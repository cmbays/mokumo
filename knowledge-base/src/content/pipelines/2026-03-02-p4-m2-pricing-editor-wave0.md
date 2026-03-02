---
title: 'P4 M2 Wave 0 — Pricing Editor Backend'
subtitle: 'Port extension, Supabase repo, and 11 server actions for the Pricing Editor UI'
date: 2026-03-02
phase: 2
pipelineName: 'Pricing Editor UI'
pipelineType: vertical
products: []
domains: ['pricing']
tools: []
stage: build
tags: ['feature', 'build', 'architecture']
sessionId: '0a1b62cb-84e6-46ff-b178-9021bb5a09ae'
branch: 'worktree-happy-chasing-pearl'
status: complete
---

## What Was Built

Wave 0 of P4 M2 extends the pricing backend to support the Pricing Editor UI. No UI was built in this wave — it is purely backend infrastructure.

**PR**: #760 (merged 2026-03-02)

### Files Changed

| File | Change |
|------|--------|
| `src/domain/ports/pricing-template.repository.ts` | Extended with `listTemplates(serviceType?)`, `deleteTemplate`, `setDefaultTemplate` |
| `src/infrastructure/repositories/pricing/supabase-pricing-template.repository.ts` | Implemented all three new methods |
| `src/infrastructure/repositories/pricing-templates.ts` | Re-exported new methods from facade |
| `src/app/(dashboard)/settings/pricing/pricing-templates-actions.ts` | 12 server actions (was 0) |

### Architecture Decision: Actions in `app/` not `features/`

The plan originally specified `src/features/pricing/actions/`. The ESLint boundary rule blocks `features/` from importing `infrastructure/`. Per `docs/ARCHITECTURE.md`, `app/` can import from both `features/` and `infrastructure/`.

**Decision**: Actions live in `src/app/(dashboard)/settings/pricing/pricing-templates-actions.ts` — matching the existing pattern for the dashboard layer. This is architecturally correct: server actions are wiring layer, not domain logic.

### Server Actions (12 total)

All gate on `verifySession()` first. Return `ActionResult<T>` = `{ data: T; error: null } | { data: null; error: string }`.

- `listPricingTemplates(serviceType?)` — filtered list by shop
- `getPricingTemplate(id)` — single template with cells + **shop ownership check**
- `createPricingTemplate(data)` — injects `shopId` from session
- `updatePricingTemplate(id, data)` — injects `shopId` from session
- `deletePricingTemplate(id)` — `shopId` always from session
- `savePricingMatrix(templateId, cells)` — **ownership check via `getTemplateById` before write**
- `setDefaultPricingTemplate(id, serviceType)` — `shopId` from session + `serviceType` validation
- `getDefaultPricingTemplate(serviceType)` — primary read path for pricing editor on load
- `getMarkupRules()` — shop-scoped
- `saveMarkupRules(rules)` — replaces all markup rules
- `getRushTiers()` — ordered by `displayOrder`
- `saveRushTiers(tiers)` — replaces all rush tiers

### Import Aliasing Pattern

`getMarkupRules` and `getRushTiers` exist with the same names in both the facade (`@infra/repositories/pricing-templates`) and the actions file (as exported actions). Resolved with import aliasing:

```ts
import {
  getMarkupRules as fetchMarkupRules,
  getRushTiers as fetchRushTiers,
} from '@infra/repositories/pricing-templates'

export async function getMarkupRules() { ... fetchMarkupRules(...) }
export async function getRushTiers() { ... fetchRushTiers(...) }
```

This keeps the public action API clean without renaming the facade.

## Security Review — 2 Iterations

The review orchestration pipeline (6-stage, 3 agents: `build-reviewer`, `design-auditor`, `finance-sme`) ran twice. All 4 criticals and 5 majors were fixed before the PR was created.

### Iteration 1: FAIL — 4 critical BOLA fixes

All were BOLA (Broken Object Level Authorization) — authenticated but not authorized:

1. **`getPricingTemplate` action**: fetched by ID with no shop check → any authenticated user from any shop could read another shop's full template. Fixed: `if (data && data.shopId !== session.shopId) return err('Template not found')`

2. **`savePricingMatrix` action**: no ownership check before replacing cells → any user could overwrite another shop's pricing matrix. Fixed: added `getTemplateById` verification before `upsertMatrixCells`.

3. **`upsertTemplate` repo**: UPDATE WHERE `id` only → cross-tenant overwrite possible with a known UUID. Fixed: `WHERE id AND shopId` in the Drizzle `and()` clause.

4. **`setDefaultTemplate` repo**: second UPDATE in transaction WHERE `id` only → cross-tenant default-setting. Fixed: `WHERE id AND shopId`.

### Iteration 1: 5 majors also fixed

- Missing `getDefaultPricingTemplate` action (primary read path for the editor UI was absent)
- Renamed `getMarkupRulesAction` → `getMarkupRules`, `getRushTiersAction` → `getRushTiers` (asymmetric naming)
- Added `serviceType` validation to `setDefaultPricingTemplate` (inconsistent with `getDefaultPricingTemplate`)
- Replaced `as never` test assertions with typed `CREATE_DATA` fixture
- Fixed `(tx: unknown)` mock type → `MockTx` alias with correct Drizzle types

### Iteration 2: PASS_WITH_WARNINGS

Two warnings deferred as GitHub Issues:
- **#758**: `savePricingMatrix` TOCTOU — ownership check and write are separate (un-transacted) DB calls. Low risk now (single-user), needs fixing before multi-user or concurrent sessions. Fix: add `shopId` to `upsertMatrixCells` and enforce inside transaction.
- **#759**: `upsertTemplate` update path skips `isValidUuid(data.shopId)` guard. Theoretical only — `shopId` always comes from trusted `session.shopId`.

## Test Coverage

- **36 repo tests**: deleteTemplate, setDefaultTemplate, listTemplates with filter, MockTx type correctness
- **40 action tests**: all 12 actions, auth gate, shopId injection, error envelope, ownership rejection
- **Total**: 76 new tests (2130 project total, 104 files)

## Review Orchestration Gap

`finance-sme` was NOT triggered by the config globs for P4 pricing paths. The financial domain patterns in `tools/orchestration/config/review-domains.json` predate Clean Architecture and only match legacy paths (`app/**/quote*/**`, `components/features/**/Invoice*`). The pricing paths (`src/app/(dashboard)/settings/pricing/**`, `src/infrastructure/repositories/pricing/**`, `src/domain/entities/pricing-template*`) match no financial domain rules.

`finance-sme` was injected manually via gap-detect (Stage 4). It correctly returned `[]` — Wave 0 is pure CRUD with no arithmetic.

**Config improvement needed**: Add pricing path patterns to the `financial` domain in `review-domains.json`. Filed as a config improvement issue in wrap-up.

## Quality Gates at Merge

- `npx tsc --noEmit` → 0 errors
- `npm run lint` → 0 errors (24 pre-existing warnings)
- `npm run test` → 2130 tests passing

## Resume Command

```bash
claude --resume 0a1b62cb-84e6-46ff-b178-9021bb5a09ae
```

## What's Next

**Wave 1** (two parallel sessions, both depend on `pricing-backend`):
- `matrix-cell-grid` — `MatrixCellGrid` shared component with pure logic functions for add/remove rows/columns and big.js cell tinting
- `hub-surfaces` — `GarmentMarkupEditor`, `RushTierEditor`, and `PricingTemplateCard` adaptation

See `manifest.yaml` in workspace (deleted after this commit) for full session prompts.
