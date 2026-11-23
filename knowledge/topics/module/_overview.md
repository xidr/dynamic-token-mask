---
title: Module overview
created: 2026-10-22
updated: 2026-11-23
tags: [module, scope]
status: active
source: Project setup conversation, 2026-10-22, and scripts/main.js, scripts/mask-renderer.mjs and scripts/mask-editor.mjs, 2026-11-23
---

# Module overview

Last verified: 2026-11-23 (Foundry 14.369 GM and player renderer checks and GM editor footer regression)

**TL;DR:** Dynamic Token Mask stores a circle per image path and renders circular crops on ordinary static scene tokens. GMs manage masks through the API or the [Portrait Mask Editor](../../features/portrait-mask-editor.md). Foundry 14.369 testing confirmed shared crops and removal in GM and player sessions, with persistence across reconnects and browser reloads. Editor runtime checks are pending.

## Details

- ID: `dynamic-token-mask`; title: Dynamic Token Mask; initial manifest version: `0.1.0`.
- Target: Foundry VTT 14. The manifest specifies minimum 14 and deliberately makes no verified-version claim.
- `scripts/main.js` registers the mask store and GM editor menu, exposes the module API and connects the renderer to Foundry hooks. The editor uses a localized Handlebars template and module-scoped styles.
- A hidden world setting, lifecycle hooks and focused storage tests are implemented; see [mask storage](../../reference/mask-storage.md). No dependencies or build pipeline have been introduced.
- The project has its own Git repository, initialized on `main`; no remote was configured during setup.

## Open design questions

- How should the editor preview crops on nonuniformly scaled or rectangular tokens? It currently shows the square crop before Foundry applies token texture settings.
- How should masking interact with dynamic rings, image transitions and token configuration previews?
- Which other token modules need explicit compatibility testing?

## In this area

- [Circular mask design](circular-mask-design.md) — original design and current editor behavior. Read when: changing crop behavior or the editor.

## Related

- [Environment](../../reference/environment.md)
- [Develop and validate](../../how-to/develop-and-validate.md)
- [Standalone module](../../decisions/2026-10-22-standalone-module.md)
- [File picker integration](../../reference/file-picker-integration.md)
- [Portrait mask editor](../../features/portrait-mask-editor.md)
- [Static token renderer](../../features/static-token-renderer.md)
