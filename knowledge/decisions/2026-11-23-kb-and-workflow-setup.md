---
title: Knowledge base and workflow setup
date: 2026-11-23
status: accepted
tags: [workflow]
---
# Knowledge base and workflow setup

**TL;DR:** Use Codex and Gemini with feature records, soft-rule warnings and separate calibration logs.

## Context

The module has an established Obsidian vault. The user selected Codex and Gemini Swarm for the v13 upgrade.

## Decision

Use Codex and Gemini with feature records, soft-rule warnings and separate calibration logs.

Codex uses Astra Medium for planning and review, Sol Medium or High for routine or standard building, and Astra Medium for difficult builds. The planner and native workers compact at 80k tokens. CLI workers use 128k for Sol and 64k for Astra. Install both modes and choose once per new feature. Project configuration lives under .codex/.

Gemini uses the Neon High coordinator and reviewer, Flash explorer, Hydrogen Medium or Flash High mechanical builder, Hydrogen XHigh standard builder and Neon Medium difficult builder. GEMINI.md and .agents/agents/ hold the instructions.

## Alternatives

The user dropped Claude and selected no Cursor workflow. The guide’s older single-chat model switching would carry planning context into implementation.

## Consequences

Mirror the four shared sections in AGENTS.md and GEMINI.md. CODEX.md references the Gemini reviewer checklist. The user approves the plan, chooses fixes, approves the merge and handles the push. Keep wikilinks and existing note history.
