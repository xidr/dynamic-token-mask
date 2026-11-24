---
title: Static token renderer
created: 2026-11-23
updated: 2026-11-24
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

This milestone covered ordinary static scene tokens. See the [Portrait mask editor](portrait-mask-editor.md) and [File picker mask controls](file-picker-mask-controls.md) for GM editing, and [Native token previews and transitions](native-token-previews-and-transitions.md) for the later preview and transition integrations. The later [native dynamic ring renderer](native-dynamic-rings.md) applies masks to static ring subjects. Animated images are outside scope.

## Implementation

`scripts/main.js` connects Foundry hooks to `scripts/mask-renderer.mjs`. The Node tests cover crop geometry, sharing, redraw, reload, release, stale work and fallback. All 19 tests passed and the implementation review accepted the batch with no findings.

## Runtime verification

On 2026-11-23, separate headless GM and player sessions in Foundry 14.369 displayed two visible, targetable 1×1 static tokens with rings disabled and a shared 400×200 PNG. After the GM saved the mask, both tokens on both clients showed a 120×120 crop with the off-center green subject centered and a transparent corner. The same crop checks passed in fresh browser sessions after reconnecting and again after explicitly reloading both clients.

The GM's removal call returned `true`. Both tokens on both connected clients restored the original 400×200 texture, opaque corner and baseline center pixels without a reload. The tokens retained their original image path and grid footprint and remained visible and targetable through save and removal. The temporary test scene was deleted. See [Verify static token masks in Foundry](../how-to/verify-static-token-masks.md).

### First UI release

On 2026-11-23 in Foundry 14.369, the GM compared the editor’s square crop with a scene token. The gold subject, circular edge and transparent opening appeared in the same positions. The native wildcard selector showed the unrelated blue variant in its original square and restored the circular crop after switching back to the variant with a mask. The mask is keyed to the concrete image selected by Foundry.

The GM exercised Foundry’s texture settings on a 1×2 token. **Fill** stretched the circle into an ellipse, **Contain** fit it to the narrow axis and **Cover** extended it horizontally beyond the footprint. The token supported 45° rotation, horizontal and vertical mirroring, and uniform scale of 1.45. On a 50 px grid, a separate 1×1 token from an imported prototype with X scale 1.5 and Y scale 0.7 displayed a crop about 75×35 px. The editor continued to show the square crop before Foundry applied those settings.

Both clients displayed Foundry’s targeting arrows when targeting masked tokens with **T**. With token vision enabled, the player saw the farther token before a solid wall was placed and lost sight of it afterward. The GM could still see both tokens. In a separate fixture, an elevation-10 overhead tile with whole-tile **Fade** hid one masked token. In the GM view, selecting that token faded the tile and revealed its crop. The matching token outside the tile stayed visible throughout. [Picker release verification](file-picker-mask-controls.md#first-ui-release)
