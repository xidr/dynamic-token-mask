---
title: Colored mask borders
created: 2026-11-24
updated: 2026-11-24
tags: [feature, editor, rendering, storage]
status: active
source: Mask border acceptance plan and scripts/mask-store.mjs, scripts/mask-geometry.mjs, scripts/mask-renderer.mjs and scripts/mask-editor.mjs
---

# Colored mask borders

**TL;DR:** A GM can add an optional colored band inside the outline of any saved portrait mask. The shared mask stores the border settings per exact image path.

## Request

Add a border toggle, color picker and width control for circle, square and both hexagon orientations. Keep the original image sampling, silhouette and native token footprint.

## Decided

Measure width as a percentage of the square crop side and use common geometry for the editor preview and shared renderer. Introduce storage version 3 only when a mask with non-default border settings is first saved. [Draw borders inside the mask outline](../decisions/2026-11-24-inward-mask-borders.md)

## Behavior

- The border defaults to off, black and 2% wide. Turn on **Show border** to edit color and width. The inclusive range is 0.5–10%, with fractional values supported. Turning a custom border off keeps its color and width on save and restores those settings when it is enabled again.
- Border-only changes update the local preview immediately. **Save Mask** updates eligible renders for that image path through the existing world setting and change hook. **Cancel** discards the draft. **Remove Mask** clears the entire record. Reopening loads the saved settings. Conditional writes detect a more recent record with different border settings.
- The band follows all four outlines inward. Eligible placed tokens, held drags, configuration previews, recognized native fade targets and ring subjects use the shared crop drawing. Foundry's token fit and scale still govern how the square crop appears on the scene.

## Out of scope

Token-specific border overrides. Existing source and native-renderer eligibility rules apply.

## Implementation

`scripts/mask-store.mjs` handles validation, lazy migration and path notifications. `scripts/mask-geometry.mjs` provides the common inward border for `scripts/mask-editor.mjs` and `scripts/mask-renderer.mjs`. The editor template, scoped CSS and English and Russian translations provide the controls.

All six Node test files passed on 2026-11-24 at `caaa2b7`. Focused cases cover normalized defaults, version guards and lazy migration, border-only cache invalidation, widths and outline clipping for all four shapes in square and rectangular output frames, Cancel, reopening and fractional width preservation.

On 2026-11-24, the GM ran the editor checks on Foundry 14.369 at `6505b71`. All four shapes showed inward borders at 0.5% and 10%. A saved 2.04% width reopened correctly, disabled preferences survived reopening, and stale changes were rejected. Both native configuration previews followed border edits. At 1400×950, moving the wide editor window exposed the partial footer.

Both roles observed live changes, reload persistence, removal, held drags, settled fades and implicit and explicit ring subjects with preserved native frames. The supplemental run at `32a07d9` passed the placed-crop checks at all three widths for every shape. Each of the 12 crops matched a fresh-canvas rendering pixel for pixel. Repeated canvas reads reproduced the earlier draft editor differences. Both clients showed the blend to unmasked art and its settled result. Foundry permissions blocked configuration and placement for the owning player. [Foundry border results](../how-to/verify-mask-borders.md#check-it-worked)
