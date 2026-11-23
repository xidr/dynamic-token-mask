---
title: Static token renderer
created: 2026-11-23
updated: 2026-11-23
tags: [feature, rendering]
status: active
source: scripts/main.js, scripts/mask-renderer.mjs and tests/mask-renderer.test.mjs
---

# Static token renderer

**TL;DR** A saved circle crops the matching portrait on ordinary static scene tokens. The renderer uses the world mask store and a temporary mesh texture.

## Request

Apply a saved off-center circle to every ordinary scene token using the same resolved static portrait. Preserve the source image, token document, grid footprint and targeting. Restoring the original portrait after mask removal must work for GMs and players.

## Decided

Crop the square around the selected circle and clip its corners to transparency. Let Foundry fit the resulting square using the token's existing texture settings. See [Use derived mesh textures for static token crops](../decisions/2026-11-23-static-token-mesh-crops.md).

## Behavior

At ready and on draw, the renderer reads the mask for the exact image path. Received mask-setting changes reapply or remove the crop on matching scene tokens. Tokens sharing the same source base texture and mask share the crop until its last consumer releases it. A missing or unusable source or mismatched source dimensions leave the original texture in place. The renderer releases its textures on token destruction and canvas teardown.

## Out of scope

This milestone covered ordinary static scene tokens. See [[portrait-mask-editor]] for the editor and [[file-picker-integration]] for planned per-image picker controls. Dynamic rings, drag and configuration previews, animated images and image transitions remain future work.

## Implementation

`scripts/main.js` connects Foundry hooks to `scripts/mask-renderer.mjs`. The Node tests cover crop geometry, sharing, redraw, reload, release, stale work and fallback. All 19 tests passed and the implementation review accepted the batch with no findings.

## Runtime verification

On 2026-11-23, separate headless GM and player sessions in Foundry 14.369 displayed two visible, targetable 1×1 static tokens with rings disabled and a shared 400×200 PNG. After the GM saved the mask, both tokens on both clients showed a 120×120 crop with the off-center green subject centered and a transparent corner. The same crop checks passed in fresh browser sessions after reconnecting and again after explicitly reloading both clients.

The GM's removal call returned `true`. Both tokens on both connected clients restored the original 400×200 texture, opaque corner and baseline center pixels without a reload. The tokens retained their original image path and grid footprint and remained visible and targetable through save and removal. The temporary test scene was deleted. See [Verify static token masks in Foundry](../how-to/verify-static-token-masks.md).
