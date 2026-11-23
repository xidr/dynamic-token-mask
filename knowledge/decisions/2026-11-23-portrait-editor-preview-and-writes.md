---
title: Share crop drawing and check editor snapshots in the write queue
date: 2026-11-23
status: accepted
tags: [editor, rendering, storage]
---

# Share crop drawing and check editor snapshots in the write queue

**TL;DR:** The editor uses the renderer's crop drawing and submits its loaded mask as a condition for Save or Remove.

## Context

The preview needs the scene token's crop geometry and source alpha. The editor keeps a local draft while its saved record can change, including in another window in the same client while an earlier write is still in flight.

## Decision

Reuse the renderer's square source crop and circular clip with a 256-pixel preview cap. The store accepts an optional expected record or expected absence. It checks that expectation against fresh state inside its serialized write queue. The editor reports a conflict and lets the GM load the new saved state.

## Alternatives

An editor-specific crop would duplicate the geometry and clipping rules. Checking the saved record before queueing a write leaves a race with an operation already waiting to commit. A record revision would require related storage changes. The current store can compare the fields of a validated record.

## Consequences

The preview shares framing and transparency with the token crop. Foundry applies each token's texture settings afterward. Existing direct store calls can omit the expectation. The conditional check catches changes visible at the point of writing. Separate GM clients keep separate queues around a shared Foundry world setting.
