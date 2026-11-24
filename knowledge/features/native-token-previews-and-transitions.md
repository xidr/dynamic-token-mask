---
title: Native token previews and transitions
created: 2026-11-24
updated: 2026-11-24
tags: [feature, rendering, foundry]
status: active
source: scripts/main.js, scripts/mask-renderer.mjs, scripts/prototype-mask-preview.mjs and Foundry 14.369 baseline
---

# Native token previews and transitions

**TL;DR:** The module applies saved static portrait crops during drags, in scene and prototype token previews, and to targets in recognized native transitions on Foundry 14.369. Runtime validation of the changed build is pending.

## Request

Use the selected image's own saved circle for every eligible preview and transition endpoint. Keep Foundry's normal controls, timing and document updates. Dropping, cancelling, applying or starting a subsequent change must leave the visible result consistent with the selected image.

## Decided

Use the existing crop renderer for canvas meshes and share crops across eligible consumers with independent lifetimes. Use the same crop drawing for the prototype Appearance thumbnail. Supply the derived crop to the native filter only when its animated progress uniform identifies it as the one driving the active transition. [Frame targets in native token transitions](../decisions/2026-11-24-native-token-transition-targets.md)

## Behavior

- Drag and scene-configuration preview clones use their own resolved path and loaded texture. Closing a preview releases its crop reference. Matching clones refresh when a GM creates, replaces or removes a mask. A scene preview requests a redraw if Foundry's loaded texture lags behind the selection.
- The prototype Appearance thumbnail uses the exact displayed image path. The crop is limited to the thumbnail's rendered content. Partial renders, changing to another image, toggling the ring and closing the sheet invalidate obsolete work. External portraits need a canvas-readable CORS response.
- A recognized native transition uses the outgoing mesh's current portrait and a crop for the incoming image when that path has a mask. Each transition context owns its target reference until it completes or the canvas is torn down. Subsequent document draws determine the settled portrait.

## Out of scope

This batch covers ordinary static art. Dynamic rings have a separate roadmap batch. Unsupported image sources and unresolved wildcards keep their native behavior.

## Implementation

`scripts/main.js` wires Foundry token and prototype-sheet hooks to `scripts/mask-renderer.mjs` and `scripts/prototype-mask-preview.mjs`. The renderer and prototype tests exercise preview lifetimes, stale loads, exact sources, mask changes while previews are open, CORS-enabled prototype art and transition filter identity and cleanup.

## Foundry 14.369 baseline

On 2026-11-24, separate GM and owning-player sessions exercised two masked portraits A and B, with expected crop widths of 144 and 226 px, and an unmasked portrait C. Both sessions produced the following observations on the pre-change module revision `03f40a8`.

| Scenario | Observed in each role |
| --- | --- |
| Held drag with drop or cancel | The held B clone showed the raw 512 px source instead of the 226 px crop. The placed token had the correct portrait after drop and cancel. |
| Scene-token configuration | A and B rendered raw during preview. A rapid A → B → C → A sequence left a stale 512 px texture displayed on selection A. The settled C preview was unverified. Cancel restored the 144 px A crop and Apply showed the 226 px B crop. |
| Prototype Appearance | A, B and C thumbnails rendered raw. Cancelling and placing a token gave the A crop. Applying B and placing a token gave the B crop. |
| Completed transitions | A → B blended toward raw B before settling on the B crop. B → C settled on the original C art. |
| Interrupted transitions | Both clients settled on the requested final art in the masked and unmasked cases. |

HTML snapshots and fourteen screenshots or animation frames were kept outside Foundry Data. The changed-build cases are pending for both roles. [Verify native token previews and transitions in Foundry](../how-to/verify-native-token-previews-and-transitions.md)
