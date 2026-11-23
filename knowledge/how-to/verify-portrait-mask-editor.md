---
title: Verify the portrait mask editor in Foundry
created: 2026-11-23
updated: 2026-11-23
tags: [how-to, editor, validation]
status: active
source: Portrait mask editor milestone and scripts/mask-editor.mjs
---

# Verify the portrait mask editor in Foundry

**TL;DR:** Compare the live editor preview with ordinary static scene tokens and confirm that saved masks persist while canceled drafts disappear.

## When to use

After the approved merge, use the designated test world with the module enabled and reload the browser. Connect a GM and a player in separate sessions on the same scene. Use dedicated test portraits and record the Foundry build.

## Steps

1. Use a wide static portrait with a recognizable off-center subject and a static portrait with visible transparency inside the circle you intend to draw. Give each image an ordinary visible 1×1 scene token with default texture settings and rings disabled. Give a second token the same exact wide-portrait path. Record the original portraits and paths, and confirm the fixtures have no saved masks.
2. As GM, open **Portrait Mask Editor** in Configure Settings. For the wide portrait, use the editor's browse control to choose the image, then select **Load Image**. Try the center and radius drag handles, then enter a numeric center and adjust the radius slider. Move the circle near an edge and confirm it stays within the image, including when the slider reaches the bound. Confirm the player has no editor entry in Configure Settings. For the footer regression, use a 1400×950 viewport and open the empty editor at its default position. Load a 400×200 PNG and check all four footer buttons are fully inside the viewport. Change the radius, then click Reset, Save, Remove and Cancel without dragging the window. Verify the default radius, saved record, removal and window closure.
3. Frame the off-center subject using a circle smaller than the default. Confirm the world-wide effect is stated near **Save Mask** and **Remove Mask**. Save and compare the subject's placement and zoom to the square preview on both matching tokens in both sessions. Confirm the token using another path stays the same.
4. Open the saved wide portrait again. Confirm the circle and preview match the saved crop. Move the circle or change its radius, then choose **Cancel**. Confirm both matching tokens preserve the saved crop and reopening still shows the saved circle. Reload the GM and player sessions and confirm the crop and editor state persist.
5. Load, frame and save the transparent portrait. Compare the transparent details inside the circle and the transparent corners of the clipped square with the 1×1 token. Use a contrasting scene background so source transparency is visible.
6. With a known saved mask, try a missing path and an unsupported image. Check the editor reports a useful message and that reopening the valid path restores the saved geometry. Reopen that path in two GM editor windows. Save a changed crop in the first and attempt Remove in the second. Confirm the second shows a conflict and the newer crop remains. Reload the image to obtain the current saved circle.
7. Remove each saved mask and confirm all matching test tokens restore their original portrait in both clients. Check that token paths and footprints still match the baseline. Remove the temporary test scene and fixtures after recording results.

## Check it worked

**TODO: unverified**

Record the Foundry build and outcomes for both preview comparisons, GM and player behavior, save, Cancel, reopen, reload, conflict, errors and removal. Mark the checks in [portrait-mask-editor](../features/portrait-mask-editor.md) and the roadmap only after exercising them in Foundry. See [the feature record](../features/portrait-mask-editor.md) for the November 23, 2026 results on Foundry 14.369.

## If it goes wrong

Record the exact image format, source dimensions and token texture settings, alongside the observed frame and any errors from each browser console. The [Verify static token masks in Foundry](verify-static-token-masks.md) procedure can verify renderer behavior separately.
