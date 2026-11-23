# Module knowledge conventions
Approved CLI workflow, branch task/kb-conventions, base d4abbbb. Standard builder. Keep Codex and Gemini, module test commands, and main.
1. Adopt system conventions for relative Markdown links, knowledge/INDEX.md, six templates and decision records. Preserve destination, aliases, anchors, literals and history. Record the new decision, mark the previous setup decision replaced in part for the affected scope, and update its index entry.
2. Update all affected active references, authoring guidance, reviewer checks and the Codex handoff wording. Keep shared instructions mirrored. Preserve module-specific knowledge and workflows.
3. Validate links against the baseline, index and template coverage, metadata and current commands. Planner commits the tested changes; fresh read-only Astra reviewer. Return for review before merge.

4. Approved checker fixes after integration with main d10c582: require exactly one primary template entry per expected template under Templates, verify INDEX.md by its stored directory-entry spelling on case-insensitive filesystems, and validate links with inline-code labels while ignoring example links inside code. Run regression probes and a fresh CLI review.

5. Approved follow-up: detect stale path substrings inside inline commands, including relative paths, while exempting literal Markdown link examples. Use shared ATX heading parsing for Templates section boundaries, including correctly indented headings. Verify both regressions and existing controls in scratch copies, then obtain fresh CLI review before merge.

6. Approved final-review fix: recognize literal Markdown links with empty or balanced nested labels in inline code. Mask only the example and continue detecting adjacent stale command paths. Preserve existing checker behavior elsewhere. Test and send the committed diff to a fresh CLI reviewer before merge.

7. Approved follow-up: when an inner link invalidates an outer link, mask only actual link examples and keep the stale command visible. Consume balanced parentheses in literal link destinations. Preserve earlier controls and run fresh independent CLI review before merge.
