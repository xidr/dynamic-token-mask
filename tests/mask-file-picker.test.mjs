import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {beforeEach, test} from "node:test";
import {setImmediate} from "node:timers/promises";
import {MODULE_ID} from "../scripts/mask-store.mjs";

const variants = ["list", "thumbs", "tiles", "images"];
const src = "portraits/Case%20Sensitive%20%D0%9B.PNG";
const portrait = {src, centerX: 0.5, centerY: 0.5, radius: 0.3, imageWidth: 400, imageHeight: 200};
const strings = JSON.parse(readFileSync(new URL("../lang/en.json", import.meta.url), "utf8")).DTM;

// Model the installed FilePicker markup and its delegated selection and local row dragging.
class Element {
  children = [];
  dataset = {};
  style = {};
  parentElement = null;
  attributes = {};
  listeners = new Map();
  attached = false;

  constructor(tagName, ownerDocument, options) {
    Object.assign(this, {tagName, ownerDocument}, options);
  }

  get isConnected() {
    return this.attached || (this.parentElement?.isConnected ?? false);
  }

  prepend(child) {
    child.parentElement = this;
    this.children.unshift(child);
  }

  append(...children) {
    for (const child of children) {
      child.parentElement = this;
      this.children.push(child);
    }
  }

  remove() {
    const parent = this.parentElement;
    if (parent) parent.children.splice(parent.children.indexOf(this), 1);
    this.parentElement = null;
    this.attached = false;
  }

  setAttribute(name, value) {
    this.attributes[name] = value;
  }

  addEventListener(type, listener) {
    if (!this.listeners.has(type)) this.listeners.set(type, []);
    this.listeners.get(type).push(listener);
  }

  focus() {
    this.ownerDocument.activeElement = this;
  }

  fire(type, details) {
    const event = {
      target: this, ...details, defaultPrevented: false, stopped: false,
      preventDefault() { this.defaultPrevented = true; },
      stopPropagation() { this.stopped = true; }
    };
    for (let element = this; element && !event.stopped; element = element.parentElement) {
      for (const listener of element.listeners.get(type) ?? []) listener(event);
    }
    return event;
  }
}

function makeDocument() {
  return {
    baseURI: "https://foundry.example/table/game",
    createElement(tag, options) { return new Element(tag, this, options); }
  };
}

function makePicker(mode = "list", {type = "any", ownerDocument = makeDocument()} = {}) {
  const element = ownerDocument.createElement("form", {attached: true});
  const picker = {
    type, element, selected: "", search: "", submitted: [], dragged: [], browseCount: 0,
    browse() { this.browseCount++; },
    render() { Hooks.callAll("renderFilePicker", this, element); },
    close() {
      element.remove();
      Hooks.callAll("closeFilePicker", this);
    },
    show(files) {
      const section = ownerDocument.createElement("section", {dataset: {files: ""}});
      const destination = ownerDocument.createElement("ul", {className: "directory folders"});
      const list = ownerDocument.createElement("ul", {
        className: "directory files-list " + (mode === "list" ? "details" : mode)
      });
      this.body?.remove();
      this.body = section;
      element.append(section);
      section.append(destination, list);
      const rows = files.map(([path, name, directory = false]) => {
        const dataset = directory ? {path, name, directory: "", action: "pickDirectory"}
          : {path, name, file: "", action: "pickFile"};
        const row = ownerDocument.createElement("li", {dataset, draggable: !directory});
        row.addEventListener("dragstart", () => this.dragged.push(path));
        (directory ? destination : list).append(row);
        return row;
      });
      this.render();
      return rows;
    }
  };

  element.querySelectorAll = selector => {
    assert.equal(selector, 'section[data-files] .files-list > li[data-file][data-path][data-action="pickFile"]');
    return element.children
      .filter(section => Object.hasOwn(section.dataset, "files"))
      .flatMap(section => section.children)
      .filter(list => list.className.split(" ").includes("files-list"))
      .flatMap(list => list.children)
      .filter(row => Object.hasOwn(row.dataset, "file") && Object.hasOwn(row.dataset, "path")
        && row.dataset.action === "pickFile");
  };
  element.addEventListener("click", event => {
    let row = event.target;
    while (row && !row.dataset.action) row = row.parentElement;
    if (row?.dataset.action === "pickFile") picker.selected = row.dataset.path;
  });
  element.addEventListener("submit", () => picker.submitted.push(picker.selected));
  return picker;
}

