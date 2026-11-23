# Dynamic Token Mask

A system-independent Foundry VTT module for dynamic circular token masking.

## Status

See the [development roadmap](ROADMAP.md) for completed milestones and the remaining Foundry checks and planned file-picker integration.

The module stores one circular mask per image path in each world. Ordinary static scene tokens use the selected circle as a cropped portrait while retaining their original image path and token dimensions. In a Foundry VTT 14.369 test world, saving a mask updated two matching tokens in both GM and player sessions. The crops persisted across reconnects and reloads, and removing the mask restored the original portraits in both sessions. [Test-world procedure](knowledge/how-to/verify-static-token-masks.md)

In a ready world, a GM can open **Portrait Mask Editor** from Configure Settings. Enter the exact image path or browse for a static PNG, JPEG or WebP, then select **Load Image**. Move or resize the circle with the drag handles or numeric controls and check the square crop on the checkerboard. **Save Mask** and **Remove Mask** update eligible tokens using that image path throughout the world. **Cancel** discards the current draft. On Foundry 14.369, both GM and player token textures matched the wide and transparent PNG preview samples. At 1400×950, all four footer actions stayed visible after loading a wide portrait. Per-image buttons and saved-mask indicators in the file picker are planned. [Editor feature record](knowledge/features/portrait-mask-editor.md) · [Storage contract](knowledge/reference/mask-storage.md)

## Development

Open this folder as its own IDE project and Git repository.

- `module.json`: Foundry module manifest.
- `scripts/main.js`: registers storage and the editor menu, exposes the module API and wires renderer hooks.
- `scripts/mask-store.mjs`: validated world-level mask persistence.
- `scripts/mask-renderer.mjs`: shared circular crop drawing and token mesh texture lifecycle.
- `scripts/mask-editor.mjs`, `scripts/mask-geometry.mjs`: GM editor, image validation and circle geometry.
- `templates/mask-editor.hbs`: editor controls and preview.
- `tests/`: storage, renderer and editor tests (`node --test`).
- `styles/module.css`: module UI styles.
- `lang/en.json`, `lang/ru.json`: translations.

No build step is required. The main checkout under `/opt/foundry-dev/foundrydata/Data/modules/dynamic-token-mask` is the live module directory. Linked worktrees are isolated from it.
Once Foundry discovers the module, enable it through Manage Modules in a test world and reload the browser after script changes. If it is absent from the module list, a Foundry restart may be needed.

Files in this directory can be served publicly by Foundry. Keep secrets and private material outside it.

## Agent knowledge base

Start with [AGENTS.md](AGENTS.md) and [knowledge/index.md](knowledge/index.md). Shared notes cover project scope, environment, validation and open design questions. Use [CODEX.md](CODEX.md) for Codex and [GEMINI.md](GEMINI.md) for Gemini Swarm.
