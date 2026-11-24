import assert from "node:assert/strict";
import test from "node:test";
import {drawCrop, MaskRenderer} from "../scripts/mask-renderer.mjs";

const mask = {src: "portraits/one.webp", centerX: 0.75, centerY: 0.4, radius: 0.2, imageWidth: 200, imageHeight: 100};

function token(baseTexture = {}) {
  const texture = {baseTexture};
  return {
    document: {texture: {src: mask.src}, ring: {enabled: false}},
    texture,
    mesh: {texture},
    renderFlags: {set(flags) { assert.deepEqual(flags, {refreshMesh: true}); }}
  };
}

function crop() {
  return {disposed: 0, destroy(ownBase) {
    assert.equal(ownBase, true);
    this.disposed++;
  }};
}

function cropSurface() {
  const operations = [];
  const methods = ["beginPath", "arc", "moveTo", "lineTo", "closePath", "clip", "drawImage", "getImageData"];
  const context = Object.fromEntries(methods.map(name => [name, (...args) => operations.push([name, ...args])]));
  return {operations, getContext: () => context};
}

function installTextureMocks(t, bases) {
  class Image { naturalWidth = 200; naturalHeight = 100; }
  class BaseTexture {
    constructor(source, {resolution}) {
      this.source = source;
      this.width = source.width / resolution;
      this.height = source.height / resolution;
      this.resolution = resolution;
    }
  }
  class Texture {
    constructor(baseTexture) { Object.assign(this, crop(), {baseTexture}); }
  }
  const globals = {
    HTMLImageElement: Image,
    PIXI: {Texture, BaseTexture, SVGResource: class {}},
    foundry: {canvas: {TextureLoader: {loader: {getCache: src => bases.get(src)}}}},
    canvas: {app: {renderer: {gl: {MAX_TEXTURE_SIZE: 1, getParameter: () => 1024}}}},
    document: {createElement: cropSurface}
  };
  for (const [key, value] of Object.entries(globals)) {
    const prior = Object.getOwnPropertyDescriptor(globalThis, key);
    Object.defineProperty(globalThis, key, {configurable: true, value});
    t.after(() => prior ? Object.defineProperty(globalThis, key, prior) : delete globalThis[key]);
  }
  return Image;
}

test("off-center rectangular art fills a square with a circular clip", () => {
  const surface = cropSurface();
  const image = {};
  drawCrop(surface, image, mask);
  assert.equal(surface.width, 40);
  assert.equal(surface.height, 40);
  assert.deepEqual(surface.operations, [
    ["beginPath"], ["arc", 20, 20, 20, 0, 2 * Math.PI], ["clip"],
    ["drawImage", image, 130, 20, 40, 40, 0, 0, 40, 40], ["getImageData", 0, 0, 1, 1]
  ]);
});

test("polygon clips keep the off-center source rectangle in uncapped crops and capped previews", () => {
  const apothem = Math.sqrt(3) / 2;
  const outlines = {
    square: [[1, 1], [-1, 1], [-1, -1], [1, -1]],
    "hex-flat": [[1, 0], [0.5, apothem], [-0.5, apothem], [-1, 0], [-0.5, -apothem], [0.5, -apothem]],
    "hex-pointy": [[0, -1], [apothem, -0.5], [apothem, 0.5], [0, 1], [-apothem, 0.5], [-apothem, -0.5]]
  };
  const image = {};
  for (const [shape, vertices] of Object.entries(outlines)) {
    for (const cap of [20, Infinity]) {
      const surface = cropSurface();
      drawCrop(surface, image, {...mask, shape}, cap);
      const size = Math.min(cap, 40);
      assert.deepEqual([surface.width, surface.height], [size, size]);
      const half = size / 2;
      assert.deepEqual(surface.operations, [
        ["beginPath"],
        ...vertices.map(([x, y], i) => [i === 0 ? "moveTo" : "lineTo", half + x * half, half + y * half]),
        ["closePath"], ["clip"], ["drawImage", image, 130, 20, 40, 40, 0, 0, size, size],
        ["getImageData", 0, 0, 1, 1]
      ], `${shape} in a ${size}px frame`);
    }
  }
});

