---
title: Gotchas
created: 2026-11-23
updated: 2026-11-23
tags: [storage]
status: active
---
# Gotchas

**TL;DR:** Use the exact resolved image path and keep world-setting concurrency in mind.

A wildcard pattern identifies multiple images. Store the resolved image path. Check an editor’s loaded mask inside the queued write, after any earlier operation completes. An earlier comparison can pass while another editor’s save is still pending. Two GM browsers have separate queues and can still overwrite simultaneous whole-setting edits. See [mask storage](reference/mask-storage.md).

Foundry 14.369 positions an auto-height ApplicationV2 when it renders. If asynchronous content later grows, measure the updated window and call its native positioning method when it overflows. See [editor-actions-below-viewport](bugs/fixed/editor-actions-below-viewport.md).
