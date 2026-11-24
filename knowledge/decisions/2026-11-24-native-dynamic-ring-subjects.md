---
title: Select mask sources for native dynamic rings
date: 2026-11-24
status: accepted
tags: [rendering, architecture, foundry]
---

# Select mask sources for native dynamic rings

## Context

Foundry prepares a ring subject from the portrait when the stored subject field is empty and a mapping exists. The prepared field can therefore name a different texture while the document still represents an implicit subject. Foundry can install that inferred texture on the mesh and use it for ring layout. [Native dynamic rings](../features/native-dynamic-rings.md)

## Decision

An explicit subject selects its own image and mask. An implicit subject selects the portrait's mask and original pixels when a mask is available. It uses Foundry's installed subject otherwise. Swap the subject texture within the native ring pipeline and keep the exact native mesh texture available for restoration. Keep the original texture dimensions and resolution for the derived ring subject so the native sizing path receives the same layout inputs. Let Foundry retain the shader, ring assets, visual effects and token document settings.

## Alternatives

Using the prepared subject as the mask key would give an inferred alternate image the semantics of an explicit choice. Using the portrait as the key for every ring would apply its mask to a different image selected expressly as the subject. Replacing the subject with the ordinary square crop would change the texture dimensions Foundry uses to size and pad the ring. Drawing a separate ring would require duplicating Foundry's sizing, fitting and effect behavior.

## Consequences

A mask edit can affect both a plain portrait and implicit rings for that portrait. An explicit subject is affected by edits to its own path. The renderer must verify the loaded source before creating a crop and must leave native textures under Foundry ownership. Foundry upgrades warrant rechecking implicit subject inference and ring layout. [Verification procedure](../how-to/verify-native-dynamic-rings.md)
