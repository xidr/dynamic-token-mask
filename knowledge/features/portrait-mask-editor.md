---
title: Portrait mask editor
created: 2026-11-23
updated: 2026-11-23
tags: [feature, editor, rendering]
status: active
source: scripts/mask-editor.mjs, scripts/mask-geometry.mjs and tests/mask-editor.test.mjs
---

# Portrait mask editor

**TL;DR:** A ready GM can frame and preview a circular crop for an exact image path, then save or remove the shared world mask.

## Request

Add a Foundry ApplicationV2 editor to open a static portrait, initialize from its saved circle, move and resize within the source image, and preview the crop used by ordinary static scene tokens. Preserve the saved mask on Cancel or on failure and provide English and Russian controls.

## Decided

Use a GM-only settings menu and a ready-world API that can open the same editor for a supplied path. Share the renderer's crop drawing with the editor. Compare the loaded mask with the current record inside each queued write. See [Share crop drawing and check editor snapshots in the write queue](../decisions/2026-11-23-portrait-editor-preview-and-writes.md).

## Behavior

- Open **Portrait Mask Editor** from Configure Settings. Enter the exact image path or choose it with the image picker, then select **Load Image**. To open directly after Foundry is ready, call `await game.modules.get("dynamic-token-mask").api.openEditor(src)` as a GM. It loads the supplied path after building the editor.
- Use a static PNG, JPEG or WebP accessible by an HTTP(S) URL or relative path. The editor checks the file container before attempting to decode it. It rejects wildcard paths and reports unsupported or unreadable sources. The exact path identifies the persisted mask, including case and encoding.
- Drag the center to move the circle and the right handle to resize it. The numeric fields express the center as percentages of width and height, and the radius field and slider as a percentage of the shorter side. The circle stays inside the source. **Reset Circle** restores the centered default. A replacement image with different dimensions prompts a review before saving the refitted circle.
- The square preview displays both the source's transparency and the transparent area outside the circle on a checkerboard. Foundry applies the token's own texture settings when fitting that square.
- The editor shows an inline notice that **Save Mask** and **Remove Mask** affect eligible tokens using the exact path throughout the world. **Cancel** discards the draft. A stale snapshot or failed write shows feedback and preserves the saved state. After a conflict, reload the image in the editor to obtain the current mask.

## Out of scope

Per-image edit controls and indicators inside the native file picker, animation, dynamic rings and token-specific fit previews. Simultaneous edits from separate GM browsers still follow the world setting's concurrency limits. See [File picker integration](../reference/file-picker-integration.md) and [Mask storage](../reference/mask-storage.md).

## Implementation

`scripts/main.js` registers the GM menu and API. `scripts/mask-editor.mjs`, `scripts/mask-geometry.mjs` and `templates/mask-editor.hbs` implement the editor. `scripts/mask-renderer.mjs` provides crop drawing and `scripts/mask-store.mjs` checks expected snapshots. `styles/module.css`, `lang/en.json` and `lang/ru.json` provide presentation and labels.

On 2026-11-23, the full Node suite passed. It covers path preservation, crop geometry and clipping, static format detection, bounded radius feedback, Cancel, persistence failures and competing editor writes.

On Foundry 14.369, the GM opened the settings menu and loaded two 400×200 PNGs. The player had no editor menu. Center and radius dragging, numeric framing, the bounded slider, Save, Cancel and reopening worked. Both clients showed the same 120×120 crop as the editor at the sampled center, corner and interior transparency coordinates. The two wide-portrait tokens changed together and the token on the other path kept its original texture. Each footprint stayed 1×1. Both crops survived reloads on both clients. Removing the masks restored all three original textures. Choosing a file in Foundry’s picker updated the editor path and loaded the selected image. Missing and unsupported files showed the expected errors. A stale editor reported a conflict on Remove, and reloading it recovered the newer saved radius. A follow-up GM browser check at 1400×950 confirmed all four footer actions worked from the default position after loading a 400×200 PNG. See [editor-actions-below-viewport](../bugs/fixed/editor-actions-below-viewport.md) and [verify-portrait-mask-editor](../how-to/verify-portrait-mask-editor.md).
