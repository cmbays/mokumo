---
pipeline: 20260302-p4-m2-pricing-editor
session: Wave 0 — pricing-backend
created: 2026-03-02
---

# Wave 0 — Pricing Backend: Session Notes

## What Was Built

### 1. Port interface extended (`src/domain/ports/pricing-template.repository.ts`)
- `listTemplates(shopId, serviceType?)` — added optional serviceType filter
- `deleteTemplate(id, shopId)` — shop scope guard (both IDs required)
- `setDefaultTemplate(shopId, id, serviceType)` — transactional: clear then set

### 2. Supabase repository (`src/infrastructure/repositories/pricing/supabase-pricing-template.repository.ts`)
- `listTemplates`: uses `and(eq(shopId), eq(serviceType))` when serviceType provided; falls back to `eq(shopId)` alone
- `deleteTemplate`: `DELETE WHERE id AND shop_id`. Both UUID-validated at DAL boundary.
- `setDefaultTemplate`: transaction with two `UPDATE` statements — first `SET is_default=false WHERE shopId + serviceType AND id <> target`, then `SET is_default=true WHERE id = target`. Uses `ne()` from drizzle-orm.

### 3. Facade updated (`src/infrastructure/repositories/pricing-templates.ts`)
- `listTemplates` signature updated to match new optional arg
- `deleteTemplate` + `setDefaultTemplate` re-exported

### 4. Server actions (`src/app/(dashboard)/settings/pricing/pricing-templates-actions.ts`)
11 actions, all gate on `verifySession()` first:
- `listPricingTemplates(serviceType?)` → `listTemplates`
- `getPricingTemplate(id)` → `getTemplateById`
- `createPricingTemplate(data)` → injects `shopId` from session
- `updatePricingTemplate(id, data)` → takes full `Omit<PricingTemplateInsert, 'id'|'shopId'>` (not partial — upsertTemplate requires all required fields)
- `deletePricingTemplate(id)` → `shopId` from session, never from caller
- `savePricingMatrix(templateId, cells)` → `upsertMatrixCells`
- `setDefaultPricingTemplate(id, serviceType)` → `shopId` from session
- `getMarkupRulesAction()` → `getMarkupRules`
- `saveMarkupRules(rules)` → `upsertMarkupRules`
- `getRushTiersAction()` → `getRushTiers`
- `saveRushTiers(tiers)` → `upsertRushTiers`

Return envelope: `{ data: T; error: null } | { data: null; error: string }` — typed `ActionResult<T>`.

## Architecture Decision: Actions in `app/` not `features/`

The plan specified `src/features/pricing/actions/` but the ESLint boundary rule blocks
`features/` from importing `infrastructure/`. Per `docs/ARCHITECTURE.md`:
- `features/` → can only import from `domain/` and `shared/`
- `app/` → can import from `features/`, `shared/`, and `infrastructure/`

**Decision**: Actions placed in `src/app/(dashboard)/settings/pricing/pricing-templates-actions.ts`
matching the existing pattern (`actions.ts` for overrides).

This is architecturally correct: server actions are the wiring layer that belongs in `app/`.

## Test Coverage
- 36 repo tests (covers deleteTemplate, setDefaultTemplate, listTemplates with filter)
- 40 action tests (covers all 11 actions + auth, shopId injection, error envelope)
- Total: 76 new tests

## Self-Review Findings (Review Orchestration — 2 iterations)

### Iteration 1: FAIL — 4 criticals fixed
All were BOLA (Broken Object Level Authorization) — authenticate but not authorize:

1. **`getPricingTemplate`**: fetched by id with no shop check → added `if (data && data.shopId !== session.shopId) return err('Template not found')`
2. **`savePricingMatrix`**: no ownership check before cell write → added `getTemplateById` verification before `upsertMatrixCells`
3. **`upsertTemplate` (repo)**: UPDATE `WHERE id` only → changed to `WHERE id AND shopId`
4. **`setDefaultTemplate` (repo)**: second TX UPDATE `WHERE id` only → changed to `WHERE id AND shopId`

### Iteration 1: 5 majors also fixed
- Added `getDefaultPricingTemplate` action (missing primary read path)
- Renamed `getMarkupRulesAction`/`getRushTiersAction` → `getMarkupRules`/`getRushTiers` (no `Action` suffix; used import alias to avoid collision with facade)
- Added `serviceType` validation to `setDefaultPricingTemplate` (consistent with `getDefaultPricingTemplate`)
- Replaced `as never` test assertions with `CREATE_DATA` fixture
- Fixed `(tx: unknown)` mock type → `MockTx` with proper type for `delete/insert/update`

### Iteration 2: PASS_WITH_WARNINGS
- 2 warnings deferred as GitHub Issues:
  - #758: `savePricingMatrix` TOCTOU (check+write not in same transaction)
  - #759: `upsertTemplate` missing `isValidUuid(data.shopId)` guard (theoretical risk only)

## Quality Gates
- `npx tsc --noEmit` → 0 errors
- `npm run lint` → 0 errors (24 pre-existing warnings)
- `npm run test` → 2130 tests passing, thresholds met
- PR: #760
