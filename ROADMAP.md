# Dynamic Token Mask roadmap

A GM can open a portrait in Foundry’s file picker and frame the subject for all ordinary static tokens using that image in the world. The first UI release was tested in the designated Foundry 14.369 world on November 23, 2026.

## 1. Store and render a mask — verified

- [x] Store one validated circle per exact image path in each world. A GM can save and remove masks through the module API. [Storage contract](knowledge/reference/mask-storage.md)
- [x] Render the selected circle on ordinary static tokens while preserving the source path and token dimensions. Matching tokens can share the cropped texture. [Renderer record](knowledge/features/static-token-renderer.md)
- [x] Verify the full API workflow on Foundry 14.369. A GM and player saw the same off-center crop on two tokens, retained it across reloads, and saw both originals return after removal. Both tokens kept their 1×1 footprint and remained targetable. [Live test procedure](knowledge/how-to/verify-static-token-masks.md)

## 2. Frame a portrait in the editor — live checks on Foundry 14.369

- [x] Open a static image in a GM-only ApplicationV2 editor. Start with an existing saved circle and let the GM move and resize it using drag handles or numeric controls.
- [x] Draw the square crop on a checkerboard with the same circular clip and framing as the token renderer.
- [x] Keep drafts local. Explain the world-wide effect of Save and Remove and bound the circle to the source. Report image and persistence failures while preserving the last saved mask. [Editor feature record](knowledge/features/portrait-mask-editor.md)
- [x] Verified wide and transparent PNG previews against 1×1 token textures in GM and player sessions, including Cancel, reopening, reload and removal. [Editor runtime procedure](knowledge/how-to/verify-portrait-mask-editor.md)
- [x] Verified Reset, Save, Remove and Cancel after loading a 400×200 portrait at the default window position in a 1400×950 viewport. [Footer regression](knowledge/bugs/fixed/editor-actions-below-viewport.md)

## 3. Open the editor from Foundry’s file picker — live checks on Foundry 14.369

- [x] Add a GM-only edit button and a saved-mask indicator in list, thumbnail, tile and image views. Pass the exact path Foundry selects, including case and encoding.
- [x] Update matching indicators in all open pickers after saves and removals. Cover selection and submission isolation, drag handling, partial renders, picker closure and focus return in automated tests. The buttons have matching English and Russian labels. [File picker mask controls](knowledge/features/file-picker-mask-controls.md)
- [x] Exercise click hit-testing and mouse, Enter and Space activation in all four views in an offline Chromium fixture using Foundry 14.369 styles.
- [x] Verified all four views, selection, submission, tile drag, PNG upload, keyboard focus return, navigation, search, saved indicators in two GM pickers, a detached picker and an encoded Cyrillic path with a space and uppercase extension. Both clients displayed token updates. The player account lacked file-browsing permission. [Picker live acceptance](knowledge/features/file-picker-mask-controls.md#live-acceptance)

## 4. Verify the first UI release — live checks on Foundry 14.369

- [x] Created, adjusted, cancelled, saved and removed a mask through the built-in picker. Both tokens showed the crop after scene navigation on both clients, a GM browser reload and a player rejoin. [Picker release verification](knowledge/features/file-picker-mask-controls.md#first-ui-release)
- [x] Checked a transparent PNG with a space and Cyrillic characters in its filename. The native wildcard selector displayed the selected variant's own art and reapplied the mask when the masked variant was selected again. [Renderer verification](knowledge/features/static-token-renderer.md#first-ui-release)
- [x] Compared the square preview with a rendered token and exercised rectangular footprints, fit, rotation, mirroring, texture scale, targeting and token vision. [Renderer verification](knowledge/features/static-token-renderer.md#first-ui-release)
- [x] Verified overhead tile occlusion. Selecting the covered token faded the tile and revealed the crop. [Renderer verification](knowledge/features/static-token-renderer.md#first-ui-release)
- [x] Confirmed that missing PNGs, GIFs and unresolved wildcard paths disabled Save. Disabling the module and reloading restored both original portraits with the mask still saved. Re-enabling it restored both crops. [Picker release verification](knowledge/features/file-picker-mask-controls.md#first-ui-release)
- [ ] Repeat the player-only browser reload. The client reached the canvas, but returning to the test scene timed out.

## 5. Keep static portrait masks consistent across native Foundry token workflows

### Batch 1. Drag previews, token configuration previews and image transitions

Renderer and sheet integrations passed automated checks. Post-merge checks ran on Foundry 14.369. [Runtime results by role](knowledge/features/native-token-previews-and-transitions.md#foundry-14369-post-merge-verification) · [Verification procedure](knowledge/how-to/verify-native-token-previews-and-transitions.md)

- [x] The GM and owning player both saw the placed token's crop in the held drag preview. Drop and cancel preserved the correct portrait for both roles.
- [x] The GM verified scene-token and prototype previews with two masked images and an unmasked image. Cancel preserved the original portrait. Apply updated the scene token and the next token placed from the prototype. The owner could see the GM-placed tokens. Native permissions prevented the owner from opening configuration sheets or placing tokens.
- [x] Both clients saw the correct outgoing and incoming art in completed native fades between two masked portraits and then to an unmasked portrait.
- [x] Both clients displayed the requested final portrait after an interrupted fade and kept it after the first fade's scheduled end. This passed for masked and unmasked targets.
- [x] Creating, replacing and removing a mask refreshed the held drag and placed token for both roles, and the GM's open scene and prototype previews.

### Batch 2. Native dynamic rings

- [ ] Apply the mask for the resolved ring subject image. With an implicit subject, use the token portrait’s mask. With an explicit subject, use that image’s own mask.
- [ ] Verify both subject modes on GM and player clients. Include a masked token portrait paired with an unmasked explicit subject. The subject retains its original framing in that case, and the ring artwork stays intact in every case.
