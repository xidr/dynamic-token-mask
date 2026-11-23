# Gemini Swarm workflow

## What this is

Dynamic Token Mask is a standalone Foundry VTT 14 module. A JavaScript service stores one circular mask per image in a world setting. Read README.md for implementation status.

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
- For new soft game-rule boundaries, warn inline before confirmation and keep a visible marker on the result. Enforce technical, security, permission, idempotency and schema guards strictly.
- Confirm IDE project targeting before using symbol inspections. See `knowledge/reference/ide-tools.md`.

## Knowledge base

Start at [knowledge/INDEX.md](knowledge/INDEX.md) in the current checkout. Use its reading hints to find the relevant topic overview and notes. Search with rg, favor recent evidence, and flag contradictions. Keep lasting knowledge in this vault.
Use topics for area overviews, reference for contracts, how-to for procedures, decisions for dated choices, features for delivered behavior, bugs for open reports and bugs/fixed for resolved reports. File surprises in gotchas.md.
Use the six templates and relative Markdown links with `.md` extensions. Follow the [authoring guide](knowledge/how-to/write-notes.md) and run its [checks](knowledge/how-to/write-notes.md#check-it-worked) for knowledge-base changes. Verify topic claims against code and date the evidence. Ask before large restructures. At finish, update the README and notes as applicable, then list changed files.

## Shared with other tools

AGENTS.md routes Codex to CODEX.md and Gemini to GEMINI.md. Mirror What this is, Commands, Hard rules and Knowledge base byte-for-byte in AGENTS.md and GEMINI.md. Both workflows use What to check in .agents/agents/reviewer.md.

## Models, subagents, and Swarm roles
- Never edit files, create a worktree, or commit before the user explicitly approves the plan.
- The Coordinator (main session) never writes project code or runs build/fix loops inline; all
  implementation and review runs through the Swarm (`@builder` and `@reviewer`).
- **Coordinator (Main session — `Gemini 4 Neon (High)`):** Researches, interviews the user,
  writes the plan, and coordinates the Swarm board. Never edits code directly.
- **`explore` subagent (`.agents/agents/explore.md`):** Invoked via `invoke_subagent` with
  `TypeName: "explore"`, `Model: "flash"`. Read-only by construction (`tools: [read_file]`).
  Use for broad file/symbol searches during planning. Spot-check its findings before building on
  them; for git history (`git log`, `git blame`), run commands yourself.
- **`@builder` (Swarm worker — fresh context, no `fork`):** Spawned after plan approval without
  `fork` (0-token start, free of planning chatter) and pinned to the approved `Builder:` model.
  Copies `<appDataDir>/brain/<conversation-id>/scratch/PLAN.md` into the worktree's `PLAN.md` and
  commits it first, builds the agreed batch, runs applicable checks, and hands off according to §5.
  Sleeps in `waiting` (zero cost, batch memory intact) while its report or work is reviewed.
  On multi-batch tasks, once the batch and any review fixes are committed, the Coordinator `kill`s
  the old builder and spawns a fresh `@builder-N` (no `fork`) for the next batch.
- **`@reviewer` (Swarm worker — fresh context, `model: "gemini-4-neon-high"`):** Spawned
  without `fork` so it starts with a clean context unanchored on `@builder`'s reasoning. Follows
  `.agents/agents/reviewer.md` to review the finished batch against `PLAN.md` and the Hard rules,
  then posts its report to `@coordinator`.

## Workflow

### 1. Start (Coordinator — Plan Phase)
- Do not create a worktree or edit any file yet.
- If continuing existing work: read its worktree's `PLAN.md` and present the next batch
  of steps as the plan.
- Otherwise read `knowledge/INDEX.md` and open the relevant files from the main checkout.

### 2. Clarify and plan (Coordinator — Plan Phase)
- Research first: read the relevant code and knowledge files (using `explore` on `flash`
  for broad searches to keep raw file dumps out of the Coordinator's context; use `/compact`
  if a planning session grows long) so you never ask the user something you could have looked up.
- Interview the user when the task is a new feature, or when the goal, scope, or what
  "done" means is unclear. Ask everything in ONE batch (`ask_question` or a single list);
  give each question options and a recommended default. Ask about what to build and its
  constraints, not implementation details you can decide yourself.
- Skip the interview when the task is already unambiguous (a bug with a clear repro, a
  typo, a documentation-only change). State any assumption you make instead.
- Write the plan in the exact shape `PLAN.md` will have:
  - `## Requirements` — the user's answers, your assumptions, what is out of scope,
    and how we will know it is done.
  - `## Steps` — numbered, each ending in a testable, committable state. Because `@builder`
    starts with a fresh context (no `fork`), each step must name its files and the reason
    for any choice that is not obvious.
- Suggest the `@builder` model, with one line of reasoning, as a `Builder:` line under
  `## Requirements` (if the user picks another, record theirs):
  - `gemini-4-neon-medium` — complex, tightly coupled, or tricky builds.
  - `gemini-4-hydrogen-xhigh` — the default for standard code builds (features, bug fixes, tests).
  - `gemini-4-hydrogen-medium` (or `gemini-3.8-flash-high`) — documentation-only and
    mechanical work.
- Present the plan and propose how many steps to do now — all of them for small work,
  a first batch (e.g. 1–2 of 5) for large work. Wait for explicit approval.

### 3. After approval — Launch the Swarm (Coordinator)
Once the user approves the plan and batch:
1. Write the approved plan verbatim to `<appDataDir>/brain/<conversation-id>/scratch/PLAN.md`
   (for Batch 1, before the worktree exists).
2. Name the swarm: `swarm{action: "title", title: "<task title>"}`.
3. Spawn `@builder` with a **fresh** context (no `fork`) pinned to the chosen `Builder:` model:
   `swarm{action: "add", name: "builder", model: "<chosen-builder-model>", brief: "You own task/<slug> in .worktrees/<slug>. Follow Workflow §3–§5 in GEMINI.md: create the worktree, copy <scratch>/PLAN.md verbatim to PLAN.md in the worktree root and commit it first, then implement steps <X–Y>. After the applicable checks pass, post the absolute worktree path, base branch (main), covered steps and check results to @reviewer for changes beyond Markdown or when the user requests review. For Markdown-only work without a review request, report directly to @coordinator."}`
4. Spawn `@reviewer` for changes beyond Markdown or when the user requests review. Use a **fresh**
   context (no `fork`) pinned to `gemini-4-neon-high`. If the user requests review later, the
   Coordinator spawns the reviewer if needed and arranges the handoff in §5.
   `swarm{action: "add", name: "reviewer", model: "gemini-4-neon-high", brief: "You are the independent Reviewer. Wait in waiting until @builder or @coordinator tags you with a finished batch. Read and follow .agents/agents/reviewer.md strictly. Never edit files or switch branches. When your review is complete, post your full report to @coordinator."}`
5. End your turn by showing the user the `open_board` link from the `swarm` result on its own line.

### 4. Per step (inside `@builder`)
1. **Worktree & `PLAN.md` (before Step 1):** Create `git worktree add -b task/<slug> .worktrees/<slug> main`
   and run the worktree setup command. Documentation-only tasks (only Markdown changes) skip the
   setup command and the test runs below. On Batch 1, copy `<scratch>/PLAN.md` verbatim to `PLAN.md`
   in the worktree root and commit it before any other change; on Batch 2+, `PLAN.md` is already
   committed in the worktree.
2. **Implement** what the plan says. If a step cannot be done as written, or the work would
   leave the plan's scope, stop and post `@coordinator`; do not improvise. If requirements
   change, update `## Requirements` first, then the steps.
3. **Test:** New feature → add tests. Bug fix → first write a failing test that reproduces it,
   then fix. Run targeted tests for everything the step touched, and the full suite before
   committing anything beyond Markdown. Do not move on with failing tests; if unfixable, stop,
   document why in the bug file, and post `@coordinator`.
4. **Light notes update:** tick the step in `PLAN.md`; record any gotcha while it's fresh.
5. **Commit** (code, tests, and `PLAN.md` together).

### 5. After the agreed batch
1. `@builder` runs applicable checks, including the full suite for changes beyond Markdown, and
   fixes any failures.
2. **Handoff:** `@builder` posts the worktree's absolute path, the base branch (`main`), the covered
   plan steps and check results to `@reviewer` for changes beyond Markdown or when the user requests
   review, then enters `waiting`. For Markdown-only work without a review request, `@builder` posts
   the same details directly to `@coordinator`, and the Coordinator proceeds to step 6. If the user
   requests review after that report, the Coordinator sends the handoff details to `@reviewer` and
   follows the review steps below.
3. **Independent Review:** `@reviewer` inspects the diff and applicable checks per `.agents/agents/reviewer.md`
   and posts `@coordinator` with its full report (**Accept**, **Accept after fixes**, or **Rework**).
4. **User Decision:** Coordinator gives the user `@reviewer`'s report **word for word** (findings and
   proposed fixes included), adds its own view where it disagrees, and waits for the user's choice.