test("two token wrappers share one crop until the last consumer releases it", async () => {
  const derived = crop();
  let calls = 0;
  const renderer = new MaskRenderer({get: () => ({...mask})}, () => { calls++; return derived; });
  const first = token();
  const second = token(first.texture.baseTexture);
  await Promise.all([renderer.apply(first), renderer.apply(second)]);
  assert.equal(first.mesh.texture, derived);
  assert.equal(second.mesh.texture, derived);
  assert.equal(calls, 1);
  renderer.release(first, false);
  assert.equal(first.mesh.texture, first.texture);
  assert.equal(derived.disposed, 0);
  renderer.clear();
  assert.equal(second.mesh.texture, second.texture);
  assert.equal(derived.disposed, 1);
});

test("a pending crop cannot overwrite removal, destruction, or a replacement mask", async t => {
  for (const action of ["remove", "destroy", "replace", "shape", "teardown"]) {
    await t.test(action, async () => {
      let current = mask;
      const pending = Promise.withResolvers();
      const oldCrop = crop();
      const newCrop = crop();
      const renderer = new MaskRenderer({get: () => current}, (_base, record) =>
        record === mask ? pending.promise : newCrop);
      const subject = token();
      const applying = renderer.apply(subject);
      await Promise.resolve();
      if (action === "destroy") {
        renderer.release(subject, false);
        subject.destroyed = true;
      } else if (action === "teardown") {
        renderer.clear();
      } else if (action === "shape") {
        current = {...mask, shape: "hex-pointy"};
        await renderer.update([mask.src], [subject]);
      } else {
        current = action === "remove" ? null : {...mask, radius: 0.1};
        await renderer.apply(subject);
      }
      pending.resolve(oldCrop);
      await applying;
      assert.equal(subject.mesh.texture, ["replace", "shape"].includes(action) ? newCrop : subject.texture);
      assert.equal(oldCrop.disposed, 1);
      renderer.clear();
    });
  }
});

test("a pending crop yields when Foundry replaces the mesh, source or displayed texture", async t => {
  for (const changed of ["mesh", "source", "texture"]) {
    await t.test(changed, async () => {
      const derived = crop();
      const renderer = new MaskRenderer({get: () => mask}, () => derived);
      const subject = token();
      const applying = renderer.apply(subject);
      if (changed === "mesh") subject.mesh = {texture: subject.texture};
      if (changed === "source") subject.document.texture.src = "two.png";
      if (changed === "texture") subject.mesh.texture = {};
      const expected = subject.mesh.texture;
      await applying;
      assert.equal(subject.mesh.texture, expected);
      assert.equal(derived.disposed, 1);
    });
  }
});

test("redraw and reload read the saved record again and removal restores ordinary art", async () => {
  let current = mask;
  const store = {get(src) { return src === current?.src ? current : null; }};
  let renderer = new MaskRenderer(store, crop);
  const subject = token();
  await renderer.apply(subject);
  const previous = subject.mesh.texture;
  subject.texture = {baseTexture: {}};
  subject.mesh.texture = subject.texture;
  await renderer.apply(subject);
  assert.equal(previous.disposed, 1);
  assert.notEqual(subject.mesh.texture, subject.texture);
  renderer.clear();
  renderer = new MaskRenderer(store, crop);
  const reloaded = token();
  await renderer.apply(reloaded);
  const derived = reloaded.mesh.texture;
  assert.notEqual(derived, reloaded.texture);
  current = null;
  await renderer.apply(reloaded);
  assert.equal(reloaded.mesh.texture, reloaded.texture);
  assert.equal(derived.disposed, 1);
});

test("unsupported previews, uninitialized rings and unsupported image resources retain their textures", async () => {
  let attempts = 0;
  const renderer = new MaskRenderer({get: () => mask}, () => { attempts++; return null; });
  const preview = token();
  preview.isPreview = true;
  const ring = token();
  ring.document.ring.enabled = true;
  const unsupported = token();
  for (const subject of [preview, ring, unsupported]) {
    await renderer.apply(subject);
    assert.equal(subject.mesh.texture, subject.texture);
  }
  assert.equal(attempts, 1);
});

