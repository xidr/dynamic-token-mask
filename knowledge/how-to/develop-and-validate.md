---
title: Develop and validate
created: 2026-10-22
updated: 2026-11-23
tags: [development, validation]
status: active
source: Project setup conversation and existing server knowledge, 2026-10-22
---

# Develop and validate

**TL;DR:** The scaffold loads directly as browser JavaScript without a build step. Validate changed files locally, then verify implemented behavior in a designated Foundry test world.

## Details

From the module root:

```bash
git status --short
node --check scripts/main.js
python3 -m json.tool module.json > /dev/null
python3 -m json.tool lang/en.json > /dev/null
python3 -m json.tool lang/ru.json > /dev/null
```

Check that every script, stylesheet and language path in `module.json` exists and that translation keys match. Add focused tests for new behavior; do not infer runtime compatibility from syntax checks.

Run `node --test` for the full suite or `node --test tests/mask-store.test.mjs` for storage. Run `node --check` on each changed JavaScript module. No build or lint tool is configured.

```python
# Run with python3 from the module root.
import json
from pathlib import Path
def read(path):
    return json.loads(Path(path).read_text())
def keys(obj, prefix=()):
    return {path for k, v in obj.items() for path in
            (keys(v, prefix + (k,)) if isinstance(v, dict) else [prefix + (k,)])}
manifest = read("module.json")
for path in manifest["esmodules"] + manifest["styles"] + [x["path"] for x in manifest["languages"]]:
    assert Path(path).is_file(), path
assert keys(read("lang/en.json")) == keys(read("lang/ru.json"))
```

For runtime testing, agree on a test world, enable the module there when authorized and reload the browser after script changes. Check browser errors and the actual token behavior. A newly added module may need Foundry to rediscover installed packages; request a restart only if needed and authorized. Keep campaign activation and service restarts under the user's control.

Before marking a Foundry version verified in the manifest, exercise the implemented behavior on that version. Record useful findings and known compatibility limits in the knowledge base.

## Related

- [[environment]]
- [[topics/module/_overview]]
- [[verify-portrait-mask-editor]]
- [[verify-static-token-masks]]