5. **Applying Fixes:** Coordinator wakes `@builder` referencing `@reviewer`'s `#seq` post (no copy-paste)
   with the chosen fixes; `@builder` applies them as steps (§4), re-runs applicable checks, and reports back.
6. **Work not logically done** → Coordinator proposes the next batch; upon approval, `kill`s the old
   `@builder` and spawns a fresh `@builder-N` (no `fork`). Apply the review rule from §3 and spawn
   `@reviewer` if required and absent. **Work logically done** → proceed to §6 Finish.

### 6. Finish (`@builder` → Coordinator)
1. `@builder` performs the **full notes update**:
   Update verified topics and the README, record features and decisions, file bugs and gotchas, move fixed bugs to bugs/fixed, document reusable procedures, and update the vault index or overview. Append one finished-task row to knowledge/topics/model-calibration/gemini.md.

2. `@builder` deletes `PLAN.md` (first moving valuable reasoning into a decision record and
   lasting requirements into the feature record) and commits.
3. `@builder` rebases onto `main` (keeping both sides' entries in `knowledge/` in alphabetical
   order), re-runs the full suite (a documentation-only branch skips it), and posts `@coordinator` that
   the branch is ready.
4. **Propose the merge:** Coordinator presents a short summary to the user (mentioning any new
   gotcha or bug other worktrees should know about) and waits for explicit merge approval.
5. **After approval:** Merge with `knowledge/how-to/merge-a-task-branch.md` (defer cleanup until the
   checkout is unused). The Coordinator calls `swarm{action: "kill"}` on `builder` and on `reviewer`
   if a reviewer was spawned.