test("drag and configuration clones own independent leases on their selected image", async () => {
  const secondPath = "portraits/two.webp";
  const secondMask = {...mask, src: secondPath, centerX: 0.25};
  const masks = new Map([[mask.src, mask], [secondPath, secondMask]]);
  const renderer = new MaskRenderer(masks, crop);
  const placed = token();
  await renderer.apply(placed);
  const placedCrop = placed.mesh.texture;
  for (const previewType of ["dragging", "config"]) {
    const preview = token(placed.texture.baseTexture);
    Object.assign(preview, {isPreview: true, previewType});
    await renderer.apply(preview);
    assert.equal(preview.mesh.texture, placedCrop);
    preview.document.texture.src = secondPath;
    preview.texture = preview.mesh.texture = {baseTexture: {}};
    await renderer.apply(preview);
    const secondCrop = preview.mesh.texture;
    assert.notEqual(secondCrop, placedCrop);
    assert.notEqual(secondCrop, preview.texture);
    preview.document.texture.src = "portraits/unmasked.png";
    preview.texture = preview.mesh.texture = {baseTexture: {}};
    await renderer.apply(preview);
    assert.equal(preview.mesh.texture, preview.texture);
    assert.equal(secondCrop.disposed, 1);
    renderer.release(preview, false);
    assert.equal(placed.mesh.texture, placedCrop);
    assert.equal(placedCrop.disposed, 0);
  }
  renderer.clear();
  assert.equal(placedCrop.disposed, 1);
});

test("returning a config preview to its initial path requests a single native redraw", async () => {
  const subject = token();
  Object.assign(subject, {isPreview: true, previewType: "config"});
  const renderer = new MaskRenderer(new Map(), crop, () => null);
  let redraws = 0;
  subject.renderFlags.set = flags => { assert.deepEqual(flags, {redraw: true}); redraws++; };
  subject.document.texture.src = "faces/C.png";
  await renderer.apply(subject);
  subject.document.texture.src = mask.src;
  renderer.refreshPreview(subject);
  renderer.refreshPreview(subject);
  assert.equal(redraws, 1);
  subject.texture = subject.mesh.texture = {baseTexture: {}};
  await renderer.apply(subject);
  renderer.refreshPreview(subject);
  assert.equal(redraws, 1);
});

function nativeAnimation(subject, src, filter = new TransitionFilter()) {
  const prepared = Promise.withResolvers();
  const finished = Promise.withResolvers();
  const context = {name: "token", to: {texture: {src}}, chain: [], promise: finished.promise};
  const animation = {context: subject, wait: prepared.promise,
    attributes: [{attribute: "progress", parent: filter.uniforms}]};
  subject.mesh.filters = [filter];
  subject.animationContexts = new Map([[context.name, context]]);
  return {context, filter, prepared, finished, getAnimation: () => animation};
}

class TransitionFilter {
  uniforms = {targetTexture: {native: true}};
  set targetTexture(texture) { this.uniforms.targetTexture = texture; }
}

test("a native transition samples the polygon destination crop and leaves native cleanup to Foundry", async t => {
  const dest = {...mask, src: "B.png", shape: "hex-flat"};
  const bases = new Map([[mask.src, {}], [dest.src, {}]]);
  const Image = installTextureMocks(t, bases);
  for (const base of bases.values()) base.resource = {source: new Image()};
  const subject = token(bases.get(mask.src));
  const renderer = new MaskRenderer(new Map([[mask.src, mask], [dest.src, dest]]));
  await renderer.apply(subject);
  const outgoing = subject.mesh.texture;
  assert.notEqual(outgoing, subject.texture);
  const transition = nativeAnimation(subject, dest.src);
  transition.prepared.resolve();
  const native = transition.filter.uniforms.targetTexture;
  await renderer.transition(subject, transition.getAnimation, TransitionFilter);
  const incoming = transition.filter.uniforms.targetTexture;
  assert.notEqual(incoming, native);
  assert.equal(subject.mesh.texture, outgoing);
  assert.deepEqual(incoming.baseTexture.source.operations.slice(1, 9), [
    ["moveTo", 40, 20], ["lineTo", 30, 20 + 10 * Math.sqrt(3)], ["lineTo", 10, 20 + 10 * Math.sqrt(3)],
    ["lineTo", 0, 20], ["lineTo", 10, 20 - 10 * Math.sqrt(3)], ["lineTo", 30, 20 - 10 * Math.sqrt(3)],
    ["closePath"], ["clip"]
  ]);
  assert.deepEqual(incoming.baseTexture.source.operations[9],
    ["drawImage", bases.get(dest.src).resource.source, 130, 20, 40, 40, 0, 0, 40, 40]);
  const destinationToken = token(bases.get(dest.src));
  destinationToken.document.texture.src = dest.src;
  await renderer.apply(destinationToken);
  assert.equal(destinationToken.mesh.texture, incoming);
  renderer.release(destinationToken);
  assert.equal(incoming.disposed, 0);

  transition.finished.resolve();
  await transition.finished.promise;
  assert.equal(transition.filter.uniforms.targetTexture, native);
  assert.equal(incoming.disposed, 1);
  assert.equal(outgoing.disposed, 0);
  renderer.clear();
  assert.equal(outgoing.disposed, 1);
});

