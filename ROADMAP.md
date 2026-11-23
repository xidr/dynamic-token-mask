# Dynamic Token Mask roadmap

A GM can open a portrait in Foundry’s file picker and frame the subject for all ordinary static tokens using that image in the world. The next milestone is to verify the picker workflow in the designated Foundry world. Status reflects evidence through November 23, 2026.

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

## 4. Verify the first UI release

- [ ] Repeat the two-client test through the file picker without console commands. Create, adjust, cancel, save and remove a mask. Check both tokens after a scene change and browser reload.
- [ ] Check static images with transparency, resolved wildcard variants, and filenames with spaces or Unicode. Verify that editing one image leaves other images alone.
- [ ] Check rotation, mirroring, rectangular footprints, nonuniform scale and fit. Document where the on-token result differs from the square editor preview. Verify targeting, vision and occlusion in a scene configured to exercise them.
- [ ] Exercise missing images and unsupported resources. Disable the module in the designated test world and reload to confirm Foundry displays the originals. Record the tested Foundry build and supported cases in the README. [Validation guide](knowledge/how-to/develop-and-validate.md)

## 5. Decide which rendering cases to support next

- [ ] Test drag previews, scene-token and prototype-token configuration previews, and image-change transitions. Record which paths need additional renderer hooks.
- [ ] Test dynamic rings with both implicit and explicit subject images. Decide which image owns the mask before adding ring support.
- [ ] Prioritize animated portraits and third-party token or picker integrations using concrete use cases and repeatable fixtures. Give each selected integration its own acceptance check. [Open design questions](knowledge/topics/module/_overview.md)
