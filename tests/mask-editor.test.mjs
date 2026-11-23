import assert from "node:assert/strict";
import {beforeEach, test} from "node:test";
import {constrainCircle, isSupportedStaticImage, toCircle, toRecord} from "../scripts/mask-geometry.mjs";
import {drawCrop} from "../scripts/mask-renderer.mjs";
import {MODULE_ID, validateMask} from "../scripts/mask-store.mjs";

const sourcePath = "portraits/Case%20Sensitive%20%D0%9B.png?rev=2";
const original = {src: sourcePath, centerX: 0.75, centerY: 0.4, radius: 0.2, imageWidth: 400, imageHeight: 200};
const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+abroAAAAASUVORK5CYII=", "base64");

function element(properties = {}) {
  const handlers = new Map();
  return Object.assign({
    value: "",
    disabled: false,
    addEventListener(type, handler) { handlers.set(type, handler); },
    fire(type, event = {}) { handlers.get(type)?.({currentTarget: this, preventDefault() {}, ...event}); }
  }, properties);
}

function canvas() {
  const operations = [];
  const methods = ["clearRect", "drawImage", "beginPath", "rect", "ellipse", "fill", "stroke", "arc", "clip", "getImageData"];
  const context = Object.fromEntries(methods.map(name => [name, (...args) => operations.push([name, ...args])]));
  return element({
    operations,
    getContext: () => context,
    getBoundingClientRect: () => ({left: 0, top: 0, width: 400, height: 200}),
    setPointerCapture() {}
  });
}

function view(path) {
  const fields = {
    "file-picker": element({value: path, ownerDocument: {baseURI: "https://foundry.example/table/game"}}),
    ".mask-source": canvas(),
    ".mask-preview": canvas(),
    ".mask-workspace": element({hidden: true}),
    ".mask-current-source": element(),
    ".mask-status": element({classList: {toggle() {}}})
  };
  for (const name of ["centerX", "centerY", "radius", "radiusSlider"]) fields['[name="' + name + '"]'] = element({name});
  for (const action of ["load", "reset", "remove", "save", "cancel"]) fields['[data-action="' + action + '"]'] = element();
  return {querySelector(selector) {
    assert.ok(Object.hasOwn(fields, selector), selector);
    return fields[selector];
  }};
}

// Model the Foundry view and its lifecycle. Use the module's real hooks and mask store.
const hooks = new Map();
globalThis.Hooks = {once: (name, callback) => hooks.set(name, callback), on() {}, callAll() {}};
globalThis.foundry = {applications: {api: {
  ApplicationV2: class {
    async render(options) {
      try {
        this._canRender();
      } catch (error) {
        this.warning = error.message;
        return this;
      }
      this.parts = {body: view((await this._prepareContext(options)).src)};
      this.rendered = true;
      this._onRender({}, {isFirstRender: true});
      return this;
    }
    async close() {
      await this._preClose();
      this.rendered = false;
      this._onClose();
      return this;
    }
    _prepareContext() {}
    _onRender() {}
    _preClose() {}
    _onClose() {}
  },
  HandlebarsApplicationMixin: base => base
}}};
const opener = {isConnected: true, focus() { this.didFocus = true; }};
globalThis.document = {activeElement: opener};
globalThis.createImageBitmap = () => Promise.reject(new Error("Unexpected decode"));

await import("../scripts/main.js");

let stored;
let menus;
let writeAttempts;
let rejectWrite;
let api;
beforeEach(() => {
  stored = {version: 1, masks: [{...original}]};
  menus = [];
  writeAttempts = 0;
  rejectWrite = false;
  opener.didFocus = false;
  globalThis.game = {
    ready: false,
    user: null,
    i18n: {localize: key => key},
    modules: new Map([[MODULE_ID, {}]]),
    settings: {
      register() {},
      registerMenu: (...args) => menus.push(args),
      get: () => stored,
      async set(_module, _key, value) {
        writeAttempts++;
        if (rejectWrite) throw new Error("Offline");
        stored = value;
      }
    }
  };
  hooks.get("init")();
  api = game.modules.get(MODULE_ID).api;
});

function startWorld(isGM) {
  game.user = {isGM};
  hooks.get("setup")();
  game.ready = true;
  hooks.get("ready")();
}

function mockImage(t, decode = () => ({width: 400, height: 200, close() {}})) {
  t.mock.method(globalThis, "fetch", async path => {
    assert.equal(path, sourcePath);
    return {ok: true, blob: async () => new Blob([png])};
  });
  t.mock.method(globalThis, "createImageBitmap", decode);
}

async function openImage() {
  const editor = await api.openEditor();
  const field = editor.parts.body.querySelector("file-picker");
  field.value = sourcePath;
  field.fire("input");
  await editor.loadImage();
  return editor;
}

