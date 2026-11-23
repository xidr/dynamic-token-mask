---
title: Mask storage
created: 2026-10-22
updated: 2026-11-23
tags: [module, storage, implementation]
status: active
source: scripts/mask-store.mjs, scripts/main.js and focused Node tests
---

# Mask storage

**TL;DR:** A hidden world setting stores one validated circle per exact image path. In the Foundry 14.369 test, a GM save and removal reached a connected player, and the saved mask persisted across reconnects and browser reloads.

## Schema and API

Setting: `dynamic-token-mask.masks`, Object, world scope, hidden from standard settings. Version 1 contains a `masks` array. Each record has `src`, `centerX`, `centerY`, `radius`, `imageWidth`, `imageHeight`. Centers are fractions of their respective dimensions; radius is relative to the shorter dimension. Positive integer image dimensions allow bounds validation for rectangular images. The editor supplies the decoded image dimensions. Replacing a file at the same path may require reauthoring its mask.

After ready, access `game.modules.get("dynamic-token-mask").api.masks`:

- `get(src)`: detached record or null.
- `has(src)`: existence check.
- `list()`: detached records.
- `save(record, {expected} = {})`: validates then persists and returns a Promise for a detached saved record. Validation can throw synchronously.
- `remove(src, {expected} = {})`: Promise resolving to whether a record was removed.

Omit `expected` for an unconditional write. Supply `null` to require absence or a record to require an equal saved mask. The service validates and copies the supplied snapshot before queueing the operation.

Save/remove require a GM and a ready world. Reading is available to all clients. Exact path spelling, case and encoding are preserved. Blank paths and wildcard `*` patterns are rejected. Save accepts only finite numeric geometry and an in-bounds circle; unknown schema versions, malformed data and duplicate paths are rejected instead of being silently reset. Extra record properties are not persisted. There is no per-record revision yet; change detection compares record values.

Foundry setting changes emit `Hooks.callAll("dynamic-token-mask.masksChanged", paths)` with frozen affected-path arrays on each receiving client. Initialize the baseline at ready. No notification or write for unchanged saves or absent removals. Change subscribers should query the current store.

## Persistence and limitations

The service reads fresh settings and compares any expected snapshot once the operation reaches the front of its instance queue. A mismatch rejects with `MaskConflictError`, including after another local editor has written a different mask. The queue continues after a rejection. Concurrent GM browsers or tabs can still overwrite simultaneous whole-setting changes because their queues are separate. Reads return detached copies.

The static token renderer consumes this API and its change hook. The [[portrait-mask-editor]] uses conditional writes for Save and Remove. The [[verify-static-token-masks]] procedure covers persistence and receiving-client behavior in Foundry.

## Validation

`node --test tests/mask-store.test.mjs` covers rectangular bounds, invalid inputs, exact image associations, detached reads, reopening persistence, queued saves and conditional writes, remote notifications, no-op operations, permissions, failed-write recovery and invalid schema rejection using an injected settings adapter. In the 2026-11-23 Foundry 14.369 test, a single GM save updated both clients, the stored mask applied after reconnecting and reloading, and a subsequent GM removal propagated live. See [[features/static-token-renderer]].

## Related

- [[file-picker-integration]]
- [[circular-mask-design]]
- [[develop-and-validate]]
