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

On 2026-11-24, isolated GM and owning-player sessions exercised module revision `6505b71` on Foundry 14.369.

| Scenario | GM | Owning player |
| --- | --- | --- |
| Defaults and shape previews | The border started off with black and 2% settings, and the color and width controls became editable when enabled. Off, 0.5% and 10% previews on all four shapes kept interior landmarks and outside transparency, with no border pixels outside the outline. At 1400×950, the wide editor's footer extended to y=966.5. Moving the window exposed all four buttons with a footer bottom at y=948.5. | Native permissions blocked configuration and placement. |
| Saving and editing | Green and teal border changes reached both matching placed tokens. Reopening showed 2.04% in both the readout and slider. Cancel kept the stored record, stale Save and Remove were rejected, and reopening after disabling the border retained its preferences for re-enabling. | Both matching tokens followed live saves. The unrelated control kept its source art. |
| Reload and removal | The saved teal border returned after a browser reload. Removing the mask restored both source textures. | The teal border persisted through browser reload and removal restored both original textures. |
| Held drags and sheet previews | The held clone followed border-only changes and removal. Drop and Cancel settled correctly. The open scene-token and prototype Appearance previews followed live border changes and removal. | The held clone followed border-only changes and removal. Drop and Cancel settled correctly. The owner lacked Foundry's `TOKEN_CONFIGURE` and `TOKEN_CREATE` permissions. |
| Native fades | The A-to-B blend showed the green outgoing crop and red target. The B-to-C fade blended into and settled on the original C art. Interrupted fades settled on the requested red crop and original C art. | The same outgoing and masked target borders were observed mid-fade. The B-to-C blend showed the original C art. Both completed and both interrupted fades settled on the expected textures. |
| Dynamic rings | Implicit and explicit subjects used distinct borders and updated independently. Removal restored native subjects. The rectangular explicit frame stayed 330×180 on a 2×1 token using fill at subject scale 1.25. | The same subject choices, border changes, restoration, frame dimensions, fit, scale and native ring effects were observed. |

The strict comparison of the 192×192 saved flat-topped hexagon preview against the two matching token textures on each client found identical measurements in all four comparisons. There were 469 RGBA pixel differences, including 165 fully opaque pixels with a maximum RGB channel difference of 1 and 178 alpha differences with a maximum difference of 1. No pixel differed by more than two RGB levels where both alpha values were above 200. Both clients’ B-to-C screenshots showed the bordered outgoing crop blending into the native art. The instrumentation expected an ImageBitmap and could not read the native RenderTexture target's dimensions.

HTML snapshots, rendered screenshots and observation JSON were kept outside Foundry Data. Fixture PNGs were served through browser routes. See `observations-first-full.json`, `observations-editor-native.json`, `observations-crop-rings.json`, `observations-drag-fade-reload.json`, `observations-fades.json` and `observations-reload.json`. The cleanup records confirmed exact restoration of the original world mask setting and zero remaining fixture mask keys, scenes, actors or extra tokens. The first recovery removed three extra tokens before that zero-residue check.

### Supplemental placed-crop checks

The follow-up at `32a07d9` on Foundry 14.369 completed the placed-crop matrix for both roles. Both clients captured byte-identical crop PNGs for all 12 combinations. The checks confirmed the footprint and scale, five interior points per crop, all 20 thick-border edge and vertex samples, and no alpha outside the antialiasing neighborhood.

| Shape | Exact green pixels with border off | At 0.5% | At 10% |
| --- | ---: | ---: | ---: |
| Circle | 0 | 156 | 10,024 |
| Square | 0 | 764 | 13,148 |
| Flat-topped hexagon | 0 | 56 | 9,454 |
| Pointy-topped hexagon | 0 | 56 | 9,454 |

An offline comparison used the production `drawCrop`, the same decoded bitmap and the same records. Fresh canvases matched all 12 placed crops pixel for pixel. A repeatedly sampled canvas matched the 12 earlier draft editor captures exactly. Eleven of those drafts differed from fresh-canvas output near the antialiased edges. The fresh, reopened saved circle preview at 0.5% also matched the live crop exactly.

See `width-matrix-summary.json` and `isolated-raster/offline-raster.json`, kept outside Foundry Data with the rendered canvas screenshots. Cleanup restored the original mask setting exactly and confirmed zero fixture mask keys, scenes, actors and extra tokens.

The rapid ordinary scene-token preview repair has its own [live verification record](../bugs/fixed/stale-scene-token-preview.md). See the [border feature record](../features/colored-mask-borders.md) and [roadmap](../../ROADMAP.md) for follow-up.

## If it goes wrong

Record the shape, color, width, path, source dimensions, frame center and half-size, token fit and texture scale. Compare the editor preview and token from one saved record. For a ring, include the prepared subject path and native subject-frame dimensions.
