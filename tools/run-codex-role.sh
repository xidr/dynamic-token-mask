#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 2 || $# -gt 3 || -z $2 ]]; then
  echo "Usage (from task worktree): tools/run-codex-role.sh ROLE 'brief' [expected-task-branch]" >&2
  exit 2
fi
case "$1" in
  builder-routine|builder-standard|builder-difficult)
    git_dir=$(git rev-parse --absolute-git-dir)
    common_dir=$(git rev-parse --path-format=absolute --git-common-dir)
    branch=$(git symbolic-ref --quiet --short HEAD || true)
    if [[ "$git_dir" -ef "$common_dir" || $branch != task/?* || $branch != "${3:-}" ]]; then
      echo "Builder requires a linked worktree on the assigned task branch. Pass task/<slug> as the third argument." >&2
      exit 2
    fi
    sandbox=workspace-write
    ;;
  reviewer)
    if [[ $# != 2 ]]; then
      echo "Usage: tools/run-codex-role.sh reviewer 'brief'" >&2
      exit 2
    fi
    sandbox=read-only
    ;;
  *) echo "Unknown Codex role: $1" >&2; exit 2 ;;
esac

root=$(git rev-parse --show-toplevel)
python3 - "$root" "$1" "$sandbox" "$2" <<'PY'
import json
import os
from pathlib import Path
import sys
import tomllib

root, role, sandbox, brief = sys.argv[1:]
profile = Path(root, ".codex", "roles", f"{role}.config.toml")
with profile.open("rb") as stream:
    settings = tomllib.load(stream)
args = ["codex", "exec", "--cd", root, "--sandbox", sandbox]
for key in ("model", "model_reasoning_effort", "model_auto_compact_token_limit"):
    args.extend(["-c", f"{key}={json.dumps(settings[key])}"])
prompt = f"Act as {role}. Follow the delegated-role instructions in CODEX.md.\n\n{brief}"
os.execvp("codex", [*args, "--", prompt])
PY
