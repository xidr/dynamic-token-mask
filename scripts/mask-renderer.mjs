/** Draw the selected circle onto a transparent square or into a native ring frame. */
export function drawCrop(canvas, image, mask, maxSize = Infinity, frame) {
  const {imageWidth, imageHeight, centerX, centerY, radius} = mask;
  const diameter = 2 * radius * Math.min(imageWidth, imageHeight);
  const size = Math.max(1, Math.min(maxSize, Math.ceil(diameter)));
  canvas.width = frame?.width ?? size;
  canvas.height = frame?.height ?? size;
  const output = frame?.diameter ?? size;
  const x = (canvas.width - output) / 2;
  const y = (canvas.height - output) / 2;
  const context = canvas.getContext("2d");
  context.beginPath();
  context.arc(canvas.width / 2, canvas.height / 2, output / 2, 0, 2 * Math.PI);
  context.clip();
  context.drawImage(image, centerX * imageWidth - diameter / 2, centerY * imageHeight - diameter / 2,
    diameter, diameter, x, y, output, output);
  // A tainted canvas cannot be uploaded to WebGL. Fail while the original is still installed.
  context.getImageData(0, 0, 1, 1);
}

function createCrop(base, mask, frame) {
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
  if (frame) {
    const gl = canvas.app.renderer.gl;
    if (Math.max(frame.width, frame.height) > gl.getParameter(gl.MAX_TEXTURE_SIZE)) return null;
  }
  const surface = document.createElement("canvas");
  drawCrop(surface, image, mask, Infinity, frame);
  return new PIXI.Texture(new PIXI.BaseTexture(surface, {resolution: frame?.resolution ?? 1}));
}

function eligible(token) {
  const supportedPreview = !token.isPreview || ["dragging", "config"].includes(token.previewType);
  return !token.destroyed && supportedPreview
    && token.mesh && !token.mesh.destroyed && token.texture?.baseTexture;
}

// A prepared ring subject can be inferred from a portrait even when the two files differ.
function maskPath(doc) {
  return (doc.ring?.enabled && doc._source?.ring?.subject?.texture) || doc.texture.src;
}

function selection(doc) {
  return JSON.stringify([doc.texture.src, !!doc.ring?.enabled, doc.ring?.subject?.texture, doc._source?.ring?.subject?.texture]);
}

function ringFrame(original) {
  const resolution = original.baseTexture.resolution ?? 1;
  const width = Math.round(original.width * resolution);
  const height = Math.round(original.height * resolution);
  if (!(Number.isSafeInteger(width) && width > 0 && Number.isSafeInteger(height) && height > 0)) return null;
  // Foundry's standard subject occupies the central two thirds of a square ring asset.
  // Retain the installed texture dimensions for native padding, UVs and mesh sizing.
  return {width, height, resolution, diameter: Math.min(width, height) * 2 / 3};
}

export class MaskRenderer {
  #masks;
  #create;
  #getBase;
  #tokens = new Map();
  #transitions = new Map();
  #chains = new WeakSet();
  #previewSources = new Map();
  #drawnRings = new WeakMap();
  // Foundry can supply distinct texture wrappers around one shared image.
  #byBase = new WeakMap();

  constructor(masks, create = createCrop, getBase = src => foundry.canvas.TextureLoader.loader.getCache(src)) {
    this.#masks = masks;
    this.#create = create;
    this.#getBase = getBase;
  }

  #acquire(base, mask, frame = null) {
    let group = this.#byBase.get(base);
    if (!group) this.#byBase.set(base, group = new Map());
    const key = JSON.stringify([mask, frame]);
    let entry = group.get(key);
    if (!entry) {
      entry = {group, key, refs: 0, texture: null};
      group.set(key, entry);
      entry.ready = Promise.resolve().then(() => entry.refs ? this.#create(base, mask, frame) : null)
        .then(texture => {
          if (entry.refs) entry.texture = texture;
          else texture?.destroy(true);
        }).catch(error => console.warn("Dynamic Token Mask | Could not crop token art.", error));
    }
    entry.refs++;
    return entry;
  }

