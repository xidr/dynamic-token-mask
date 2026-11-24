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

Foundry verification for the border build is pending after merge. GM coverage includes the editor, localized controls, narrow and wide border previews, save and cancel, reopening, conflicts and eligible sheet previews. GM and owning-player coverage includes live updates and removal, reload, held drags, fades, and implicit and explicit ring subjects with a rectangular frame. [Verify mask borders in Foundry](../how-to/verify-mask-borders.md)
