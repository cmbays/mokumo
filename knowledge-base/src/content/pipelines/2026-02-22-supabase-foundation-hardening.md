---
title: 'Issue #550 Hardening — Pagination DRY, Provider Router, Rate Limiting'
subtitle: 'Addressing remaining architectural and security findings from the Supabase Foundation review'
date: 2026-02-22
phase: 2
pipelineName: 'Supabase Foundation Hardening'
pipelineId: '20260222-550-hardening'
pipelineType: horizontal
products: ['garments']
tools: []
stage: wrap-up
tags: ['build', 'learning', 'decision']
branch: 'session/0222-550-hardening'
pr: '#583'
status: complete
sessionId: '0a1b62cb-84e6-46ff-b178-9021bb5a09ae'
---

## Problem Statement

Issue #550 tracked 34 open review findings (14 major, 20 warnings) from the Supabase Foundation epic. PRs #579–#581 addressed the Phase 2b hardening items (multi-tenancy indexes, shops schema, session lookup). This pipeline closed the remaining architectural and security items.

## What Was Already Shipped

Before starting, three P1 items were confirmed already complete in the schema:

- **P1a**: `created_at` on `shops` table — present at `src/db/schema/shops.ts:13`
- **P1b**: `source` column on `catalog_styles` — present at `src/db/schema/catalog-normalized.ts:80`
- **P2c**: Composite unique index `(source, external_id)` on `catalog_styles` — present at `src/db/schema/catalog-normalized.ts:99`

This is a common pattern when fixing review findings across multiple PRs — always read the schema before implementing, or you'll duplicate work.

## What Was Built

### P2d — Shared `fetchAllPages<T>()` utility

Two nearly identical offset-cursor `while(true)` pagination loops existed in:

- `src/infrastructure/repositories/_providers/supplier/garments.ts`
- `src/infrastructure/services/catalog-sync.service.ts`

Both had the same constants (`CATALOG_PAGE_SIZE = 100`, `MAX_CATALOG_PAGES = 500`), the same zero-progress guard, and the same safety ceiling logic.

**Solution**: Extracted `fetchAllPages<T>()` to `src/shared/lib/pagination.ts`. The generic type parameter accommodates different item shapes. Callers pass a `PageFetcher<T>` callback that wraps their adapter call.

**Key decision**: No `import 'server-only'` on `pagination.ts`. The logger it imports is isomorphic, and both callers already have their own server-only guards. Adding server-only would break the supplier/garments test suite (tests import the module in a non-server context).

**Follow-up fix**: Both callers also had independent `CATALOG_PAGE_SIZE = 100` constants that replicated `fetchAllPages`'s default. Removed them — the default is the single source of truth.

### P2e — `getActiveProvider()` discriminated union

Two boolean helper functions overlapped in `garments.ts`:

- `isSupabaseCatalogMode()` returned true when `SUPPLIER_ADAPTER === 'supabase-catalog'`
- `isSupplierMode()` returned true when `SUPPLIER_ADAPTER` was ANY truthy string (including `'supabase-catalog'`)

This meant `isSupplierMode()` was true in supabase-catalog mode, making the conditional logic order-dependent and fragile.

**Solution**: Single `getActiveProvider()` returning `type GarmentProvider = 'supabase-catalog' | 'supplier' | 'mock'`. The three states are mutually exclusive. TypeScript can exhaustively check each call site. Adding a fourth provider requires touching one function, not two booleans.

### P3f — Sign-in rate limiting

New infrastructure:

- `src/shared/lib/redis.ts` — lazy Upstash Redis singleton, null when env vars missing
- `src/shared/lib/rate-limit.ts` — `checkSignInRateLimit(key)` using sliding window (5 attempts / 15 min)
- `src/app/(auth)/login/actions.ts` — wired before credential validation

**Security hardening decisions** (all found/confirmed by security-reviewer before PR):

| Concern                         | Decision                                                                                                                                         |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Header trust order              | `x-real-ip` → `x-vercel-forwarded-for` → `x-forwarded-for`. Vercel overwrites the first two at the edge; `x-forwarded-for` is client-appendable. |
| No IP in production             | Block immediately (return error) — don't allow unverified requests in prod                                                                       |
| Rate limit key                  | Compound `${ip}:${email}` — prevents locking out all users on a shared NAT IP                                                                    |
| Redis unavailable in production | Fail closed (block sign-in) — misconfigured prod infra should not silently disable rate limiting                                                 |
| Redis error                     | Fail open (allow sign-in) — transient Redis errors should not make login unavailable                                                             |
| Dev/CI without Redis            | Fail open — Redis is intentionally unconfigured in local dev and CI                                                                              |

## Review Orchestration Results

Pipeline run at wrap-up on the final diff (7 files, 187+/71-):

- **Stage 2 risk**: score 15 (low) — single domain `data-layer`
- **Agents dispatched**: `build-reviewer`
- **Gate**: PASS — zero findings
- **Gap logged**: `security-reviewer` not in `review-agents.json` → Issue #584. Security coverage was manually provided before PR creation, so no actual gap in this PR.

## Key Learnings

### `server-only` and test environments

`import 'server-only'` throws at import time in non-server contexts (Vitest, Node scripts). Any utility imported by test code must NOT have `server-only` unless every test file also runs inside a simulated server context. The workaround: don't add `server-only` to isomorphic utilities. Let callers enforce the boundary.

### Discriminated union > multiple boolean flags

Two boolean helpers that are supposed to be mutually exclusive are better expressed as a single function returning a string union. Booleans can't encode mutual exclusivity at the type level — a union type can.

### Compound rate limit keys for shared IPs

Simple IP-based rate limiting (`x-forwarded-for` alone) is problematic for business users on shared networks (offices, universities, mobile carriers using CGNAT). Compounding with the email address being attempted means each `(IP, user)` pair gets its own bucket — an attacker can't burn rate limit for legitimate users unless they're attempting the same account.

### Fail-closed vs fail-open semantics

Security controls should default fail-closed in production (unknown → block) and fail-open in development (unknown → allow). This matches the asymmetry of environments: production mistakes are user-visible and security-critical; dev mistakes are caught locally.

## Files Changed

| File                                                              | Change                                                       |
| ----------------------------------------------------------------- | ------------------------------------------------------------ |
| `src/shared/lib/pagination.ts`                                    | NEW — `fetchAllPages<T>()` utility                           |
| `src/shared/lib/redis.ts`                                         | NEW — lazy Upstash Redis singleton                           |
| `src/shared/lib/rate-limit.ts`                                    | NEW — sliding window sign-in rate limiter                    |
| `src/infrastructure/repositories/garments.ts`                     | MODIFIED — `getActiveProvider()` discriminated union         |
| `src/infrastructure/repositories/_providers/supplier/garments.ts` | MODIFIED — uses `fetchAllPages`, removed duplicate constants |
| `src/infrastructure/services/catalog-sync.service.ts`             | MODIFIED — uses `fetchAllPages`, removed duplicate constants |
| `src/app/(auth)/login/actions.ts`                                 | MODIFIED — IP extraction, compound rate limit key            |

## Links

- Closes: Issue #550
- PR: #583 (merged 2026-02-22)
- Gap issue filed: #584 (security-reviewer registry config)
- Predecessor PRs: #579, #580, #581 (Phase 2b hardening)
