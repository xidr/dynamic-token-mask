import {constrainCircle, isSupportedStaticImage, toCircle, toRecord} from "./mask-geometry.mjs";
import {drawCrop} from "./mask-renderer.mjs";
import {MODULE_ID} from "./mask-store.mjs";

const {ApplicationV2, HandlebarsApplicationMixin} = foundry.applications.api;
const localize = key => game.i18n.localize("DTM." + key);
const canEditMasks = () => game.ready && game.user?.isGM === true;
const NUMBER_FIELDS = ["centerX", "centerY", "radius", "radiusSlider"];

function isConcreteImagePath(src, base) {
  if (typeof src !== "string" || !src.trim() || src.includes("*") || src.trimStart().startsWith("#")) return false;
  try {
    const {protocol} = new URL(src, base);
    return protocol === "http:" || protocol === "https:";
  } catch {
    return false;
  }
}

export async function openMaskEditor(src = "") {
  const editor = new MaskEditor({src});
  await editor.render({force: true});
  return editor.rendered ? editor : null;
}

export class MaskEditor extends HandlebarsApplicationMixin(ApplicationV2) {
  static DEFAULT_OPTIONS = {
    classes: ["dynamic-token-mask"],
    window: {title: "DTM.Title", icon: "fa-solid fa-circle-user", resizable: true},
    position: {width: 820},
    actions: {
      load() { return this.loadImage(); },
      reset() { this.reset(); },
      save() { return this.persist(false); },
      remove() { return this.persist(true); },
      cancel() { return this.close(); }
    }
  };

  static PARTS = {body: {template: "modules/" + MODULE_ID + "/templates/mask-editor.hbs"}};

  #image = null;
  #src;
  #circle;
  #originalCircle;
  #drag;
  #request = null;
  #snapshot = null;
  #opener;
  #view;
  #message = [null, false];
  #writing = false;
  #closing = false;

  constructor(options = {}) {
    const {src = "", ...applicationOptions} = options;
    super(applicationOptions);
    this.#src = src;
    this.#opener = document.activeElement;
  }

  get #store() { return game.modules.get(MODULE_ID).api.masks; }

  get #busy() { return this.#closing || this.#writing || !!this.#request; }

  get #minimumRadius() {
    return Math.min(0.001, this.#snapshot?.radius ?? 0.001) * Math.min(this.#image.width, this.#image.height);
  }

  _canRender() {
    if (!canEditMasks()) throw new Error(localize("Permission"));
  }

