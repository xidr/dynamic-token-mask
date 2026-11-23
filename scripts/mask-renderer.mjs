/** Draw only the selected source pixels into a transparent, square texture. */
export function drawCrop(canvas, image, mask, maxSize = Infinity) {
  const {imageWidth, imageHeight, centerX, centerY, radius} = mask;
  const diameter = 2 * radius * Math.min(imageWidth, imageHeight);
  const size = Math.max(1, Math.min(maxSize, Math.ceil(diameter)));
  canvas.width = canvas.height = size;
  const context = canvas.getContext("2d");
  context.beginPath();
  context.arc(size / 2, size / 2, size / 2, 0, 2 * Math.PI);
  context.clip();
  context.drawImage(image, centerX * imageWidth - diameter / 2, centerY * imageHeight - diameter / 2,
    diameter, diameter, 0, 0, size, size);
  // A tainted canvas cannot be uploaded to WebGL. Fail while the original is still installed.
  context.getImageData(0, 0, 1, 1);
}

function createCrop(base, mask) {
  // Token._draw can silently substitute Foundry's fallback art after a failed load.
  if (foundry.canvas.TextureLoader.loader.getCache(mask.src) !== base) return null;
  const image = base.resource?.source;
  const isBitmap = typeof ImageBitmap !== "undefined" && image instanceof ImageBitmap;
  const isImage = image instanceof HTMLImageElement;
  // PIXI's SVGResource exposes its rasterized backing canvas.
  if (!isBitmap && !isImage && !(base.resource instanceof PIXI.SVGResource)) return null;
  const width = isImage ? image.naturalWidth : image.width;
  const height = isImage ? image.naturalHeight : image.height;
  if (width !== mask.imageWidth || height !== mask.imageHeight) return null;
  const surface = document.createElement("canvas");
  drawCrop(surface, image, mask);
  return new PIXI.Texture(new PIXI.BaseTexture(surface));
}

function eligible(token) {
  return !token.destroyed && !token.isPreview && !token.document.ring?.enabled
    && token.mesh && !token.mesh.destroyed && token.texture?.baseTexture;
}

export class MaskRenderer {
  #masks;
  #create;
  #tokens = new Map();
  // Foundry can supply distinct texture wrappers around one shared image.
  #byBase = new WeakMap();

  constructor(masks, create = createCrop) {
    this.#masks = masks;
    this.#create = create;
  }

  #acquire(base, mask) {
    let group = this.#byBase.get(base);
    if (!group) this.#byBase.set(base, group = new Map());
    const key = JSON.stringify(mask);
    let entry = group.get(key);
    if (!entry) {
      entry = {group, key, refs: 0, texture: null};
      group.set(key, entry);
      entry.ready = Promise.resolve().then(() => entry.refs ? this.#create(base, mask) : null)
        .then(texture => {
          if (entry.refs) entry.texture = texture;
          else texture?.destroy(true);
        }).catch(error => console.warn("Dynamic Token Mask | Could not crop token art.", error));
    }
    entry.refs++;
    return entry;
  }

  async apply(token) {
    this.release(token);
    if (!eligible(token) || token.mesh.texture !== token.texture) return;
    const src = token.document.texture.src;
    if (!src?.trim() || src.includes("*")) return;
    const mask = this.#masks.get(src);
    if (!mask) return;
    const {mesh, texture: original} = token;
    const entry = this.#acquire(original.baseTexture, mask);
    const state = {mesh, original, entry};
    this.#tokens.set(token, state);
    await entry.ready;
    if (this.#tokens.get(token) !== state) return;
    if (!entry.texture || !eligible(token) || token.document.texture.src !== src
      || token.mesh !== mesh || token.texture !== original || mesh.texture !== original) {
      this.release(token);
      return;
    }
    mesh.texture = entry.texture;
    token.renderFlags.set({refreshMesh: true});
  }

  release(token, refresh = true) {
    const state = this.#tokens.get(token);
    if (!state) return;
    this.#tokens.delete(token);
    const {mesh, original, entry} = state;
    if (!mesh.destroyed && entry.texture && mesh.texture === entry.texture) {
      mesh.texture = original;
      if (refresh && token.mesh === mesh && !token.destroyed) token.renderFlags.set({refreshMesh: true});
    }
    if (--entry.refs === 0) {
      entry.group.delete(entry.key);
      entry.texture?.destroy(true);
    }
  }

  clear() {
    for (const token of this.#tokens.keys()) this.release(token, false);
  }
}
