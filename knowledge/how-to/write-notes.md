---
title: Write project notes
created: 2026-11-23
updated: 2026-11-23
tags: [workflow]
status: active
---
# Write project notes

**TL;DR:** File evidence with its topic and register it in the vault.

1. Search the lowercase index, topic overviews and existing notes for the subject. Open the relevant template.
2. Use a lowercase kebab-case filename, frontmatter and a short TL;DR. Include evidence and dates. Record verified behavior separately from proposals. Use vault-root paths when a wikilink basename is ambiguous.
3. Update a topic for architecture, a reference for a contract and a how-to for a repeatable procedure. Date topic verification. For each delivered feature record the request, decisions, behavior, exclusions and implementation.
4. Record a decision when alternatives matter. Preserve its history. For a later reversal, add a new record and set the old record’s status, replaced_by and, for partial replacement, replaced_part.
5. File an open bug in bugs/ with evidence and a reproducer. On resolution mark it fixed, move it to bugs/fixed/, repair incoming links and remove the open index entry. Add transferable surprises to gotchas.md.
6. Register new active notes in [[index]] or their area overview. Check each link resolves uniquely and each active note is reachable. Keep retired knowledge with outdated status and a link to its replacement.
7. At finish update the builder tool’s calibration log per [[topics/model-calibration/_overview]].
