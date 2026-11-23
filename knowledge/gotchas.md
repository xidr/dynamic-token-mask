---
title: Gotchas
created: 2026-11-23
updated: 2026-11-23
tags: [storage]
status: active
---
# Gotchas

**TL;DR:** Use the exact resolved image path and keep world-setting concurrency in mind.

A wildcard pattern identifies multiple images. Store the resolved image path. Two GM browsers can overwrite simultaneous whole-setting edits, even though writes are serialized within one instance. See [mask storage](reference/mask-storage.md).