function numeric(editor, name, value) {
  const input = editor.parts.body.querySelector('[name="' + name + '"]');
  input.valueAsNumber = value;
  input.fire("input");
  input.fire("blur");
  return input.value;
}

test("the editor entry points require a ready GM world", async () => {
  assert.equal(await api.openEditor(), null);
  assert.equal(menus.length, 0);
  startWorld(false);
  assert.equal(await api.openEditor(), null);
  assert.equal(menus.length, 0);
  startWorld(true);
  const [[namespace, key, menu]] = menus;
  assert.deepEqual([namespace, key, menu.restricted], [MODULE_ID, "portraitEditor", true]);
  assert.ok((await api.openEditor()) instanceof menu.type);
});

test("loads the exact path, previews the saved crop, bounds edits, and preserves the mask on cancel", async t => {
  startWorld(true);
  mockImage(t);
  const editor = await openImage();
  const body = editor.parts.body;
  assert.equal(body.querySelector(".mask-current-source").textContent, sourcePath);
  assert.equal(body.querySelector('[name="centerX"]').value, 75);
  assert.equal(body.querySelector('[name="radius"]').value, 20);
  const preview = body.querySelector(".mask-preview");
  assert.deepEqual(preview.operations.map(([name]) => name), ["beginPath", "arc", "clip", "drawImage", "getImageData"]);
  assert.deepEqual(preview.operations[3].slice(2), [260, 40, 80, 80, 0, 0, 80, 80]);

  assert.equal(numeric(editor, "centerY", 130), 80);
  const image = body.querySelector(".mask-source");
  image.fire("pointerdown", {button: 0, pointerId: 1, clientX: 300, clientY: 160});
  image.fire("pointermove", {pointerId: 1, clientX: -100, clientY: 10});
  image.fire("pointerup", {pointerId: 1});
  assert.equal(body.querySelector('[name="centerX"]').value, 10);
  assert.equal(body.querySelector('[name="centerY"]').value, 20);
  image.fire("pointerdown", {button: 0, pointerId: 2, clientX: 80, clientY: 40});
  image.fire("pointermove", {pointerId: 2, clientX: 60, clientY: 40});
  image.fire("pointerup", {pointerId: 2});
  assert.equal(body.querySelector('[name="radius"]').value, 10);

  await editor.close();
  assert.deepEqual(api.masks.get(sourcePath), original);
  assert.equal(writeAttempts, 0);
  assert.equal(opener.didFocus, true);
  const reopened = await openImage();
  assert.equal(reopened.parts.body.querySelector('[name="centerX"]').value, 75);
  await reopened.close();
});

test("the radius slider follows the bounded circle before blur", async t => {
  startWorld(true);
  mockImage(t);
  const editor = await openImage();
  const body = editor.parts.body;
  assert.equal(numeric(editor, "centerX", 80.04), 80.04);

  const slider = body.querySelector('[name="radiusSlider"]');
  slider.value = slider.valueAsNumber = 50;
  slider.fire("input");
  assert.equal(slider.value, 39.92);
  assert.equal(body.querySelector('[name="radius"]').value, 39.92);
  await editor.close();
});

test("save and remove use the loaded image, and failed writes preserve the saved mask", async t => {
  startWorld(true);
  mockImage(t);
  const errors = t.mock.method(console, "error", () => {});
  const editor = await openImage();
  const body = editor.parts.body;
  numeric(editor, "radius", 15);

  const path = body.querySelector("file-picker");
  path.value = "portraits/Other.png";
  path.fire("input");
  assert.equal(body.querySelector('[data-action="save"]').disabled, true);
  await editor.persist(false);
  assert.equal(writeAttempts, 0);
  path.value = sourcePath;
  path.fire("input");

  rejectWrite = true;
  await editor.persist(false);
  assert.equal(body.querySelector(".mask-status").textContent, "DTM.SaveFailed");
  assert.deepEqual(api.masks.get(sourcePath), original);
  rejectWrite = false;
  await editor.persist(false);
  assert.equal(api.masks.get(sourcePath).radius, 0.15);

  rejectWrite = true;
  await editor.persist(true);
  assert.equal(body.querySelector(".mask-status").textContent, "DTM.RemoveFailed");
  assert.equal(api.masks.get(sourcePath).radius, 0.15);
  assert.equal(errors.mock.callCount(), 2);
  rejectWrite = false;
  await editor.persist(true);
  assert.equal(api.masks.get(sourcePath), null);
  await editor.close();
});

