---
title: Verify mask borders in Foundry
created: 2026-11-24
updated: 2026-11-24
tags: [how-to, rendering, editor, validation]
status: active
source: Mask border acceptance plan and border regression tests
---

# Verify mask borders in Foundry

**TL;DR:** Compare each shape's border in the GM editor and both clients' rendered crops while keeping the source frame and token settings fixed.

## When to use

After an approved merge, run in the designated test world with the changed module enabled. Use separate GM and owning-player sessions and keep artifacts outside Foundry Data. [Use Playwright MCP for Foundry checks](use-playwright-mcp-for-foundry.md)

## Steps

1. Use a static portrait with recognizable landmarks and transparent pixels. Place two owned matching tokens, including a 1×1 token at default fit, and a control token using a different image. Record their source paths, footprints and original textures.
2. As GM, load the portrait in **Portrait Mask Editor** and capture the controls. Check that the border defaults to off and that enabling it reveals black at 2%. On all four shapes, compare a vivid border at 0.5% and 10% with the border off. Keep the center and frame half-size fixed. Confirm the color follows the inside edges, including polygon corners, and that the interior source landmarks and outside transparency stay in place. Load a wide portrait and check that the preview and footer remain usable.
3. Save a border-only change and compare the editor preview with both clients' matching crops. Check the control token and token properties. Reopen a mask saved with a fractional width such as 2.04% through the GM API and compare its slider position and displayed percentage. Cancel a draft, then save with the border disabled and reopen to check the retained color and width on re-enable. In a second editor, confirm stale Save and Remove conflict after a border-only change in the first. Reload each client to check persistence, then remove the mask and record the restored textures.
4. Follow [Verify native token previews and transitions in Foundry](verify-native-token-previews-and-transitions.md) with distinct border colors on the outgoing and incoming images. Include live border edits during held drags in both roles and in GM scene-token and prototype Appearance previews. Observe a completed fade and the settled result of an interrupted fade.
5. Follow [Verify native dynamic rings in Foundry](verify-native-dynamic-rings.md) with different borders on an implicit portrait and explicit subject, including a rectangular native subject texture. Compare both roles on live border changes and removal. Check the selected source, native frame dimensions, subject scale, fit and ring appearance. Remove disposable fixtures and restore their settings after recording results.

## Check it worked

TODO: unverified. Record the Foundry build, module revision, results and artifact references by role. Capture HTML snapshots for the editor and sheet controls and rendered canvas screenshots for the portraits. Record native permissions where they limit a role's checks. Update the [border feature record](../features/colored-mask-borders.md) and [roadmap](../../ROADMAP.md) with observed results.

| Role | Pending evidence |
| --- | --- |
| GM | Defaults and controls, 0.5% and 10% widths and corners on all four shapes, wide preview, fractional width on reopen, Cancel, disabled preferences, stale edits, reload, removal, both sheet previews, held drag, fades and ring subjects |
| Owning player | Live border updates and removal, reload, held drag, fades and implicit and explicit ring subjects including the rectangular frame |

## If it goes wrong

Record the shape, color, width, path, source dimensions, frame center and half-size, token fit and texture scale. Compare the editor preview and token from one saved record. For a ring, include the prepared subject path and native subject-frame dimensions.
