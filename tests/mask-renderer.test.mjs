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

test("off-center rectangular art fills a square with a circular clip", () => {
  const operations = [];
  const context = Object.fromEntries(["beginPath", "arc", "clip", "drawImage", "getImageData"].map(name =>
    [name, (...args) => operations.push([name, ...args])]));
  const surface = {getContext: () => context};
  const image = {};
  drawCrop(surface, image, mask);
  assert.equal(surface.width, 40);
  assert.equal(surface.height, 40);
  assert.deepEqual(operations, [
    ["beginPath"], ["arc", 20, 20, 20, 0, 2 * Math.PI], ["clip"],
    ["drawImage", image, 130, 20, 40, 40, 0, 0, 40, 40], ["getImageData", 0, 0, 1, 1]
  ]);
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
  for (const action of ["remove", "destroy", "replace", "teardown"]) {
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
      } else {
        current = action === "remove" ? null : {...mask, radius: 0.1};
        await renderer.apply(subject);
      }
      pending.resolve(oldCrop);
      await applying;
      assert.equal(subject.mesh.texture, action === "replace" ? newCrop : subject.texture);
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

test("previews, rings and unsupported image resources retain their textures", async () => {
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
