# Static token renderer

Use visible native agents on task/static-token-renderer. Base c9b2757.

1. Build the renderer for ordinary static scene tokens. Crop a saved circle to fill the token, share derived textures, handle redraw, changes, removal and teardown. Preserve source art, document and gameplay footprint. Fail back to the original texture. Use the existing storage API. Editor, rings and animated transitions are outside this milestone.
2. Add regression coverage for shared textures, pending crop removal, token destruction and reload. Run syntax checks and node --test. First batch is Difficult. Expected files: scripts/main.js, scripts/mask-renderer.mjs, tests/mask-renderer.test.mjs. Independently review the committed batch.
3. Update README and knowledge notes. After approval to merge, verify in a designated Foundry 14.369 world: GM saves an off-center circular crop for one static portrait on two ordinary tokens, player sees both, reload retains crop, removal restores both, targeting and grid footprint are preserved. Record pending checks explicitly until observed.
