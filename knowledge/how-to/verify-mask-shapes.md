---
title: Verify mask shapes in Foundry
created: 2026-11-24
updated: 2026-11-24
tags: [how-to, rendering, editor, validation]
status: active
source: Mask shapes acceptance plan and scripts/mask-geometry.mjs, scripts/mask-store.mjs and scripts/mask-renderer.mjs
---

# Verify mask shapes in Foundry

**TL;DR:** Compare the four outlines at one center and zoom, then check that saved shapes follow the matching portrait through native Foundry render paths on both clients.

## When to use

After an approved merge, use the designated test world with the changed module enabled. Follow [Use Playwright MCP for Foundry checks](use-playwright-mcp-for-foundry.md) for isolated GM and owning-player sessions and private artifacts outside Foundry Data.

## Steps

1. Prepare a static rectangular portrait with a recognizable off-center subject and visible transparency. Place two visible, owned tokens using its exact path and one token on a different path. Record the unmasked textures, paths and footprints. Include a 1×1 token at default fit and a rectangular token to exercise native fit separately.
2. As GM, open the editor from Configure Settings and from the native picker. Capture the shape selector and footer in HTML snapshots. Load the rectangular portrait and confirm Circle is selected by default. Set an off-center frame. Switch between Circle, Square, Flat-topped hexagon and Pointy-topped hexagon. The center, numeric half-size and recognizable landmarks in the square preview should stay fixed. The square fills the sampling frame, the flat-topped hexagon touches its horizontal extremes and the pointy-topped hexagon touches its vertical extremes. Check source transparency, outline hit testing, center drag and the resize handle for both hexagons. Check that **Reset Frame** centers and fits the selected shape. Check that **Cancel** discards the draft and that all four footer actions remain visible after loading a wide portrait in a 1400×950 viewport.
3. As GM, restore the off-center framing from step 2. Save the circle, then save each polygon with the same center and half-size. Observe both sessions after each shape-only save. Both matching tokens should update to the expected outline and preserve their paths and footprints. The unrelated token should keep its baseline art. Compare the 1×1 crop with the square preview. Observe the native fit on the rectangular token. Reopen a saved hexagon, change its shape, Cancel and confirm the original remains. In two GM editor windows, save a shape-only change in one and attempt Save and Remove from the stale window. Reload the image after confirming both conflicts and the preserved newer shape.
4. Reload the GM and owning-player browsers separately, then verify the saved shape in both sessions and reopen it in the editor. Remove the mask as GM and capture both restored originals. Confirm the owning player has no Portrait Mask Editor entry in settings.
5. Use different saved outlines for two masked portraits and run [Verify native token previews and transitions in Foundry](verify-native-token-previews-and-transitions.md). Include a shape-only change during a held drag in both roles and while each eligible GM preview is open. Capture the incoming crop during a completed fade, then interrupt a fade and verify the settled result after both effects would have ended.
6. Run [Verify native dynamic rings in Foundry](verify-native-dynamic-rings.md) with distinct shapes on the implicit portrait and the explicit subject. Include a rectangular native subject texture and a rectangular token. Confirm the clip follows the applicable image and retains the native frame dimensions, fit, subject scale and ring appearance. Compare both roles on shape-only edits, removal, a held drag and a settled transition. Observe an unmasked subject and the restoration of the native texture. Remove disposable fixtures and restore fixture settings after recording outcomes.

## Check it worked

TODO: unverified. Record the date, Foundry build, module revision, expected and observed results and artifact references by role. Use rendered screenshots for visible art and HTML snapshots for editor and sheet controls. Update the [roadmap](../../ROADMAP.md) and applicable feature records.

| Role | Pending evidence |
| --- | --- |
| GM | Editor shape options and footer, frame preservation, reset, Cancel, reopen, stale Save and Remove, synchronized shape edits, reload and removal, held drag, sheet previews, native fades and implicit and explicit ring subjects including the rectangular frame |
| Owning player | Absent editor entry, live shape edits and removal, reload, held drag, native fades and implicit and explicit ring subjects including the rectangular frame. Record native configuration or placement permissions if they prevent checks. |

## If it goes wrong

Record the exact source path and dimensions, selected shape, center, frame half-size, Foundry fit and scale, and each client's console output. For rings, record the stored and prepared subject paths, subject scale and native frame dimensions. Capture the editor's preview and placed token from the same saved mask before changing the fixture.
