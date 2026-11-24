# Shared agent instructions

Codex reads CODEX.md. Antigravity reads GEMINI.md. Delegated roles follow their assignment.

## What this is

Dynamic Token Mask is a standalone Foundry VTT 14 module. A JavaScript service stores one mask per exact image path in a world setting. Read README.md for implementation status.

## Commands

- Worktree setup and build: none. Foundry loads browser JavaScript directly. Tests use Node's built-in runner.
- Run: Foundry reads the live module checkout. After an approved merge, reload an authorized test world to exercise changes.
- Test (full): `node --test`. Test (targeted): `node --test tests/mask-store.test.mjs`.
- Lint: none configured. Run `node --check` on each changed JavaScript file.
- Manifest paths, JSON and translation keys: run the checks in `knowledge/how-to/develop-and-validate.md` after manifest or UI changes.

## Hard rules

- Use English for chat unless asked otherwise. Write project notes, comments and commits in English.
- After plan approval, work in a linked task worktree on `task/<slug>`. Reuse the assigned Codex checkout wherever it resides. Preserve unrelated changes. The user approves merges and handles pushes.
- Run the full suite before committing changes beyond Markdown. Start bug fixes with a failing test or document why the runner cannot reproduce the issue. Preserve existing test coverage.
- Foundry can serve the entire module directory. Keep secrets, private material, personal identifiers and rule-book content outside it. Keep rule books outside Data/.
- Keep the module system-independent, English and Russian translation keys aligned, and module UI CSS scoped under `.dynamic-token-mask`.
- Verify rendering in a designated test world before claiming compatibility. Obtain permission before restarting Foundry or enabling the module in a campaign. Leave unrelated systems, modules and worlds alone.
- For authorized browser validation, follow [Use Playwright MCP for Foundry checks](knowledge/how-to/use-playwright-mcp-for-foundry.md). Use isolated GM and player sessions when comparing roles, collect HTML snapshots and rendered canvas screenshots as applicable, and record observed results and pending steps by role. Keep browser profiles and artifacts outside Foundry `Data/`.
- For new soft game-rule boundaries, warn inline before confirmation and keep a visible marker on the result. Enforce technical, security, permission, idempotency and schema guards strictly.
- Confirm IDE project targeting before using symbol inspections. See `knowledge/reference/ide-tools.md`.

## Knowledge base

Start at [knowledge/INDEX.md](knowledge/INDEX.md) in the current checkout. Use its reading hints to find the relevant topic overview and notes. Search with rg, favor recent evidence, and flag contradictions. Keep lasting knowledge in this vault.
Use topics for area overviews, reference for contracts, how-to for procedures, decisions for dated choices, features for delivered behavior, bugs for open reports and bugs/fixed for resolved reports. File surprises in gotchas.md.
Use the six templates and relative Markdown links with `.md` extensions. Follow the [authoring guide](knowledge/how-to/write-notes.md) and run its [checks](knowledge/how-to/write-notes.md#check-it-worked) for knowledge-base changes. Verify topic claims against code and date the evidence. Ask before large restructures. At finish, update the README and notes as applicable, then list changed files.

## Shared with other tools

AGENTS.md routes Codex to CODEX.md and Gemini to GEMINI.md. Mirror What this is, Commands, Hard rules and Knowledge base byte-for-byte in AGENTS.md and GEMINI.md. Both workflows use What to check in .agents/agents/reviewer.md.
