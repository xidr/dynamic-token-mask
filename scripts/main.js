import {MaskEditor, openMaskEditor} from "./mask-editor.mjs";
import {MaskFilePicker} from "./mask-file-picker.mjs";
import {CHANGE_HOOK, MaskStore, MODULE_ID} from "./mask-store.mjs";
import {MaskRenderer} from "./mask-renderer.mjs";
import {PrototypeMaskPreview} from "./prototype-mask-preview.mjs";

let masks;
let renderer;
let pickerMasks;
let prototypePreview;

function applyMask(token) {
  renderer?.apply(token).catch(error => console.warn("Dynamic Token Mask | Could not apply token mask.", error));
}

Hooks.once("init", () => {
  masks = new MaskStore({
    settings: game.settings,
    canWrite: () => game.ready && game.user?.isGM === true,
    notify: paths => Hooks.callAll(CHANGE_HOOK, paths)
  });
  masks.register();
  pickerMasks = new MaskFilePicker(masks, openMaskEditor);
  game.modules.get(MODULE_ID).api = Object.freeze({masks, openEditor: openMaskEditor});
});

Hooks.once("setup", () => {
  if (game.user?.isGM === true) {
    game.settings.registerMenu(MODULE_ID, "portraitEditor", {
      name: "DTM.Title",
      label: "DTM.OpenEditor",
      hint: "DTM.MenuHint",
      icon: "fa-solid fa-circle-user",
      type: MaskEditor,
      restricted: true
    });
  }
});

Hooks.once("ready", () => {
  masks.initialize();
  renderer = new MaskRenderer(masks);
  prototypePreview = new PrototypeMaskPreview(masks);
  for (const token of globalThis.canvas?.tokens?.placeables ?? []) applyMask(token);
});
Hooks.on("drawToken", applyMask);
Hooks.on("updateToken", (doc, changed) => {
  if (!doc.rendered || !renderer) return;
  if (changed.ring?.subject && ("texture" in changed.ring.subject)) {
    renderer.subjectChanged(doc.object).catch(error => console.warn("Dynamic Token Mask | Could not refresh ring subject.", error));
  }
  const {CanvasAnimation} = foundry.canvas.animation;
  renderer.transition(doc.object, name => CanvasAnimation.getAnimation(name),
    foundry.canvas.rendering.filters.TextureTransitionFilter)
    .catch(error => console.warn("Dynamic Token Mask | Could not frame token transition.", error));
});
Hooks.on("refreshToken", token => renderer?.refreshPreview(token));
Hooks.on("renderTokenConfig", (sheet, element) => renderer?.watchConfig(sheet, element));
Hooks.on("closeTokenConfig", sheet => renderer?.closeConfig(sheet));
Hooks.on("renderPrototypeTokenConfig", (sheet, element) => prototypePreview?.render(sheet, element));
Hooks.on("closePrototypeTokenConfig", sheet => prototypePreview?.close(sheet));
Hooks.on("renderFilePicker", (picker, element) => pickerMasks?.render(picker, element));
Hooks.on("closeFilePicker", picker => pickerMasks?.close(picker));
Hooks.on(CHANGE_HOOK, paths => {
  pickerMasks?.update(paths);
  prototypePreview?.update(paths);
  renderer?.update(paths, globalThis.canvas?.tokens?.placeables ?? [])
    .catch(error => console.warn("Dynamic Token Mask | Could not update token masks.", error));
});
Hooks.on("destroyToken", token => renderer?.release(token, false));
Hooks.on("canvasTearDown", () => renderer?.clear());
