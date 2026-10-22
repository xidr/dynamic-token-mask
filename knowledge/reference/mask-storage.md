---
title: Mask storage
created: 2026-10-22
updated: 2026-10-22
tags: [module, storage, implementation]
status: active
source: scripts/mask-store.mjs, scripts/main.js and focused Node tests
---

# Mask storage

**TL;DR:** A hidden world setting stores one validated circle per exact image path. The service is implemented and unit-tested; Foundry runtime and multiplayer behavior remain unverified.

## Schema and API

Setting: `dynamic-token-mask.masks`, Object, world scope, hidden from standard settings. Version 1 contains a `masks` array. Each record has `src`, `centerX`, `centerY`, `radius`, `imageWidth`, `imageHeight`. Centers are fractions of their respective dimensions; radius is relative to the shorter dimension. Positive integer image dimensions allow bounds validation for rectangular images. The editor must supply actual loaded dimensions; the storage service does not load files. Replacing a file at the same path may require reauthoring its mask.

After ready, access `game.modules.get("dynamic-token-mask").api.masks`:

- `get(src)`: detached record or null.
- `has(src)`: existence check.
- `list()`: detached records.
- `save(record)`: validates then persists; returns a Promise for a detached saved record. Validation can throw synchronously.
- `remove(src)`: Promise resolving to whether a record was removed.

Save/remove require a GM and a ready world. Reading is available to all clients. Exact path spelling, case and encoding are preserved. Blank paths and wildcard `*` patterns are rejected. Save accepts only finite numeric geometry and an in-bounds circle; unknown schema versions, malformed data and duplicate paths are rejected instead of being silently reset. Extra record properties are not persisted. There is no per-record revision yet; change detection compares record values.

Foundry setting changes emit `Hooks.callAll("dynamic-token-mask.masksChanged", paths)` with frozen affected-path arrays on each receiving client. Initialize the baseline at ready. No notification or write for unchanged saves or absent removals. Change subscribers should query the current store.

## Persistence and limitations

The service reads fresh settings for each operation and serializes writes within its instance. Failed writes do not poison the queue. Concurrent GM browsers/tabs still use whole-setting last-write-wins behavior and can overwrite each other's edits; multi-writer coordination is not implemented. This is a small-library first version, not an atomic database. Returned records cannot mutate stored data.

Runtime code only registers storage/API; there is no file-browser UI, image processing or token rendering. No world activation or server restart occurred. The existing design note remains a proposal where it differs from this implemented contract.

## Validation

`node --test tests/mask-store.test.mjs` covers rectangular bounds, invalid inputs, exact image associations, detached reads, reopening persistence, queued saves, remote notifications, no-op operations, permissions, failed-write recovery and invalid schema rejection using an injected settings adapter. These tests do not prove Foundry runtime compatibility. Next validate world persistence and synchronized callbacks in an agreed test world.

## Related

- [[file-picker-integration]]
- [[circular-mask-design]]
- [[develop-and-validate]]