test("an interrupted target load cannot overwrite a newer transition or unmasked art", async () => {
  const subject = token();
  const dest = {...mask, src: "B.png"};
  const renderer = new MaskRenderer(new Map([[dest.src, dest]]), crop, () => ({}));
  const first = nativeAnimation(subject, dest.src);
  const stale = renderer.transition(subject, first.getAnimation, TransitionFilter);
  const second = nativeAnimation(subject, "C.png");
  second.prepared.resolve();
  first.finished.resolve();
  await renderer.transition(subject, second.getAnimation, TransitionFilter);
  first.prepared.resolve();
  await stale;
  assert.equal(first.filter.uniforms.targetTexture.native, true);
  assert.equal(second.filter.uniforms.targetTexture.native, true);
  second.finished.resolve();
  renderer.clear();
});

test("ambiguous or unrecognized native animations leave their filters untouched", async () => {
  const subject = token();
  const renderer = new MaskRenderer(new Map([[mask.src, mask]]), crop, () => ({}));
  const active = nativeAnimation(subject, mask.src);
  active.prepared.resolve();
  const other = new TransitionFilter();
  subject.mesh.filters.push(other);
  active.getAnimation().attributes.push({attribute: "progress", parent: other.uniforms});
  await renderer.transition(subject, active.getAnimation, TransitionFilter);
  assert.equal(active.filter.uniforms.targetTexture.native, true);
  assert.equal(other.uniforms.targetTexture.native, true);
  delete active.getAnimation().attributes;
  await renderer.transition(subject, active.getAnimation, TransitionFilter);
  await renderer.transition(subject, active.getAnimation, undefined);
  active.finished.resolve();
});

test("late crop completion preserves a newer masked endpoint and releases only the obsolete crop", async () => {
  const subject = token();
  const dest = {...mask, src: "B.png"};
  const delayed = Promise.withResolvers();
  const obsolete = crop();
  const latest = crop();
  const renderer = new MaskRenderer(new Map([[dest.src, dest], [mask.src, mask]]),
    (base, record) => record.src === dest.src ? delayed.promise : latest, () => ({}));
  const first = nativeAnimation(subject, dest.src);
  first.prepared.resolve();
  const stale = renderer.transition(subject, first.getAnimation, TransitionFilter);
  await new Promise(resolve => setImmediate(resolve));
  const second = nativeAnimation(subject, mask.src);
  second.prepared.resolve();
  first.finished.resolve();
  await renderer.transition(subject, second.getAnimation, TransitionFilter);
  assert.equal(second.filter.uniforms.targetTexture, latest);
  delayed.resolve(obsolete);
  await stale;
  assert.equal(obsolete.disposed, 1);
  assert.equal(first.filter.uniforms.targetTexture.native, true);
  assert.equal(second.filter.uniforms.targetTexture, latest);
  const external = {};
  second.filter.targetTexture = external;
  renderer.clear();
  assert.equal(second.filter.uniforms.targetTexture, external);
  assert.equal(latest.disposed, 1);
  second.finished.resolve();
});

test("a stale config image load requests a redraw against the current concrete selection", async () => {
  const subject = token();
  Object.assign(subject, {isPreview: true, previewType: "config"});
  const selectedBase = {};
  const renderer = new MaskRenderer(new Map(), crop, () => selectedBase);
  let redraws = 0;
  subject.renderFlags.set = flags => { assert.deepEqual(flags, {redraw: true}); redraws++; };
  await renderer.apply(subject);
  renderer.refreshPreview(subject);
  renderer.refreshPreview(subject);
  assert.equal(redraws, 1);
  subject.texture = subject.mesh.texture = {baseTexture: selectedBase};
  await renderer.apply(subject);
  renderer.refreshPreview(subject);
  assert.equal(redraws, 1);
});

