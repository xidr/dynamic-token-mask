---
title: Verify static token masks in Foundry
created: 2026-11-23
updated: 2026-11-23
tags: [how-to, rendering, validation]
status: active
source: Static token renderer milestone and scripts/main.js
---

# Verify static token masks in Foundry

**TL;DR** Exercise save, player synchronization, reload and removal on two tokens with one shared portrait in a designated Foundry 14.369 test world. These runtime checks are pending.

## When to use

After the approved merge, use the designated test world with the module enabled and reload the browser. Connect a GM and a player to the same scene in separate sessions with both tokens visible to the player.

## Steps

1. Create two ordinary visible 1×1 scene tokens with rings disabled. Assign both a dedicated 400×200 static PNG portrait with a recognizable off-center subject. Record the original portrait appearance and grid footprint and confirm the player can target each token.
2. Select exactly one test token. Run this in the ready GM client console. If the fixture has different dimensions, substitute its exact pixel width and height.

   ```js
   const masks = game.modules.get("dynamic-token-mask").api.masks;
   const [testToken] = canvas.tokens.controlled;
   const src = testToken.document.texture.src;
   if (masks.has(src)) throw new Error("Use a test portrait without a saved mask.");
   await masks.save({
     src,
     centerX: 0.7,
     centerY: 0.45,
     radius: 0.3,
     imageWidth: 400,
     imageHeight: 200
   });
   ```

3. Confirm both clients see the same off-center circular portrait on both tokens. Confirm the grid footprint, targeting and token image paths match the baseline.
4. Reload both sessions and confirm both portraits remain cropped. Select a test token again and run the following in the GM client.

   ```js
   await game.modules.get("dynamic-token-mask").api.masks.remove(
     canvas.tokens.controlled[0].document.texture.src
   );
   ```

5. Confirm removal returned `true` and restored both original portraits immediately on both clients.

## Check it worked

Record the Foundry version and observations for crop placement, live player updates, reload, removal, targeting and grid footprint. Update the feature record with verified results.

## If it goes wrong

Check both browser consoles for module errors. Confirm both tokens use the same exact path, the PNG dimensions match the saved record and the player is viewing the same scene. Record deviations alongside the successful checks.
