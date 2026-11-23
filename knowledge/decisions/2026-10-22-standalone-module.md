---
title: Standalone module
date: 2026-10-22
status: accepted
tags: [architecture, project]
---

# Standalone module

## Context

The user requested a new module for dynamic circular token masking and approved setting up this standalone project structure.

## Decision

Create Dynamic Token Mask in `/opt/foundry/foundrydata/Data/modules/dynamic-token-mask`, with its own Git repository and shared agent knowledge base.

## Alternatives

Embedding the feature in the Dark Heresy system would couple it to that system; a separate development checkout could be introduced later if needed.

## Consequences

This project is independent of Dark Heresy and is also the live module directory. Public-safe notes live alongside code. Rendering design, runtime validation and campaign activation remain future work.
