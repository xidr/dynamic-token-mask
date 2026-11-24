---
title: Gotchas
created: 2026-11-23
updated: 2026-11-24
tags: [storage, foundry, ui]
status: active
---
# Gotchas

**TL;DR:** Preserve exact paths, check saved snapshots inside the write queue and use each native application's actual host window and loaded image.

A wildcard pattern identifies multiple images. Store the resolved image path. Check an editor’s loaded mask inside the queued write, after any earlier operation completes. An earlier comparison can pass while another editor’s save is still pending. Two GM browsers have separate queues and can still overwrite simultaneous whole-setting edits. See [mask storage](reference/mask-storage.md).

Foundry 14.369 positions an auto-height ApplicationV2 when it renders. If asynchronous content later grows, measure the updated window and call its native positioning method when it overflows. See [editor-actions-below-viewport](bugs/fixed/editor-actions-below-viewport.md).

An ApplicationV2 opened from a detached picker needs the opener’s Foundry window ID at render time. Read it from the opener’s `ownerDocument.defaultView.id` and pass it in `window.windowId` so the editor opens in the same host window. Close can restore focus while the opener remains connected. See [File picker integration](reference/file-picker-integration.md).

In Foundry 14.369, returning a scene configuration preview to the placed token's original image path can refresh the clone without redrawing it. Compare the selected path and loaded base texture before applying a crop. A prototype thumbnail can display external art even when its image is unusable for canvas. Use an anonymous CORS image request for crop drawing when the remote source allows it. [Native token previews and transitions](features/native-token-previews-and-transitions.md)

An empty stored ring subject can have a populated prepared path in Foundry 14.369. This inferred path determines the native fallback art. The stored field distinguishes an explicit choice, and an implicit mask is drawn from the original portrait. [Native dynamic ring subject decision](decisions/2026-11-24-native-dynamic-ring-subjects.md)

On Foundry 14.369, a remote subject change or ring toggle can redraw the original token and cancel its owner's active drag. A mask-setting edit updates the held clone in place. When testing, check the interaction state and placed token before starting a fresh drag. [Native ring verification](features/native-dynamic-rings.md#changed-build-live-verification)

A range input with a fixed step can round a valid fractional value when it is assigned to the control. The border width API accepts any finite number in its range, so the editor uses `step="any"` to keep the slider and numeric readout in sync. [Colored mask borders](features/colored-mask-borders.md)
