---
title: 'ADR-015: Zod-First Schema Design'
description: 'Zod schemas are the single source of truth; TypeScript types and database validators are derived from them.'
category: decision
status: active
adr_status: accepted
adr_number: 015
date: 2026-03-08
supersedes: null
superseded_by: null
depends_on: [013, 014]
---

# ADR-015: Zod-First Schema Design

## Status

Accepted

## Context

Without a single source of truth, TypeScript interfaces, database schemas, and runtime validation tend to drift apart — a validated form can submit data that fails at the database layer, or a TypeScript type can be out of sync with what the API actually accepts.

## Decision

Zod schemas are the single source of truth. TypeScript types are derived via `z.infer<>`. Database schemas use `drizzle-zod` to infer Zod validators from the Drizzle schema. Form validation uses `@hookform/resolvers/zod`.

## Options Considered

- **TypeScript interfaces first** — no runtime validation
- **Prisma-generated types** — DSL-based, not composable with Zod
- **io-ts** — more complex, less ergonomic

## Consequences

One definition point for type + validation + database contract. Compile-time and runtime errors are caught early. Adds Zod as a required first step for any new entity or API endpoint.