test("a config ring toggle requests native redraw even on the same image path", async () => {
  const subject = token();
  Object.assign(subject, {isPreview: true, previewType: "config"});
  const renderer = new MaskRenderer(new Map(), crop, () => subject.texture.baseTexture);
  let redraws = 0;
  subject.renderFlags.set = flags => { assert.deepEqual(flags, {redraw: true}); redraws++; };
  await renderer.apply(subject);
  subject.document.ring.enabled = true;
  renderer.refreshPreview(subject);
  assert.equal(redraws, 1);
  await renderer.apply(subject);
  subject.document.ring.enabled = false;
  renderer.refreshPreview(subject);
  assert.equal(redraws, 2);
});

test("setting changes refresh live previews from their first mask through replacement and removal", async () => {
  const masks = new Map();
  const renderer = new MaskRenderer(masks, crop);
  const placed = token();
  const drag = Object.assign(token(placed.texture.baseTexture), {isPreview: true, previewType: "dragging"});
  const config = Object.assign(token(), {isPreview: true, previewType: "config"});
  const unrelated = Object.assign(token(), {isPreview: true, previewType: "config"});
  unrelated.document.texture.src = "other.png";
  const closed = Object.assign(token(), {isPreview: true, previewType: "config"});
  for (const t of [placed, drag, config, unrelated, closed]) await renderer.apply(t);
  renderer.release(closed, false);
  masks.set(mask.src, mask);
  masks.set("other.png", {...mask, src: "other.png"});
  await renderer.update([mask.src], [placed]);
  const shared = placed.mesh.texture;
  assert.notEqual(shared, placed.texture);
  assert.equal(drag.mesh.texture, shared);
  const firstConfig = config.mesh.texture;
  assert.notEqual(firstConfig, config.texture);
  assert.equal(closed.mesh.texture, closed.texture);
  assert.equal(unrelated.mesh.texture, unrelated.texture);

  masks.set(mask.src, {...mask, radius: 0.1});
  await renderer.update([mask.src], [placed]);
  assert.equal(shared.disposed, 1);
  assert.equal(firstConfig.disposed, 1);
  const replacement = drag.mesh.texture;
  assert.equal(replacement, placed.mesh.texture);
  assert.notEqual(replacement, shared);
  assert.notEqual(config.mesh.texture, config.texture);

  const resizedConfig = config.mesh.texture;
  masks.set(mask.src, {...masks.get(mask.src), shape: "square"});
  await renderer.update([mask.src], [placed]);
  const polygon = placed.mesh.texture;
  assert.notEqual(polygon, placed.texture);
  assert.notEqual(polygon, replacement);
  assert.equal(drag.mesh.texture, polygon);
  assert.notEqual(config.mesh.texture, resizedConfig);
  assert.notEqual(config.mesh.texture, config.texture);
  assert.equal(replacement.disposed, 1);
  assert.equal(resizedConfig.disposed, 1);

  masks.delete(mask.src);
  await renderer.update([mask.src], [placed]);
  for (const t of [placed, drag, config]) assert.equal(t.mesh.texture, t.texture);
  assert.equal(polygon.disposed, 1);
  renderer.clear();
  masks.set(mask.src, mask);
  await renderer.update([mask.src], []);
  for (const t of [drag, config]) assert.equal(t.mesh.texture, t.texture);
});

const portraits = ["A.png", "B.png", "C.png", "mapped.png"];
function ringFixture() {
  const bases = new Map(portraits.map(src => [src, {src}]));
  const masks = new Map(portraits.slice(0, 2).map(src => [src, {...mask, src}]));
  function make(portrait, explicit = null, prepared = explicit ?? portrait, width = 512, height = 512) {
    const t = token(bases.get(portrait));
    t.document.texture.src = portrait;
    t.document._source = {ring: {subject: {texture: explicit}}};
    t.document.ring = {enabled: true, subject: {texture: prepared, scale: 1.25}};
    t.ring = {effects: 9, colorBand: {startRadius: 0.666}};
    t.hasDynamicRing = true;
    t.mesh.texture = {baseTexture: bases.get(prepared), width, height};
    return t;
  }
  return {bases, masks, make};
}

