# Colored mask borders

Visible native agents on task/mask-borders from d7e85f4. Each exact image may have an optional border, off by default. Defaults are black and 2% of the square crop side. Slider range is 0.5–10%. Persist chosen color and width while disabled. Keep original image sampling, silhouette and native footprint. Draw all border pixels inside all four shapes on preview and eligible native token paths.

1. Difficult builder: implement storage, rendering and editor together. Check compatibility with circle and polygon records, version guards against older writers, normalized equality and conflicts. Add translated toggle, color picker and slider. Cover border-only save/cancel, reopening and live invalidation. Verify widths and clipped corners across shapes, capped previews and rectangular ring frames. Expected files: scripts/mask-store.mjs, mask-renderer.mjs, mask-editor.mjs, template, translations, styles if needed, related tests.
2. Run full suite, syntax, manifest, translations and diff checks. Commit and obtain independent native review.
3. Update README and knowledge records, validate and request merge approval. Keep the live shapes-only validation independent of this branch. Runtime confirmation of borders follows approved deployment.
4. Review fix: preserve fractional API widths such as 2.04% when reopening the slider. Verify range markup and editor value synchronization.
