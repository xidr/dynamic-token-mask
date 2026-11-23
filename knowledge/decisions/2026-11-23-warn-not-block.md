---
title: Warnings for soft game rules
date: 2026-11-23
status: accepted
tags: [workflow]
---
# Warnings for soft game rules

**TL;DR:** Warn inline before confirmation and attach a persistent visible marker to the resulting state. Apply this to new soft domain boundaries.

## Context

A future editor can encounter a valid user choice outside a game convention.

## Decision

Warn inline before confirmation and attach a persistent visible marker to the resulting state. Apply this to new soft domain boundaries.

## Alternatives

Hard-blocking every unusual choice would prevent intentional exceptions. A toast alone would lose the warning after confirmation.

## Consequences

Keep security, permissions, idempotency, technical constraints and schema integrity strict. Existing hard guards stay in place until revisited.
