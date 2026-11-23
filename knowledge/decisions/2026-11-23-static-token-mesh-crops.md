---
title: Use derived mesh textures for static token crops
date: 2026-11-23
status: accepted
tags: [rendering, architecture]
---

# Use derived mesh textures for static token crops

**TL;DR** Install a shared, transparent circular crop on eligible token meshes and keep the settings and original texture as the sources for subsequent draws.

## Context

The same off-center circle applies to all ordinary static scene tokens sharing an exact portrait path in a world. Selecting a smaller circle should fill the token with the selected portrait area. The source art, document and gameplay footprint must be preserved.

## Decision

Generate a module-owned PIXI texture from a canvas containing the clipped square crop. Share it by source base texture and mask record, and request Foundry's normal mesh refresh after replacing the texture. Retain the original texture for restoration and release the crop after its last consumer leaves.

## Alternatives

Keeping the original frame would leave a smaller portrait inside the original bounds. A shader-only approach would require handling how Foundry reads texture alpha outside the shader. Rewriting the original image or token document would change persisted data and make restoration depend on that change.

## Consequences

The renderer can reuse the existing mask-change hook and keeps crop ownership limited to active consumers. The crop needs a browser-readable resource with the dimensions recorded in the mask. Renderer interaction with Foundry targeting and multiplayer redraw remains part of [Verify static token masks in Foundry](../how-to/verify-static-token-masks.md).
