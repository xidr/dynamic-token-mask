---
title: Environment
created: 2026-10-22
updated: 2026-10-22
tags: [foundry, paths]
status: active
source: Project setup conversation and existing server knowledge, 2026-10-22
---

# Environment

**TL;DR:** This repository is also the live module installation. Keep public-safe documentation here and keep private material outside Foundry's served data tree.

## Details

| Purpose | Path |
| --- | --- |
| Module project | `/opt/foundry/foundrydata/Data/modules/dynamic-token-mask` |
| Foundry application | `/opt/foundry/foundryvtt` |
| Foundry data | `/opt/foundry/foundrydata` |
| Other modules | `/opt/foundry/foundrydata/Data/modules` |
| Dark Heresy system and existing server knowledge | `/opt/foundry/foundrydata/Data/systems/dark-heresy` |
| Rule books, outside served data | `/opt/foundry/books` |

The existing server knowledge records Foundry VTT 14.367 and the `foundry` systemd service, running as user `foundry`. Recheck the installed version and service state when needed; setup did not restart or enable anything.

The user's table uses Russian and English. This module is system-independent; Dark Heresy-specific rules and deployment conventions are not module requirements. No dedicated module test world has been selected.

Foundry serves files from its data directories, including Markdown notes. Do not store credentials, private campaign details, personal IDs, PDFs or extracted rule-book text here. Do not assume `.gitignore` provides HTTP access protection.

## Related

- [[develop-and-validate]]
- [[ide-tools]]
