---
title: Native token previews and transitions
created: 2026-11-24
updated: 2026-11-24
tags: [feature, rendering, foundry]
status: active
source: scripts/main.js, scripts/mask-renderer.mjs, scripts/prototype-mask-preview.mjs and Foundry 14.369 runtime checks
---

# Native token previews and transitions

**TL;DR:** The module applies saved static portrait crops during drags, in scene and prototype token previews, and to targets in recognized native transitions on Foundry 14.369. Runtime verification distinguishes observed results from actions blocked by native role permissions.

## Request

Use the selected image's own saved mask for every eligible preview and transition endpoint. Keep Foundry's normal controls, timing and document updates. Dropping, cancelling, applying or starting a subsequent change must leave the visible result consistent with the selected image.

## Decided

Use the existing crop renderer for canvas meshes and share crops across eligible consumers with independent lifetimes. Use the same crop drawing for the prototype Appearance thumbnail. Supply the derived crop to the native filter only when its animated progress uniform identifies it as the one driving the active transition. [Frame targets in native token transitions](../decisions/2026-11-24-native-token-transition-targets.md)

## Behavior

- Drag and scene-configuration preview clones use their own resolved path and loaded texture. Closing a preview releases its crop reference. Matching clones refresh when a GM creates, replaces or removes a mask. A scene preview requests a redraw if Foundry's loaded texture lags behind the selection.
- The prototype Appearance thumbnail uses the exact displayed image path. The crop is limited to the thumbnail's rendered content. Partial renders, changing to another image, toggling the ring and closing the sheet invalidate obsolete work. External portraits need a canvas-readable CORS response.
- A recognized native transition uses the outgoing mesh's current portrait and a crop for the incoming image when that path has a mask. Each transition context owns its target reference until it completes or the canvas is torn down. Subsequent document draws determine the settled portrait.

## Out of scope

This batch covers ordinary static art. See the [native dynamic rings](native-dynamic-rings.md) record for the subsequent ring workflow. Unsupported image sources and unresolved wildcards keep their native behavior.

## Implementation

`scripts/main.js` wires Foundry token and prototype-sheet hooks to `scripts/mask-renderer.mjs` and `scripts/prototype-mask-preview.mjs`. The renderer and prototype tests exercise preview lifetimes, stale loads, exact sources, mask changes while previews are open, CORS-enabled prototype art and transition filter identity and cleanup.

Shared rendering uses the selected outline for the same fixed square sampling frame in previews and eligible transition targets. Foundry 14.369 shape checks at `d7e85f4` confirmed live shape edits in held drags for both roles and in open GM previews, along with the expected mid-fade and settled art. The GM prototype passed rapid portrait changes. The ordinary scene sheet could retain stale art when the GM rapidly returned the preview to the original portrait. The repair at `f41382b` queues a native draw for an eligible scene preview using Foundry's prepared image path. The Node regression passed and a live rerun is pending. [Shape results](../how-to/verify-mask-shapes.md#check-it-worked) · [Scene preview repair](../bugs/fixed/stale-scene-token-preview.md)

## Foundry 14.369 baseline

On 2026-11-24, separate GM and owning-player sessions exercised two masked portraits A and B, with expected crop widths of 144 and 226 px, and an unmasked portrait C. The following observations are from the pre-change module revision `03f40a8`.

| Scenario | Role | Observation |
| --- | --- | --- |
| Held drag with drop or cancel | GM and owning player | The held B clone showed the raw 512 px source instead of the 226 px crop. The placed token had the correct portrait after drop and cancel. |
| Scene-token configuration | GM | A and B rendered raw during preview. A rapid A → B → C → A sequence left a stale 512 px texture displayed on selection A. The settled C preview was unverified. Cancel restored the 144 px A crop and Apply showed the 226 px B crop. |
| Prototype Appearance | GM | A, B and C thumbnails rendered raw. Cancelling and placing a token gave the A crop. Applying B and placing a token gave the B crop. |
| Completed transitions | GM and owning player | A → B blended toward raw B before settling on the B crop. B → C settled on the original C art. |
| Interrupted transitions | GM and owning player | Both clients settled on the requested final art in the masked and unmasked cases. |

HTML snapshots and fourteen screenshots or animation frames were kept outside Foundry Data. [Verify native token previews and transitions in Foundry](../how-to/verify-native-token-previews-and-transitions.md)

## Foundry 14.369 post-merge verification

On 2026-11-24, the GM and owning player loaded module revision `4d249b2` in separate sessions. The fixture used the same expected A, B and C sizes as the baseline. The owning player lacked Foundry's `TOKEN_CONFIGURE` and `TOKEN_CREATE` permissions.

| Scenario | GM | Owning player |
| --- | --- | --- |
| Held drag, drop and cancel | The held clone displayed the 226 px B crop. Drop and cancel preserved the placed token's crop. | The held clone displayed the 226 px B crop. Drop and cancel preserved the placed token's crop. |
| Scene-token configuration | A and B displayed 144 px and 226 px crops. C displayed the original 512 px texture. Rapid A → B → C → A settled on the A crop in this run. A later shape check reproduced a stale preview using the same sequence. Cancel kept A and Apply showed the B crop. [Scene preview repair](../bugs/fixed/stale-scene-token-preview.md) | Native permissions blocked opening the sheet. Rendering as this role is unverified. |
| Prototype Appearance | A and B showed their respective crops and C showed its original art. Rapid selection changes, partial Appearance renders and the ring toggle showed the expected thumbnail. After Cancel, placing a new token gave a 144 px A crop. After Apply, placing a new token gave a 226 px B crop. | The GM-placed tokens showed the same 144 px A and 226 px B crops. Native permissions blocked the owner from opening the sheet or placing a token. |
| Mask changes during a held drag | The placed token and held clone each changed from 512 px to 205 px on create, to 287 px on replacement, and back to 512 px on removal. | The placed token and held clone each showed the same four widths while the GM changed the mask. |
| Mask changes with the scene-token sheet open | A preview of C showed 205 px after creating a mask and 287 px after replacing it. Removing it restored the 512 px source. The placed token's saved portrait remained A. | Native permissions blocked opening the sheet. |
| Mask changes with the prototype sheet open | Creating and replacing C's mask showed two different crops in the thumbnail. Removing the mask restored native art. | Native permissions blocked opening the sheet. |
| Completed native fades | Intermediate frames showed A → B at 144 → 226 px and B → C at 226 → 512 px. Both fades settled on the selected portrait. | The same outgoing and incoming texture widths were visible during each fade. Both settled portraits matched the GM view. |
| Interrupted native fades | Switching to B during C → A settled on the 226 px B crop. Switching to C during B → A settled on the original 512 px C. Each stayed correct past the original fade's duration. | Both interruption sequences settled on the same portrait as the GM and stayed correct past the original fade's duration. |

A CORS-enabled external portrait was unavailable for browser testing. The automated prototype test covers that source path.

See the [verification procedure](../how-to/verify-native-token-previews-and-transitions.md) for reproduction and evidence capture.
