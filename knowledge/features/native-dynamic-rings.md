---
title: Native dynamic rings
created: 2026-11-24
updated: 2026-11-24
tags: [feature, rendering, foundry]
status: active
source: scripts/main.js, scripts/mask-renderer.mjs, installed Foundry 14.369 source and designated-world baseline
---

# Native dynamic rings

**TL;DR:** An explicit ring subject uses its own saved mask. An implicit subject uses the portrait's saved mask and original portrait pixels. Without an applicable mask, Foundry displays its native subject art.

## Request

Honor per-image masks on native dynamic rings and preserve native ring composition, decoration, fit, scale, effects, paths and footprint.

## Decided

Use the stored subject choice to determine whether the subject is explicit. Foundry may infer a different prepared subject from the portrait. [Select mask sources for native dynamic rings](../decisions/2026-11-24-native-dynamic-ring-subjects.md)

## Behavior

- A ring with an empty stored subject uses the rendered portrait path to find the mask. With a saved mask, the crop uses the original portrait even if Foundry selected inferred subject art. Without a mask it displays the native subject, including inferred art.
- A ring with a stored subject uses that image's own mask. A portrait mask has no effect on a different explicit subject.
- Subject edits, ring toggles and live mask changes update the current eligible token or canvas preview. Removing the applicable mask restores the native mesh texture. Shared crops remain available while more than one token or preview uses them.
- A native image transition settles on the current subject with the ring intact.

## Out of scope

Ring-enabled prototype Appearance thumbnails retain their native rendering. Placement from a prototype uses the normal scene-token path. Unsupported and unresolved sources retain their native behavior. The native mid-animation ring composition remains under Foundry control.

## Implementation

The existing Foundry hooks run `scripts/mask-renderer.mjs`. The renderer checks source identity and dimensions before installing a crop. It centers the masked pixels in a transparent texture with the native subject's dimensions and resolution, preserving the layout inputs Foundry uses for fit and ring padding. The circle's diameter is two thirds of the shorter side, matching Foundry's nominal subject diameter. Foundry still applies its native subject scale and grid fitting. Crops share a cache entry when the source, mask and output frame match. On release, the renderer restores the exact installed native texture if it still owns the mesh assignment.

The token update hook in `scripts/main.js` also handles a stored subject change that leaves the prepared subject path unchanged. This covers entering the inferred subject path explicitly or entering the portrait path explicitly when it is also the implicit subject. Foundry may use different fitting for the new stored choice.

Renderer tests cover the subject matrix, live mask edits, subject-only preview switches, stale work, crop sharing, restoration and teardown.

## Foundry 14.369 baseline

On 2026-11-24, the GM and owning player ran separate browser sessions on module revision `a13ffbf`. Both roles saw the same native subject in all seven fixtures.

| Portrait | Stored subject | Prepared and displayed on both clients |
| --- | --- | --- |
| Masked A | Empty | Original A, 256 × 256 px |
| Unmasked C | Empty | Original C, 512 × 512 px |
| Masked A | Masked B | Original B, 290 × 70 px |
| Masked A | Unmasked C | Original C, 512 × 512 px |
| Unmasked C | Masked B | Original B, 290 × 70 px |
| Masked A with a mapping | Empty | Inferred art, 512 × 512 px |
| Unmasked C with a mapping | Empty | Inferred art, 512 × 512 px |

The designated world supplied no subject mappings. The inferred cases used mappings scoped to the two browser sessions. The fixtures used `TokenRingSamplerShader`, subject scale 0.8, the pulse effect, an orange ring (`#ff802e`) and a blue background (`#1479bd`). The rectangular B subject had a mesh size of about 100 × 24.14 px, with padding of 240 px horizontally and 350 px vertically. The screenshots show blue background above and below B, while the opaque wolf portrait covers its ring and background. HTML snapshots, rendered canvas screenshots and geometry measurements were kept outside Foundry Data. [Verification procedure](../how-to/verify-native-dynamic-rings.md)

The baseline run verified removal of the temporary scene, actor, masks and browser-local mappings.

## Changed-build live verification

On module revision `cabdfef`, the GM and owning player compared the seven baseline cases in isolated Foundry 14.369 sessions in the designated test world. Both also checked a 2×1 token using cover fit. Each masked subject matched the expected crop pixel for pixel. The mapped implicit portrait used A's pixels in the 512 × 512 inferred frame. Unmasked C retained its inferred art. Rectangular B kept the baseline mesh dimensions and padding. Both clients showed the native shader, colors and pulse. Pixel values along the exposed ring changed between successive screenshots on each client.

| Action | GM and owning-player observations |
| --- | --- |
| Switch subjects and toggle the ring on a placed token | Subject-only changes, entering the same inferred path explicitly, and rapid switches settled on the selected subject. Turning the ring off restored the ordinary portrait crop. |
| Replace, remove and recreate the explicit B mask during a drag | The placed token and held clone on each client matched the replacement and recreated crops. Removing the mask restored native B. |
| Replace, remove and recreate the implicit A mask during a drag | Both clients updated the placed token and held clone on each edit. Each role also checked drop and cancel. |
| Create and remove the first mask for explicit C during a drag | All four placed and held objects displayed the expected C crop on creation, then restored the native 512 × 512 C texture on removal. |
| GM changes the subject while the owner holds a drag | After the stored subject changed from B to C, the owner briefly saw the old B texture on both original and clone. Foundry canceled the gesture on redraw. The settled original displayed native C and retained its position. |
| GM toggles the ring off during a separate owner drag | Foundry canceled the drag. Both clients displayed the ordinary 144 × 144 A crop, and a fresh owner drag displayed it too. Re-enabling the ring restored cropped B on both. |
| Edit a scene token in its configuration sheet | The GM preview followed masked B, unmasked C and rapid B/C/B changes. Cancel retained implicit A on both clients. Apply displayed B on both clients. The owner lacked native token configuration permission. |
| Edit a prototype and place a fresh token | The GM saw the original portrait in the ring-enabled thumbnail and the ordinary crop with the ring off. After Cancel, a fresh token displayed implicit A. After Apply, a fresh token displayed cropped B. Both clients checked placement. The owner lacked native token creation permission. |
| Complete and interrupt a native subject transition | Both clients displayed an active native transition filter during the completed and interrupted fades. Each settled on the correct 290 × 70 B crop with zero remaining filters or animation contexts, including after the superseded effect would have ended. |

Both sessions returned to their original scene. The temporary actor, scene, ten tokens, masks and session-local mappings were removed. Neither console recorded a warning or error attributed to the module. HTML snapshots, paired screenshots and measurements were retained outside Foundry Data.

[Verification procedure](../how-to/verify-native-dynamic-rings.md)
