import {resolveImageURL} from "./mask-geometry.mjs";
import {MODULE_ID} from "./mask-store.mjs";

const FILE_ROW = 'section[data-files] .files-list > li[data-file][data-path][data-action="pickFile"]';
const canEditMasks = () => game.ready && game.user?.isGM === true;

export class MaskFilePicker {
  #masks;
  #openEditor;
  #pickers = new Map();

  constructor(masks, openEditor) {
    this.#masks = masks;
    this.#openEditor = openEditor;
  }

  render(picker, element) {
    if (!this.#prunePickers() || picker.type === "folder") return this.close(picker);

    const previous = this.#pickers.get(picker)?.controls ?? new Map();
    const controls = new Map();
    for (const row of element.querySelectorAll(FILE_ROW)) {
      const {path: src, name = src} = row.dataset;
      const url = resolveImageURL(src, row.ownerDocument.baseURI);
      if (!url || !/\.(png|jpe?g|webp)$/i.test(url.pathname)) continue;

      let control = previous.get(row);
      if (!control || control.src !== src || control.name !== name || control.wrapper.parentElement !== row) {
        control?.wrapper.remove();
        control = this.#createControl(row, src, name);
      }
      controls.set(row, control);
    }

    for (const [row, control] of previous) {
      if (!controls.has(row)) control.wrapper.remove();
    }
    if (controls.size === 0) {
      this.#pickers.delete(picker);
      return;
    }
    this.#pickers.set(picker, {element, controls});
    const saved = this.#readSavedPaths();
    for (const control of controls.values()) this.#updateControl(control, saved.has(control.src));
  }

  close(picker) {
    for (const {wrapper} of this.#pickers.get(picker)?.controls.values() ?? []) wrapper.remove();
    this.#pickers.delete(picker);
  }

  update(paths) {
    if (!this.#prunePickers()) return;
    const changed = new Set(paths);
    let saved;
    for (const {controls} of this.#pickers.values()) {
      for (const control of controls.values()) {
        if (!changed.has(control.src)) continue;
        saved ??= this.#readSavedPaths();
        this.#updateControl(control, saved.has(control.src));
      }
    }
  }

  #prunePickers() {
    const available = canEditMasks();
    // Foundry can replace an older picker with the same application ID without closing it.
    for (const [picker, {element}] of this.#pickers) {
      if (!available || !element.isConnected) this.close(picker);
    }
    return available;
  }

  #readSavedPaths() {
    try {
      return new Set(this.#masks.list().map(({src}) => src));
    } catch (error) {
      console.error(MODULE_ID + " | Could not read saved masks", error);
      return new Set();
    }
  }

  #createControl(row, src, name) {
    const doc = row.ownerDocument;
    const wrapper = doc.createElement("span");
    wrapper.className = "dynamic-token-mask mask-picker-control";

    const button = doc.createElement("button");
    button.type = "button";
    // Make the button the drag source so it can cancel the drag before the row receives it.
    button.draggable = true;
    button.addEventListener("dragstart", event => {
      event.preventDefault();
      event.stopPropagation();
    });
    button.addEventListener("click", async event => {
      event.preventDefault();
      event.stopPropagation();
      if (!canEditMasks() || !button.isConnected) return;
      button.focus({preventScroll: true});
      try {
        await this.#openEditor(src, {opener: button});
      } catch (error) {
        console.error(MODULE_ID + " | Could not open the portrait mask editor", error);
      }
    });

    const icon = doc.createElement("span");
    icon.className = "fa-solid fa-circle-user";
    icon.setAttribute("aria-hidden", "true");
    const status = doc.createElement("span");
    status.className = "fa-solid fa-check mask-picker-status";
    status.setAttribute("aria-hidden", "true");
    button.append(icon, status);
    wrapper.append(button);
    row.prepend(wrapper);
    return {wrapper, button, status, src, name};
  }

  #updateControl({button, status, name}, saved) {
    status.hidden = !saved;
    const key = saved ? "DTM.PickerEditSaved" : "DTM.PickerEdit";
    const label = game.i18n.format(key, {name});
    button.title = label;
    button.setAttribute("aria-label", label);
  }
}
