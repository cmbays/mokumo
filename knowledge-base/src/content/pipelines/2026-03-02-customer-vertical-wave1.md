---
title: 'Customer Vertical — Wave 1: CRUD Repo + Activity Timeline'
subtitle: 'SupabaseCustomerRepository (23 methods), 9 server actions, ICustomerActivityRepository, CustomerActivityService, ActivityFeed UI — all wired through the provider router'
date: 2026-03-02
phase: 2
pipelineName: 'Customer Vertical'
pipelineType: vertical
products: ['customers']
domains: ['devx']
tools: []
stage: build
tags: ['build', 'architecture']
sessionId: '0a1b62cb-84e6-46ff-b178-9021bb5a09ae'
branch: 'worktree-cryptic-seeking-pearl'
status: complete
---

## Summary

Wave 1 of the Customer Vertical (`20260228-customer-vertical` pipeline). Two parallel tasks:

- **Wave 1a (`customer-crud`)**: Full `ICustomerRepository` implementation in Supabase + 9 server actions (createCustomer, updateCustomer, archiveCustomer, createContact/updateContact/deleteContact, createAddress/updateAddress/deleteAddress)
- **Wave 1b (`customer-activity`)**: `ICustomerActivityRepository` + `CustomerActivityService` + Supabase impl + `ActivityFeed` / `ActivityEntry` UI components

**PR**: #757
**Resume command**:

```bash
claude --resume 0a1b62cb-84e6-46ff-b178-9021bb5a09ae
```

---

## What Was Built

### Wave 1a — Customer CRUD

| File | Role |
|---|---|
| `src/infrastructure/repositories/_providers/supabase/customers.ts` | `SupabaseCustomerRepository` — 23 methods implementing `ICustomerRepository` |
| `src/infrastructure/repositories/customers.ts` | Provider router (env-switch: `DATA_PROVIDER=supabase` vs mock) |
| `src/infrastructure/repositories/customers-mutable.ts` | Client-safe barrel exporting only `getCustomersMutable` |
| `src/features/customers/actions/customer.actions.ts` | createCustomer / updateCustomer / archiveCustomer |
| `src/features/customers/actions/contact.actions.ts` | createContact / updateContact / deleteContact |
| `src/features/customers/actions/address.actions.ts` | createAddress / updateAddress / deleteAddress |

### Wave 1b — Activity Timeline

| File | Role |
|---|---|
| `src/domain/ports/customer-activity.port.ts` | `ICustomerActivityRepository` interface + Zod schemas |
| `src/domain/services/customer-activity.service.ts` | `CustomerActivityService` — single write path |
| `src/infrastructure/repositories/_providers/supabase/customer-activity.ts` | Supabase implementation |
| `src/infrastructure/repositories/customer-activity.ts` | Provider router + exported singleton service |
| `src/features/customers/actions/activity.actions.ts` | `addCustomerNote`, `loadMoreActivities` server actions |
| `src/features/customers/components/ActivityFeed.tsx` | Filter chips + timeline + load more + Quick Note rail |
| `src/features/customers/components/ActivityEntry.tsx` | Single timeline entry (left border + icon + metadata) |

---

## Key Architecture Decisions

### 1. `customers-mutable.ts` Thin Barrel (CI Fix)

Adding `import 'server-only'` to `customers.ts` (the provider router) caused a Turbopack build failure because 4 client components (`SettingsColorsClient`, `ProductionBoard`, `GarmentDetailDrawer`, settings pricing page) imported `getCustomersMutable` from that file. Turbopack traces dynamic imports (`await import('./_providers/supabase/customers')`) at bundle time even inside async functions.

**Fix**: Created `customers-mutable.ts` — a thin barrel that exports only `getCustomersMutable` (no server-only dependency). All 4 client-side callers now import from `customers-mutable`. The router keeps `import 'server-only'`.

**Pattern to reuse**: Whenever a router file has `import 'server-only'` AND has a synchronous/mutable accessor needed by client components, extract the accessor into a separate client-safe barrel.

