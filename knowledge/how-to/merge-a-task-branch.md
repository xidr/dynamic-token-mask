---
title: Merge a task branch
created: 2026-11-23
updated: 2026-11-23
tags: [workflow]
status: active
---
# Merge a task branch

**TL;DR:** The user approves a tested fast-forward into the live main checkout.

1. Record the absolute task and main paths from `git worktree list --porcelain`. Verify each with `git -C "$task" status -sb` and `git -C "$live" status -sb`. Verify the task branch and main respectively. Preserve user changes. Stop on overlap, unexpected staged changes or a dirty task checkout.
2. In the task checkout rebase the finished branch with `git -C "$task" rebase main`. Preserve both sides of knowledge index additions. Check links on Markdown-only work. For any other change run the full suite and applicable checks in [[develop-and-validate]]. Report the tested revision and ask for merge approval.
3. After explicit approval verify main is still an ancestor of the tested revision and the task branch still points to it. Run `git -C "$live" merge --ff-only "$tested_revision"` on main. If main moved incompatibly, return to step 2.
4. Check both revisions, status, and the same applicable checks in the live directory. Foundry loads files here. A designated world and any service restart require separate authorization. The user handles pushing.
5. Confirm all chats and agents have left the task path before cleanup. Hand off an app-managed chat to Local, verify its new working directory, then archive the managed worktree. For a repository-created worktree run `git -C "$live" worktree remove "$task"`. Delete only a verified merged task branch with `git -C "$live" branch -d "$branch"`.

TODO: unverified — live post-merge checks and app-managed handoff/cleanup on this module.
