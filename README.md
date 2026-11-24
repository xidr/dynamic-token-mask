# Dynamic Token Mask

A system-independent Foundry VTT module for per-image token masking.

## Status

The first UI release was tested in a designated Foundry VTT 14.369 test world on November 23, 2026. See the [development roadmap](ROADMAP.md) for the tested cases and remaining validation.

The module stores one mask per exact image path in each world. Circle is the default, with square, flat-topped hexagon and pointy-topped hexagon also available. Ordinary static scene tokens use the selected shape as a cropped portrait while retaining their original image path and token dimensions. In the original circle checks on Foundry VTT 14.369, saving a mask updated two matching tokens in both GM and player sessions. The crops persisted across reconnects and reloads, and removing the mask restored the original portraits in both sessions. [Test-world procedure](knowledge/how-to/verify-static-token-masks.md)

In a ready world, a GM can open **Portrait Mask Editor** from Configure Settings. Enter the exact image path or browse for a static PNG, JPEG or WebP, then select **Load Image**. Choose a mask shape, adjust the center and frame half-size, and check the square crop on the checkerboard. Shape changes preserve framing. **Reset Frame** centers and fits the selected shape to the image. **Save Mask** and **Remove Mask** update eligible tokens using that image path throughout the world. **Cancel** discards the current draft. In the circle editor checks on Foundry 14.369, both GM and player token textures matched the wide and transparent PNG preview samples. At 1400×950, all four footer actions stayed visible after loading a wide portrait. [Editor feature record](knowledge/features/portrait-mask-editor.md) · [Storage contract](knowledge/reference/mask-storage.md)

In the built-in file picker, a ready-world GM can use the portrait icon beside a PNG, JPEG or WebP candidate to open the editor for that exact path. A check mark indicates a saved mask. The control is available in list, thumbnail, tile and image views. The standard file selection still works on the row. In live testing, a GM opened a transparent PNG with spaces and Cyrillic characters in its filename, cancelled an edit, then reopened it and saved. Both clients saw the shared crop and later saw the originals return on removal. The crops survived scene changes, a GM browser reload and a player rejoin. A separate player reload reached the canvas, but returning to the test scene timed out. Missing PNGs, GIFs and unresolved wildcard patterns could not be saved. [File picker mask controls](knowledge/features/file-picker-mask-controls.md)

Masks apply to the exact resolved image. In the live checks, switching to an unrelated wildcard variant displayed its original art, and switching back displayed the crop. The editor shows a square crop. Foundry applies token fit, rotation, mirroring and texture scale to that square, so a stretched token can display the circle as an ellipse. [Renderer verification](knowledge/features/static-token-renderer.md#first-ui-release)

The native token workflow batch covers held drag previews, scene-token configuration previews, prototype Appearance thumbnails and targets in recognized native image transitions. In Foundry 14.369, held drag, drop and cancel passed for the GM and owning player. The GM verified scene-token and prototype Appearance previews, including Cancel and Apply. Both clients saw the expected portrait framing during completed native fades and the correct final portraits after interrupted fades. Mask creation, replacement and removal refreshed matching previews while they were open. The test owner's native permissions prevented opening the configuration sheets and placing tokens. [Native token previews and transitions](knowledge/features/native-token-previews-and-transitions.md)

The dynamic ring renderer uses the portrait's mask for an implicit subject and the subject image's own mask for an explicit one. When Foundry infers alternate subject art, a saved portrait mask uses the original portrait pixels. Without an applicable mask, the ring displays native subject art. On Foundry 14.369, the GM and owning player verified all seven subject cases, rectangular fit, live mask edits and settled native transitions. A remote subject change can cancel a held drag when Foundry redraws the token. [Native dynamic rings](knowledge/features/native-dynamic-rings.md)

On Foundry 14.369, the GM verified all four outlines in the editor. Both clients saw matching placed crops update on save, persist through reload and return to the source art on removal. The shape checks also covered held drags, native fades and implicit and explicit ring subjects. A rapid return to the original portrait left a stale ordinary scene-token preview in the GM sheet. The repair passed 78 Node tests and independent review. The live rerun on Foundry 14.369 confirmed rapid and whitespace-padded returns to the original portrait. Both clients saw the expected placed crops after Cancel and Apply. [Mask shape results](knowledge/how-to/verify-mask-shapes.md#check-it-worked) · [Scene preview repair](knowledge/bugs/fixed/stale-scene-token-preview.md)

A GM can use **Show border** on any shape, choose a color and set the width to 0.5–10% of the square crop side. The default is off, with black at 2%. Turning the border off keeps its color and width for later. The border sits inside the outline and appears in the editor preview and eligible token render paths. On Foundry 14.369, the GM verified the editor controls and both configuration previews. Both roles observed border updates, browser reload persistence, removal, held drags, native fades and implicit and explicit ring subjects. All four shapes passed the placed-crop checks with borders off, at 0.5% and at 10% for both roles. Fresh-canvas reference crops matched all 12 placed crops pixel for pixel. Moving the wide editor exposed its full footer at 1400×950. [Colored mask border verification](knowledge/how-to/verify-mask-borders.md#check-it-worked)

## Development

Open this folder as its own IDE project and Git repository.

- `module.json`: Foundry module manifest.
- `scripts/main.js`: registers storage and the editor menu, exposes the module API and wires renderer, prototype preview and picker hooks.
- `scripts/mask-store.mjs`: validated world-level mask persistence.
- `scripts/mask-renderer.mjs`: shared shape-aware crop drawing and token mesh texture lifecycle.
- `scripts/prototype-mask-preview.mjs`: crop for the native prototype Appearance thumbnail.
- `scripts/mask-editor.mjs`, `scripts/mask-geometry.mjs`: GM editor, image validation and mask geometry.
- `scripts/mask-file-picker.mjs`: GM-only controls and saved-mask indicators in the built-in picker.
- `templates/mask-editor.hbs`: editor controls and preview.
- `tests/`: storage, renderer, editor and picker tests (`node --test`).
- `styles/module.css`: module UI styles.
- `lang/en.json`, `lang/ru.json`: translations.

No build step is required. The main checkout under `/opt/foundry-dev/foundrydata/Data/modules/dynamic-token-mask` is the live module directory. Linked worktrees are isolated from it.
Once Foundry discovers the module, enable it through Manage Modules in a test world and reload the browser after script changes. If it is absent from the module list, a Foundry restart may be needed.

For authorized browser checks in the designated test world, see [Use Playwright MCP for Foundry checks](knowledge/how-to/use-playwright-mcp-for-foundry.md).

Files in this directory can be served publicly by Foundry. Keep secrets and private material outside it.

## Agent knowledge base

Start with [AGENTS.md](AGENTS.md) and [knowledge/INDEX.md](knowledge/INDEX.md). Shared notes cover project scope, environment, validation and open design questions. Use [CODEX.md](CODEX.md) for Codex and [GEMINI.md](GEMINI.md) for Gemini Swarm.
