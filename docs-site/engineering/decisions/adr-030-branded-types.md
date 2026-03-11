---
title: 'ADR-030: Branded Types for Nominal Safety'
description: 'Use branded types (unique symbol intersection) for entity IDs; decline for status state machines.'
category: decision
status: active
adr_status: proposed
adr_number: 030
date: 2026-03-11
supersedes: null
superseded_by: null
depends_on: [015, 019]
---

# ADR-030: Branded Types for Nominal Safety

## Status

Proposed

## Context

TypeScript uses structural typing — two types with the same shape are interchangeable. This means a `string` representing a `QuoteId` is assignable to a parameter expecting a `CustomerId`. Similarly, a branded type pattern (using `unique symbol` intersection) can encode state machine transitions at the type level, making invalid transitions compile errors.

We evaluated this pattern for two use cases: entity ID safety and status state machines.

## Decision

### Adopt: Branded Entity IDs

Introduce a `Brand<T, S>` utility in `src/domain/lib/branded.ts` to create nominally distinct ID types:

```typescript
declare const __brand: unique symbol
type Brand<T, S extends string> = T & { readonly [__brand]: S }

export type QuoteId = Brand<string, 'QuoteId'>
export type InvoiceId = Brand<string, 'InvoiceId'>
export type JobId = Brand<string, 'JobId'>
export type CustomerId = Brand<string, 'CustomerId'>
```

This prevents cross-entity ID mixups at zero runtime cost. IDs are created via factory functions or validated at repository boundaries.

### Decline: Branded Status States

We explicitly decline using branded types to encode status transitions (e.g., `type DraftQuote = Brand<Quote, 'draft'>`) for these reasons:

1. **Zod-first conflict** (ADR-015): All types derive from `z.infer<>`. Branded status types require a parallel type layer that Zod cannot express, creating two sources of truth.
2. **Boundary cast tax**: Every DB read, Zod parse, and API response would need `as DraftQuote` casts. This erodes the safety the pattern provides — the cast is an unchecked assertion.
3. **CRUD mismatch**: The pattern works best with functional pipelines (`ship(approve(order))`). Our architecture loads entities, mutates status, and persists — a fundamentally different data flow.
4. **Runtime guards suffice**: ADR-019 establishes per-entity state machines in `domain/rules/` that catch invalid transitions before persistence. These are testable, debuggable, and produce meaningful error messages.

### Why `unique symbol` Over Zod `.brand()`

Zod provides a built-in `.brand<'X'>()` method that also creates nominally distinct types. We considered both approaches:

|                                | `unique symbol` intersection                                        | Zod `.brand()`                                              |
| ------------------------------ | ------------------------------------------------------------------- | ----------------------------------------------------------- |
| **Framework dependency**       | None — pure TypeScript                                              | Tied to Zod's type internals                                |
| **Branding without parse**     | `brandId<T>(raw)` — one cast                                        | Requires `schema.parse()` or falls back to `as` cast anyway |
| **Structural reproducibility** | Impossible — `unique symbol` is opaque outside the declaring module | Possible — Zod's `BRAND` symbol is importable               |
| **Runtime cost**               | Zero                                                                | Zod parse overhead (if using parse for branding)            |
| **Fits our boundary**          | Yes — repos already validate via Drizzle/Zod, then brand the result | Awkward — would add a second parse step solely for branding |

Both approaches prevent cross-entity ID mixups equally well. We chose `unique symbol` because our branding boundary is repository return sites where data has already been validated. Adding a Zod parse step solely to brand an ID adds overhead without additional safety. The `brandId<T>()` helper is a deliberate, explicit cast at a point where the value has already been proven valid.

## Adoption Strategy

Branded IDs are adopted **incrementally**, not via big-bang migration:

1. New code written against branded ID types from the start.
2. Existing code migrates when naturally touched during vertical builds.
3. Port interfaces and repositories update entity-by-entity as each vertical ships.

## Consequences

- Entity ID types become nominally distinct. Functions accepting `QuoteId` reject raw strings or other entity IDs at compile time.
- Repository and factory functions serve as the "branding boundary" where raw strings are cast to branded types after validation.
- Status transitions remain enforced at runtime per ADR-019, not at the type level.
- Future reconsideration: if we adopt a more functional/event-sourced architecture (M5+), status branding may become viable.
