---
title: Circular mask design
created: 2026-10-22
updated: 2026-10-22
tags: [module, design, rendering]
status: proposed
source: User requirements and installed Foundry VTT 14.367 client/common source inspection, 2026-10-22
---

# Circular mask design

**TL;DR:** Preserve original image files and token image paths. Proposed implementation stores image-specific circle definitions in a world setting and supplies temporary circular cropped textures to token meshes. Requirements are confirmed; storage scope, crop framing and implementation below are proposals, not implemented behavior.

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

## Proposed behavior and persistence

One mask per exact resolved image path per world, shared by tokens using that image. A GM edits it; connected clients receive the setting change and refresh matching visible tokens. Other scenes resolve the current definition when drawn. No edits to individual scene documents are needed.

Use a hidden module world setting with a versioned array of records, each containing `src`, `centerX`, `centerY`, `radius` and a revision. Centers are fractions of source width/height; radius is a fraction of the shorter source dimension. Validate finite values, positive radius and a circle within image bounds. Preserve URL case and meaningful query parameters. Resolve wildcard tokens to their actual image, never store a mask against a wildcard pattern.

Proposed framing: crop the square bounding the selected circle, make pixels outside the circle transparent, and fit that square to the token. Thus choosing a smaller circle zooms in on the selected subject; it does not shrink the displayed token. Default fit preserves aspect ratio. Existing nonuniform scale or fill on rectangular footprints can distort a circle; show this distinction in preview rather than silently rewriting token settings.

Per-image association was subsequently confirmed by the user, including separate masks for images selected by wildcard tokens. World-level storage and crop framing remain proposed. Future per-token overrides or cross-world export are separate features.

## Proposed editor

The current first-phase plan extends Foundry's existing file browser with per-image controls opening an ApplicationV2 editor; see [[file-picker-integration]]. This supersedes the earlier dedicated browser proposal. Direct token-sheet shortcuts can follow later. Show the source image with draggable circle center and radius handle, numeric controls, and a checkerboard token-result preview. Provide Save, Cancel and Remove mask. Save explicitly indicates that all tokens using this image in this world are affected. Keep edits local until saved; removal restores ordinary rendering. A future shortcut from a token should use its effective rendered image, including an explicit ring subject.

## Proposed rendering implementation

For static images, create an antialiased transparent square in a browser canvas and a module-owned PIXI texture. This is a transient derived texture, not an exported image file. Keep document paths, Foundry's cached source textures and `token.texture` intact; assign the derived texture to the token mesh, then request the necessary mesh sizing refresh. Existing transparency is preserved.

Start with a small adapter around draw/refresh/destroy hooks. Build once per source/mask revision and share through a bounded, reference-counted cache. Prewarm active-scene images where feasible. Async completion must verify token/mesh identity and current source/revision before applying; ignore stale work. Do not generate textures every frame or recursively request refresh from every refresh callback. Release only module-owned resources on eviction/teardown. A failed image load or unsupported resource falls back to ordinary rendering with a useful editor error.

Browser-generated texture alpha should pass through Foundry's existing color/depth/detection paths, but this remains a runtime hypothesis. Check canvas-backed alpha extraction specifically. External images require browser-readable resources; a CORS failure must not break token rendering.

Dynamic rings, drag/configuration previews and image-change transitions need explicit integration. Prototype hook behavior and transition completion behavior must be tested. If hooks cannot handle a path cleanly, isolate a narrow compatibility wrapper rather than replace the Token class or global image loader. No dependency or wrapper API is chosen yet. Video/animated-image masking is outside the proposed initial static-image release; preserve normal rendering for those resources.

## Validation before implementation is considered compatible

Test in an agreed test world: opaque rectangular and transparent sources; off-center and small circles; shared images and unmasked images; save/remove on GM and player clients; reload and scene changes; wildcard resolution; rotation/mirroring/scale/fit; drag and configuration previews; source changes including transitions; rings with and without explicit subjects; visibility, tint, alpha, detection and occlusion; cache cleanup and failed loads. Preserve gameplay footprint, vision and targeting behavior. Verify disabling the module restores original images after reload.

No runtime verification, module activation, server restart or implementation occurred during this design investigation.

## Related

- [[_overview]]
- [[develop-and-validate]]
