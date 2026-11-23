---
title: Per-image mask storage
created: 2026-11-23
updated: 2026-11-23
tags: [feature, storage]
status: active
---
# Per-image mask storage

**TL;DR:** Each exact image path can have a world-scoped circle shared by tokens using that image.

## Request

Associate a circle with an individual image, including a resolved wildcard image.

## Decided

Store validated records in a hidden world setting. Preserve the original image and path.

## Behavior

A ready GM can save and remove circles. Clients can read records and subscribe to changes. See [mask storage](../reference/mask-storage.md) for the API and concurrency limits.

## Out of scope

Cross-world export. See [Portrait mask editor](portrait-mask-editor.md) and [Static token renderer](static-token-renderer.md) for the features that use this service.

## Implementation

`scripts/mask-store.mjs`, `scripts/main.js` and `tests/mask-store.test.mjs`. Automated storage checks pass. In the 2026-11-23 Foundry 14.369 test, a GM save and removal reached a connected player, and the saved mask persisted across reconnects and browser reloads. See [Static token renderer](static-token-renderer.md).
