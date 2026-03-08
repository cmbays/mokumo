---
title: 'ADR-014: Clean Architecture — 4-Layer Dependency Rule'
description: 'A four-layer architecture with strict inward-only dependency direction enforces testability and prevents import cycles.'
category: decision
status: active
adr_status: accepted
adr_number: 014
date: 2026-03-08
supersedes: null
superseded_by: null
depends_on: []
---

# ADR-014: Clean Architecture — 4-Layer Dependency Rule

## Status
Accepted

## Context
As the codebase grows, preventing import cycles and ensuring testability requires explicit layer boundaries. Specifically: need the ability to swap mock data implementations for Supabase implementations without touching UI components.

## Decision
Four layers with strict inward-only dependency direction:

- `domain/` — innermost, zero framework dependencies
- `infrastructure/` — implements ports, depends only on `domain/`
- `features/` — business use cases, depends on `domain/` and `infrastructure/`
- `app/` — wiring and routing, depends on all layers

Enforced via ESLint `no-restricted-imports` rules. The `eslint.config.mjs` file is the authoritative enforcement point.

## Options Considered
- **Feature-based flat structure** — no enforcement mechanism, drifts over time
- **Next.js default co-location** — no separation of concerns, no testability boundary

## Consequences
Mock-to-Supabase swap requires zero component changes. Architecture violations are caught at lint time, not code review. Initial setup overhead; new contributors need to internalize the layer rules.