function wrappers(row) {
  return row.children.filter(child => child.className === "dynamic-token-mask mask-picker-control");
}

function button(row) {
  assert.equal(wrappers(row).length, 1);
  return wrappers(row)[0].children[0];
}

function checkSaved(control, saved) {
  assert.equal(control.children[1].hidden, !saved);
  assert.equal(control.attributes["aria-label"].endsWith(" (mask saved)"), saved);
}

const hooks = new Map();
globalThis.Hooks = {
  once: (name, handler) => hooks.set(name, handler),
  on: (name, handler) => hooks.set(name, handler),
  callAll: (name, ...args) => hooks.get(name)?.(...args)
};
globalThis.document = makeDocument();
globalThis.foundry = {applications: {api: {
  ApplicationV2: class {
    async render() {
      this._canRender();
      const {src: path} = await this._prepareContext({});
      document.activeElement = document.createElement("button");
      this.rendered = true;
      editors.push({editor: this, path});
    }
    async close() {
      this.rendered = false;
      this._onClose({});
    }
    _prepareContext() {}
    _onClose() {}
  },
  HandlebarsApplicationMixin: base => base
}}};
await import("../scripts/main.js");

let editors;
let masks;
let reads;

beforeEach(() => {
  editors = [];
  reads = 0;
  let stored = {version: 1, masks: [portrait]};
  let onChange;
  globalThis.game = {
    ready: true,
    user: {isGM: true},
    i18n: {
      format: (key, {name}) => strings[key.split(".")[1]].replace("{name}", () => name)
    },
    modules: new Map([[MODULE_ID, {}]]),
    settings: {
      register(_module, _setting, config) { onChange = config.onChange; },
      get() { reads++; return stored; },
      set(_module, _setting, value) { stored = value; onChange(value); }
    }
  };
  Hooks.callAll("init");
  Hooks.callAll("ready");
  ({masks} = game.modules.get(MODULE_ID).api);
});

test("renders one translated control per static image candidate in each picker view", () => {
  for (const mode of variants) {
    const name = "Case Sensitive Л <portrait>";
    const picker = makePicker(mode);
    const [saved, s3, relative, ...skipped] = picker.show([
      [src, name],
      ["https://assets.example/Portrait%2BOne.webp?signature=x#anchor", "Portrait+One"],
      ["data/Новый portrait.JPEG", "Новый portrait"],
      ["portrait.svg", "SVG"], ["portrait.GIF", "GIF"], ["portrait.apng", "APNG"], ["portrait.mp4", "Video"],
      ["portrait.txt?fake=.png", "Text"], ["portraits/*.png", "Wildcard"], ["blob:https://example.com/x.png", "Blob"],
      ["data:image/png;base64,abcd.png", "Data URL"], ["", "Empty"], ["dirname.png", "Directory", true]
    ]);
    const edit = button(saved);
    assert.equal(edit.tagName, "button");
    assert.equal(edit.type, "button");
    assert.equal(edit.attributes["aria-label"], "Edit portrait mask for " + name + " (mask saved)");
    assert.equal(edit.attributes["aria-label"], edit.title);
    checkSaved(edit, true);
    checkSaved(button(s3), false);
    checkSaved(button(relative), false);
    for (const row of skipped) assert.equal(wrappers(row).length, 0);
    picker.render();
    assert.equal(button(saved), edit);
    assert.equal(edit.listeners.get("click").length, 1);
    assert.equal(edit.listeners.get("dragstart").length, 1);
  }
});

test("skips players, unready worlds, folder pickers, and roots without compatible rows", () => {
  const picker = makePicker();
  game.ready = false;
  const [row] = picker.show([[src, "Portrait"]]);
  assert.equal(wrappers(row).length, 0);
  game.ready = true;
  game.user.isGM = false;
  picker.render();
  assert.equal(wrappers(row).length, 0);
  game.user.isGM = true;
  const [folderRow] = makePicker("list", {type: "folder"}).show([[src, "Portrait"]]);
  assert.equal(wrappers(folderRow).length, 0);
  makePicker().render();
  picker.render();
  assert.equal(wrappers(row).length, 1);
  game.user.isGM = false;
  picker.render();
  assert.equal(wrappers(row).length, 0);
});

