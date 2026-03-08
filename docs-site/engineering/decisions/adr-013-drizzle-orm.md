---
title: 'ADR-013: Drizzle ORM — Chosen over Prisma'
description: 'Drizzle ORM is the data access layer for its TypeScript-native schema, zero runtime binary, and serverless compatibility.'
category: decision
status: active
adr_status: accepted
adr_number: 013
date: 2026-03-08
supersedes: null
superseded_by: null
depends_on: [008]
---

# ADR-013: Drizzle ORM — Chosen over Prisma

## Status
Accepted

## Context
Needed a TypeScript ORM for Next.js on Supabase/PostgreSQL in a serverless environment. Two primary options evaluated: Drizzle and Prisma.

## Decision
Drizzle 0.45+.

## Options Considered
- **Prisma** — schema defined in its own DSL (not TypeScript), requires a runtime binary that adds significant bundle weight and cold start time, no native Zod integration (requires separate `zod-prisma` package), connection pooling requires extra configuration for serverless.
- **Kysely** — excellent query builder but no schema definition layer, less type inference out of the box.

## Consequences
Schema is TypeScript — `drizzle-zod` gives direct Zod schema inference from the DB schema (one source of truth). No runtime binary — approximately 50KB, serverless-friendly, no cold-start penalty. `prepare: false` mode enables PgBouncer/Supabase connection pooler compatibility.

Trade-off: Prisma has a richer migration GUI and more community tutorials. Drizzle's migration tooling is less polished but sufficient.
