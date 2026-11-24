import {
  MASK_SHAPES, constrainCircle, containsMaskPoint, isSupportedStaticImage, maskRightExtent,
  resolveImageURL, toCircle, toRecord, traceMaskPath
} from "./mask-geometry.mjs";
import {drawCrop} from "./mask-renderer.mjs";
import {MaskConflictError, MODULE_ID} from "./mask-store.mjs";

const {ApplicationV2, HandlebarsApplicationMixin} = foundry.applications.api;
const localize = key => game.i18n.localize("DTM." + key);
const canEditMasks = () => game.ready && game.user?.isGM === true;
const NUMBER_FIELDS = ["centerX", "centerY", "radius", "radiusSlider"];
const sameFrame = (a, b) => a.x === b.x && a.y === b.y && a.radius === b.radius;

export async function openMaskEditor(src = "", {opener} = {}) {
  const editor = new MaskEditor({src, opener});
  const options = {force: true};
  const windowId = opener?.ownerDocument?.defaultView?.id;
  if (windowId) options.window = {windowId};
  await editor.render(options);
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
  #mask;
  #originalMask;
  #drag;
  #request = null;
  #snapshot = null;
  #opener;
  #view;
  #message = [null, false];
  #writing = false;
  #closing = false;

  constructor(options = {}) {
    const {src = "", opener = document.activeElement, ...applicationOptions} = options;
    super(applicationOptions);
    this.#src = src;
    this.#opener = opener;
  }

  get #store() { return game.modules.get(MODULE_ID).api.masks; }

  get #busy() { return this.#closing || this.#writing || !!this.#request; }

  get #minimumRadius() {
    const shorterSide = Math.min(this.#image.width, this.#image.height);
    return Math.min(shorterSide * 0.001, shorterSide * (this.#snapshot?.radius ?? 0.001), this.#mask.radius);
  }

  _canRender() {
    if (!canEditMasks()) throw new Error(localize("Permission"));
  }

  async _prepareContext(options) {
    return {
      ...await super._prepareContext(options),
      src: this.#view?.source.value ?? this.#src,
      sizeDescriptionId: this.id + "-mask-size-help"
    };
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
      shape: body.querySelector('[name="shape"]'),
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
    this.#view.shape.addEventListener("change", event => this.#selectShape(event.currentTarget.value));
    for (const input of Object.values(inputs)) {
      input.addEventListener("input", () => this.#numeric(input));
      input.addEventListener("blur", () => this.#syncValues());
    }

    if (this.#image) this.#showImage();
    this.#status(...this.#message);
    this.#syncControls();
    if (!this.#image && options.isFirstRender && this.#src) void this.loadImage();
  }

  #status(key, error = false) {
    this.#message = [key, error];
    const {status} = this.#view;
    status.textContent = key ? localize(key) : "";
    status.classList.toggle("error", error);

    // Loading an image or wrapping a status message can grow the window after Foundry positions it.
    const {element} = this;
    if (element.getBoundingClientRect().bottom > element.ownerDocument.documentElement.clientHeight) this.setPosition();
  }

  #syncControls() {
    const {body, source, inputs, shape} = this.#view;
    const busy = this.#busy;
    source.disabled = busy;
    shape.disabled = busy || !this.#image;
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
    if (!resolveImageURL(src, source.ownerDocument.baseURI)) {
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
      const mask = {...toCircle(record, image.width, image.height), shape: record?.shape ?? "circle"};
      const dimensionsChanged = record && (record.imageWidth !== image.width || record.imageHeight !== image.height);
      this.#image?.close();
      this.#image = image;
      image = null;
      this.#src = src;
      this.#snapshot = record;
      this.#mask = this.#originalMask = mask;
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
    const {x, y, radius, shape} = this.#mask;
    const {canvas, preview} = this.#view;
    const ctx = canvas.getContext("2d");
    const sx = canvas.width / width;
    const sy = canvas.height / height;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(this.#image, 0, 0, canvas.width, canvas.height);
    ctx.beginPath();
    ctx.rect(0, 0, canvas.width, canvas.height);
    traceMaskPath(ctx, shape, x * sx, y * sy, radius * sx, radius * sy);
    ctx.fillStyle = "rgba(0, 0, 0, 0.55)";
    ctx.fill("evenodd");
    ctx.beginPath();
    traceMaskPath(ctx, shape, x * sx, y * sy, radius * sx, radius * sy);
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 2;
    ctx.stroke();
    for (const px of [x, x + radius * maskRightExtent(shape)]) {
      ctx.beginPath();
      ctx.arc(px * sx, y * sy, 5, 0, 2 * Math.PI);
      ctx.fillStyle = "#ffbf47";
      ctx.fill();
    }

    drawCrop(preview, this.#image, this.#draftRecord(), 256);
    this.#syncValues(activeInput);
  }

  #syncValues(activeInput) {
    if (!this.#image) return;
    const {width, height} = this.#image;
    const {x, y, radius, shape} = this.#mask;
    const radiusPercent = 100 * (radius / Math.min(width, height));
    const {inputs, shape: selector} = this.#view;
    selector.value = shape;
    const minimumPercent = 100 * (this.#minimumRadius / Math.min(width, height));
    inputs.radius.min = inputs.radiusSlider.min = minimumPercent;
    const values = {centerX: 100 * (x / width), centerY: 100 * (y / height),
      radius: radiusPercent, radiusSlider: radiusPercent};
    for (const [name, value] of Object.entries(values)) {
      if (name === "radiusSlider" || inputs[name] !== activeInput) inputs[name].value = Number(value.toPrecision(12));
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
    const {x, y, radius, shape} = this.#mask;
    const {width, height} = event.currentTarget.getBoundingClientRect();
    const scaleX = width / this.#image.width;
    const scaleY = height / this.#image.height;
    const dx = point.x - x;
    const dy = point.y - y;
    const centerDistance = Math.hypot(dx * scaleX, dy * scaleY);
    const handleScale = maskRightExtent(shape);
    const handleDistance = Math.hypot((dx - radius * handleScale) * scaleX, dy * scaleY);
    const resize = handleDistance <= 12 && handleDistance < centerDistance;
    if (!resize && centerDistance > 12 && !containsMaskPoint(shape, this.#mask, point)) return;
    event.preventDefault();
    this.#drag = {pointerId: event.pointerId, resize, dx, dy, radius, handleScale};
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  #moveDrag(event) {
    const drag = this.#drag;
    if (this.#busy || !drag || event.pointerId !== drag.pointerId) return;
    const point = this.#point(event);
    const frame = {...this.#mask};
    if (drag.resize) {
      const delta = (point.x - frame.x - drag.dx) / drag.handleScale;
      frame.radius = this.#limitRadius(drag.radius + delta);
    } else {
      frame.x = point.x - drag.dx;
      frame.y = point.y - drag.dy;
    }
    this.#setFrame(frame);
  }

  #limitRadius(radius) {
    const {x, y} = this.#mask;
    const {width, height} = this.#image;
    return Math.min(radius, x, width - x, y, height - y);
  }

  #numeric(input) {
    const value = input.valueAsNumber;
    if (this.#busy || !this.#image || !Number.isFinite(value)) return;
    const frame = {...this.#mask};
    const {width, height} = this.#image;
    if (input.name === "centerX") frame.x = value / 100 * width;
    else if (input.name === "centerY") frame.y = value / 100 * height;
    else frame.radius = this.#limitRadius(value / 100 * Math.min(width, height));
    this.#setFrame(frame, input);
  }

  #selectShape(shape) {
    if (this.#busy || !this.#image || !MASK_SHAPES.includes(shape)) return;
    this.#drag = null;
    this.#setMask({...this.#mask, shape});
  }

  #setFrame(frame, activeInput) {
    const {width, height} = this.#image;
    const bounded = constrainCircle(frame, width, height, this.#minimumRadius);
    this.#setMask({...bounded, shape: this.#mask.shape}, activeInput);
  }

  #setMask(next, activeInput) {
    if (!sameFrame(next, this.#mask) || next.shape !== this.#mask.shape) {
      this.#mask = next;
      if (["Saved", "Removed"].includes(this.#message[0])) this.#status(null);
    }
    this.#paint(activeInput);
  }

  reset() {
    if (this.#busy || !this.#image) return;
    this.#setFrame(toCircle(null, this.#image.width, this.#image.height));
  }

  #draftRecord() {
    const {width, height} = this.#image;
    const {shape} = this.#mask;
    const saved = this.#snapshot;
    if (saved?.imageWidth === width && saved.imageHeight === height && sameFrame(this.#mask, this.#originalMask)) {
      return {...saved, shape};
    }
    return toRecord(this.#src, this.#mask, width, height, shape);
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
      const options = {expected: this.#snapshot};
      if (remove) {
        await this.#store.remove(this.#src, options);
        this.#snapshot = null;
      } else {
        this.#snapshot = await this.#store.save(this.#draftRecord(), options);
        this.#originalMask = this.#mask;
      }
      this.#status(remove ? "Removed" : "Saved");
    } catch (error) {
      if (error instanceof MaskConflictError) {
        this.#status("Conflict", true);
        return;
      }
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
