# Dynamic Token Mask roadmap

The next milestone is for a GM to open a portrait in Foundry’s file picker, frame the subject, and see the result on every ordinary static token that uses that image in the world. Checked items reflect implementation and verification through November 23, 2026. The remaining milestones are in delivery order.

## 1. Store and render a mask — verified

- [x] Store one validated circle per exact image path in each world. A GM can save and remove masks through the module API. [Storage contract](knowledge/reference/mask-storage.md)
- [x] Render the selected circle on ordinary static tokens while preserving the source path and token dimensions. Matching tokens can share the cropped texture. [Renderer record](knowledge/features/static-token-renderer.md)
- [x] Verify the full API workflow on Foundry 14.369. A GM and player saw the same off-center crop on two tokens, retained it across reloads, and saw both originals return after removal. Both tokens kept their 1×1 footprint and remained targetable. [Live test procedure](knowledge/how-to/verify-static-token-masks.md)

## 2. Frame a portrait in the editor — Foundry checks pending

- [x] Open a static image in a GM-only ApplicationV2 editor. Start with an existing saved circle and let the GM move and resize it using drag handles or numeric controls.
- [x] Draw the square crop on a checkerboard with the same circular clip and framing as the token renderer.
- [x] Keep drafts local. Explain the world-wide effect of Save and Remove and bound the circle to the source. Report image and persistence failures while preserving the last saved mask. [Editor feature record](knowledge/features/portrait-mask-editor.md)
- [ ] In the designated Foundry world, compare the preview with rendered 1×1 tokens for a wide off-center portrait and a portrait with transparency. Check Cancel, reopening, reload and removal. [Editor runtime procedure](knowledge/how-to/verify-portrait-mask-editor.md)

## 3. Open the editor from Foundry’s file picker

- [ ] Give GMs an edit button and a saved-mask indicator on eligible images in list, thumbnail, tile and image views. Use the exact path Foundry selects, including case and encoding.
- [ ] Keep editing separate from choosing a file. Verify that opening the editor by mouse or keyboard preserves the picker selection, and that ordinary selection, submission and dragging still work.
- [ ] Refresh indicators after save or removal in every open picker. Check navigation, search and view changes for duplicate buttons or lost selection. Verify player accounts have no edit controls.
- [ ] Provide matching English and Russian labels, keyboard access and focus return when the editor closes. [Picker integration plan](knowledge/reference/file-picker-integration.md)

## 4. Verify the first UI release

- [ ] Repeat the two-client test through the file picker without console commands. Create, adjust, cancel, save and remove a mask. Check both tokens after a scene change and browser reload.
- [ ] Check static images with transparency, resolved wildcard variants, and filenames with spaces or Unicode. Verify that editing one image leaves other images alone.
- [ ] Check rotation, mirroring, rectangular footprints, nonuniform scale and fit. Document where the on-token result differs from the square editor preview. Verify targeting, vision and occlusion in a scene configured to exercise them.
- [ ] Exercise missing images and unsupported resources. Disable the module in the designated test world and reload to confirm Foundry displays the originals. Record the tested Foundry build and supported cases in the README. [Validation guide](knowledge/how-to/develop-and-validate.md)

## 5. Decide which rendering cases to support next

- [ ] Test drag previews, scene-token and prototype-token configuration previews, and image-change transitions. Record which paths need additional renderer hooks.
- [ ] Test dynamic rings with both implicit and explicit subject images. Decide which image owns the mask before adding ring support.
- [ ] Prioritize animated portraits and third-party token or picker integrations using concrete use cases and repeatable fixtures. Give each selected integration its own acceptance check. [Open design questions](knowledge/topics/module/_overview.md)
