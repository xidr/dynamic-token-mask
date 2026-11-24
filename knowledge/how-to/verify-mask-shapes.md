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

On 2026-11-24, all six steps ran in isolated GM and owning-player sessions on Foundry 14.369 with module revision `d7e85f4`. The table records the observations from that build.

| Scenario | GM | Owning player |
| --- | --- | --- |
| Editor framing and controls | Opened from settings and the picker. Circle was the default and all four footer actions remained visible at 1400×950. Shape changes kept the off-center frame and sampled artwork. Both hexagons passed outside hit testing, center drag, resizing and reset. Cancel discarded the draft. | The editor entry was absent in settings. |
| Saving and reopening | Both matching tokens followed all four outlines with the original paths and footprints. The 1×1 crop matched the editor framing, the rectangular token retained native fit, and unrelated art stayed unchanged. Reopening restored the saved shape. Cancelling a change retained it. A stale window rejected both Save and Remove after another window saved a different shape. | Both matching tokens updated on each shape-only save. The unrelated token retained its art. |
| Reload and removal | The saved shape persisted on reload and reopened in the editor. Removing it restored both original portraits. | Reload preserved the saved shape. Removal restored both originals. |
| Held drags and configuration | The held clone and placed token followed shape edits. Scene and prototype previews followed shape-only mask edits. The prototype's rapid image changes passed. Rapidly returning to the placed portrait in the ordinary scene sheet could leave another portrait visible until a draw. Separate Cancel and Apply checks passed. | Held clones and placed tokens followed live shape edits. The owner saw the GM's applied portrait on the placed token. Foundry configuration and placement permissions blocked those owner actions. |
| Native fades | Mid-fade frames showed both masked outlines in the A-to-B blend and the raw C art in the B-to-C blend. Interrupted fades settled on the requested masked and unmasked targets. | Mid-fade and settled art matched the GM in both completed fades and both interruption cases. |
| Dynamic ring subjects | Implicit and explicit subjects followed the applicable outline. The rectangular native subject retained its frame dimensions, fit, scale and ring appearance. Shape-only edits, removal, held drags and settled transitions used the applicable crop or restored native art. | Subject selection, fit, live edits, removal, held drags and settled transitions agreed with the GM observations. |

HTML snapshots, rendered screenshots and diagnostic traces were kept outside Foundry Data. The evidence includes `editor-frame-checks.json`, `editor-conflicts.json`, `reload-and-removal.json`, `rapid-diagnostic2.json`, intermediate screenshots and `midframes.json`, `ring-pulse.json` and `cleanup.json`. Cleanup removed disposable scene and actor fixtures, restored fixture settings and confirmed the temporary mask records were gone in both sessions.

The [scene preview repair](../bugs/fixed/stale-scene-token-preview.md) passed automated checks and a live rerun at `32a07d9`, including rapid and whitespace-padded returns and placed crop checks after Cancel and Apply. An external CORS-enabled portrait was unavailable for the prototype thumbnail check. See the [roadmap](../../ROADMAP.md) for follow-up.

## If it goes wrong

Record the exact source path and dimensions, selected shape, center, frame half-size, Foundry fit and scale, and each client's console output. For rings, record the stored and prepared subject paths, subject scale and native frame dimensions. Capture the editor's preview and placed token from the same saved mask before changing the fixture.
