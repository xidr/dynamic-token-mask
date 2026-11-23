---
title: File picker integration
created: 2026-10-22
updated: 2026-11-23
tags: [foundry, file-picker, integration]
status: active
source: Installed Foundry 14.367 client source and templates; inspection only
---

# File picker integration

**TL;DR:** The built-in v14 file picker can be augmented through `renderFilePicker` without replacing its class or templates. Add per-image edit controls and mask indicators to existing file entries. This is a source-verified integration plan, not a runtime-tested implementation.

## Verified extension points

Application paths below are relative to `/opt/foundry/foundryvtt`.

- `client/applications/apps/file-picker.mjs`: `FilePicker` extends the Handlebars ApplicationV2 mixin. Its namespace is `foundry.applications.apps.FilePicker`; new instances should respect `.implementation` as the core file input does.
- `client/applications/api/application.mjs`, render lifecycle and `#callHooks`: the render hook is `renderFilePicker(app, element, context, options)`. `element` is a native HTMLElement, not jQuery. Parent-class hook dispatch also supports ordinary subclasses, subject to their application inheritance boundary.
- `templates/apps/file-picker/body.hbs`: all four views (`list`, `thumbs`, `tiles`, `images`) expose `li[data-file][data-path]`; directories use `data-directory`. Each file row has `data-action="pickFile"`.
- `FilePicker._prepareContext`: `context.files` contains `url`, `name`, `img` and `icon`. `url` is the same value put in the row's `data-path` and subsequently selected by Foundry. Use this path as the image association, not the display name, thumbnail URL or reconstructed directory path. Preserve case and URL encoding; do not decode the storage key.
- `FilePicker.browse`: directory/source navigation renders new content. `#onChangeDisplayMode` renders only the body. Render integration must handle partial rerenders and unchanged rows without duplicating controls/listeners.
- `FilePicker.#onPickFile`: sets the picked row and file input. `#onSubmit` invokes the selection callback and closes the picker.
- `ApplicationV2.#onClick`: dispatches the closest `data-action` using a listener on the application root. An unhandled click inside a file row reaches the native file-selection action.
- `client/applications/elements/file-picker.mjs`: core file inputs open `FilePicker.implementation`, so integration reaches standard image fields without adding separate token-sheet controls in this phase.

Official reference: https://foundryvtt.com/api/v14/classes/foundry.applications.apps.FilePicker.html

## Recommended adapter

Register `renderFilePicker` and `closeFilePicker`. On render, require an active world and a GM; inspect actual file entries and image eligibility rather than relying only on the picker's type (`any` can contain images). Skip folder-only browsing and unsupported resources.

For each eligible row, insert a module-owned wrapper with `.dynamic-token-mask`, a `type="button"` editor control and a saved-mask indicator. Use translated accessible labels and textContent/DOM construction for filenames. Style within the module wrapper so core picker layout is not globally changed. Support all four views and keyboard activation.

Attach the button click handler directly to the button; call preventDefault and stopPropagation before opening the editor. Do not submit the parent form, call the native selection callback, alter its file input, or install a competing `pickFile` action. Stop drag initiation from the edit control as needed; preserve ordinary row dragging. A close action on the editor should return focus to its opener if still connected.

Decoration must be idempotent: mark inserted controls, bind each once, and update existing indicators. Keep open picker references only while needed and remove them on close. On mask changes, update matching indicators directly instead of rebrowsing/rerendering the picker and disturbing search, scroll or selection. Read current records from the storage service rather than retaining stale record objects in button closures.

Use the file path exposed by the row. Do not enumerate folders separately or recursively, and do not load every full-resolution image merely to decorate the browser. File-extension eligibility is only a preliminary filter: animated WebP/PNG can share static extensions, so the later editor must define and validate supported formats instead of claiming extension checks detect animation.

## Compatibility boundaries and verification

The render hook is an extension point; row selectors are version-specific template details. Keep selectors in one adapter. If a replacement file browser does not expose compatible rows, do nothing gracefully; third-party picker compatibility is not established. No prototype patches, replacement templates or new dependency are required by the inspected built-in picker.

Before shipping, test all four views; folder/source changes; partial rerenders; search; multiple picker windows; spaces, Unicode and encoded paths; non-image entries; keyboard clicks; normal selection/submission; drag/upload behavior; GM/player gating; indicators after save/remove; and cleanup after close. Include S3 path behavior when a test source is available. No world has been activated and no browser runtime test was performed during inspection.

## Adapter contract

The storage service and portrait editor are implemented. The planned adapter can open an editor with `game.modules.get("dynamic-token-mask").api.openEditor(src)` using the row path. It can query `api.masks.has(src)` for indicators and listen for `dynamic-token-mask.masksChanged` to receive affected paths. Storage and token rendering remain in their respective services.

## Related

- [[circular-mask-design]]
- [[mask-storage]]
- [[portrait-mask-editor]]
- [[develop-and-validate]]
