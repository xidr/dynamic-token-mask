---
title: File picker mask controls
created: 2026-11-23
updated: 2026-11-23
tags: [feature, file-picker, editor]
status: active
source: scripts/mask-file-picker.mjs, scripts/mask-editor.mjs and tests/mask-file-picker.test.mjs
---

# File picker mask controls

**TL;DR:** A ready-world GM can open the Portrait Mask Editor from an eligible file row and see whether that exact image path has a saved mask. Save and removal refresh matching indicators across open pickers.

## Request

Add an accessible editor shortcut and saved-mask status to eligible images in all four built-in file picker views. Preserve native browsing, selection, submission and drag behavior.

## Decided

Augment the built-in picker through Foundry’s application hooks. Use each row’s exact path, the existing editor and the world mask store. [Augment native file picker rows](../decisions/2026-11-23-native-file-picker-rows.md)

## Behavior

- List, thumbnail, tile and image views show a portrait button for PNG, JPEG and WebP candidates. A check mark and the translated button label indicate a saved mask. The editor verifies whether the selected file is a supported static image.
- Click the portrait button or activate it with Enter or Space to load that row in the editor while preserving the picker’s selection. Closing the editor returns focus to the button if it is still present. Editors opened from detached pickers use the picker’s host window.
- Ordinary clicks and drags on the file row use Foundry’s behavior. Save and Remove update matching indicators in open pickers without restarting the current browse. Player accounts and folder-only pickers have no mask controls.

## Out of scope

Third-party picker integrations, animated images and separate shortcuts on token sheets.

## Implementation

`scripts/mask-file-picker.mjs` manages controls and their lifecycle. `scripts/main.js` connects the picker and mask-update hooks. `scripts/mask-editor.mjs`, `scripts/mask-geometry.mjs` and `templates/mask-editor.hbs` handle the opener, source validation and initial focus. `styles/module.css` and the English and Russian locale entries provide the presentation and accessible labels. [File picker integration](../reference/file-picker-integration.md)

On 2026-11-23, all 40 Node tests passed. Picker tests cover gating, exact paths, selection and submission isolation, drag behavior, multiple open pickers, rerender and close cleanup, and the editor’s host window and focus return. An offline Chromium fixture used the actual adapter and installed Foundry 14.369 styles. Hit-testing reached the edit button in all four views. Mouse, Enter and Space each opened the editor entry point without triggering a native row click.

## Live acceptance

Use a designated Foundry world for these checks.

- As GM, open eligible images in all four views, including paths with spaces, Unicode or existing encoding. Confirm the editor opens the exact path Foundry selects, including case.
- Open with mouse, Enter and Space. Check the selection and file field, then close the editor and confirm that focus returns. Repeat from a detached picker. Confirm normal row selection, submission and drag.
- Open two pickers on matching paths. Save and remove a mask and confirm the indicators update while selection and search stay intact. Change folders, sources and views to check for duplicate controls. Check that unsupported files and directories lack controls, unrelated rows keep their indicators, and drag-and-drop upload still works where available.
- Connect as a player, confirm no edit controls appear, and compare matching token crops after a GM edits, saves and removes a mask. Check Cancel, scene changes and browser reloads. Try an S3 source if the designated world provides one.

Mouse, Enter and Space activation were exercised across the four views. Every view retained the selected file and returned focus on close. Folder navigation, search, native submission and uploading a PNG by drop passed. A detached picker opened its editor in the same window and regained focus on close.

Live checks on Foundry 14.369 used a transparent PNG with a Cyrillic filename, a space and an uppercase extension. The GM opened the encoded path from the picker and saved a crop. Both open pickers showed the saved indicator. Two matching tokens used derived textures on both GM and player clients, while a third token retained its original texture. Cancel discarded a subsequent radius change. After both clients reloaded, reopening showed the saved radius. Removal cleared the indicator and restored original textures on both clients. In Foundry’s tile picker, dragging the file row produced the exact native tile texture path and starting a drag on its edit button cancelled the drag. The player account lacked file-browsing permission. Its picker showed no mask controls. [Develop and validate](../how-to/develop-and-validate.md)

### First UI release

On 2026-11-23, a GM used the built-in picker on Foundry 14.369 to open a transparent PNG with a space and Cyrillic characters in its filename. The GM adjusted the draft and selected **Cancel**. Reopening showed the default circle. The GM then saved a center of 69% by 43% and a radius of 23% of the shorter image side. The picker displayed the saved-mask check mark, and both matching tokens showed the crop on the GM and player clients. The GM navigated away and returned to both crops, then reloaded and saw them again. The player also left the scene and returned to both crops, and saw them after rejoining. A separate player browser reload reached the canvas, but returning to the test scene timed out. The two crops could not be checked after that reload.

The editor disabled **Save Mask** for a missing PNG, an unsupported GIF and an unresolved wildcard pattern. The picker offered no portrait edit button on the GIF row. With the mask still saved, disabling the module and reloading returned both tokens to their original 2:1 textures in the GM browser. Re-enabling restored the crops. Removing the mask cleared the picker indicator and restored the two originals on both clients. [Renderer verification](static-token-renderer.md#first-ui-release)