test("native rings select the stored subject or original portrait and restore the installed wrapper", async () => {
  const {bases, masks, make} = ringFixture();
  const renderer = new MaskRenderer(masks, (base, record) => ({...crop(), base, record}), src => bases.get(src));
  for (const [portrait, explicit, prepared] of [
    ["A.png", null, "A.png"], ["C.png", null, "C.png"],
    ["A.png", null, "mapped.png"], ["C.png", null, "mapped.png"],
    ["A.png", "B.png", "B.png"], ["A.png", "C.png", "C.png"], ["C.png", "B.png", "B.png"]
  ]) {
    const t = make(portrait, explicit, prepared);
    const native = t.mesh.texture;
    const before = structuredClone(t.document);
    await renderer.apply(t);
    const path = explicit ?? portrait;
    if (masks.has(path)) {
      assert.equal(t.mesh.texture.base, bases.get(path));
      assert.equal(t.mesh.texture.record, masks.get(path));
    } else assert.equal(t.mesh.texture, native);
    assert.equal(t.texture.baseTexture, bases.get(portrait));
    assert.deepEqual(t.document, before);
    renderer.release(t);
    assert.equal(t.mesh.texture, native);
  }
});

test("ring subjects share equal crops, isolate framing dimensions and track live preview edits by subject", async () => {
  const {bases, masks, make} = ringFixture();
  const renderer = new MaskRenderer(masks, crop, src => bases.get(src));
  const t = make("A.png", "B.png");
  const drag = Object.assign(make("C.png", "B.png"), {isPreview: true, previewType: "dragging"});
  const config = Object.assign(make("A.png", "B.png", "B.png", 160, 320), {isPreview: true, previewType: "config"});
  const tokens = [t, drag, config];
  const native = tokens.map(t => t.mesh.texture);
  await Promise.all(tokens.map(t => renderer.apply(t)));
  const first = drag.mesh.texture;
  assert.equal(t.mesh.texture, first);
  assert.notEqual(config.mesh.texture, first);
  await renderer.update(["A.png"], [t]);
  assert.equal(drag.mesh.texture, first);
  assert.equal(t.mesh.texture, first);
  masks.set("B.png", {...masks.get("B.png"), shape: "hex-flat"});
  await renderer.update(["B.png"], [t]);
  assert.equal(first.disposed, 1);
  const second = drag.mesh.texture;
  assert.equal(t.mesh.texture, second);
  masks.delete("B.png");
  await renderer.update(["B.png"], [t]);
  assert.deepEqual(tokens.map(t => t.mesh.texture), native);
  assert.equal(second.disposed, 1);
  masks.set("B.png", {...mask, src: "B.png"});
  await renderer.update(["B.png"], [t]);
  const third = drag.mesh.texture;
  renderer.release(drag, false);
  assert.equal(third.disposed, 0);
  renderer.clear();
  assert.equal(third.disposed, 1);
});

test("a held drag redraws for remote ring subject changes and toggles while movement stays incremental", async () => {
  const {bases, masks, make} = ringFixture();
  const renderer = new MaskRenderer(masks, (base, record) => ({...crop(), base, record}), src => bases.get(src));
  const drag = Object.assign(make("A.png", "B.png"), {isPreview: true, previewType: "dragging"});
  const redraws = [];
  drag.renderFlags.set = flags => { if (flags.redraw) redraws.push(flags); };
  await renderer.apply(drag);
  const firstCrop = drag.mesh.texture;
  assert.equal(firstCrop.record, masks.get("B.png"));

  for (const x of [100, 200]) {
    drag.document.x = x;
    renderer.refreshPreview(drag);
  }
  assert.deepEqual(redraws, []);
  assert.equal(drag.mesh.texture, firstCrop);

  // Foundry copies the remote update into the held clone and dispatches refreshToken.
  drag.document._source.ring.subject.texture = drag.document.ring.subject.texture = "C.png";
  renderer.refreshPreview(drag);
  renderer.refreshPreview(drag);
  assert.deepEqual(redraws, [{redraw: true}]);

  // The redraw completes through drawToken and receives its own incremental refresh.
  const nativeSubject = make("A.png", "C.png").mesh.texture;
  drag.mesh.texture = nativeSubject;
  await renderer.apply(drag);
  renderer.refreshPreview(drag);
  assert.deepEqual(redraws, [{redraw: true}]);
  assert.equal(drag.mesh.texture, nativeSubject);
  assert.equal(firstCrop.disposed, 1);

  drag.document.ring.enabled = false;
  renderer.refreshPreview(drag);
  renderer.refreshPreview(drag);
  assert.deepEqual(redraws, [{redraw: true}, {redraw: true}]);

  drag.ring = null;
  drag.hasDynamicRing = false;
  drag.mesh.texture = drag.texture;
  await renderer.apply(drag);
  drag.document.x = 300;
  renderer.refreshPreview(drag);
  assert.deepEqual(redraws, [{redraw: true}, {redraw: true}]);
  assert.equal(drag.mesh.texture.record, masks.get("A.png"));
  assert.equal(drag.mesh.texture.base, bases.get("A.png"));
  renderer.clear();
});

