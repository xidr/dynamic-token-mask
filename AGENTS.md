# Shared agent instructions

This is the standalone Dynamic Token Mask module. `AGENTS.md` is the shared entry point for Codex and Claude Code; `CLAUDE.md` imports it. Keep lasting project knowledge in `knowledge/`, an Obsidian-compatible Markdown vault.

## Start here

1. Read `knowledge/index.md`, then only the overview or notes relevant to the task. Read `README.md` for the current implementation status.
2. Search with `rg` before deciding something is undocumented. Prefer newer `updated` dates; ignore `status: outdated` except as history. Report contradictions.
3. Notes describe dated observations. Verify paths, branches, APIs and settings before relying on them. In a worktree use its own instructions and knowledge base.

## Project boundaries

- Module ID: `dynamic-token-mask`. Standalone and system-independent; target Foundry VTT 14. Runtime compatibility and rendering design remain unverified.
- This checkout is the live module directory. Foundry may publicly serve its files, including knowledge notes. Never store secrets, personal IDs, private material or rule-book text here. Rule books belong outside `Data/`.
- Preserve user changes. Keep English and Russian localization keys in sync. Scope module UI CSS under `.dynamic-token-mask`.
- Validate relevant JSON, manifest paths and JavaScript syntax after changes. Test rendering behavior in a designated test world when implementation begins; syntax checks do not prove runtime compatibility.
- Ask before restarting Foundry, enabling the module in a campaign world, or pushing to a remote, unless the user already authorized that action. Do not alter unrelated systems, modules or worlds.
- Consider IDE tools for symbols, callers and inspections; use focused `rg` for literal text. Confirm the IDE targets this module project before using its results. See `knowledge/reference/ide-tools.md`.

## Maintaining knowledge

- One idea per file, lowercase-kebab-case names. Use `knowledge/templates/note.md` or `decision.md`, fill in frontmatter, and start notes with a short TL;DR.
- Record conclusions and evidence, not transcripts. Distinguish implemented facts, proposals and open questions.
- Update existing notes rather than duplicating them; change `updated`. Never delete knowledge: mark it outdated and link its replacement.
- Use `[[note-name]]` links. Register every new note in the index or a topic overview. Put unsorted notes in `knowledge/inbox/`.
- Ask before large restructures. Keep knowledge in version control alongside the module; agent-specific memory is not the shared source of truth.
- At session end, record useful discoveries or decisions and tell the user which files changed. Keep `README.md` aligned with implemented behavior.
