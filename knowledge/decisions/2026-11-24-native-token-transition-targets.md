---
title: Frame targets in native token transitions
date: 2026-11-24
status: accepted
tags: [rendering, architecture, foundry]
---

# Frame targets in native token transitions

## Context

In the Foundry 14.369 baseline, both clients saw native A → B blend toward the raw B portrait before settling on its saved crop. The placed token renderer installs its crop after a token draw. Foundry prepares a separate target for the animation. [Baseline observations](../features/native-token-previews-and-transitions.md#foundry-14369-baseline)

## Decision

Use the existing token update hook to find the active animation context. Require one `TextureTransitionFilter` whose uniform object is the exact object animated through its `progress` property by that context. After native target preparation, require a current token, mesh, context and filter with the same native target before calling the filter's `targetTexture` setter. Leave unrecognized filters alone. Retain only the module-owned crop and restore the native target if the filter still uses the crop when releasing it.

## Alternatives

Waiting for the settled draw leaves raw incoming artwork visible during the blend. Replacing the animation or patching Foundry's private methods would add compatibility and cleanup work. Matching a filter by class alone could change a filter used by a different animation.

## Consequences

Foundry controls the effect and timing. The identification logic depends on observed Foundry 14.369 behavior and should be revalidated after a Foundry upgrade. The changed-build browser checks remain pending. [Verification procedure](../how-to/verify-native-token-previews-and-transitions.md)