  apply(token) {
    this.#releaseCrop(token);
    const doc = token.document;
    if (doc.ring?.enabled) {
      this.#drawnRings.set(token, {subject: doc.ring.subject?.texture, stored: doc._source?.ring?.subject?.texture});
    } else this.#drawnRings.delete(token);
    // Track drawn previews even when the selected portrait has no mask yet.
    if (!token.destroyed && ["config", "dragging"].includes(token.previewType)) {
      const state = this.#previewSources.get(token) ?? {};
      state.drawn = selection(token.document);
      state.subjectBase = token.mesh?.texture?.baseTexture;
      this.#previewSources.set(token, state);
    }
    return this.#applyMask(token);
  }

  async update(paths, placeables) {
    const pending = [];
    for (const token of new Set([...placeables, ...this.#previewSources.keys()])) {
      if (paths.includes(maskPath(token.document))) {
        this.#releaseCrop(token);
        pending.push(this.#applyMask(token));
      }
    }
    await Promise.all(pending);
  }

  // Switching between a mapped implicit subject and the very same explicit file
  // can change mask ownership or native fitting without changing the animation texture paths.
  async subjectChanged(token) {
    const drawn = this.#drawnRings.get(token);
    if (!drawn) return;
    const contexts = [...token.animationContexts.values()].filter(c => c.to?.ring?.subject || c.to?.texture?.src);
    if (contexts.length) await Promise.all(contexts.map(c => c.promise));
    const doc = token.document;
    if (this.#drawnRings.get(token) === drawn && !token.destroyed && doc.ring?.enabled
      && drawn.subject === doc.ring.subject.texture && drawn.stored !== doc._source?.ring?.subject?.texture) {
      token.renderFlags.set({redraw: true});
    }
  }

  async #applyMask(token) {
    if (!eligible(token)) return;
    const doc = token.document;
    const src = maskPath(doc);
    if (!src?.trim() || src.includes("*")) return;
    const mask = this.#masks.get(src);
    if (!mask) return;
    const {mesh, texture: portrait} = token;
    const original = mesh.texture;
    const selected = selection(doc);
    let base = portrait.baseTexture;
    let frame = null;
    if (doc.ring?.enabled) {
      if (!token.hasDynamicRing || !token.ring || !original?.baseTexture) return;
      const subject = doc.ring.subject?.texture;
      if (!subject || this.#getBase(subject) !== original.baseTexture
        || original.baseTexture.resource?.source?.tagName === "VIDEO") return;
      if (doc._source?.ring?.subject?.texture) {
        if (src !== subject) return;
        base = original.baseTexture;
      } else if (this.#getBase(src) !== base) return;
      frame = ringFrame(original);
      if (!frame) return;
    } else if (original !== portrait) return;
    const entry = this.#acquire(base, mask, frame);
    const state = {mesh, original, entry};
    this.#tokens.set(token, state);
    await entry.ready;
    if (this.#tokens.get(token) !== state) return;
    if (!entry.texture || !eligible(token) || selection(token.document) !== selected
      || token.mesh !== mesh || token.texture !== portrait || mesh.texture !== original) {
      this.#releaseCrop(token);
      return;
    }
    mesh.texture = entry.texture;
    token.renderFlags.set({refreshMesh: true});
  }

  // TokenConfig can refresh without a redraw when returning to the placed document's path.
  refreshPreview(token) {
    if (token.previewType !== "config" || token.destroyed) return;
    const src = token.document.texture.src;
    const state = this.#previewSources.get(token);
    if (!state) return;
    // The selection can also change while Foundry awaits a previous image load.
    const base = token.texture?.baseTexture;
    const expected = this.#getBase(src);
    const selected = selection(token.document);
    const subject = token.document.ring?.enabled && token.document.ring.subject?.texture;
    const subjectBase = subject && this.#getBase(subject);
    if (state.drawn === selected && (!expected || expected === base)
      && (!subjectBase || subjectBase === state.subjectBase)) {
      state.requested = null;
      return;
    }
    if (state.requested === selected && state.base === base && state.requestedSubject === state.subjectBase) return;
    state.requestedSubject = state.subjectBase;
    state.requested = selected;
    state.base = base;
    token.renderFlags.set({redraw: true});
  }

  release(token, refresh = true) {
    this.#drawnRings.delete(token);
    this.#previewSources.delete(token);
    this.#releaseCrop(token, refresh);
  }

  #releaseCrop(token, refresh = true) {
    const state = this.#tokens.get(token);
    if (!state) return;
    this.#tokens.delete(token);
    const {mesh, original, entry} = state;
    if (!mesh.destroyed && entry.texture && mesh.texture === entry.texture) {
      mesh.texture = original;
      if (refresh && token.mesh === mesh && !token.destroyed) token.renderFlags.set({refreshMesh: true});
    }
    this.#releaseEntry(entry);
  }

  async transition(token, getAnimation, Filter) {
    if (!token || token.destroyed || token.isPreview || token.document.ring?.enabled
      || typeof Filter !== "function" || !token.animationContexts?.values) return;
    const pending = [];
    for (const context of token.animationContexts.values()) {
      // A chained update starts its next context after this one completes.
      if (!context?.promise?.then) continue;
      if (context.chain?.length && !this.#chains.has(context)) {
        const chains = this.#chains;
        chains.add(context);
        context.promise.then(() => {
          if (chains === this.#chains) return this.transition(token, getAnimation, Filter);
        }).catch(error => console.warn("Dynamic Token Mask | Could not frame chained transition.", error));
      }
      const src = context.to?.texture?.src;
      if (!src?.trim() || src.includes("*") || context.to?.ring?.enabled || this.#transitions.has(context)) continue;
      const mask = this.#masks.get(src);
      if (!mask) continue;
      const animation = getAnimation(context.name);
      if (animation?.context !== token || !animation.wait?.then || !Array.isArray(animation.attributes)) continue;
      // Build 14.369 animates the progress uniform on its own transition filter.
      const filters = token.mesh?.filters?.filter(filter => filter instanceof Filter
        && filter.uniforms && animation.attributes.some(a => a?.attribute === "progress" && a.parent === filter.uniforms));
      if (filters?.length !== 1) continue;
      pending.push(this.#frameTarget(token, context, animation, filters[0], mask));
    }
    await Promise.all(pending);
  }

  async #frameTarget(token, context, animation, filter, mask) {
    const mesh = token.mesh;
    const state = {mesh, filter};
    this.#transitions.set(context, state);
    const current = () => this.#transitions.get(context) === state && !token.destroyed
      && !token.document.ring?.enabled && token.animationContexts.get(context.name) === context
      && token.mesh === mesh && mesh.filters?.includes(filter);
    context.promise.then(() => this.#releaseTarget(context));
    try {
      // Native preparation loads the exact target and installs its padded render texture.
      await animation.wait;
      if (!current()) return;
      const base = this.#getBase(mask.src);
      if (!base || !filter.uniforms.targetTexture) return;
      state.original = filter.uniforms.targetTexture;
      state.entry = this.#acquire(base, mask);
      await state.entry.ready;
      if (current() && state.entry.texture && filter.uniforms.targetTexture === state.original) {
        filter.targetTexture = state.entry.texture;
      }
    } catch (error) {
      this.#releaseTarget(context);
      throw error;
    }
  }

  #releaseTarget(context) {
    const state = this.#transitions.get(context);
    if (!state) return;
    this.#transitions.delete(context);
    const {mesh, filter, entry, original} = state;
    if (!entry) return;
    if (!mesh.destroyed && mesh.filters?.includes(filter) && filter.uniforms?.targetTexture === entry.texture
      && original && !original.destroyed) filter.targetTexture = original;
    this.#releaseEntry(entry);
  }

  #releaseEntry(entry) {
    if (--entry.refs === 0) {
      entry.group.delete(entry.key);
      entry.texture?.destroy(true);
    }
  }

  clear() {
    this.#drawnRings = new WeakMap();
    this.#previewSources.clear();
    this.#chains = new WeakSet();
    for (const context of this.#transitions.keys()) this.#releaseTarget(context);
    for (const token of this.#tokens.keys()) this.release(token, false);
  }
}
