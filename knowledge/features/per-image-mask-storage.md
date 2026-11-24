---
title: Per-image mask storage
created: 2026-11-23
updated: 2026-11-24
tags: [feature, storage]
status: active
---
# Per-image mask storage

**TL;DR:** Each exact image path can have a world-scoped mask shared by tokens using that image.

## Request

Associate one mask with an individual image, including a resolved wildcard image. Support circle, square and both regular hexagon orientations, with an optional border per image.

## Decided

Store validated records in a hidden world setting. Preserve the original image and path. Keep legacy masks readable. A polygon save can upgrade the collection to version 2, and a save with non-default border settings upgrades it to version 3. [Keep the square sampling frame for all mask shapes](../decisions/2026-11-24-mask-shapes-square-frame.md)

## Behavior

A ready GM can save and remove masks. Clients can read records and subscribe to changes, including shape-only and border-only edits. A storage upgrade by itself leaves existing circle snapshots equivalent. See [mask storage](../reference/mask-storage.md) for the API and concurrency limits.

## Out of scope

Cross-world export. See [Portrait mask editor](portrait-mask-editor.md) and [Static token renderer](static-token-renderer.md) for the features that use this service.

## Implementation

`scripts/mask-store.mjs`, `scripts/main.js` and `tests/mask-store.test.mjs`. Automated storage checks cover version upgrades, failed writes and retries, shape-only updates, stale saves and removes, and reopening. Automated border checks cover normalized defaults, retained disabled preferences, stale snapshots and change notifications. Border persistence and client synchronization in Foundry await the designated-world check. [Verify mask borders in Foundry](../how-to/verify-mask-borders.md) The shape check on Foundry 14.369 at `d7e85f4` confirmed polygon saves and removal on both clients, persistence through both reloads and rejection of stale Save and Remove from a second GM editor window. [Shape results](../how-to/verify-mask-shapes.md#check-it-worked) In the 2026-11-23 Foundry 14.369 test, a GM save and removal reached a connected player, and the saved mask persisted across reconnects and browser reloads. See [Static token renderer](static-token-renderer.md).
