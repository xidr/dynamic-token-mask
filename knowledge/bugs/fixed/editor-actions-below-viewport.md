---
title: Editor actions fall below the viewport after loading a portrait
created: 2026-11-23
updated: 2026-11-23
tags: [bug, editor]
status: fixed
source: Two Chromium runs on Foundry 14.369
---

# Editor actions fall below the viewport after loading a portrait

At a 1400×950 viewport, the first pixel of the Reset button was at y=950 after a GM loaded a 400×200 PNG. Playwright found the enabled button but could not bring it into view to click it.

## Reproduction

Open the empty editor from Configure Settings at its default position. Load a 400×200 PNG, adjust the circle and try to click Reset in the footer. Inspect the footer bounds against the browser viewport. Move the editor upward to reach its actions.

## Regression check

Foundry positioned the empty editor before the image workspace expanded. The editor now calls ApplicationV2.setPosition() when the updated window extends below the viewport.

The original footer spanned y=950.25–978.25. With the task branch script loaded in the same Foundry 14.369 GM browser workflow, all four buttons spanned y=905–933. Without dragging the window, Reset restored radius 50%, Save created the test mask, Remove deleted it and Cancel closed the editor. See [[verify-portrait-mask-editor]].