test("edit activation opens the exact image and restores focus without native selection or submit", async () => {
  const picker = makePicker("thumbs");
  const [selected, editRow] = picker.show([["preserve.webp", "Already selected"], [src, "Portrait"]]);
  selected.fire("click");
  const control = button(editRow);

  // Pointer clicks and the detail=0 click synthesized by Enter or Space reach the same native button listener.
  for (const detail of [1, 0]) {
    const event = control.children[0].fire("click", {detail});
    assert.equal(event.defaultPrevented, true);
    assert.equal(event.stopped, true);
    assert.equal(picker.selected, "preserve.webp");
    assert.deepEqual(picker.submitted, []);
    await setImmediate();
    const {editor, path} = editors.at(-1);
    assert.equal(path, src);
    picker.element.ownerDocument.activeElement = picker.element;
    await editor.close();
    assert.equal(picker.element.ownerDocument.activeElement, control);
  }
  assert.equal(editors.length, 2);
  picker.element.fire("submit");
  assert.deepEqual(picker.submitted, ["preserve.webp"]);
});

test("keeps native image drag and cancels drags that start on the edit button", () => {
  const picker = makePicker("tiles");
  const [row] = picker.show([[src, "Portrait"]]);
  const control = button(row);
  assert.equal(row.draggable, true);
  assert.equal(control.draggable, true);
  const editDrag = control.fire("dragstart");
  assert.equal(editDrag.defaultPrevented, true);
  assert.deepEqual(picker.dragged, []);

  const rowDrag = row.fire("dragstart");
  assert.equal(rowDrag.defaultPrevented, false);
  assert.deepEqual(picker.dragged, [src]);
});

test("updates matching rows across open windows without replacing their native state", async () => {
  const first = makePicker();
  const second = makePicker("images");
  const [row, sameName, encodedDifferently] = first.show([[src, "Portrait"],
    ["elsewhere/portrait.png", "Portrait"], [decodeURIComponent(src), "Portrait"]]);
  const [otherRow] = second.show([[src, "Portrait"]]);
  const edit = button(row);
  const otherEdit = button(otherRow);
  row.fire("click");
  first.search = "different search";
  row.style.display = "none";
  first.body.scrollTop = 92;

  await masks.remove(src);
  checkSaved(edit, false);
  checkSaved(otherEdit, false);
  await masks.save(portrait);
  checkSaved(edit, true);
  checkSaved(otherEdit, true);
  checkSaved(button(sameName), false);
  checkSaved(button(encodedDifferently), false);
  assert.equal(first.selected, src);
  assert.equal(first.search, "different search");
  assert.equal(row.style.display, "none");
  assert.equal(first.body.scrollTop, 92);
  assert.equal(first.browseCount + second.browseCount, 0);
  assert.equal(button(row), edit);
  assert.equal(button(otherRow), otherEdit);
});

test("releases replaced and closed picker controls", async () => {
  const picker = makePicker();
  const [oldRow] = picker.show([[src, "Portrait"]]);
  const oldControl = button(oldRow);
  oldControl.fire("click");
  await setImmediate();
  const [newRow] = picker.show([["different.jpg", "New directory"]]);
  assert.equal(oldControl.isConnected, false);
  assert.equal(wrappers(oldRow).length, 0);
  picker.element.ownerDocument.activeElement = picker.element;
  await editors[0].editor.close();
  assert.equal(picker.element.ownerDocument.activeElement, picker.element);
  checkSaved(button(newRow), false);

  const [sameRow] = picker.show([[src, "Back to original directory"]]);
  checkSaved(button(sameRow), true);
  // ApplicationV2 can detach a same-ID picker on render without emitting its close hook.
  picker.element.remove();
  const fresh = makePicker();
  const [freshRow] = fresh.show([[src, "Current picker"]]);
  assert.equal(wrappers(sameRow).length, 0);
  fresh.close();
  assert.equal(wrappers(freshRow).length, 0);
  const readsAfterClosing = reads;
  await masks.remove(src);
  assert.equal(reads, readsAfterClosing + 1);
});
