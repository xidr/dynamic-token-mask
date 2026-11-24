---
title: Stale scene-token preview after returning to the original portrait
created: 2026-11-24
updated: 2026-11-24
tags: [foundry, rendering]
status: fixed
source: Foundry 14.369 shape checks at d7e85f4 and task repair at f41382b
---

# Stale scene-token preview after returning to the original portrait

**TL;DR:** On Foundry 14.369, the GM's ordinary scene-token preview could keep showing another image after selection returned to the token's original portrait. The repair schedules a native draw for the return and passed the Node regression. A live rerun is pending.

## Symptom

During the 2026-11-24 shape checks at `d7e85f4`, the selected field and prepared preview path both showed the original image A after a rapid series of changes, while the clone still showed C. An explicit native draw restored the correct crop. The prototype Appearance thumbnail passed the rapid sequence. See [shape results](../../how-to/verify-mask-shapes.md#check-it-worked).

## Reproduction

As GM, place an ordinary token with a static masked portrait A and rings disabled. Open scene-token configuration and switch A → B → C → A rapidly, with two clearly different alternatives. After earlier image work settles, compare the visible clone with the selected path. Repeat with C already visible on return to A. The shape run retained the diagnostic trace `rapid-diagnostic2.json` and screenshots of the stale preview and the clone after a native draw outside Foundry Data.

## Root cause

Foundry's TokenConfig can compare the returning path to the original document and refresh the clone without scheduling a draw. An earlier draw can install its texture after the path has returned to A, even when A was still visible at the moment of return.

## Tried and failed

A refresh that checks the currently loaded texture can see the expected A texture while the native C draw is still in flight. It therefore cannot reliably detect this case.

## Fix and regression test

The scene-sheet listener reads Foundry's prepared preview path after the native form handler, coalesces duplicate changes and schedules the final native draw for an eligible static preview. It checks that the sheet is still open and the selection still matches before drawing. The test in `tests/mask-renderer.test.mjs` covers the pending C draw, a return after C is installed, whitespace in the raw field value, repeated input, a subsequent selection, ring exclusion and sheet closure. All 78 Node tests and independent review passed at `f41382b`.

After the repair is merged, rerun the rapid sequence as GM. Confirm the A crop, then check Cancel, Apply and the owning player's view of the placed token. See the [native preview procedure](../../how-to/verify-native-token-previews-and-transitions.md).
