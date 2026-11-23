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

See [[topics/model-calibration/_overview]] for the schema.

| Date | Task | Kind | Planner | Builder | Reviewer & verdict | Fix rounds | Findings | Cost / notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 2026-11-23 | kb-setup | infra | Codex | Planner built setup, Sol Medium applied fix | Astra Medium, Accept after fixes → Accept | 1 | Gemini skipped reviewer creation for requested Markdown reviews | CLI and native worker smoke checks passed |
| 2026-11-23 | static-token-renderer | feature | Codex | Astra Medium, 1 Difficult batch | Astra Medium, Accept | 0 | None | Native agents. 19 Node tests passed. Foundry 14.369 GM and player save, persistence and removal checks passed. |
| 2026-11-23 | portrait-mask-editor | feature | Codex | Sol High, 2 Standard batches | Astra Medium, Accept after fixes → Accept | 1 | A pending write could allow a stale editor submission. The radius slider could show a value different from the bounded circle until blur. | Native agents. 31 Node tests passed. Foundry editor checks pending. |
