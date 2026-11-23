---
title: File picker integration
created: 2026-10-22
updated: 2026-11-23
tags: [foundry, file-picker, integration]
status: active
source: Installed Foundry 14.369 client source and templates, scripts/mask-file-picker.mjs and tests/mask-file-picker.test.mjs
---

# File picker integration

**TL;DR:** The picker adapter uses the built-in ApplicationV2 render and close hooks. Each edit button uses its row’s exact `data-path`. The adapter updates indicators directly when masks change.

## Foundry extension points

Application paths below are relative to `/opt/foundry/foundryvtt`. These hooks and template details were inspected in Foundry 14.369.

- `client/applications/apps/file-picker.mjs` implements `foundry.applications.apps.FilePicker` with the Handlebars ApplicationV2 mixin. Core file inputs in `client/applications/elements/file-picker.mjs` open `FilePicker.implementation`.
- `client/applications/api/application.mjs` emits `renderFilePicker(app, element, context, options)` with a native element. Its parent-hook dispatch can also reach subclasses with compatible markup. The adapter also listens for `closeFilePicker`.
- `templates/apps/file-picker/body.hbs` declares the list, thumbnail, tile and image views. File rows in `section[data-files] .files-list` expose `data-file`, `data-path` and `data-action="pickFile"`. Foundry prepares the path as `context.files[].url` and uses it when choosing a file. The row name serves as the translated control’s display label.
- Browsing can replace content and switching views renders the body. Native click dispatch finds the closest `data-action` on the application root. Native file selection updates the picked row and input, and submission invokes the selection callback.

[Foundry FilePicker API](https://foundryvtt.com/api/v14/classes/foundry.applications.apps.FilePicker.html)

## Adapter contract

- `scripts/main.js` passes the mask store and existing editor entry point into `MaskFilePicker`. The adapter requires a ready world and a GM and skips folder pickers.
- Candidate filtering requires a concrete HTTP(S) URL or a path that resolves to one, with a PNG, JPEG or WebP pathname. The editor checks the file container before decoding. The adapter passes the original path through to the editor and mask store, preserving case, encoding and query parameters.
- The row keeps its native selection and drag handlers. A directly bound `type="button"` cancels its own click and drag start before they reach the row. Browser button behavior supplies Enter and Space activation. Styles are anchored to the module wrapper or to rows containing it.
- `openMaskEditor(src, {opener})` loads the path and uses the opener document’s Foundry window ID when available. The editor focuses the opener on close if the button is still connected. Settings and API callers can keep using the default application window.
- On render, the adapter reuses controls on unchanged rows, removes obsolete controls and releases closed or disconnected picker roots. The `dynamic-token-mask.masksChanged` hook supplies changed paths. The adapter reads the current saved paths from `masks.list()` and updates matching indicators in place, preserving the picker’s search, scroll and selection.

## Compatibility boundaries

The row selectors depend on built-in v14 markup. Picker implementations with different markup receive no controls. Third-party pickers and S3 sources have no recorded live verification. See the feature record for automated evidence and the outstanding test-world checks. [File picker mask controls](../features/file-picker-mask-controls.md)

## Related

- [Circular mask design](../topics/module/circular-mask-design.md)
- [Augment native file picker rows](../decisions/2026-11-23-native-file-picker-rows.md)
- [Mask storage](mask-storage.md)
- [Portrait mask editor](../features/portrait-mask-editor.md)
- [Develop and validate](../how-to/develop-and-validate.md)
