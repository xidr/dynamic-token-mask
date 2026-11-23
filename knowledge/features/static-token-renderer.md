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

Crop the square around the selected circle and clip its corners to transparency. Let Foundry fit the resulting square using the token's existing texture settings. See [[2026-11-23-static-token-mesh-crops]].

## Behavior

At ready and on draw, the renderer reads the mask for the exact image path. Received mask-setting changes reapply or remove the crop on matching scene tokens. Tokens sharing the same source base texture and mask share the crop until its last consumer releases it. A missing or unusable source or mismatched source dimensions leave the original texture in place. The renderer releases its textures on token destruction and canvas teardown.

## Out of scope

The editor, file-browser controls, dynamic rings, previews, animated images and image transitions are future work.

## Implementation

`scripts/main.js` connects Foundry hooks to `scripts/mask-renderer.mjs`. The Node tests cover crop geometry, sharing, redraw, reload, release, stale work and fallback. All 19 tests passed and the implementation review accepted the batch with no findings. Foundry 14.369 observation is pending. See [[verify-static-token-masks]].
