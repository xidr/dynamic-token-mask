---
title: Draw borders inside the mask outline
date: 2026-11-24
status: accepted
tags: [geometry, rendering, storage]
---

# Draw borders inside the mask outline

## Context

The four supported shapes share a square sampling frame. An optional decorative border must follow each silhouette in the editor and native token paths while preserving the sampled pixels, output dimensions and existing framing. A world may already contain version 1 circle records or version 2 polygon records.

## Decision

Overlay a band inside the outer contour by filling the space between it and a concentric inset contour. Measure width in square crop coordinates. Compensate for the hexagon's apothem so the thickness is measured perpendicular to its sides. Use the same geometry in the editor source overlay and shared crop drawing. Native transformations apply to the complete crop.

Use a lazy upgrade to schema 3 for persisted border settings. Keep the disabled black 2% default implicit. Keep custom color and width on disabled records so the editor can restore them when the border is enabled. Normalize color spelling and the explicit default before equality comparisons.

## Alternatives

A centered outline stroke would extend past the silhouette unless clipped, and its stroke width would need to account for the portion outside the mask. A border drawn outside the mask could extend the footprint or be cut off at the crop edges. Adding border fields to an older schema would let older writers reserialize known geometry and discard the new fields. Upgrading on load would write to worlds without a saved border.

## Consequences

The crop source rectangle and outer silhouette stay fixed at every supported border width. The same border follows the crop through eligible native paths, including rectangular ring subject frames. Older builds reject version 3 through their unknown-schema guard. The upgrade and mask change share one setting write. An upgrade leaves unchanged records equivalent for snapshots and notifications. [Mask storage](../reference/mask-storage.md)
