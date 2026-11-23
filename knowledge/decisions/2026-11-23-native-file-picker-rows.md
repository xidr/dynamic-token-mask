---
title: Augment native file picker rows
date: 2026-11-23
status: accepted
tags: [foundry, file-picker, editor]
---

# Augment native file picker rows

## Context

The picker needs one edit button per eligible image in each view while preserving the file-selection workflow. Foundry 14.369 places the exact selection path on each row and issues ApplicationV2 hooks for normal and partial renders. The adapter also needs to react when a mask changes while another picker is open.

## Decision

Decorate eligible rows from `renderFilePicker`, release controls at close, and refresh saved-mask indicators in place on the mask-change hook. Pass the untouched row path to the existing editor. Pass the opener’s Foundry window ID when rendering from a detached picker so the editor can return focus in that window.

## Alternatives

Replacing the picker class or body template would give direct control over the markup and couple the module to more of Foundry’s UI. Rebuilding paths from filenames and directories would add independent URL handling with a risk of changing image keys. Rebrowsing on mask changes would rebuild picker state for updates that only affect indicators.

## Consequences

The integration depends on the built-in v14 row contract, so keep the selector and lifecycle in one adapter. Browser-level checks should cover all four layouts, partial renders and native selection and drag. Ordinary settings and API entry points continue to use the same editor. [File picker integration](../reference/file-picker-integration.md)
