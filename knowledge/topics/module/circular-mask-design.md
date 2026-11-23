---
title: Circular mask design
created: 2026-10-22
updated: 2026-11-23
tags: [module, design, rendering]
status: active
source: User requirements and installed Foundry VTT 14.367 client/common source inspection, 2026-10-22
---

# Circular mask design

Last verified: 2026-11-23 (picker adapter and editor entry point). Storage, renderer and settings editor verification in Foundry 14.369 dates to 2026-11-23. Foundry source observations below date to 2026-10-22.

**TL;DR:** Preserve original image files and token image paths. This note records the original design and Foundry 14.367 source observations. See [mask storage](../../reference/mask-storage.md), [Static token renderer](../../features/static-token-renderer.md) and [Portrait mask editor](../../features/portrait-mask-editor.md) for the implemented behavior, and [File picker mask controls](../../features/file-picker-mask-controls.md) for the per-image controls.

## Confirmed requirements

- Existing images, including opaque rectangular images, remain the source.
- An editor allows adjustment of a circular mask's center and size.
- If a mask exists, apply it when rendering that image on a scene token.

## Verified source observations

Installed `/opt/foundry/foundryvtt/package.json` reports version 14.367.
Paths below are relative to that application root. No server code or world data was changed.

- `common/documents/token.mjs`, `BaseToken.defineSchema`: token texture data includes source, anchors, fit and alpha threshold; documents also have module flags.
- `client/canvas/placeables/token.mjs`, `_draw`: loads the original texture, assigns `token.texture`, calls `canvas.primary.addToken`, then configures a dynamic ring.
- `client/canvas/groups/primary.mjs`, `addToken`: assigns `token.texture` to a `PrimarySpriteMesh`.
- `client/canvas/placeables/placeable-object.mjs`: `drawToken` runs after awaited `_draw`, before a scheduled full refresh; `refreshToken` follows incremental refresh; `destroyToken` is available for cleanup. Hook callbacks are not an awaited texture preparation pipeline.
- `client/canvas/placeables/token.mjs`, `_refreshMeshSizeAndScale` and `_refreshMesh`: Foundry fits the mesh texture to token dimensions and applies scale, anchor, tint and alpha. `_refreshShape` separately sets the gameplay hit area.
- `client/canvas/primary/primary-sprite-mesh.mjs`: alpha data participates in containment; texture updates invalidate alpha data. A visual shader-only mask would need separate consideration of these paths.
- `client/canvas/placeables/tokens/ring.mjs`, `configure` and `#configureTexture`: an explicit ring subject can replace the mesh texture. Masking only `texture.src` is insufficient for this case.
- `client/canvas/placeables/token.mjs`, `#handleTransitionChanges`: image transitions create temporary target meshes and load textures independently. A draw hook alone does not cover this path.
- `client/applications/sheets/token/`: v14 has distinct scene-token and prototype-token configuration applications, with preview documents.
- `client/helpers/client-settings.mjs`: world settings provide persistence and change callbacks. Image files themselves are not token documents with flags.

## Original storage and framing proposal

One mask per exact resolved image path per world, shared by tokens using that image. A GM edits it; connected clients receive the setting change and refresh matching visible tokens. Other scenes resolve the current definition when drawn. No edits to individual scene documents are needed.

Use a hidden module world setting with a versioned array of records, each containing `src`, `centerX`, `centerY`, `radius` and a revision. Centers are fractions of source width/height; radius is a fraction of the shorter source dimension. Validate finite values, positive radius and a circle within image bounds. Preserve URL case and meaningful query parameters. Resolve wildcard tokens to their actual image, never store a mask against a wildcard pattern.

Proposed framing: crop the square bounding the selected circle, make pixels outside the circle transparent, and fit that square to the token. Thus choosing a smaller circle zooms in on the selected subject; it does not shrink the displayed token. Default fit preserves aspect ratio. Existing nonuniform scale or fill on rectangular footprints can distort a circle; show this distinction in preview rather than silently rewriting token settings.

Per-image association was subsequently confirmed by the user, including separate masks for images selected by wildcard tokens. World-level storage has since shipped as described in [mask storage](../../reference/mask-storage.md). The static renderer implements this crop framing. Future per-token overrides or cross-world export are separate features.

## Portrait mask editor

The ApplicationV2 editor opens from GM settings or the module's `openEditor(src)` API. It loads the exact path entered or selected with Foundry's image picker. The source image has a draggable circle center and radius handle. Numeric controls and a radius slider update the same constrained circle. The checkerboard preview displays the square crop with the renderer's circular clip and the source's existing transparency.

Edits remain local until Save or Remove. An inline notice explains the effect on eligible tokens throughout the world. Each write compares the loaded mask with the current mask within the store's write queue. See [Portrait mask editor](../../features/portrait-mask-editor.md) and [mask storage](../../reference/mask-storage.md).

The built-in file picker also opens the editor on the exact path of an eligible row. The adapter handles entry controls, while the editor validates image content. See [File picker integration](../../reference/file-picker-integration.md). Future token shortcuts should use the effective rendered image, including an explicit ring subject.

## Original rendering proposal

For static images, create an antialiased transparent square in a browser canvas and a module-owned PIXI texture. This is a transient derived texture, not an exported image file. Keep document paths, Foundry's cached source textures and `token.texture` intact; assign the derived texture to the token mesh, then request the necessary mesh sizing refresh. Existing transparency is preserved.

Start with a small adapter around draw/refresh/destroy hooks. Build once per source/mask revision and share through a bounded, reference-counted cache. Prewarm active-scene images where feasible. Async completion must verify token/mesh identity and current source/revision before applying; ignore stale work. Do not generate textures every frame or recursively request refresh from every refresh callback. Release only module-owned resources on eviction/teardown. A failed image load or unsupported resource falls back to ordinary rendering with a useful editor error.

Browser-generated texture alpha should pass through Foundry's existing color/depth/detection paths, but this remains a runtime hypothesis. Check canvas-backed alpha extraction specifically. External images require browser-readable resources; a CORS failure must not break token rendering.

Dynamic rings, drag/configuration previews and image-change transitions need explicit integration. Prototype hook behavior and transition completion behavior must be tested. If hooks cannot handle a path cleanly, isolate a narrow compatibility wrapper rather than replace the Token class or global image loader. No dependency or wrapper API is chosen yet. Video/animated-image masking is outside the proposed initial static-image release; preserve normal rendering for those resources.

## Broader runtime validation

Foundry 14.369 testing covered shared crops, unmasked tokens, GM and player updates after save and removal, and persistence across browser reloads. The editor preview matched sampled token pixels for wide off-center and transparent PNGs, and the editor reported missing and unsupported images. See [Verify static token masks in Foundry](../../how-to/verify-static-token-masks.md) and [Portrait mask editor](../../features/portrait-mask-editor.md).

Broader test-world validation still needs to cover scene changes, wildcard resolution, rotation, mirroring, scale and fit, drag and configuration previews, source changes and transitions, rings with and without explicit subjects, visibility, tint, alpha, detection and occlusion, cache cleanup and renderer fallback after failed loads. Continue checking gameplay footprint, vision and targeting in those cases. Verify that disabling the module restores original images after reload.

## Related

- [Module overview](_overview.md)
- [Develop and validate](../../how-to/develop-and-validate.md)
- [Static token renderer](../../features/static-token-renderer.md)
