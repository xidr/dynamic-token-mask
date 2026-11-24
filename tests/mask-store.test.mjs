import test from "node:test";
import assert from "node:assert/strict";
import {MaskConflictError, MaskStore, validateMask} from "../scripts/mask-store.mjs";

const mask = (src = "tokens/a.webp") => ({src, centerX: 0.5, centerY: 0.5,
  radius: 0.5, imageWidth: 800, imageHeight: 400});

function setup(initial = {version: 1, masks: []}) {
  let value = structuredClone(initial);
  let config;
  let allowed = true;
  let fail = false;
  const events = [];
  const writes = [];
  const settings = {
    register: (_module, _key, options) => { config = options; },
    get: () => value,
    set: async (_module, _key, next) => {
      writes.push(structuredClone(next));
      await Promise.resolve();
      if (fail) { fail = false; throw new Error("Write failed"); }
      value = structuredClone(next);
      config.onChange(value);
    }
  };
  const store = new MaskStore({settings, canWrite: () => allowed, notify: paths => events.push(paths)});
  store.register();
  store.initialize();
  return {store, events, writes, config, settings, deny: () => { allowed = false; },
    fail: () => { fail = true; }, replace: next => { value = next; config.onChange(value); }};
}

test("validates circle bounds using rectangular image dimensions", () => {
  assert.equal(validateMask({...mask(), centerX: 0.25}).centerX, 0.25);
  for (const patch of [{centerX: 0.1}, {radius: 0}, {radius: NaN}, {centerY: Infinity},
    {imageWidth: 0}, {imageHeight: 1.5}, {src: "tokens/*.webp"}, {src: ""}]) {
    assert.throws(() => validateMask({...mask(), ...patch}));
  }
});

test("persists separate exact paths, returns copies, and survives a new service instance", async () => {
  const h = setup();
  const src = "tokens/Лицо%20A.webp?version=2";
  await Promise.all([h.store.save(mask(src)), h.store.save(mask("tokens/a.webp"))]);
  h.store.get(src).centerX = 0;
  h.store.list()[0].radius = 0;
  assert.equal(h.store.get(src).centerX, 0.5);
  const reopened = new MaskStore({settings: h.settings, canWrite: () => true, notify: () => {}});
  reopened.initialize();
  assert.equal(reopened.list().length, 2);
  assert.equal(reopened.has("tokens/A.webp"), false);
});

test("reports affected paths for local and remote changes, skips unchanged saves/removals", async () => {
  const h = setup();
  await h.store.save(mask());
  await h.store.save(mask());
  assert.equal(await h.store.remove("absent.webp"), false);
  assert.deepEqual(h.events, [["tokens/a.webp"]]);
  h.replace({version: 1, masks: [mask("tokens/b.webp")]});
  assert.deepEqual(h.events[1], ["tokens/a.webp", "tokens/b.webp"]);
  assert.equal(await h.store.remove("tokens/b.webp"), true);
  assert.equal(h.store.get("tokens/b.webp"), null);
});

test("conditional writes distinguish expected absence and copy the caller's snapshot", async () => {
  const {store, events} = setup();
  const initial = mask();
  await store.save(initial, {expected: null});
  await assert.rejects(store.save(initial, {expected: null}), MaskConflictError);

  const snapshot = store.get(initial.src);
  const replacement = {...initial, radius: 0.3};
  const pending = store.save(replacement, {expected: snapshot});
  snapshot.radius = 0.1;
  assert.deepEqual(await pending, replacement);

  await assert.rejects(store.remove(initial.src, {expected: initial}), MaskConflictError);
  assert.deepEqual(store.get(initial.src), replacement);
  assert.equal(await store.remove(initial.src), true);
  assert.deepEqual(events, [[initial.src], [initial.src], [initial.src]]);
});

test("read access remains available while GM writes are denied", async () => {
  const h = setup({version: 1, masks: [mask()]});
  h.deny();
  assert.equal(h.store.has("tokens/a.webp"), true);
  await assert.rejects(h.store.save(mask("b.webp")), /Only a GM/);
  await assert.rejects(h.store.remove("tokens/a.webp"), /Only a GM/);
  assert.equal(h.store.list().length, 1);
});

test("failed persistence leaves data intact and queue recovers", async () => {
  const h = setup();
  h.fail();
  await assert.rejects(h.store.save(mask()), /Write failed/);
  assert.equal(h.store.list().length, 0);
  await h.store.save(mask("b.webp"));
  assert.equal(h.store.list().length, 1);
});

test("refuses unknown schemas and duplicate records without replacing data", () => {
  assert.throws(() => setup({version: 4, masks: []}), /Unsupported/);
  assert.throws(() => setup({version: 1, masks: [mask(), mask()]}), /Duplicate/);
});

