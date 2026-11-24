---
title: Use Playwright MCP for Foundry checks
created: 2026-11-23
updated: 2026-11-23
tags: [how-to, playwright, validation]
status: active
source: First UI release verification on foundry-dev, 2026-11-23
---

# Use Playwright MCP for Foundry checks

**TL;DR** Use Playwright to inspect Foundry's HTML controls and capture the rendered canvas in a designated test world. On `foundry-dev`, a direct stdio MCP client worked when the Codex chat had no Playwright actions.

## When to use

Use this procedure for an authorized browser check in the designated Foundry test world. Use separate browser profiles for GM and player sessions. Keep profiles, screenshots and other output outside Foundry `Data/`, and omit credentials, private URLs and account identifiers from project notes.

## Steps

1. On `foundry-dev`, run `codex mcp get playwright`. On 2026-11-23 it reported `enabled: true`, `transport: stdio` and `npx -y @playwright/mcp@0.0.86` with host-specific Chromium arguments and environment settings.
2. Use the chat's Playwright tools if they are available. For the verified fallback, start the configured command through a direct MCP stdio client with the Chromium arguments and environment from the host configuration. Append `--isolated --output-dir <directory-outside-Data>`. Start an independent server for each role. Send `initialize`, then `notifications/initialized`, then `tools/list`. Use each tool's returned input schema with `tools/call`.
3. Use `browser_resize` at 1440×950 and `browser_navigate` to open the designated Foundry join page. Wait until a fresh `browser_snapshot` shows the account combobox. The page title appeared before the combobox during verification. Use current snapshot refs with `browser_select_option` to select the authorized account and `browser_click` to join.
4. Wait for `/game` to load and the Foundry sidebar to appear. Use `browser_snapshot` for HTML controls such as the sidebar, settings and file picker. For token art and other canvas content, inspect a `browser_take_screenshot` result. Close the test browser with `browser_close` and remove temporary output when the check is complete.

## Check it worked

On 2026-11-23, direct MCP calls resized the viewport, joined the designated world, reached `/game`, found the sidebar and captured a screenshot. Record the scene and rendered result for each role when running the [static token mask checks](verify-static-token-masks.md) or [portrait editor checks](verify-portrait-mask-editor.md). Track player rejoin and player browser reload individually. In the first UI release checks, the player rejoined successfully and a separate browser reload reached the canvas, but returning to the test scene timed out.

## If it goes wrong

An enabled server in `codex mcp get playwright` confirms configuration on that host. To check native exposure, try **Settings → MCP servers → Restart** in Codex desktop, then `/mcp` in a session on the same host. TODO: unverified for native Playwright action exposure in this chat. Use the direct stdio procedure if chat actions are still unavailable.
