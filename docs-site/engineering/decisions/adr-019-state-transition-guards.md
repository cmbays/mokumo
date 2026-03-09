---
title: 'ADR-019: State Transition Guards in Domain Layer'
description: 'Per-entity state machines in domain/rules/ enforce valid transitions before any persistence occurs.'
category: decision
status: active
adr_status: proposed
adr_number: 019
date: 2026-03-08
supersedes: null
superseded_by: null
depends_on: [001, 014]
---

# ADR-019: State Transition Guards in Domain Layer

## Status

Proposed

## Context

Without explicit transition rules, any status update can be applied to any entity regardless of current state — a declined quote can be directly accepted, a completed job can be moved back to draft. These invalid transitions corrupt the audit trail and break automation triggers.

## Decision

Per-entity state machines in `domain/rules/` (e.g., `quote-transitions.ts`, `job-transitions.ts`). Guards run in server actions before any persistence. Invalid transitions throw a typed domain error.

Example shape:

```typescript
const VALID_TRANSITIONS: Record<QuoteStatus, QuoteStatus[]> = {
  draft: ['sent'],
  sent: ['accepted', 'declined', 'draft'],
  accepted: [],
  declined: ['draft'],
}
```

## Consequences

Invalid transitions are caught at the domain layer before touching the database. Domain errors surface meaningful messages to the UI. Requires defining the full transition graph for each entity before shipping that entity's status workflow.