test("reads and edits legacy circles without upgrading until a polygon is saved", async () => {
  const a = mask();
  const b = mask("b.webp");
  const h = setup({version: 1, masks: [a]});
  const snapshot = h.store.get(a.src);
  assert.deepEqual(h.store.list(), [a]);
  await h.store.save({...a, shape: "circle"}, {expected: snapshot});
  assert.deepEqual(h.writes, []);
  await h.store.save({...b, shape: "circle"});
  assert.deepEqual(h.settings.get(), {version: 1, masks: [a, b]});

  const hex = {...b, shape: "hex-flat"};
  h.fail();
  await assert.rejects(h.store.save(hex, {expected: b}), /Write failed/);
  assert.deepEqual(h.settings.get(), {version: 1, masks: [a, b]});
  await h.store.save(hex, {expected: b});
  assert.deepEqual(h.settings.get(), {version: 2, masks: [{...a, shape: "circle"}, hex]});
  assert.deepEqual(h.events, [[b.src], [b.src]]);
  assert.deepEqual(setup(h.settings.get()).store.list(), [a, hex]);

  // A snapshot from before another record upgraded the schema still matches.
  await h.store.remove(a.src, {expected: snapshot});
  await h.store.save(b, {expected: hex});
  assert.deepEqual(h.settings.get(), {version: 2, masks: [{...b, shape: "circle"}]});
  await h.store.remove(b.src);
  assert.deepEqual(h.settings.get(), {version: 2, masks: []});
});

test("remote shape-only changes invalidate stale saves and removals", async () => {
  const a = mask();
  const h = setup({version: 1, masks: [a]});
  const snapshot = h.store.get(a.src);
  h.replace({version: 2, masks: [{...a, shape: "circle"}]});
  assert.deepEqual(h.events, []);
  const pointy = {...a, shape: "hex-pointy"};
  h.replace({version: 2, masks: [pointy]});
  await assert.rejects(h.store.save(a, {expected: snapshot}), MaskConflictError);
  await assert.rejects(h.store.remove(a.src, {expected: snapshot}), MaskConflictError);
  await h.store.save(pointy, {expected: pointy});
  assert.deepEqual(h.writes, []);
  assert.deepEqual(h.events, [[a.src]]);
  await h.store.save({...a, shape: "square"}, {expected: pointy});
  assert.deepEqual(h.events, [[a.src], [a.src]]);
});

test("checks shape names, collection schema, GM permission and full square bounds", async () => {
  const a = mask();
  for (const shape of [undefined, null, false, "", "triangle", "toString"]) {
    assert.throws(() => validateMask({...a, shape}), /shape/);
  }
  for (const shape of ["circle", "square", "hex-flat", "hex-pointy"]) {
    assert.doesNotThrow(() => validateMask({...a, shape, centerX: 0.25}));
    assert.throws(() => validateMask({...a, shape, centerX: 0.24}), /fit/);
  }
  assert.throws(() => setup({version: 1, masks: [{...a, shape: "square"}]}), /version/);
  assert.throws(() => setup({version: 2, masks: [a]}), /version/);
  const h = setup({version: 1, masks: [a]});
  h.deny();
  await assert.rejects(h.store.save({...a, shape: "square"}), /Only a GM/);
  assert.deepEqual(h.writes, []);
});

test("borders upgrade lazily, compare canonically and protect stale snapshots", async () => {
  const a = mask();
  const b = {...mask("b.webp"), shape: "hex-flat"};
  const defaults = {enabled: false, color: "#000000", widthPercent: 2};
  const h = setup({version: 2, masks: [{...a, shape: "circle"}, b]});
  await h.store.save({...a, border: defaults});
  assert.deepEqual(h.writes, []);
  const border = {enabled: false, color: "#aa00ff", widthPercent: 0.5};
  const saved = {...a, border};
  h.fail();
  await assert.rejects(h.store.save(saved), /Write failed/);
  assert.equal(h.settings.get().version, 2);
  const pending = h.store.save({...a, border: {...border, color: "#AA00FF"}}, {expected: a});
  assert.deepEqual(await pending, saved);
  assert.deepEqual(h.settings.get(), {version: 3, masks: [{...saved, shape: "circle"}, b]});
  assert.deepEqual(h.events, [[a.src]]);
  await h.store.save(saved, {expected: {...saved, border: {...border, color: "#AA00FF"}}});
  assert.equal(h.writes.length, 2);
  await assert.rejects(h.store.save(a, {expected: a}), MaskConflictError);
  await assert.rejects(h.store.remove(a.src, {expected: a}), MaskConflictError);
  const enabled = {...saved, border: {...border, enabled: true}};
  h.replace({version: 3, masks: [{...enabled, shape: "circle"}, b]});
  assert.deepEqual(h.events, [[a.src], [a.src]]);
  await h.store.save({...b, shape: "square"}, {expected: b});
  assert.deepEqual(setup(h.settings.get()).store.get(a.src), enabled);
  await h.store.save({...a, border: defaults}, {expected: enabled});
  assert.deepEqual(h.store.get(a.src), a);
  assert.equal(h.settings.get().version, 3);
});

test("validates border settings even when disabled and guards legacy schema versions", async () => {
  const a = mask();
  const border = {enabled: true, color: "#123456", widthPercent: 10};
  for (const patch of [{enabled: 1}, {widthPercent: 0.499}, {widthPercent: 10.1}, {widthPercent: NaN},
    {widthPercent: "2"}, {color: "#123"}, {color: "#001122ff"}, {color: "black"}]) {
    assert.throws(() => validateMask({...a, border: {...border, enabled: false, ...patch}}), /border/);
  }
  for (const version of [1, 2]) {
    assert.throws(() => setup({version, masks: [{...a, shape: "circle", border}]}), /version/);
  }
  const h = setup({version: 1, masks: [a]});
  await h.store.save({...a, border}, {expected: a});
  assert.equal(h.settings.get().version, 3);
  assert.deepEqual(h.store.get(a.src), {...a, border});
});
