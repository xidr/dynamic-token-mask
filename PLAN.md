# Milestone 5 batch 2 — native dynamic rings

Use visible native agents, a difficult builder and an independent reviewer. Base is main at a13ffbf, branch is task/native-dynamic-rings, in the linked checkout assigned to this chat.

1. Capture the existing native ring baseline on 14.369 in the designated world with isolated GM and owning-player sessions. Compare native framing, geometry, scale, effects and the installed subject to the prepared and stored paths. Use temporary fixtures and keep evidence outside Data.
2. Start with failing renderer tests. With masked A/B and unmasked C, cover implicit A and C, explicit B and C on portrait A, and explicit B on portrait C. For inferred mapped subjects use original portrait pixels and mask when masked and native inferred art otherwise.
3. Update scripts/mask-renderer.mjs and tests/mask-renderer.test.mjs, and scripts/main.js only as needed. Preserve the native ring shader, decoration, footprint, fit, scaling, document paths and ownership of textures. Verify image identity and dimensions and restore the exact native texture. Unsupported art keeps native behavior.
4. Handle live mask edits, changing just the subject, ring toggles, stale pending work, shared crops and teardown. Cover held and scene previews, prototype behavior, and settled native transitions with intact ring composition.
5. Run node --test, syntax checks for changed JavaScript and knowledge checks. Document baseline, implementation and pending live verification in README, ROADMAP and relevant knowledge notes. Commit, independently review and fix findings. Request approval to merge.
6. After merge, compare canvas screenshots on GM and owning-player clients for the matrix, live edits, drag and subject switches. Check ring art and geometry against the baseline, record observations per role, and clean up fixtures. Verify changed-build behavior before claiming compatibility.

Review follow-up: handle native refresh-only subject changes and ring toggles on a held drag clone. Test the remote update during a drag and verify ordinary movement does not repeatedly request redraw.