### 2. Provider Router — Why No `isSupabaseMode()` Guard in Tests

The router uses `process.env.DATA_PROVIDER === 'supabase'` rather than a helper to avoid throwing when the env var is unset. In Vitest, an unset `DATA_PROVIDER` falls through to the mock provider. The Supabase module is lazy-loaded via `await import(...)`, which prevents postgres/drizzle from entering the test bundle.

### 3. `lifecycleStage: 'contract'` Domain/DB Mismatch

The domain entity allows `'contract'` for backward compat with the quoting engine. The DB enum excludes it. The Supabase repo maps `'contract'` → `'repeat'` at write paths and filters it from `inArray` conditions at read time. **Deferred**: Wave 3 (Step 13) removes `'contract'` from the domain enum.

### 4. Legacy Flat Fields on Customer Entity

The new schema derives `name/email/phone/address` from `contacts[]`. Until Wave 3 wires primary contacts, the `mapCustomerRow()` mapper returns safe placeholders:
- `name` → company name
- `email` → `'unknown@placeholder.local'` (sentinel, not shown in UI)
- `phone` / `address` → `''`

### 5. Cursor-based Pagination for Activity Feed

Repository `listForCustomer` fetches `limit + 1` rows. If `length > limit`, `hasMore = true` and the last row's `createdAt` becomes `nextCursor`. Filter changes reset the cursor and re-fetch from scratch via a `useEffect` dependency on `activeFilter`. This avoids stale pagination state.

### 6. `vi.hoisted` + `vi.mock` for Router Coverage

The 23 Supabase-mode branches in `customers.ts` were uncovered, pulling repository line coverage below the 80% CI threshold. Fix: used `vi.hoisted()` to create a mock `supabaseCustomerRepository` object (23 `vi.fn()` methods), then `vi.mock('../_providers/supabase/customers', () => ({ supabaseCustomerRepository: mockRepo }))` to intercept the dynamic import. `vi.stubEnv('DATA_PROVIDER', 'supabase')` in `beforeEach` triggered the Supabase branch. Result: `customers.ts` reached 100% line/branch/function coverage.

---

## Deferred Items

| Item | Deferred To |
|---|---|
| `getQuotes/getJobs/getInvoices(customerId)` cross-join | Wave 3 (customer-cross-vertical) |
| `getArtworks(customerId)` | Artwork vertical (P5 M1) |
| `getAccountBalance(customerId)` | Wave 2a (customer-financial) |
| `getPreferences(customerId)` | Wave 2b (customer-intelligence) |
| Remove `'contract'` from lifecycle domain enum | Wave 3 Step 13 |
| Remove legacy flat fields (name/email/phone/address) | Wave 3 Step 13 |
| `actorId` in activity records (currently `null`) | Wave 2 |
| Color resolution by invoice/quote status in ActivityFeed | Wave 3 cross-vertical wiring |

---

## CI Issues Encountered This Session

Three CI failures were fixed before merge:

1. **Build failure — `server-only` in client bundle**: resolved via `customers-mutable.ts` barrel (see §1 above)
2. **Format check — unformatted files from concurrent PR #760**: rebased onto latest main, ran `prettier --write` on 8 affected files from P4 M2 Wave 0
3. **Coverage threshold (80% lines/functions)**: added 23 Supabase-mode routing tests using `vi.hoisted` + `vi.mock` + `vi.stubEnv`

**Lesson**: Always run `npx prettier --write <file>` before committing new test files. The Husky pre-commit hook is not executable in git worktree environments, so it never runs as a safety net.

---

## Workspace Artifacts (now deleted)

- `docs/workspace/20260228-customer-vertical/wave1a-notes.md`
- `docs/workspace/20260228-customer-vertical/wave1b-notes.md`
- Full workspace at `docs/workspace/20260228-customer-vertical/` (retained for Wave 2 build)
