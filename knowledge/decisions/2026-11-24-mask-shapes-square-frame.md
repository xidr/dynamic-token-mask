---
title: Keep the square sampling frame for all mask shapes
date: 2026-11-24
status: accepted
tags: [storage, geometry, rendering]
---

# Keep the square sampling frame for all mask shapes

## Context

The existing circle uses a square sampling frame centered on the selected portrait area. Square and regular hexagonal masks need to work across the same editor and renderer paths while preserving zoom, cropping bounds and native token transforms when a GM changes shape.

## Decision

Use the same square source rectangle for every shape. The stored `radius` continues to describe half the frame side relative to the shorter image dimension. The square fills the frame. The flat-topped hexagon touches its left and right sides, and the pointy-topped hexagon touches its top and bottom sides. Draw the selected outline over the sampled area. Use the same normalized outline for the editor's visible boundary, hit test and crop rendering.

Read existing version 1 circle collections directly. Upgrade the entire collection to version 2 with explicit shapes in the first successful polygon write, and keep version 2 on subsequent writes. Preserve the original circle record representation in the API.

## Alternatives

A tight sampling rectangle for each outline would change how much source art is sampled, change bounds when switching shape and complicate fitting into native frames. A schema upgrade at startup would introduce a write for worlds still using only circles. Storing a polygon in version 1 would extend the old format while advertising the same schema version.

## Consequences

The center and zoom stay fixed on shape switches, with regular hexagon proportions in the editor crop. Foundry fit and scale still govern the displayed token. The native ring texture keeps its dimensions, resolution and framing while the selected outline controls the clipped subject. An upgrade preserves existing circle snapshots and change notifications identify only paths with effective mask changes. See [Mask storage](../reference/mask-storage.md) and [Verify mask shapes in Foundry](../how-to/verify-mask-shapes.md).
