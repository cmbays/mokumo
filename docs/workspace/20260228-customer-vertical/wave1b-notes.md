# Wave 1b Session Notes — `customer-activity`

**Branch**: `worktree-cryptic-seeking-pearl`
**Date**: 2026-03-02
**Pipeline**: `20260228-customer-vertical`
**Task**: 1.2 — `customer-activity` (parallel with Task 1.1 `customer-crud`)

---

## What Was Built

All 7 files required by the Wave 1b spec were created:

| File | Role |
|------|------|
| `src/domain/ports/customer-activity.port.ts` | `ICustomerActivityRepository` interface + Zod schemas |
| `src/domain/services/customer-activity.service.ts` | `CustomerActivityService` — the single write path |
| `src/infrastructure/repositories/_providers/supabase/customer-activity.ts` | Supabase implementation |
| `src/infrastructure/repositories/customer-activity.ts` | Provider router + exported singleton service |
| `src/features/customers/actions/activity.actions.ts` | `addCustomerNote`, `loadMoreActivities` server actions |
| `src/features/customers/components/ActivityFeed.tsx` | Timeline UI (filter chips + entries + load more + Quick Note rail) |
| `src/features/customers/components/ActivityEntry.tsx` | Single timeline entry (left border + icon + content + metadata) |

Two existing files were updated:

| File | What Changed |
|------|-------------|
| `src/domain/ports/index.ts` | Added `export type { ICustomerActivityRepository }` |
| `src/infrastructure/bootstrap.ts` | Added export + compile-time assertion for `ICustomerActivityRepository` |

---

## Key Architecture Decisions

### 1. Service → Port → Repository DI chain

```
Server Action
  → customerActivityService.log(input)       [CustomerActivityService — domain]
    → ICustomerActivityRepository.insert()   [port interface — domain]
      → supabaseCustomerActivityRepository   [concrete impl — infrastructure]
        → db.insert(customerActivities)      [Drizzle + Supabase]
```

The `CustomerActivityService` is constructed once in `customer-activity.ts` (the provider router) and exported as a singleton `customerActivityService`. Server actions import this singleton — they never hold a reference to the repo directly.

### 2. Port-level Zod schemas (not just TypeScript types)

All data shapes are defined as Zod schemas in the port file, not as TypeScript interfaces. Domain types are derived via `z.infer<>`. This gives:
- Runtime validation in the service before persistence
- Clear single source of truth for the `ActivityInput` shape
- Wave 3 consumers (auto-logging in quote/job/invoice actions) can import the schema for validation

### 3. Cursor-based pagination design

- Repository `listForCustomer` fetches `limit + 1` rows
- If `length > limit`, `hasMore = true` and the last row's `createdAt` becomes `nextCursor`
- The `ActivityFeed` component manages accumulated pages in local state, appending on "Load more"
- Filter changes trigger a fresh re-fetch (cursor reset to null)

### 4. Provider router pattern

`customer-activity.ts` follows the same provider router pattern as `garments.ts`:
```typescript
function getRepo(): ICustomerActivityRepository {
  return supabaseCustomerActivityRepository
}
export const customerActivityService = new CustomerActivityService(getRepo())
```
This hook point allows a mock repo to be injected in future test environments without touching service or action code.

### 5. Zod v4 API note

The project uses Zod v4 (`^4.3.6`). `ZodError` in v4 uses `.issues[]` not `.errors[]` (v3 API). Used `.issues[0]?.message` in server actions.

---

## Design Spec Implementation

### Timeline entry
- `border-left: 3px solid [color]` as only grouping signal — implemented via inline `borderLeftColor` style on a `border-l-[3px]` div
- No card background — entries sit directly on `bg-background`
- `max-width: 700px`, `padding: 12px 0 16px 16px`, `margin-bottom: 24px`
- Right-side 2-line metadata stack: status badge + amount (line 1), timestamp (line 2)

### Filter chips
- Pill style matching spec: `padding: 5px 14px; border-radius: 20px`
- Inactive state: `border: 1px solid rgba(255,255,255,0.17)`
- Active state: `border: 1px solid rgba(42,185,255,0.59); background: rgba(42,185,255,0.17); color: #2AB9FF`

### Source icons (Lucide)
- `manual` → `Clock`
- `system` → `Bot`
- `email` → `Mail`
- `sms` / `voicemail` → `Phone`
- `portal` → `Globe`

### Quick Note right rail
- `width: 360px; border-left: 1px solid rgba(255,255,255,0.14)`
- Textarea: `background: #1C1D1E; border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; min-height: 88px`
- Save button: neobrutalist `4px 4px 0px rgba(0,0,0,0.5)` shadow when active

---

## Deferred Items

### actorId (Wave 2)
The `actorId` field is always `null` in Wave 1b. The `addCustomerNote` action has a `// TODO Wave 2` comment where the authenticated userId from `verifySession()` should be injected.

### Color resolution by invoice/quote status (Wave 3)
The `ActivityFeed.resolveEntryAppearance()` function uses source-based coloring only (manual → blue, system → muted). Wave 3 cross-vertical wiring will enrich entries with invoice status (sent=gold, overdue=red, paid=green) and quote status (draft=gold, sent=blue, etc.) via the `relatedEntityType` + additional metadata.

### Entity label resolution (Wave 3)
The `entityLabel` prop in `ActivityEntry` is currently passed through from the caller. Wave 3 will supply formatted labels like `"Quote Q-001"` from the related entity data.

---

## Quality Checklist

- [x] No `console.log` — `logger.child({ domain: 'customers' })` only
- [x] No `any` types — Zod inference or explicit types throughout
- [x] No `interface` declarations — `type` and `z.infer<>` only
- [x] `CustomerActivityService.log()` is the only write path
- [x] Timeline entries have NO card background
- [x] `border-left: 3px solid [status-color]` is the grouping signal
- [x] Source icons from Lucide only
- [x] `npx tsc --noEmit` passes clean (0 errors)
- [x] `npm test` no regressions (1935 tests pass; 1 pre-existing `customers.test.ts` failure unrelated to this work)
- [x] `npx prettier --write` run on all changed files
- [x] Did NOT touch `src/infrastructure/repositories/customers.ts`

---

## Links

- Plan: `docs/workspace/20260228-customer-vertical/plan.md` — Task 1.2
- Design spec: `docs/workspace/20260228-customer-vertical/designs/design-spec.md`
- Port: `src/domain/ports/customer-activity.port.ts`
- Service: `src/domain/services/customer-activity.service.ts`
- Supabase impl: `src/infrastructure/repositories/_providers/supabase/customer-activity.ts`
- Provider router: `src/infrastructure/repositories/customer-activity.ts`
- Actions: `src/features/customers/actions/activity.actions.ts`
- UI: `src/features/customers/components/ActivityFeed.tsx` + `ActivityEntry.tsx`
