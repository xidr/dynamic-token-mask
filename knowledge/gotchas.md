---
title: Gotchas
created: 2026-11-23
updated: 2026-11-23
tags: [storage, foundry, ui]
status: active
---
# Gotchas

**TL;DR:** Preserve exact image paths, check snapshots in the write queue, and pass the opener’s host window when rendering from a detached Foundry application.

A wildcard pattern identifies multiple images. Store the resolved image path. Check an editor’s loaded mask inside the queued write, after any earlier operation completes. An earlier comparison can pass while another editor’s save is still pending. Two GM browsers have separate queues and can still overwrite simultaneous whole-setting edits. See [mask storage](reference/mask-storage.md).

Foundry 14.369 positions an auto-height ApplicationV2 when it renders. If asynchronous content later grows, measure the updated window and call its native positioning method when it overflows. See [editor-actions-below-viewport](bugs/fixed/editor-actions-below-viewport.md).

An ApplicationV2 opened from a detached picker needs the opener’s Foundry window ID at render time. Read it from the opener’s `ownerDocument.defaultView.id` and pass it in `window.windowId` so the editor opens in the same host window. Close can restore focus while the opener remains connected. See [File picker integration](reference/file-picker-integration.md).
