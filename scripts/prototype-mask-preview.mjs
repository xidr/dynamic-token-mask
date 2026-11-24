import {drawCrop} from "./mask-renderer.mjs";

const THUMBNAIL = '[data-tab="appearance"] .token-image-preview img.token-image-thumb';

function thumbnailContent(image, mask) {
  const surface = image.ownerDocument.createElement("canvas");
  drawCrop(surface, image, mask, 256);
  return `url("${surface.toDataURL()}")`;
}

export class PrototypeMaskPreview {
  #masks;
  #content;
  #sheets = new Map();

  constructor(masks, content = thumbnailContent) {
    this.#masks = masks;
    this.#content = content;
  }

  async render(sheet, root) {
    this.close(sheet);
    const image = root.querySelector(THUMBNAIL);
    if (!image) return;
    const src = image.getAttribute("src");
    if (!src?.trim() || src.includes("*")) return;
    const state = {root, image, src};
    this.#sheets.set(sheet, state);
    // Ring changes update the preview model without re-rendering the Appearance tab.
    state.onChange = event => {
      if (event.target.name === "ring.enabled") queueMicrotask(() => {
        if (this.#sheets.get(sheet) === state) this.render(sheet, root);
      });
    };
    root.addEventListener("change", state.onChange);
    if (sheet.token.ring?.enabled) return;
    try {
      const mask = this.#masks.get(src);
      if (!mask) return;
      await image.decode();
      if (this.#sheets.get(sheet) !== state || sheet.token.ring?.enabled
        || root.querySelector(THUMBNAIL) !== image || image.getAttribute("src") !== src
        || image.naturalWidth !== mask.imageWidth || image.naturalHeight !== mask.imageHeight) return;
      state.previous = image.style.content;
      image.style.content = this.#content(image, mask);
      state.applied = image.style.content;
    } catch (error) {
      if (this.#sheets.get(sheet) === state) console.warn("Dynamic Token Mask | Could not crop prototype thumbnail.", error);
    }
  }

  update(paths) {
    for (const [sheet, {root, src}] of [...this.#sheets]) {
      if (!root.isConnected) this.close(sheet);
      else if (paths.includes(src)) this.render(sheet, root);
    }
  }

  close(sheet) {
    const state = this.#sheets.get(sheet);
    if (!state) return;
    this.#sheets.delete(sheet);
    state.root.removeEventListener("change", state.onChange);
    if (state.applied && state.image.style.content === state.applied) state.image.style.content = state.previous;
  }
}
