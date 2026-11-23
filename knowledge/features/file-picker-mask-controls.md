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

After merge approval, use a designated Foundry world to check:

- As GM, open eligible images in all four views, including paths with spaces, Unicode or existing encoding. Confirm the editor opens the exact path Foundry selects, including case.
- Open with mouse, Enter and Space. Check the selection and file field, then close the editor and confirm that focus returns. Repeat from a detached picker. Confirm normal row selection, submission and drag.
- Open two pickers on matching paths. Save and remove a mask and confirm the indicators update while selection and search stay intact. Change folders, sources and views to check for duplicate controls. Check that unsupported files and directories lack controls, unrelated rows keep their indicators, and drag-and-drop upload still works where available.
- Connect as a player, confirm no edit controls appear, and compare matching token crops after a GM edits, saves and removes a mask. Check Cancel, scene changes and browser reloads. Try an S3 source if the designated world provides one.

Live picker checks are pending. [Develop and validate](../how-to/develop-and-validate.md)
