# Dynamic Token Mask

A system-independent Foundry VTT module for dynamic circular token masking.

## Status

Initial scaffold only. Token masking is not implemented yet. Targets Foundry VTT 14; runtime compatibility has not yet been verified.

The intended behavior preserves original images and lets users adjust a circular mask's center and size for scene-token rendering. See the [proposed design](knowledge/topics/module/circular-mask-design.md), based on inspection of the installed Foundry 14.367 source.

File-picker source inspection is complete: the [integration plan](knowledge/reference/file-picker-integration.md) uses the existing browser's render hooks for image controls. Storage, editing and browser integration are not implemented yet.

## Development

Open this folder as its own IDE project and Git repository.

- `module.json`: Foundry module manifest.
- `scripts/main.js`: browser ES module entry point.
- `styles/module.css`: module UI styles.
- `lang/en.json`, `lang/ru.json`: translations.

No build step is required. This directory is the live module installation at `/opt/foundry/foundrydata/Data/modules/dynamic-token-mask`.
Once Foundry discovers the module, enable it through Manage Modules in a test world and reload the browser after script changes. If it is absent from the module list, a Foundry restart may be needed.

Files in this directory can be served publicly by Foundry. Keep secrets and private material outside it.

## Agent knowledge base

Start with [AGENTS.md](AGENTS.md) and [knowledge/index.md](knowledge/index.md). Shared notes cover project scope, environment, validation and open design questions. Claude Code uses the same instructions through `CLAUDE.md`.
