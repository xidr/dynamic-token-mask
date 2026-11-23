---
title: IDE tools
created: 2026-10-22
updated: 2026-11-23
tags: [ide, tooling]
status: active
source: Project setup conversation and existing server knowledge, 2026-10-22
---

# IDE tools

**TL;DR:** Use IDE semantic tools when helpful, but confirm that the IDE has opened this module project. An IDE connection for Dark Heresy does not establish access to this project's symbols.

## Details

- Discover available tools and schemas in the current session. Use bounded symbol searches, call analysis and inspections; use `rg` for exact strings and notes.
- Pass this module's project path when supported: `/opt/foundry-dev/foundrydata/Data/modules/dynamic-token-mask`. Confirm it with a read-only project query before project-specific work.
- The sibling system's notes record a WebStorm HTTP MCP endpoint at `http://127.0.0.1:64342/stream`, verified there on 2026-10-22. Its availability and module-project access have not been verified here.
- Missing native tools does not rule out HTTP MCP access. A sandbox network failure alone is inconclusive; use the normal approval mechanism for an outside-sandbox retry when needed.
- Detailed handshake and connection checks are in `/opt/foundry-dev/foundrydata/Data/systems/dark-heresy/knowledge/reference/jetbrains-ide-mcp.md`. Read that note if troubleshooting is needed.
- The sibling system's `tools/ide.mjs` wrapper targets its own checkout. Do not assume running it from here will target this module. No wrapper has been copied into this project.

## Related

- [Environment](environment.md)
