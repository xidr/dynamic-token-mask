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

**TL;DR:** Dynamic Token Mask stores a circle per image path and renders circular crops on ordinary static scene tokens. GMs manage masks through the API or the [[features/portrait-mask-editor|Portrait Mask Editor]]. Foundry 14.369 testing confirmed shared crops and removal in GM and player sessions, with persistence across reconnects and browser reloads. The editor preview matched sampled token pixels for opaque and transparent PNG crops in both sessions. The editor refits its window when loading a portrait pushes the footer below the viewport. See [[editor-actions-below-viewport]].

## Details

- ID: `dynamic-token-mask`; title: Dynamic Token Mask; initial manifest version: `0.1.0`.
- Target: Foundry VTT 14. The manifest specifies minimum 14 and deliberately makes no verified-version claim.
- `scripts/main.js` registers the mask store and GM editor menu, exposes the module API and connects the renderer to Foundry hooks. The editor uses a localized Handlebars template and module-scoped styles.
- A hidden world setting, lifecycle hooks and focused storage tests are implemented; see [[mask-storage]]. No dependencies or build pipeline have been introduced.
- The project has its own Git repository, initialized on `main`; no remote was configured during setup.

## Open design questions

- How should the editor preview crops on nonuniformly scaled or rectangular tokens? It currently shows the square crop before Foundry applies token texture settings.
- How should masking interact with dynamic rings, image transitions and token configuration previews?
- Which other token modules need explicit compatibility testing?

## Related

- [[environment]]
- [[develop-and-validate]]
- [[2026-10-22-standalone-module]]
- [[circular-mask-design]]
- [[file-picker-integration]]
- [[features/portrait-mask-editor]]
- [[features/static-token-renderer]]
