---
title: Codex calibration log
created: 2026-11-23
updated: 2026-11-24
tags: [workflow]
status: active
---
# Codex calibration log

**TL;DR:** Record finished Codex work here.

Last verified: 2026-11-24

See [Model calibration](_overview.md) for the schema.

| Date | Task | Kind | Planner | Builder | Reviewer & verdict | Fix rounds | Findings | Cost / notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 2026-11-23 | kb-setup | infra | Codex | Planner built setup, Sol Medium applied fix | Astra Medium, Accept after fixes → Accept | 1 | Gemini skipped reviewer creation for requested Markdown reviews | CLI and native worker smoke checks passed |
| 2026-11-23 | static-token-renderer | feature | Codex | Astra Medium, 1 Difficult batch | Astra Medium, Accept | 0 | None | Native agents. 19 Node tests passed. Foundry 14.369 GM and player save, persistence and removal checks passed. |
| 2026-11-23 | portrait-mask-editor | feature | Codex | Sol High, 2 Standard batches | Astra Medium, Accept after fixes → Accept | 1 | A pending write could allow a stale editor submission. The radius slider could show a value different from the bounded circle until blur. | Native agents. 31 Node tests passed. Foundry editor checks pending. |
| 2026-11-23 | portrait-editor-footer | bug fix | Codex | Sol High | Astra Medium, Accept | 0 | None | 32 Node tests passed. Chromium verified all four actions on Foundry 14.369 at 1400×950. |
| 2026-11-23 | kb-conventions | infra | Astra Medium | Sol High for migration, integration and five fix rounds. Sol Medium for finish. | Astra Medium, Accept after fixes → Accept | 5 | Template entry counts, index filename case, inline-code link labels, stale command paths, indented headings, and literal links with empty or nested labels and balanced or backtick-quoted destinations. | CLI agents. The rebased checker at `22f208a` matches the reviewed checker at `c6461f8`. |
| 2026-11-23 | file-picker-integration | feature | Codex | Sol High, 1 Standard batch and 1 Routine fix | Astra Medium, Accept after fixes → Accept | 1 | Editors opened from detached pickers needed to use the picker’s host window. | Native agents. 40 Node tests passed. An offline Chromium fixture exercised four views with Foundry 14.369 styles. Live picker checks pending. |
| 2026-11-23 | verify-ui-release | validation | Codex | 1 Standard live verification batch and 1 Routine documentation batch | Planner check under Markdown-only review exception | 0 | Foundry fit and nonuniform scale can stretch the square crop on the token. | Native agents. Foundry 14.369 GM and player sessions. |
| 2026-11-23 | playwright-validation | docs | Codex | Sol High, 1 implementation batch. Sol Medium, 1 Routine finish. | Astra Medium, Accept | 0 | None | CLI agents. Implementation passed the knowledge checks, instruction mirroring, reviewer TOML parsing, all four Node test files, JavaScript syntax, manifest paths, JSON, translation parity and `git diff --check`. Review reran the knowledge and diff checks and skipped Node for the Markdown-only batch. No live-world tests in this task. Prior Foundry 14.369 checks confirmed both player crops after scene navigation and rejoin. A separate reload reached the canvas, then the return to the test scene timed out. Crop verification after that reload remains pending. |
| 2026-11-24 | native-token-previews-transitions | feature | Codex | Astra Medium, 1 Difficult implementation batch and 1 Difficult fix | Astra Medium, Accept after fixes → Accept | 1 | External prototype art needed a canvas-readable CORS request. Active canvas previews needed to refresh after mask changes. | Native agents. All five test files and 26 focused tests passed. Foundry 14.369 post-merge checks confirmed drags and native fades for both roles, and configuration previews for the GM. Live mask changes refreshed held drags and both configuration previews. Native permissions blocked configuration and placement for the owner. |
| 2026-11-24 | native-dynamic-rings | feature | Codex | Astra Medium, 1 Difficult implementation batch. Sol High, 1 Standard fix. | Astra Medium, Accept after fixes → Accept | 1 | Remote subject changes reach held drag clones through refresh. The renderer must detect a stale subject or ring state without redrawing on each move. | Native agents. Five Node test files and 30 focused renderer cases passed. Foundry 14.369 baseline captured for both roles. Changed-build verification pending. |
| 2026-11-24 | add-mask-shapes | feature | Codex | Astra Medium, 1 Difficult batch. Sol High, 2 Standard batches. | Astra Medium, Accept for all 3 implementation batches | 0 | None | Native agents. All 6 Node test files passed. Foundry GM and owning-player shape checks pending. |
| 2026-11-24 | mask-borders | feature | Codex | Astra Medium, 1 Difficult batch. Sol Medium, 1 Routine fix. | Astra Medium, Accept after fixes → Accept | 1 | The range input rounded valid fractional widths such as 2.04% on reopen. | Native agents. Six Node test files passed. Foundry border checks pending an approved merge. |
