---
title: 'ADR-028: Carbon-Style RLS Permission Claims (Phase 3)'
description: 'JSONB permission claims on Supabase user metadata enable role-based RLS in Phase 3 without schema changes.'
category: decision
status: active
adr_status: proposed
adr_number: 028
date: 2026-03-08
supersedes: null
superseded_by: null
depends_on: [008]
---

# ADR-028: Carbon-Style RLS Permission Claims (Phase 3)

## Status

Proposed

## Context

V1 Beta uses `shop_id` FK filtering for multi-tenancy — simple and correct for single-user shops. As shops add team members with different roles (sales, production, admin), need row-level access control without a full rewrite.

## Decision

Adopt a `has_company_permission()` RLS pattern in Phase 3. JSONB permissions on Supabase user metadata; wildcard `'0'` for all-company access; per-operation scoping (e.g., `sales_view`, `production_update`). Schema includes `shop_id` from day one — migration to RLS is additive, not a rewrite.

## Consequences

Phase 3 multi-tenancy requires no schema changes — only RLS policies and permission-checking functions. Phase 1–2 can ship without RLS overhead. Role-based access control lives in the database, not application code.
