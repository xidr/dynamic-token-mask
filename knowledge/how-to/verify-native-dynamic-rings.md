---
title: Verify native dynamic rings in Foundry
created: 2026-11-24
updated: 2026-11-24
tags: [how-to, rendering, validation]
status: active
source: Native dynamic ring acceptance plan and installed Foundry 14.369 source
---

# Verify native dynamic rings in Foundry

**TL;DR:** Compare the ring and subject separately across masked and unmasked paths, then repeat with live changes and native token previews.

## When to use

Use the designated test world for a baseline on the existing build, then repeat with the changed build after an approved merge or in an authorized isolated installation. Follow [Use Playwright MCP for Foundry checks](use-playwright-mcp-for-foundry.md) for isolated GM and owning-player sessions and artifacts outside Foundry Data.

## Steps

1. Use disposable owned tokens and a disposable owned prototype. Choose visually distinct static portraits A and B with different off-center masks, and leave C unmasked. Include a rectangular image and a portrait for which Foundry infers alternate subject art. If the test world has no mapping, use a fixture-only prefix in `CONFIG.Token.ring.subjectPaths` in both browser contexts. Point it at a fixture directory with the same filenames and alternate art. Set the mapping before preparing the token documents, then remove it or close the sessions after the run. Record the asset paths, original dimensions and crop sizes.
2. With the ring enabled, run the matrix below. Collect GM and owner canvas screenshots under matching zoom and fit settings. Record the stored portrait and subject paths, the prepared subject path, and the subject texture Foundry installed. Compare the ring edge, background, tint, effect and displayed footprint across runs. Include default fit and a rectangular token with a different fit and a nondefault subject scale. Sample more than one frame for animated ring effects.

   | Portrait | Stored ring subject | Expected subject with the change |
   | --- | --- | --- |
   | A | Empty | A's original portrait pixels framed by A's mask, including when Foundry infers alternate subject art |
   | C | Empty | Native implicit subject framing, including inferred art when available |
   | A | B | B's own mask |
   | A | C | C's native framing |
   | C | B | B's own mask |

3. Change only the explicit subject between B and C while leaving the portrait alone. Clear the explicit subject to return to implicit framing. For a mapped portrait, switch between the empty subject and the exact same inferred path entered explicitly. Confirm the mask follows the stored choice even though the prepared subject path stays the same. Repeat by entering the portrait path explicitly on a token whose implicit subject already uses that file, and check the ring fit against the native baseline. Rapidly change the subject and toggle the ring before earlier loads finish. Confirm the last selection on both clients. With the ring off, confirm the ordinary portrait crop rule resumes. Check that document paths and token dimensions retain their expected values.
4. With B selected as an explicit subject and with A selected implicitly, have the GM replace and remove the applicable masks, then recreate them. Make a mask for a previously unmasked subject and remove it again. Capture both clients after each edit, including a held drag. Check the placed token and held clone separately. Drop and cancel a drag as each role and confirm that the settled subject stays correct.
5. Using a role with native token configuration permission, repeat the masked, unmasked and rapid-switch cases in a scene-token configuration preview. Check Cancel and Apply. In prototype Appearance, compare the ring-enabled thumbnail against native behavior, toggle the ring, and test Cancel and Apply by placing fresh tokens. Check their subjects from both sessions. Note any role prevented from opening a sheet or placing a token by Foundry's native permissions.
6. Change the portrait or ring subject with a native image transition. Check that the settled target has the correct subject and ring. Repeat with a second change before the first effect finishes and capture the settled target again after the earlier effect would have ended.
7. Clear temporary masks and delete the disposable tokens, actors and uploaded fixtures you created for the run. Restore any fixture settings and scenes you changed. Keep the run's private artifacts outside Foundry Data.

## Check it worked

While the owning player holds a token, have the GM switch the explicit subject from masked B to unmasked C and toggle the ring. Check the held clone after each change and again after drop or cancel.

TODO: unverified on the changed build. Record the date, Foundry build, module revision, role, expected framing, observed result and evidence. Capture HTML snapshots for sheet controls and rendered screenshots for placement, previews, drags and settled transitions. Record unavailable role actions separately. Update the [feature record](../features/native-dynamic-rings.md) and [roadmap](../../ROADMAP.md) from the observations.

## If it goes wrong

Check whether Foundry prepared a distinct subject from an empty stored subject path. Compare the source dimensions and installed mesh texture before and after the change. Inspect ring padding, shader, background and scale separately from the subject crop. Check the consoles for errors on both clients.
