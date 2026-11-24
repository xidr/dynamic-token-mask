---
title: Mask storage
created: 2026-10-22
updated: 2026-11-24
tags: [module, storage, implementation]
status: active
source: scripts/mask-store.mjs, scripts/main.js and focused Node tests
---

# Mask storage

**TL;DR:** A hidden world setting stores one validated mask per exact image path. In the original circle checks on Foundry 14.369, a GM save and removal reached a connected player, and the saved mask persisted across reconnects and browser reloads.

## Schema and API

Setting: `dynamic-token-mask.masks`, Object, world scope, hidden from standard settings. Each schema version contains a `masks` array with one record per exact image path. Each record has `src`, `centerX`, `centerY`, `radius`, `imageWidth` and `imageHeight`. Centers are fractions of their respective dimensions. `radius` is the half-size of the square sampling frame as a fraction of the shorter source dimension. Positive integer image dimensions allow frame bounds validation for rectangular images. The editor supplies the decoded image dimensions. Replacing a file at the same path may require reauthoring its mask.

Version 1 is the default and supports circle records. Reads and circle writes with default border settings preserve version 1. The first successful save of a square or hexagon with default border settings upgrades version 1 to version 2. The first successful save of a mask with non-default border settings upgrades version 1 or 2 to version 3 in one setting write. Versions 2 and 3 use an explicit `shape` for every row, including circles. Version 3 permits an optional `border` per row. Versions 1 and 2 reject rows that contain `border`. Once upgraded, the collection stays on its latest version even after it becomes empty. A rejected setting write leaves the previous version available for retry. Builds that support only versions 1 and 2 reject version 3 through their existing unknown-format guard.

After ready, access `game.modules.get("dynamic-token-mask").api.masks`:

- `get(src)`: detached record or null.
- `has(src)`: existence check.
- `list()`: detached records.
- `save(record, {expected} = {})`: validates then persists and returns a Promise for a detached saved record. Validation can throw synchronously.
- `remove(src, {expected} = {})`: Promise resolving to whether a record was removed.

Supported API shape values are `circle`, `square`, `hex-flat` and `hex-pointy`. Omit `shape` on input to save a circle. Detached records returned by the API omit `shape` for circles and include it for polygons, across all supported versions. An omitted shape and explicit `circle` compare equally in expected snapshots and no-op saves.

Omit `border` for the default `{enabled: false, color: "#000000", widthPercent: 2}`. An explicit border requires a boolean `enabled`, a six-digit hexadecimal RGB string with a leading `#`, and a finite numeric `widthPercent` in the inclusive range 0.5–10. Fractional values are preserved and colors are normalized to lowercase. The API omits the default disabled border in returned records, and an explicit default and omission compare equally. A disabled border with a custom color or width remains in the saved and returned records. These fields participate in snapshot comparisons and no-op detection. The width is a percentage of the square crop side.

Omit `expected` for an unconditional write. Supply `null` to require absence or a record to require an equal saved mask. The service validates and copies the supplied snapshot before queueing the operation.

Save/remove require a GM and a ready world. Reading is available to all clients. Exact path spelling, case and encoding are preserved. Blank paths and wildcard `*` patterns are rejected. Save requires finite numeric geometry and an in-bounds square frame. Unknown shapes or schema versions, malformed data and duplicate paths are rejected. Extra record properties are not persisted. There is no per-record revision yet; change detection compares record values.

Foundry setting changes emit `Hooks.callAll("dynamic-token-mask.masksChanged", paths)` with frozen affected-path arrays on each receiving client. Initialize the baseline at ready. Unchanged saves and absent removals produce no write or notification. A shape-only or border-only edit emits the changed image path. Adding explicit circle shapes during a schema upgrade leaves unchanged circle records equivalent. Change subscribers should query the current store.

## Persistence and limitations

The service reads fresh settings and compares any expected snapshot once the operation reaches the front of its instance queue. A mismatch rejects with `MaskConflictError`, including after another local editor has written a different mask. The queue continues after a rejection. Concurrent GM browsers or tabs can still overwrite simultaneous whole-setting changes because their queues are separate. Reads return detached copies.

The static token renderer consumes this API and its change hook. The [portrait mask editor](../features/portrait-mask-editor.md) uses conditional writes for Save and Remove. The [Verify static token masks in Foundry](../how-to/verify-static-token-masks.md) procedure covers persistence and receiving-client behavior in Foundry.

## Validation

`node --test tests/mask-store.test.mjs` covers rectangular bounds, invalid inputs, exact image associations, detached reads, reopening persistence, queued saves and conditional writes, remote notifications, no-op operations, permissions, failed-write recovery, lazy schema migration, normalized shape and border comparisons, version 3 upgrades and invalid schema rejection using an injected settings adapter. In the 2026-11-23 Foundry 14.369 test, a single GM save updated both clients, the stored mask applied after reconnecting and reloading, and a subsequent GM removal propagated live. See [Static token renderer](../features/static-token-renderer.md).

## Related

- [File picker integration](file-picker-integration.md)
- [the circular mask design](../topics/module/circular-mask-design.md)
- [Develop and validate](../how-to/develop-and-validate.md)
