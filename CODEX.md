# Codex workflow

## Planner

Start each feature in a fresh chat opened in the trusted project. The planner defaults live in
`.codex/config.toml`. Read the shared commands, hard rules and knowledge guidance in `AGENTS.md`.
At the start of a new feature chat, before creating a worktree or delegating, ask once and wait:

> Which workflow should I use for this feature?
> 1. CLI agents — 80k planner, separate agent sessions compact at 64k for Astra and 128k for Sol.
> 2. Visible native agents — child threads in this chat, shared 80k auto-compaction.

An explicit choice in the opening request answers the question. Keep the choice for all batches, fixes
and review rounds of this feature. On resume, recover it from the approved plan or chat history.
Only the feature planner asks this question.

Inspect the affected code and propose requirements, a testable plan, the first batch and its builder tier.

- Routine: a local precedent and direct verification cover the change.
- Standard: implementation crosses components or needs investigation within known contracts.
- Difficult: correctness depends on a design decision, migration, concurrency or compatibility.

After approval, inspect the chat's attached checkout and `git worktree list`. Reuse the linked
worktree assigned to this feature, including an app-managed worktree outside `.worktrees/`. On a
fresh detached task checkout based on the approved revision, create the assigned `task/<slug>`
branch in place. If a worktree belongs to another task, leave it alone. If this feature has no
worktree yet, create one from `main`. Keep its original path throughout the chat.
Commit `PLAN.md` in the task worktree with the chosen workflow, branch, requirements, numbered
steps, affected files and acceptance checks. This module needs no dependency installation.

### Option 1. CLI agents

From the assigned worktree, launch a fresh session per assignment:

```sh
tools/run-codex-role.sh builder-standard 'Implement steps 1 and 2 in PLAN.md.' task/example-feature
tools/run-codex-role.sh reviewer 'Review steps 1 and 2 against main. Test results: …'
```

Pass the branch name assigned during planning as the builder's third argument (shown above as
`task/example-feature`). The launcher requires Codex CLI and Python 3.11+. Settings live in `.codex/roles/`.

### Option 2. Visible native agents

Use the chat's native subagent tool. Start a fresh child for each build, review or fix.
Choose `builder-routine`, `builder-standard`, `builder-difficult` or `reviewer` from
`.codex/agents/`. Select the role by name when the tool exposes an agent type. On clients
with only model and effort selectors, read the role file, select its model and effort, and
include its developer instructions in the brief. Use a fresh context and wait for the child's
report in this chat. Native agents inherit the planner's 80,000-token compaction threshold.

Give every child the absolute task worktree, exact branch and assignment. Verify that the root
and branch the child reports match the plan. A mismatch stops the assignment before edits.
The native reviewer's role instructions require read-only inspection; its shell permissions
depend on the parent session.

### Handoff for both options

After each build or fix, inspect the reported paths, diff and test results in the assigned worktree.
Stage only the approved changes, check the staged diff and commit the tested batch before review.
The planner owns Git writes. Give the reviewer the absolute worktree path, task branch, actual base
revision, covered steps and check results. Present the reviewer's findings to the user,
record accepted fixes in the plan and launch a fresh builder followed by a fresh reviewer. Apply the
Markdown-only review exception unless the user requests independent review. Request merge approval
after the finish report.

## Delegated roles

Builders read the plan, implement only the assigned batch in the task worktree, run the applicable
checks from `AGENTS.md` and leave the tested edits unstaged. Report changed paths and test results. Report a
blocked step or invalid plan assumption to the planner. Leave changes to the plan to the planner.

Reviewers work read-only. Independently inspect the requirements, diff and tests. Apply the repository
checklist under “What to check” in `.agents/agents/reviewer.md`. For knowledge-base changes, run the
[write-notes checks](knowledge/how-to/write-notes.md#check-it-worked). Report actionable findings with
file locations and the behavior that fails, or give a clean verdict and identify any unverified checks.

For a finish assignment, follow the repository checklist below.

### Finish checklist

The finish builder, on the worktree:

1. **Builder — full notes update** ([write-notes](knowledge/how-to/write-notes.md)):
   - Behavior changed → update the relevant topic file + its "Last verified" date.
   - Built a feature → add or update its feature record.
   - Chose between alternatives → add a decision record.
   - Hit a surprise / lost >15 min → add a gotcha.
   - Worked out a procedure someone will repeat → add a how-to.
   - Found a bug → create its file in `knowledge/bugs/` and add it to the index.
   - Fixed a bug → set status `fixed`, move the file to `knowledge/bugs/fixed/`, remove
     its index entry, and add the lesson to `gotchas.md` if it generalizes.
   - Added/renamed/removed a knowledge file → update `knowledge/INDEX.md` or its area's `_overview.md`
     (one-line entries, alphabetical).
   - Noticed outdated info → fix it, or mark the note outdated.
   - Calibration log → append one row to `knowledge/topics/model-calibration/codex.md` per
     [model-calibration](knowledge/topics/model-calibration/_overview.md).
2. **Builder** — Delete `PLAN.md` (first move valuable reasoning into a decision record, and
   lasting requirements into the feature record). Hand the changed paths to the planner.
3. **Planner** — Verify and commit the finish changes, then rebase onto `main`. For conflicts in `knowledge/`, keep both sides' entries and restore
   the ordering. Run the full suite again when the branch changes more than Markdown.
   A documentation-only branch skips the suite.
4. **Planner** — Propose the merge to the user with a short summary. Mention any new gotcha
   or bug that other in-progress worktrees should know about.
5. Stop. Wait for the user to approve the merge.
   After approval, use `knowledge/how-to/merge-a-task-branch.md` for the fast-forward and live
   checks. Use the verified task and live checkout paths for every runbook command.
   Defer worktree and branch cleanup while a chat still uses the task directory. Hand the
   chat off to Local and verify its new working directory before archiving an app-managed
   worktree or removing a repository-created one.
