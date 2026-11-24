import assert from "node:assert/strict";
import test from "node:test";
import {PrototypeMaskPreview} from "../scripts/prototype-mask-preview.mjs";

const mask = {src: "faces/B.png", imageWidth: 256, imageHeight: 128, centerX: 0.7, centerY: 0.5, radius: 0.3};

function sheetRoot(getImage) {
  return Object.assign(new EventTarget(), {querySelector: getImage, isConnected: true});
}

function thumbnail(src, decode = async () => {}) {
  const ownerDocument = {baseURI: "https://game.example/play", location: {origin: "https://game.example"}};
  return {getAttribute: () => src, ownerDocument, style: {content: ""}, naturalWidth: 256, naturalHeight: 128, decode};
}

test("use the concrete displayed image and preserve the native thumbnail and controls", async () => {
  const image = thumbnail(mask.src);
  const root = sheetRoot(() => image);
  const sheet = {token: {texture: {src: "faces/*.png"}, ring: {enabled: false}}};
  const preview = new PrototypeMaskPreview(new Map([[mask.src, mask]]), () => "url(cropped)");
  await preview.render(sheet, root);
  assert.equal(image.style.content, "url(cropped)");
  assert.equal(image.getAttribute("src"), mask.src);
  sheet.token.ring.enabled = true;
  await preview.render(sheet, root);
  assert.equal(image.style.content, "");
  preview.close(sheet);
});

test("obsolete thumbnail decoding cannot overwrite a partial render or a closed sheet", async () => {
  const gate = Promise.withResolvers();
  const oldImage = thumbnail(mask.src, () => gate.promise);
  const newImage = thumbnail("faces/C.png");
  let active = oldImage;
  const root = sheetRoot(() => active);
  const sheet = {token: {ring: {enabled: false}}};
  const preview = new PrototypeMaskPreview(new Map([[mask.src, mask]]), () => "url(cropped)");
  const first = preview.render(sheet, root);
  active = newImage;
  await preview.render(sheet, root);
  gate.resolve();
  await first;
  assert.equal(oldImage.style.content, "");
  assert.equal(newImage.style.content, "");
  const next = Promise.withResolvers();
  active = thumbnail(mask.src, () => next.promise);
  const pending = preview.render(sheet, root);
  preview.close(sheet);
  next.resolve();
  await pending;
  assert.equal(active.style.content, "");
});

test("dimensions, concrete source and current stylesheet ownership gate thumbnail changes", async () => {
  const image = thumbnail(mask.src);
  const root = sheetRoot(() => image);
  const sheet = {token: {}};
  const store = new Map([[mask.src, mask]]);
  const preview = new PrototypeMaskPreview(store, () => "url(cropped)");
  image.style.content = "url(previous)";
  image.naturalWidth = 50;
  await preview.render(sheet, root);
  assert.equal(image.style.content, "url(previous)");
  image.naturalWidth = 256;
  await preview.render(sheet, root);
  store.delete(mask.src);
  preview.update([mask.src]);
  assert.equal(image.style.content, "url(previous)");
  store.set(mask.src, mask);
  preview.update([mask.src]);
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(image.style.content, "url(cropped)");
  image.style.content = "url(other)";
  preview.close(sheet);
  assert.equal(image.style.content, "url(other)");
});

test("external portraits use a CORS-readable image while preserving the native thumbnail", async () => {
  const src = "https://assets.example/faces/B.png";
  const image = thumbnail(src);
  const root = sheetRoot(() => image);
  const sheet = {token: {}};
  const source = thumbnail(src);
  let requested;
  Object.defineProperty(source, "src", {set(url) { requested = [url, this.crossOrigin]; }});
  image.ownerDocument = {
    baseURI: "https://game.example/play",
    location: {origin: "https://game.example"},
    createElement(tag) { assert.equal(tag, "img"); return source; }
  };
  const preview = new PrototypeMaskPreview(new Map([[src, {...mask, src}]]), decoded => {
    assert.equal(decoded, source);
    return "url(cropped)";
  });
  await preview.render(sheet, root);
  assert.deepEqual(requested, [src, "anonymous"]);
  assert.equal(image.style.content, "url(cropped)");
  assert.equal(image.crossOrigin, undefined);
  preview.close(sheet);
  assert.equal(image.style.content, "");
});
