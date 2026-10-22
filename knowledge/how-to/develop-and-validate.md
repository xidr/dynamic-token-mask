---
title: Develop and validate
created: 2026-10-22
updated: 2026-10-22
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

Check that every script, stylesheet and language path in `module.json` exists and that translation keys match. Add focused tests when meaningful behavior exists; do not infer runtime compatibility from syntax checks.

There is currently no build command or test runner. Initial setup validated JSON, manifest file references and JavaScript syntax only. No runtime test or module activation has occurred.

For runtime testing, agree on a test world, enable the module there when authorized and reload the browser after script changes. Check browser errors and the actual token behavior. A newly added module may need Foundry to rediscover installed packages; request a restart only if needed and authorized. Keep campaign activation and service restarts under the user's control.

Before marking a Foundry version verified in the manifest, exercise the implemented behavior on that version. Record useful findings and known compatibility limits in the knowledge base.

## Related

- [[environment]]
- [[topics/module/_overview]]
