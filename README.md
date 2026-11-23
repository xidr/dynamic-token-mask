# Dynamic Token Mask

A system-independent Foundry VTT module for dynamic circular token masking.

## Status

See the [development roadmap](ROADMAP.md) for completed milestones and the planned editor, file-picker integration and runtime checks.

The module stores one circular mask per image path in each world. Ordinary static scene tokens use the selected circle as a cropped portrait while retaining their original image path and token dimensions. In a Foundry VTT 14.369 test world, saving a mask updated two matching tokens in both GM and player sessions. The crops persisted across reconnects and reloads, and removing the mask restored the original portraits in both sessions. [Test-world procedure](knowledge/how-to/verify-static-token-masks.md)

Once Foundry is ready, a GM can save or remove masks through `game.modules.get("dynamic-token-mask").api.masks`. The mask editor and file-browser controls are planned. [Storage contract](knowledge/reference/mask-storage.md) · [Renderer feature record](knowledge/features/static-token-renderer.md) · [File-picker integration plan](knowledge/reference/file-picker-integration.md)

## Development

Open this folder as its own IDE project and Git repository.

- `module.json`: Foundry module manifest.
- `scripts/main.js`: registers storage, exposes the module API and wires renderer hooks.
- `scripts/mask-store.mjs`: validated world-level mask persistence.
- `scripts/mask-renderer.mjs`: circular cropping and token mesh texture lifecycle.
- `tests/`: storage and renderer tests (`node --test`).
- `styles/module.css`: module UI styles.
- `lang/en.json`, `lang/ru.json`: translations.

No build step is required. The main checkout under `/opt/foundry-dev/foundrydata/Data/modules/dynamic-token-mask` is the live module directory. Linked worktrees are isolated from it.
Once Foundry discovers the module, enable it through Manage Modules in a test world and reload the browser after script changes. If it is absent from the module list, a Foundry restart may be needed.

Files in this directory can be served publicly by Foundry. Keep secrets and private material outside it.

## Agent knowledge base

Start with [AGENTS.md](AGENTS.md) and [knowledge/index.md](knowledge/index.md). Shared notes cover project scope, environment, validation and open design questions. Use [CODEX.md](CODEX.md) for Codex and [GEMINI.md](GEMINI.md) for Gemini Swarm.