test("a held drag detects a ring toggle during draw when the loaded bases still match", async () => {
  const {bases, masks, make} = ringFixture();
  const renderer = new MaskRenderer(masks, crop, src => bases.get(src));
  const drag = Object.assign(make("A.png"), {isPreview: true, previewType: "dragging"});
  const redraws = [];
  drag.renderFlags.set = flags => { if (flags.redraw) redraws.push(flags); };

  // The source toggled after the native draw installed the ring and finished loading its art.
  drag.document.ring.enabled = false;
  await renderer.apply(drag);
  renderer.refreshPreview(drag);
  renderer.refreshPreview(drag);
  assert.deepEqual(redraws, [{redraw: true}]);

  drag.ring = null;
  drag.hasDynamicRing = false;
  drag.mesh.texture = drag.texture;
  await renderer.apply(drag);
  renderer.refreshPreview(drag);
  assert.deepEqual(redraws, [{redraw: true}]);
  assert.notEqual(drag.mesh.texture, drag.texture);
  renderer.clear();
});

test("a pending ring crop yields to subject selection, toggles and mesh replacement", async () => {
  const {bases, masks, make} = ringFixture();
  for (const change of ["subject", "toggle", "mesh", "owner"]) {
    const t = make("A.png", "B.png");
    const gate = Promise.withResolvers();
    const obsolete = crop();
    const renderer = new MaskRenderer(masks, () => gate.promise, src => bases.get(src));
    const applying = renderer.apply(t);
    await Promise.resolve();
    if (change === "subject") t.document._source.ring.subject.texture = t.document.ring.subject.texture = "C.png";
    if (change === "toggle") t.document.ring.enabled = false;
    if (change === "mesh") t.mesh = {...t.mesh};
    if (change === "owner") t.mesh.texture = {};
    const expected = t.mesh.texture;
    gate.resolve(obsolete);
    await applying;
    assert.equal(t.mesh.texture, expected);
    assert.equal(obsolete.disposed, 1);
  }
});

test("a scene preview redraws on subject-only switches and a ring transition keeps its composed target", async () => {
  const {bases, masks, make} = ringFixture();
  const renderer = new MaskRenderer(masks, crop, src => bases.get(src));
  const t = Object.assign(make("A.png", "B.png"), {isPreview: true, previewType: "config"});
  await renderer.apply(t);
  const flags = [];
  t.renderFlags.set = f => flags.push(f);
  renderer.refreshPreview(t);
  t.document._source.ring.subject.texture = t.document.ring.subject.texture = "C.png";
  renderer.refreshPreview(t);
  renderer.refreshPreview(t);
  assert.deepEqual(flags, [{redraw: true}]);

  const placed = make("A.png", "B.png");
  const anim = nativeAnimation(placed, "A.png");
  anim.prepared.resolve();
  await renderer.transition(placed, anim.getAnimation, TransitionFilter);
  assert.equal(anim.filter.uniforms.targetTexture.native, true);
  anim.finished.resolve();
  const settled = make("A.png", null, "mapped.png");
  Object.assign(placed, {document: settled.document, texture: settled.texture, mesh: settled.mesh});
  const native = placed.mesh.texture;
  await renderer.apply(placed);
  assert.notEqual(placed.mesh.texture, native);
  renderer.release(placed);
  assert.equal(placed.mesh.texture, native);
  renderer.clear();
});

