---
title: Module overview
created: 2026-10-22
updated: 2026-11-24
tags: [module, scope]
status: active
source: Project setup conversation, 2026-10-22, and scripts/main.js, scripts/mask-renderer.mjs, scripts/mask-editor.mjs, scripts/mask-file-picker.mjs and scripts/prototype-mask-preview.mjs
---

# Module overview

Last verified on 2026-11-24 against the native ring renderer at `cabdfef` in separate Foundry 14.369 GM and owning-player sessions. [Native dynamic rings](../../features/native-dynamic-rings.md)

On 2026-11-24, the GM and owning player tested the preceding native token workflow batch on Foundry 14.369. The native token workflow checks covered drags for both roles and configuration previews for the GM. Both clients showed the expected art during completed native fades and settled on the requested portraits after interrupted fades. [Runtime results by role](../../features/native-token-previews-and-transitions.md#foundry-14369-post-merge-verification) The first UI release was verified on 2026-11-23 in a Foundry 14.369 test world with GM and player clients. [Picker release verification](../../features/file-picker-mask-controls.md#first-ui-release) · [Renderer verification](../../features/static-token-renderer.md#first-ui-release)

**TL;DR:** Dynamic Token Mask stores a circle per image path and renders circular crops on ordinary static scene tokens. GMs manage masks through the API or the [Portrait Mask Editor](../../features/portrait-mask-editor.md), including through per-image buttons in the [built-in file picker](../../features/file-picker-mask-controls.md). Saving from the picker updated matching indicators in two open GM pickers and matching token textures on both clients. Foundry 14.369 testing confirmed shared crops and removal in GM and player sessions, with persistence across reconnects and browser reloads. The editor preview matched sampled token pixels for opaque and transparent PNG crops in both sessions. The editor refits its window when loading a portrait pushes the footer below the viewport. See [editor-actions-below-viewport](../../bugs/fixed/editor-actions-below-viewport.md).

## Details

- ID: `dynamic-token-mask`; title: Dynamic Token Mask; initial manifest version: `0.1.0`.
- Target: Foundry VTT 14. The manifest specifies minimum 14 and deliberately makes no verified-version claim.
- `scripts/main.js` registers the mask store and GM editor menu, exposes the module API and connects the renderer and picker adapter to Foundry hooks. The editor uses a localized Handlebars template and module-scoped styles.
- The renderer handles eligible drag and scene-configuration clones and recognized native transition targets. A sheet adapter crops the prototype Appearance thumbnail. [Native token previews and transitions](../../features/native-token-previews-and-transitions.md)
- The canvas renderer uses the portrait mask for implicit dynamic ring subjects and the subject mask for explicit subjects. When a subject has no applicable mask, Foundry supplies native art. [Native dynamic rings](../../features/native-dynamic-rings.md)
- A hidden world setting, lifecycle hooks and focused storage tests are implemented; see [mask storage](../../reference/mask-storage.md). No dependencies or build pipeline have been introduced.
- The project has its own Git repository, initialized on `main`; no remote was configured during setup.

## Open design questions

- Should the editor offer a token-specific preview? The current square preview shows the crop before Foundry applies token fit and scale. On a rectangular footprint or with nonuniform scale, the circle can render as an ellipse.
- Which other token modules need explicit compatibility testing?

## In this area

- [Circular mask design](circular-mask-design.md) — original design and current editor behavior. Read when: changing crop behavior or the editor.

## Related

- [Environment](../../reference/environment.md)
- [Develop and validate](../../how-to/develop-and-validate.md)
- [Standalone module](../../decisions/2026-10-22-standalone-module.md)
- [File picker integration](../../reference/file-picker-integration.md)
- [Native token previews and transitions](../../features/native-token-previews-and-transitions.md)
- [Portrait mask editor](../../features/portrait-mask-editor.md)
- [Static token renderer](../../features/static-token-renderer.md)
