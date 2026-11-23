---
title: Codex calibration log
created: 2026-11-23
updated: 2026-11-23
tags: [workflow]
status: active
---
# Codex calibration log

**TL;DR:** Record finished Codex work here.

Last verified: 2026-11-23

See [Model calibration](_overview.md) for the schema.

| Date | Task | Kind | Planner | Builder | Reviewer & verdict | Fix rounds | Findings | Cost / notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 2026-11-23 | kb-setup | infra | Codex | Planner built setup, Sol Medium applied fix | Astra Medium, Accept after fixes → Accept | 1 | Gemini skipped reviewer creation for requested Markdown reviews | CLI and native worker smoke checks passed |
| 2026-11-23 | static-token-renderer | feature | Codex | Astra Medium, 1 Difficult batch | Astra Medium, Accept | 0 | None | Native agents. 19 Node tests passed. Foundry 14.369 GM and player save, persistence and removal checks passed. |
| 2026-11-23 | portrait-mask-editor | feature | Codex | Sol High, 2 Standard batches | Astra Medium, Accept after fixes → Accept | 1 | A pending write could allow a stale editor submission. The radius slider could show a value different from the bounded circle until blur. | Native agents. 31 Node tests passed. Foundry editor checks pending. |
| 2026-11-23 | portrait-editor-footer | bug fix | Codex | Sol High | Astra Medium, Accept | 0 | None | 32 Node tests passed. Chromium verified all four actions on Foundry 14.369 at 1400×950. |
| 2026-11-23 | kb-conventions | infra | Astra Medium | Sol High for migration, integration and five fix rounds. Sol Medium for finish. | Astra Medium, Accept after fixes → Accept | 5 | Template entry counts, index filename case, inline-code link labels, stale command paths, indented headings, and literal links with empty or nested labels and balanced or backtick-quoted destinations. | CLI agents. The rebased checker at `22f208a` matches the reviewed checker at `c6461f8`. |
| 2026-11-23 | file-picker-integration | feature | Codex | Sol High, 1 Standard batch and 1 Routine fix | Astra Medium, Accept after fixes → Accept | 1 | Editors opened from detached pickers needed to use the picker’s host window. | Native agents. 40 Node tests passed. An offline Chromium fixture exercised four views with Foundry 14.369 styles. Live picker checks pending. |
