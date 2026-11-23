# Index

Use the **Read when** hints to find the notes you need. The [authoring guide](how-to/write-notes.md) covers links, templates and validation.

## Topics

- [Gemini Swarm](topics/gemini-swarm-workflow.md) — models, roles and user approvals. Read when: planning or reviewing in Antigravity.
- [Model calibration](topics/model-calibration/_overview.md) — finished tasks by tool. Read when: recording a finished task or comparing builder tiers.
- [Module](topics/module/_overview.md) — scope, implementation and open design questions. Read when: changing module behavior.

## Reference

- [Environment](reference/environment.md) — checkout paths, live-directory constraints and languages. Read when: locating or configuring the module.
- [File picker integration](reference/file-picker-integration.md) — v14 hooks, image paths and mask controls. Read when: implementing the picker or editor.
- [IDE tools](reference/ide-tools.md) — project targeting and connection checks. Read when: inspecting symbols through the IDE.
- [Mask storage](reference/mask-storage.md) — implemented schema, API, validation and concurrency limits. Read when: calling or changing the mask store.
- [Working agreements](reference/working-agreements.md) — project approvals and handling soft rule boundaries. Read when: designing an interactive flow or handing off work.

## How-to

- [Develop and validate](how-to/develop-and-validate.md) — local checks and runtime validation. Read when: testing a module change.
- [Merge a task branch](how-to/merge-a-task-branch.md) — approval, checks and cleanup. Read when: preparing or carrying out an approved merge.
- [Verify static token masks in Foundry](how-to/verify-static-token-masks.md) — GM and player runtime checks. Read when: verifying the renderer in a designated world.
- [Write project notes](how-to/write-notes.md) — templates and index coverage. Read when: writing, moving or reviewing notes.

## Features

- [Per-image mask storage](features/per-image-mask-storage.md) — shipped behavior and limits. Read when: changing how masks are stored or updated.
- [Static token renderer](features/static-token-renderer.md) — shared crops for ordinary static scene tokens. Read when: changing or verifying token rendering.

## Open bugs

No open bug records.

## Gotchas

- [Gotchas](gotchas.md) — resolved paths and concurrent writers. Read when: looking up known traps.

## Decisions

- [Common conventions for module knowledge](decisions/2026-11-23-v13-knowledge-conventions.md) — relative links, six templates and decision metadata. Read when: writing, moving or reviewing notes.
- [Knowledge base and workflow setup](decisions/2026-11-23-kb-and-workflow-setup.md) (replaced in part by [Common conventions for module knowledge](decisions/2026-11-23-v13-knowledge-conventions.md)) — the successor adopts relative Markdown links, `INDEX.md`, six templates and standardized decision records. Read when: tracing Codex and Gemini roles, approvals or calibration.
- [Standalone module](decisions/2026-10-22-standalone-module.md) — independent module and repository. Read when: tracing the module's relationship to Foundry systems.
- [Use derived mesh textures for static token crops](decisions/2026-11-23-static-token-mesh-crops.md) — crop framing and resource ownership. Read when: changing how the renderer builds or releases a crop.
- [Warnings for soft game rules](decisions/2026-11-23-warn-not-block.md) — inline warnings and persistent markers. Read when: adding a soft game-rule boundary.

## Templates

- [Bug-Report template](templates/bug.md)
- [Decision template](templates/decision.md)
- [Feature template](templates/feature.md)
- [How-To template](templates/how-to.md)
- [Reference template](templates/reference.md)
- [Topic template](templates/topic.md)

Open `knowledge/` as an Obsidian vault.
