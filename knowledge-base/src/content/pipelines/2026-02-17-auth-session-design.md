---
title: 'Auth Session Design — verifySession() for the DAL'
subtitle: 'Phase 1 stub + 4-layer defense model for Phase 2 Supabase migration'
date: 2026-02-17
phase: 1
pipelineName: 'Auth Session'
pipelineType: horizontal
products: [dashboard, quotes, customers, invoices, jobs, garments, screens]
tools: []
stage: build
tags: [build, decision, feature]
sessionId: '0a1b62cb-84e6-46ff-b178-9021bb5a09ae'
branch: 'session/0217-auth-session-design'
status: complete
---

## Summary

Implemented `verifySession()` — the server-side auth verification function that forms Layer 2 of the 4-layer security model. This is a Phase 1 stub that validates the demo-access cookie; Phase 2 swaps the internals to Supabase Auth without changing any consumer code.

Also classified all 9 DAL domain files as `PUBLIC` or `AUTHENTICATED`, and fixed a pre-existing security gap in `middleware.ts` where cookie presence was checked but value was not validated.

**Issue**: https://github.com/cmbays/mokumo/issues/362
**PR**: https://github.com/cmbays/mokumo/pull/424
**Design doc**: https://github.com/cmbays/mokumo/blob/main/docs/strategy/auth-session-design.md

## Why This Matters

The existing `middleware.ts` only checked that the `demo-access` cookie _existed_ — it didn't verify its value. This is the pattern flagged by [CVE-2025-29927](https://nextjs.org/blog/security-nextjs-server-components-actions): middleware runs at the CDN edge and cannot be trusted as the sole security boundary. The fix is a `verifySession()` function that runs **inside the server trust boundary** (Server Components and Server Actions) and cannot be bypassed by a client.

## 4-Layer Defense Model

```
Layer 1 — middleware.ts (edge)         UX redirect for obvious unauthenticated requests. NOT a security boundary.
Layer 2 — verifySession() (server)     The real security check. Runs inside server trust boundary. Cannot be bypassed.
Layer 3 — DAL (AUTHENTICATED funcs)    Phase 2: DAL functions call verifySession() before returning data.
Layer 4 — RLS (Supabase/PostgreSQL)    Phase 2: DB-level shop_id isolation. Defense in depth.
```

**Phase 1 status:**

- Layer 1: ✅ Fixed (cookie value validated: `=== 'true'`)
- Layer 2: ✅ Implemented (`lib/auth/session.ts`)
- Layer 3: 📋 Classified (comments in all DAL files; enforcement deferred to Phase 2)
- Layer 4: ⬜ Phase 2 (requires Supabase schema)

## Files Changed

| File                   | Change                                                                                |
| ---------------------- | ------------------------------------------------------------------------------------- |
| `lib/auth/session.ts`  | **New** — `Session` type, `verifySession()` stub, React `cache()` wrap, Phase 2 JSDoc |
| `middleware.ts`        | Fix: `!demoAccess` → `demoAccess !== 'true'` (value validation)                       |
| `lib/dal/garments.ts`  | Auth classification: `PUBLIC`                                                         |
| `lib/dal/colors.ts`    | Auth classification: `PUBLIC`                                                         |
| `lib/dal/customers.ts` | Auth classification: `AUTHENTICATED`                                                  |
| `lib/dal/quotes.ts`    | Auth classification: `AUTHENTICATED`                                                  |
| `lib/dal/invoices.ts`  | Auth classification: `AUTHENTICATED`                                                  |
| `lib/dal/jobs.ts`      | Auth classification: `AUTHENTICATED`                                                  |
| `lib/dal/screens.ts`   | Auth classification: `AUTHENTICATED`                                                  |
| `lib/dal/artworks.ts`  | Auth classification: `AUTHENTICATED`                                                  |
| `lib/dal/settings.ts`  | Auth classification: `AUTHENTICATED`                                                  |

## Session Type

```ts
type Session = {
  userId: string // Phase 2: Supabase Auth UUID
  role: 'owner' | 'operator' // Drives UI permissions and DAL row filtering
  shopId: string // Phase 2: RLS shop isolation
}
```

The `Session` shape is intentionally identical in Phase 1 and Phase 2 — all consumers of `verifySession()` require zero changes when Phase 2 is wired in.

## DAL Classification

**PUBLIC** (no auth required — reference/catalog data, no PII or financials):

- `garments.ts`, `colors.ts`

**AUTHENTICATED** (must call `verifySession()` in Phase 2 before returning data):

- `customers.ts` (PII), `quotes.ts` (financial), `invoices.ts` (financial), `jobs.ts` (operational), `screens.ts` (operational), `artworks.ts` (IP), `settings.ts` (configuration)

## Security Review Findings Applied

Two parallel review agents (security + code quality) reviewed PR #424 before merge. Security review found 4 items:

| #   | Severity | Finding                                                               | Fix Applied                                   |
| --- | -------- | --------------------------------------------------------------------- | --------------------------------------------- |
| 1   | HIGH     | Cookie presence checked but value not validated in `verifySession()`  | `demoAccess !== 'true'`                       |
| 2   | HIGH     | Same gap in `middleware.ts`                                           | `demoAccess !== 'true'`                       |
| 3   | MEDIUM   | `NODE_ENV !== 'production'` includes test environments in mock bypass | `NODE_ENV === 'development'`                  |
| 4   | MEDIUM   | JSDoc Phase 2 snippet used `!` non-null assertions on env vars        | Replaced with explicit runtime `throw`        |
| 5   | LOW      | `MOCK_SESSION` returned by reference (mutation risk)                  | Returned as `{ ...MOCK_SESSION }` spread copy |

Code quality review: clean APPROVE, no issues above threshold.

## Key Decisions

**`Returns Session | null` (not throw)**: Callers can cleanly distinguish "unauthenticated user" from "server error". Throwing conflates both.

**React `cache()` wrap**: Without it, a page calling 7 AUTHENTICATED DAL functions in Phase 2 would make 7 DB round-trips. `cache()` memoizes per-request — at most 1 verification per render pass.

**`shopId` on Session even in Phase 1**: Multi-tenancy safety valve. Ensures RLS policies can be written against `shopId` from day one without touching consumer code later.

## Phase 2 Migration Path

1. `npm install @supabase/supabase-js @supabase/ssr`
2. Replace `verifySession()` internals with `supabase.auth.getUser()` + `shop_members` join
3. Wire `verifySession()` into all AUTHENTICATED DAL functions
4. Update `middleware.ts` to verify Supabase session token
5. Enable PostgreSQL RLS policies on all AUTHENTICATED tables

Full migration steps with code snippets: `docs/strategy/auth-session-design.md`
