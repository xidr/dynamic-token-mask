---
title: Common conventions for module knowledge
date: 2026-11-23
status: accepted
tags: [knowledge-base, workflow]
---

# Common conventions for module knowledge

## Context

Dynamic Token Mask used Obsidian wikilinks, a lowercase index and seven note templates. Dark Heresy, Rogue Trader X and GURPS 4e X use a shared Markdown convention. The maintainer approved adopting it for this module.

## Decision

Use relative Markdown links from the containing file, with the `.md` extension and any existing label or heading fragment. Start at [INDEX.md](../INDEX.md), with reading hints in the index and topic overviews. Use six templates for topics, how-tos, references, decisions, bugs and features. Decision records use YAML status and relative successor paths, with a scope for partial replacements. See the [authoring guide](../how-to/write-notes.md).

## Alternatives

Keeping the existing vault conventions would avoid moving the index and rewriting links. It would leave authors and reviewers with separate conventions for this module.

## Consequences

The same links work in the vault and in repository Markdown. Reviewers check destinations, index coverage and replacement history. This replaces the knowledge-format guidance in the [setup decision](2026-11-23-kb-and-workflow-setup.md). Its Codex and Gemini workflows, approvals and calibration logs still apply.