test("switching mask ownership with the same prepared ring image requests a redraw after animation", async () => {
  const {bases, masks, make} = ringFixture();
  const renderer = new MaskRenderer(masks, crop, src => bases.get(src));
  const t = make("A.png", null, "mapped.png");
  await renderer.apply(t);
  const flags = [];
  t.renderFlags.set = f => flags.push(f);
  t.document._source.ring.subject.texture = "mapped.png";
  const finished = Promise.withResolvers();
  t.animationContexts = new Map([["ring", {to: {ring: {subject: {texture: "mapped.png"}}}, promise: finished.promise}]]);
  const change = renderer.subjectChanged(t);
  assert.deepEqual(flags, []);
  finished.resolve();
  await change;
  assert.deepEqual(flags, [{redraw: true}]);
  await renderer.apply(t);
  assert.equal(t.mesh.texture.baseTexture, bases.get("mapped.png"));
  const same = make("A.png", null, "A.png");
  await renderer.apply(same);
  same.animationContexts = new Map();
  const sameFlags = [];
  same.renderFlags.set = f => sameFlags.push(f);
  same.document._source.ring.subject.texture = "A.png";
  await renderer.subjectChanged(same);
  assert.deepEqual(sameFlags, [{redraw: true}]);
  renderer.clear();
});

test("ring crops use the selected source pixels and preserve the native rectangle and resolution", async t => {
  const {bases, masks, make} = ringFixture();
  const Image = installTextureMocks(t, bases);
  const image = new Image();
  const explicitImage = new Image();
  bases.get("A.png").resource = {source: image};
  bases.get("B.png").resource = {source: explicitImage};
  bases.get("B.png").resolution = bases.get("mapped.png").resolution = 2;
  masks.set("B.png", {...masks.get("B.png"), shape: "hex-pointy"});
  const renderer = new MaskRenderer(masks);
  const subject = make("A.png", null, "mapped.png", 180, 90);
  subject.document.ring.subject.scale = 0.8;
  subject.ring.colorBand.startRadius = 0.4;
  const native = subject.mesh.texture;
  await renderer.apply(subject);
  const result = subject.mesh.texture.baseTexture;
  const surface = result.source;
  assert.deepEqual([surface.width, surface.height], [360, 180]);
  assert.deepEqual(surface.operations[1], ["arc", 180, 90, 60, 0, Math.PI * 2]);
  assert.deepEqual(surface.operations[3], ["drawImage", image, 130, 20, 40, 40, 120, 30, 120, 120]);
  assert.deepEqual([result.width, result.height, result.resolution], [180, 90, 2]);
  assert.equal(subject.document.ring.subject.scale, 0.8);

  masks.set("A.png", {...masks.get("A.png"), shape: "square"});
  await renderer.update(["A.png"], [subject]);
  const implicit = subject.mesh.texture.baseTexture.source;
  assert.deepEqual([implicit.width, implicit.height], [360, 180]);
  assert.deepEqual(implicit.operations.slice(1, 8), [
    ["moveTo", 240, 150], ["lineTo", 120, 150], ["lineTo", 120, 30], ["lineTo", 240, 30],
    ["closePath"], ["clip"], ["drawImage", image, 130, 20, 40, 40, 120, 30, 120, 120]
  ]);

  const explicit = make("A.png", "B.png", "B.png", 180, 90);
  const explicitNative = explicit.mesh.texture;
  await renderer.apply(explicit);
  const explicitResult = explicit.mesh.texture.baseTexture;
  const offset = 60 * (Math.sqrt(3) / 2);
  assert.deepEqual([explicitResult.width, explicitResult.height, explicitResult.resolution], [180, 90, 2]);
  assert.deepEqual(explicitResult.source.operations.slice(1, 10), [
    ["moveTo", 180, 30], ["lineTo", 180 + offset, 60], ["lineTo", 180 + offset, 120],
    ["lineTo", 180, 150], ["lineTo", 180 - offset, 120], ["lineTo", 180 - offset, 60],
    ["closePath"], ["clip"], ["drawImage", explicitImage, 130, 20, 40, 40, 120, 30, 120, 120]
  ]);
  renderer.release(explicit);
  assert.equal(explicit.mesh.texture, explicitNative);

  renderer.release(subject);
  assert.equal(subject.mesh.texture, native);
  native.width = 900;
  await renderer.apply(subject);
  assert.equal(subject.mesh.texture, native);
  native.width = 180;
  image.naturalHeight = 80;
  await renderer.apply(subject);
  assert.equal(subject.mesh.texture, native);
  image.naturalHeight = 100;
  native.baseTexture = bases.get("C.png");
  await renderer.apply(subject);
  assert.equal(subject.mesh.texture, native);
  renderer.clear();
});
