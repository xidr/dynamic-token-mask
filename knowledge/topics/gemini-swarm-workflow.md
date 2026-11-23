---
title: Gemini Swarm workflow
created: 2026-11-23
updated: 2026-11-23
tags: [workflow]
status: active
---
# Gemini Swarm workflow

**TL;DR:** Select Gemini 4 Neon (High) and keep the coordinator session open across batches.

Last verified: 2026-11-23 (repository configuration)

| Role | Model | Responsibility |
| --- | --- | --- |
| Coordinator | Gemini 4 Neon (High) | Research, plan and coordinate |
| Explorer | flash | Read-only discovery |
| Fresh builder | gemini-4-hydrogen-medium or gemini-3.8-flash-high / gemini-4-hydrogen-xhigh / gemini-4-neon-medium | Mechanical / standard / difficult batches |
| Fresh reviewer | gemini-4-neon-high | Independent review |

GEMINI.md defines the Swarm lifecycle. .agents/agents/ defines explore and reviewer. Approve the proposed plan and builder tier, choose fixes from the review report, approve the final merge and push when ready. Compare tier outcomes in [Gemini calibration log](model-calibration/gemini.md).

TODO: unverified — client model selection, board handoff and wake behavior in a live Antigravity session.