for (const firstRemoves of [false, true]) {
  const firstAction = firstRemoves ? "remove" : "save";
  const secondAction = firstRemoves ? "save" : "remove";
  test(`a queued editor ${secondAction} reports a conflict after a pending ${firstAction}`, async t => {
    startWorld(true);
    mockImage(t);
    const first = await openImage();
    const second = await openImage();
    numeric(first, "radius", 15);
    numeric(second, "radius", 10);

    const started = Promise.withResolvers();
    const release = Promise.withResolvers();
    const {set} = game.settings;
    t.mock.method(game.settings, "set", async (...args) => {
      started.resolve();
      await release.promise;
      return set(...args);
    });

    const pending = first.persist(firstRemoves);
    await started.promise;
    const competing = second.persist(!firstRemoves);
    release.resolve();
    await Promise.all([pending, competing]);

    const body = second.parts.body;
    assert.equal(body.querySelector(".mask-status").textContent, "DTM.Conflict");
    assert.equal(body.querySelector('[name="radius"]').value, 10);
    assert.deepEqual(api.masks.get(sourcePath), firstRemoves ? null : {...original, radius: 0.15});
    assert.equal(writeAttempts, 1);
    await Promise.all([first.close(), second.close()]);
  });
}

test("an unsupported image keeps the previous draft tied to its exact path", async t => {
  startWorld(true);
  mockImage(t);
  const editor = await openImage();
  numeric(editor, "radius", 15);
  const body = editor.parts.body;
  const path = body.querySelector("file-picker");
  path.value = "portraits/Animated.png";
  t.mock.method(globalThis, "fetch", async () => ({ok: true, blob: async () => new Blob(["GIF89a"])}));
  await editor.loadImage();
  assert.equal(body.querySelector(".mask-status").textContent, "DTM.Unsupported");
  assert.equal(body.querySelector(".mask-current-source").textContent, sourcePath);
  assert.equal(body.querySelector('[name="radius"]').value, 15);
  await editor.persist(true);
  assert.equal(writeAttempts, 0);
  assert.deepEqual(api.masks.get(sourcePath), original);
  await editor.close();
});

test("closing during decode disposes the late image without changing the saved mask", async t => {
  startWorld(true);
  const decoded = Promise.withResolvers();
  const decoding = Promise.withResolvers();
  mockImage(t, () => {
    decoding.resolve();
    return decoded.promise;
  });
  const editor = await api.openEditor();
  editor.parts.body.querySelector("file-picker").value = sourcePath;
  const loading = editor.loadImage();
  await decoding.promise;
  await editor.close();
  let disposed = false;
  decoded.resolve({width: 400, height: 200, close() { disposed = true; }});
  await loading;
  assert.equal(disposed, true);
  assert.equal(writeAttempts, 0);
  assert.deepEqual(api.masks.get(sourcePath), original);
});

test("geometry can reopen tiny saved masks and constrain circles against resized rectangular art", () => {
  const tiny = {...original, radius: 0.00001};
  assert.deepEqual(toRecord(sourcePath, toCircle(tiny, 400, 200), 400, 200), tiny);
  const resized = toRecord(sourcePath, toCircle({...original, centerX: 0.9}, 80, 160), 80, 160);
  assert.deepEqual(validateMask(resized), {...original, centerX: 0.8, imageWidth: 80, imageHeight: 160});
  const bounded = constrainCircle({x: -20, y: 300, radius: 400}, 400, 200);
  assert.deepEqual(bounded, {x: 100, y: 100, radius: 100});
});

test("the same crop source and circular clip apply when preview resolution is capped", () => {
  const surface = canvas();
  const image = {};
  const mask = {src: sourcePath, centerX: 0.75, centerY: 0.5, radius: 0.4, imageWidth: 1000, imageHeight: 500};
  drawCrop(surface, image, mask, 256);
  assert.equal(surface.width, 256);
  assert.equal(surface.height, 256);
  assert.deepEqual(surface.operations[1], ["arc", 128, 128, 128, 0, 2 * Math.PI]);
  assert.deepEqual(surface.operations[3], ["drawImage", image, 550, 50, 400, 400, 0, 0, 256, 256]);
});

test("static container detection rejects GIF, animated PNG and animated WebP", () => {
  const supports = bytes => isSupportedStaticImage(Uint8Array.from(bytes).buffer);
  assert.equal(supports(png), true);
  assert.equal(supports([0xff, 0xd8, 0xff, 0xd9]), true);
  assert.equal(supports(Buffer.from("RIFF\x0c\0\0\0WEBPVP8L\0\0\0\0")), true);
  assert.equal(supports(Buffer.from("GIF89a")), false);
  const apng = Buffer.concat([png.subarray(0, 33), Buffer.from("\0\0\0\0acTL\0\0\0\0"), png.subarray(33)]);
  assert.equal(supports(apng), false);
  assert.equal(supports(Buffer.from("RIFF\x14\0\0\0WEBPANIM\0\0\0\0VP8L\0\0\0\0")), false);
  assert.equal(supports(Buffer.from("RIFF\x16\0\0\0WEBPVP8X\x01\0\0\0\x02\0VP8L\0\0\0\0")), false);
  assert.equal(supports(png.subarray(0, -1)), false);
});
