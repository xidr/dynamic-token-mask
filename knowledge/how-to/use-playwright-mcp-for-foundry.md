---
title: Use Playwright MCP for Foundry checks
created: 2026-11-23
updated: 2026-11-24
tags: [how-to, playwright, validation]
status: active
source: First UI release verification on foundry-dev, 2026-11-23
---

# Use Playwright MCP for Foundry checks

**TL;DR:** Use Playwright snapshots for Foundry's HTML controls and screenshots for rendered token art in a designated test world. On `foundry-dev`, a direct stdio MCP client worked when the Codex chat had no Playwright actions.

## When to use

Use this procedure with the designated Foundry test world and authorized accounts. Follow [Develop and validate](develop-and-validate.md) for world access and module activation. Use separate browser profiles or isolated contexts for GM and player sessions when comparing their results. Keep profiles, credentials, screenshots and other local artifacts outside Foundry `Data/`. Omit credentials, private URLs, account identifiers and private fixture paths from project notes.

## Steps

1. Use the chat's native Playwright MCP actions if they are callable and can provide the required isolated sessions and output location. On `foundry-dev`, run `codex mcp get playwright` to inspect the host configuration when you need the fallback. On 2026-11-23 it reported `enabled: true`, `transport: stdio` and `npx -y @playwright/mcp@0.0.86` with host-specific Chromium arguments and environment settings.
2. For the verified fallback, have a direct MCP stdio client launch the configured command with the host's Chromium arguments and environment. Append `--isolated --output-dir <directory-outside-Data>` with a separate output directory and server for each role. Send `initialize` and wait for the response, then send `notifications/initialized` and request `tools/list`. Pass the tool name and arguments to `tools/call` using the returned input schema.
3. Use `browser_resize` and `browser_navigate` to set the viewport and open the designated Foundry join page. The join check used 1440×950. Use the viewport specified by the scenario if it differs. Wait until a fresh `browser_snapshot` shows the account combobox. The page title appeared before the combobox during verification. Use current snapshot refs with `browser_select_option` to select the authorized account and `browser_click` to join.
4. After `/game` loads, wait for the Foundry sidebar and open the intended test scene in each session. Use fresh `browser_snapshot` results to inspect HTML controls such as the GM's Portrait Mask Editor entry or the built-in file picker's portrait button and saved-mask indicator. Use `browser_take_screenshot` to compare the editor's rendered crop preview with the actual token art. For example, use a dedicated wide PNG on two visible 1×1 tokens and capture how the off-center subject appears on both tokens before Save, after Save and after Remove in each role's client.
5. Close each test browser with `browser_close` and remove temporary output when the check is complete. Keep any retained evidence outside Foundry `Data/`.

## Check it worked

Record the date, Foundry build, test scene or fixture, role, action and observed result for each step. List unexercised or blocked steps as pending with the reason. Track scene navigation, player rejoin and player browser reload individually. Use the [Verify static token masks in Foundry](verify-static-token-masks.md) and [Verify the portrait mask editor in Foundry](verify-portrait-mask-editor.md) guides for scenario expectations.

On 2026-11-23, direct MCP calls resized the viewport, joined the designated Foundry 14.369 world, reached `/game`, found the sidebar and captured a screenshot. In the first UI release checks, the player saw both crops after rejoining. A separate player browser reload reached the canvas, but returning to the test scene timed out. Checking both crops after that reload remains pending. [First UI release observations](../features/file-picker-mask-controls.md#first-ui-release)

## If it goes wrong

An enabled server in `codex mcp get playwright` confirms host configuration. Check the active chat's tools for callable Playwright actions. In Codex desktop, the recovery steps suggested during the first release were **Settings → MCP servers → Restart**, then `/mcp` in a session on the same host. TODO: unverified for restoring native Playwright action exposure. Use the direct stdio procedure if the actions are unavailable.
