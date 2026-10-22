import {CHANGE_HOOK, MaskStore, MODULE_ID} from "./mask-store.mjs";

let masks;
Hooks.once("init", () => {
  masks = new MaskStore({
    settings: game.settings,
    canWrite: () => game.ready && game.user?.isGM === true,
    notify: paths => Hooks.callAll(CHANGE_HOOK, paths)
  });
  masks.register();
  game.modules.get(MODULE_ID).api = Object.freeze({masks});
});

Hooks.once("ready", () => masks.initialize());
