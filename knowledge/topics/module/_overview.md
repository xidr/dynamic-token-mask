---
title: Module overview
created: 2026-10-22
updated: 2026-10-22
tags: [module, scope]
status: active
source: Project setup conversation and existing server knowledge, 2026-10-22
---

# Module overview

**TL;DR:** Dynamic Token Mask will preserve source images and allow editing a circular mask's center and size for scene-token rendering. Only the scaffold exists; a source-informed design is proposed in [[circular-mask-design]], with no runtime verification.

## Details

- ID: `dynamic-token-mask`; title: Dynamic Token Mask; initial manifest version: `0.1.0`.
- Target: Foundry VTT 14. The manifest specifies minimum 14 and deliberately makes no verified-version claim.
- `scripts/main.js` and `styles/module.css` contain placeholders. English and Russian language files are empty JSON objects.
- No dependencies, build pipeline, settings, hooks, masking code or automated test suite have been introduced.
- The project has its own Git repository, initialized on `main`; no remote was configured during setup.

## Open design questions

Clarify these with the user before treating them as requirements:

- Per-image association is confirmed, including individual images selected by wildcard tokens; world-level storage is the current proposal.
- Confirm whether the selected circle should fill the token or retain the original image framing.
- How should masking interact with Foundry's existing token rendering, borders, scaling and rotation?
- Which other token modules must be compatible? What should happen when the module is disabled?

Investigate the installed Foundry rendering API before choosing hooks or an implementation strategy.

## Related

- [[environment]]
- [[develop-and-validate]]
- [[2026-10-22-standalone-module]]
- [[circular-mask-design]]
- [[file-picker-integration]]