  async _prepareContext(options) {
    return {...await super._prepareContext(options), src: this.#view?.source.value ?? this.#src};
  }

  _onRender(context, options) {
    super._onRender(context, options);
    if (options.isFirstRender) this.#closing = false;
    const body = this.parts.body;
    if (this.#view?.body === body) return;

    const source = body.querySelector("file-picker");
    const canvas = body.querySelector(".mask-source");
    const inputs = Object.fromEntries(NUMBER_FIELDS.map(name => [name, body.querySelector('[name="' + name + '"]')]));
    this.#view = {
      body, source, canvas, inputs,
      workspace: body.querySelector(".mask-workspace"),
      currentSource: body.querySelector(".mask-current-source"),
      preview: body.querySelector(".mask-preview"),
      status: body.querySelector(".mask-status")
    };
    if (source.button) {
      source.button.tabIndex = 0;
      source.button.setAttribute("aria-label", game.i18n.localize("FILES.BrowseTooltip"));
    }
    source.addEventListener("input", () => this.#syncControls());
    source.addEventListener("keydown", event => {
      if (event.key !== "Enter" || event.target !== source.input || event.isComposing) return;
      event.preventDefault();
      void this.loadImage();
    });
    canvas.addEventListener("pointerdown", event => this.#startDrag(event));
    canvas.addEventListener("pointermove", event => this.#moveDrag(event));
    for (const type of ["pointerup", "pointercancel", "lostpointercapture"]) {
      canvas.addEventListener(type, event => {
        if (this.#drag?.pointerId === event.pointerId) this.#drag = null;
      });
    }
    for (const input of Object.values(inputs)) {
      input.addEventListener("input", () => this.#numeric(input));
      input.addEventListener("blur", () => this.#syncValues());
    }

    this.#status(...this.#message);
    this.#syncControls();
    if (this.#image) this.#showImage();
    else if (options.isFirstRender && this.#src) void this.loadImage();
  }

  #status(key, error = false) {
    this.#message = [key, error];
    const {status} = this.#view;
    status.textContent = key ? localize(key) : "";
    status.classList.toggle("error", error);
  }

  #syncControls() {
    const {body, source, inputs} = this.#view;
    const busy = this.#busy;
    source.disabled = busy;
    for (const input of Object.values(inputs)) input.disabled = busy;
    body.querySelector('[data-action="load"]').disabled = busy;
    body.querySelector('[data-action="cancel"]').disabled = this.#writing || this.#closing;
    body.querySelector('[data-action="reset"]').disabled = busy || !this.#image;
    const canPersist = !busy && this.#image && source.value === this.#src;
    body.querySelector('[data-action="save"]').disabled = !canPersist;
    body.querySelector('[data-action="remove"]').disabled = !canPersist || !this.#snapshot;
  }

  async loadImage() {
    if (this.#busy || !this.#view) return;
    if (!canEditMasks()) {
      this.#status("Permission", true);
      return;
    }
    const {source} = this.#view;
    const src = source.value;
    if (!isConcreteImagePath(src, source.ownerDocument.baseURI)) {
      this.#status("InvalidSource", true);
      return;
    }

    // Use the selected path verbatim for requests and storage.
    const request = new AbortController();
    this.#request = request;
    this.#syncControls();
    this.#status("Loading");
    let image;
    try {
      const response = await fetch(src, {signal: request.signal});
      if (!response.ok) throw new Error("Image request failed");
      const blob = await response.blob();
      const buffer = await blob.arrayBuffer();
      if (request.signal.aborted) return;
      if (!isSupportedStaticImage(buffer)) {
        this.#status("Unsupported", true);
        return;
      }
      image = await createImageBitmap(blob);
      if (request.signal.aborted) return;

      let record;
      try {
        record = this.#store.get(src);
      } catch (error) {
        console.error(MODULE_ID + " | Could not read saved masks", error);
        this.#status("ReadFailed", true);
        return;
      }
      const circle = toCircle(record, image.width, image.height);
      const dimensionsChanged = record && (record.imageWidth !== image.width || record.imageHeight !== image.height);
      this.#image?.close();
      this.#image = image;
      image = null;
      this.#src = src;
      this.#snapshot = record;
      this.#circle = this.#originalCircle = circle;
      this.#showImage();
      this.#status(dimensionsChanged ? "DimensionsChanged" : "Ready");
    } catch (error) {
      if (!request.signal.aborted) {
        console.error(MODULE_ID + " | Could not load portrait", error);
        this.#status("LoadFailed", true);
      }
    } finally {
      image?.close();
      if (this.#request === request) {
        this.#request = null;
        this.#syncControls();
      }
    }
  }

  #showImage() {
    const {workspace, currentSource, canvas} = this.#view;
    workspace.hidden = false;
    currentSource.textContent = this.#src;
    const {width, height} = this.#image;
    const scale = Math.min(640 / width, 480 / height);
    canvas.width = Math.max(1, Math.round(width * scale));
    canvas.height = Math.max(1, Math.round(height * scale));
    this.#paint();
  }

  #paint(activeInput) {
    const {width, height} = this.#image;
    const {x, y, radius} = this.#circle;
    const {canvas, preview} = this.#view;
    const ctx = canvas.getContext("2d");
    const sx = canvas.width / width;
    const sy = canvas.height / height;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(this.#image, 0, 0, canvas.width, canvas.height);
    ctx.beginPath();
    ctx.rect(0, 0, canvas.width, canvas.height);
    ctx.ellipse(x * sx, y * sy, radius * sx, radius * sy, 0, 0, 2 * Math.PI);
    ctx.fillStyle = "rgba(0, 0, 0, 0.55)";
    ctx.fill("evenodd");
    ctx.beginPath();
    ctx.ellipse(x * sx, y * sy, radius * sx, radius * sy, 0, 0, 2 * Math.PI);
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 2;
    ctx.stroke();
    for (const px of [x, x + radius]) {
      ctx.beginPath();
      ctx.arc(px * sx, y * sy, 5, 0, 2 * Math.PI);
      ctx.fillStyle = "#ffbf47";
      ctx.fill();
    }

    drawCrop(preview, this.#image, toRecord(this.#src, this.#circle, width, height), 256);
    this.#syncValues(activeInput);
  }

  #syncValues(activeInput) {
    if (!this.#image) return;
    const {width, height} = this.#image;
    const {x, y, radius} = this.#circle;
    const radiusPercent = 100 * (radius / Math.min(width, height));
    const {inputs} = this.#view;
    const minimumPercent = 100 * (this.#minimumRadius / Math.min(width, height));
    inputs.radius.min = inputs.radiusSlider.min = minimumPercent;
    const values = {centerX: 100 * (x / width), centerY: 100 * (y / height),
      radius: radiusPercent, radiusSlider: radiusPercent};
    for (const [name, value] of Object.entries(values)) {
      if (inputs[name] !== activeInput) inputs[name].value = Number(value.toPrecision(12));
    }
  }

  #point(event) {
    const {left, top, width, height} = event.currentTarget.getBoundingClientRect();
    return {x: (event.clientX - left) / width * this.#image.width,
      y: (event.clientY - top) / height * this.#image.height};
  }

  #startDrag(event) {
    if (this.#busy || !this.#image || this.#drag || event.button !== 0) return;
    const point = this.#point(event);
    const {x, y, radius} = this.#circle;
    const {width, height} = event.currentTarget.getBoundingClientRect();
    const scaleX = width / this.#image.width;
    const scaleY = height / this.#image.height;
    const dx = point.x - x;
    const dy = point.y - y;
    const centerDistance = Math.hypot(dx * scaleX, dy * scaleY);
    const handleDistance = Math.hypot((dx - radius) * scaleX, dy * scaleY);
    const resize = handleDistance <= 12 && handleDistance < centerDistance;
    if (!resize && centerDistance > 12 && Math.hypot(dx, dy) > radius) return;
    event.preventDefault();
    this.#drag = {pointerId: event.pointerId, resize, dx, dy, radius};
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  #moveDrag(event) {
    const drag = this.#drag;
    if (this.#busy || !drag || event.pointerId !== drag.pointerId) return;
    const point = this.#point(event);
    const circle = {...this.#circle};
    if (drag.resize) circle.radius = this.#limitRadius(drag.radius + point.x - circle.x - drag.dx);
    else {
      circle.x = point.x - drag.dx;
      circle.y = point.y - drag.dy;
    }
    this.#setCircle(circle);
  }

  #limitRadius(radius) {
    const {x, y} = this.#circle;
    const {width, height} = this.#image;
    return Math.min(radius, x, width - x, y, height - y);
  }

  #numeric(input) {
    const value = input.valueAsNumber;
    if (this.#busy || !this.#image || !Number.isFinite(value)) return;
    const circle = {...this.#circle};
    const {width, height} = this.#image;
    if (input.name === "centerX") circle.x = value / 100 * width;
    else if (input.name === "centerY") circle.y = value / 100 * height;
    else circle.radius = this.#limitRadius(value / 100 * Math.min(width, height));
    this.#setCircle(circle, input);
  }

  #setCircle(circle, activeInput) {
    const {width, height} = this.#image;
    const next = constrainCircle(circle, width, height, this.#minimumRadius);
    if (next.x !== this.#circle.x || next.y !== this.#circle.y || next.radius !== this.#circle.radius) {
      this.#circle = next;
      if (["Saved", "Removed"].includes(this.#message[0])) this.#status(null);
    }
    this.#paint(activeInput);
  }

  reset() {
    if (this.#busy || !this.#image) return;
    this.#setCircle(toCircle(null, this.#image.width, this.#image.height));
  }

  async persist(remove) {
    if (this.#busy || !this.#image || this.#view.source.value !== this.#src) return;
    if (!canEditMasks()) {
      this.#status("Permission", true);
      return;
    }
    if (remove && !this.#snapshot) return;
    this.#writing = true;
    this.#syncControls();
    try {
      if (JSON.stringify(this.#store.get(this.#src)) !== JSON.stringify(this.#snapshot)) {
        this.#status("Conflict", true);
        return;
      }
      if (remove) {
        await this.#store.remove(this.#src);
        this.#snapshot = null;
      } else {
        const {width, height} = this.#image;
        const unchanged = this.#circle === this.#originalCircle && this.#snapshot?.imageWidth === width
          && this.#snapshot.imageHeight === height;
        const record = unchanged ? this.#snapshot : toRecord(this.#src, this.#circle, width, height);
        this.#snapshot = await this.#store.save(record);
        this.#originalCircle = this.#circle;
      }
      this.#status(remove ? "Removed" : "Saved");
    } catch (error) {
      console.error(MODULE_ID + " | Could not write mask", error);
      this.#status(remove ? "RemoveFailed" : "SaveFailed", true);
    } finally {
      this.#writing = false;
      this.#syncControls();
    }
  }

  async close(options) {
    if (this.#writing) return this;
    this.#closing = true;
    this.#request?.abort();
    this.#request = null;
    return super.close(options);
  }

  async _preClose(options) {
    const picker = this.#view?.source.picker;
    if (picker?.rendered) await picker.close({animate: false});
    return super._preClose(options);
  }

  _onClose(options) {
    this.#image?.close();
    this.#image = null;
    this.#view = undefined;
    this.#drag = undefined;
    this.#message = [null, false];
    if (this.#opener?.isConnected) this.#opener.focus();
    super._onClose(options);
  }
}
