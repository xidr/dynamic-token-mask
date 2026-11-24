---
title: Verify native token previews and transitions in Foundry
created: 2026-11-24
updated: 2026-11-24
tags: [how-to, rendering, validation]
status: active
source: Foundry 14.369 baseline and scripts/main.js
---

# Verify native token previews and transitions in Foundry

**TL;DR:** Check held drags, both token configuration previews, and native image transitions with two different masks and one unmasked portrait.

## When to use

Use a designated test world once the changed build is served after an approved merge or in an authorized isolated installation. Follow [Use Playwright MCP for Foundry checks](use-playwright-mcp-for-foundry.md) to isolate the GM and owning-player sessions and keep all artifacts outside Foundry Data.

## Steps

1. Prepare two static portraits A and B with distinct off-center masks and a static portrait C without a mask. Use distinct source art and crop sizes so a stale or raw texture is recognizable. Start an owned scene token and a disposable owned prototype on A with rings disabled. Record source paths and raw and cropped fixture dimensions.
2. As each role, hold a drag long enough to capture the clone and original separately. Drop it. Repeat and cancel. Check the held clone and settled portrait against the selected mask.
3. With each role that has Foundry's native `TOKEN_CONFIGURE` permission, open scene-token configuration and preview A, B and C, allowing each to settle. Switch A → B → C → A rapidly and wait for late loads. Repeat with C settled before returning to A. Check that the visible texture and selected path agree in both cases. When verifying the scene preview repair, disable rings and use a static original portrait. Capture the A crop after returning, then confirm both Cancel and Apply with the owning player observing the placed token. Cancel and confirm A on the placed token. Reopen, select B and apply, then confirm B.
4. Repeat the image sequence in the prototype Appearance tab, capturing the actual thumbnail. Cancel and place a fresh token to confirm A. Apply B and place another fresh token to confirm B. Placement requires native `TOKEN_CREATE` permission. Check each placed token from both sessions. Check a partial Appearance rerender and a ring toggle on the disposable sheet. If available, use a dedicated CORS-enabled external portrait to check the thumbnail path as well.
5. With matching previews active, have the GM create, replace and remove a mask. Compare the placed token and held drag clone on both clients after each change. Repeat with the GM's scene-token sheet previewing C on a token whose saved image is A, then with the prototype Appearance thumbnail displaying C. Use distinct temporary fixture paths or restore their masks before the transition checks.
6. With both roles watching, perform A → B and B → C using the native effect. Capture intermediate canvas frames as well as the final portrait. Start a second image switch before the first finishes, once ending on a masked image and once ending on C. Record the final texture on both clients again after earlier work has settled.

## Check it worked

Record build, role, scenario and observed result. Capture HTML snapshots for configuration controls and rendered screenshots for thumbnails, held drags and intermediate and final canvas frames. Associate each pending role or scenario with its missing evidence. Update the [feature record](../features/native-token-previews-and-transitions.md) and [roadmap](../../ROADMAP.md) from the observations. See the [post-merge results](../features/native-token-previews-and-transitions.md#foundry-14369-post-merge-verification) for verified cases and permission limits. See the [scene preview repair](../bugs/fixed/stale-scene-token-preview.md) for the later reproduction and pending live rerun.

## If it goes wrong

Compare the selected path with the loaded image and record the dimensions of the visible texture. Use a mid-blend frame to assess transition target framing, and check both consoles for errors. Record any unavailable owner actions separately from rendering results.
