---
title: 'ADR-008: Supabase — Database + Auth Platform'
description: 'Supabase provides managed PostgreSQL, auth, and file storage under one SDK and billing account.'
category: decision
status: active
adr_status: accepted
adr_number: 008
date: 2026-03-08
supersedes: null
superseded_by: null
depends_on: []
---

# ADR-008: Supabase — Database + Auth Platform

## Status

Accepted

## Context

Needed managed PostgreSQL with auth, file storage, and realtime subscriptions under one SDK and billing account. Evaluated fragmented alternatives that would require separate vendors for each concern — increasing integration surface, operational complexity, and billing overhead.

## Decision

Supabase managed PostgreSQL (v15+) + Supabase Auth. All three concerns (database, auth, storage) under one platform.

## Options Considered

- **Vercel Postgres** — no auth or storage integration
- **PlanetScale** — MySQL, no native RLS
- **Neon** — PostgreSQL, but no auth/storage bundling
- **Clerk + separate DB** — two separate vendors, no RLS integration at the database layer

## Consequences

Unified SDK. Row Level Security (RLS) is native to the database. Advisory locks are available for sequence numbers (see ADR-003). Generous free tier. Supabase dashboard provides migration UI, SQL editor, and auth management without additional tooling.
