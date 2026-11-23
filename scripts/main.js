import {CHANGE_HOOK, MaskStore, MODULE_ID} from "./mask-store.mjs";
import {MaskRenderer} from "./mask-renderer.mjs";

let masks;
let renderer;

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
  game.modules.get(MODULE_ID).api = Object.freeze({masks});
});

Hooks.once("ready", () => {
  masks.initialize();
  renderer = new MaskRenderer(masks);
  for (const token of globalThis.canvas?.tokens?.placeables ?? []) applyMask(token);
});
Hooks.on("drawToken", applyMask);
Hooks.on(CHANGE_HOOK, paths => {
  for (const token of globalThis.canvas?.tokens?.placeables ?? []) {
    if (paths.includes(token.document.texture.src)) applyMask(token);
  }
});
Hooks.on("destroyToken", token => renderer?.release(token, false));
Hooks.on("canvasTearDown", () => renderer?.clear());
