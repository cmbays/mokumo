# P4 M2 W1B — Hub Surfaces Implementation Notes

**Pipeline**: `20260302-p4-m2-pricing-editor`
**Wave**: 1B — GarmentMarkupEditor + RushTierEditor + PricingTemplateCard adaptation
**Branch**: `worktree-graceful-stirring-moonbeam`

---

## What Was Built

### New Components

**`GarmentMarkupEditor.tsx`** (237 lines, `src/features/pricing/components/`)

- Inline editor for 6 fixed garment markup categories (tshirt/hoodie/hat/tank/polo/jacket)
- `Map<string, number>` state with pure-function helpers (buildRulesMap, applyMultiplierChange, markupPctLabel, rulesMapToInserts)
- Saves via `saveMarkupRules` server action inside `startTransition`
- All multiplier arithmetic via big.js (`money().minus(1).times(100)`)

**`RushTierEditor.tsx`** (320 lines)

- Variable-row rush tier table with click-to-edit cells
- Pure helpers: `tiersToRows`, `rowsToInserts`, `addTierRow`, `removeTierRow`, `updateTierField`
- pctSurcharge fraction↔display conversion: `money(t.pctSurcharge).times(100)` / `money(pctDisplay).div(100)`
- Saves via `saveRushTiers` server action inside `startTransition`

**`CellInput.tsx`** (94 lines) — extracted during review

- Click-to-edit inline table cell, extracted from RushTierEditor after U-MOD-1 flag
- `min-h-11 md:min-h-0` touch target, `focus-visible:ring-action` (no `ring-inset`)
- blur/Enter commit, Escape cancel pattern

**`GarmentMarkupEditor.test.ts`** — 19 tests covering all 4 pure helper functions
**`RushTierEditor.test.ts`** — 24 tests covering all 5 pure helper functions

- Both mock the server action import to avoid server-only guard: `vi.mock('@/app/(dashboard)/settings/pricing/pricing-templates-actions', ...)`

### Modified Components

**`PricingTemplateCard.tsx`** — adapted to P4 M1 entity shape

- `serviceType` changed from `'screen-print' | 'dtf'` → `'screen_print' | 'dtf'` (underscore, pricing entity)
- `updatedAt` changed from `string` → `Date` (formatRelativeTime now handles both)
- `MarginIndicator percentage` now optional — hub list view doesn't have per-job margin %
- Local SERVICE_TYPE maps intentionally kept (different key type AND different values vs domain constants)
- `formatRelativeTime` now imported from `@shared/lib/format` (extended to accept `Date | string`)

**`MarginIndicator.tsx`** — `percentage` made optional

- When omitted, tooltip shows "Margin: Healthy" (label only, no "0.0%")
- Backward compatible — all callers that pass percentage still work

**`shared/lib/format.ts`** — extended `formatRelativeTime(Date | string)`

**`settings/pricing/page.tsx`** — Wave 2C type shims

- Inline adapter objects with `// TODO(Wave2C)` for serviceType underscore/hyphen mismatch
- Module-level `getCustomersMutable()` moved after imports with Phase 1 comment

---

## Key Architectural Decisions

### pctSurcharge Fraction ↔ Display Conversion

- DB stores `0.10` (fraction), editor shows `10` (percentage)
- Conversion boundary: `tiersToRows` (fraction → display) and `rowsToInserts` (display → fraction)
- `displayOrder` is renumbered positionally in `rowsToInserts` — no sparse ordering

### shopId Sentinel

- Both `rulesMapToInserts` and `rowsToInserts` return `shopId: ''`
- Server action overwrites from the authenticated session
- Pattern established in Wave 0 — intentional, not a bug

### serviceType Underscore vs Hyphen Mismatch

- Pricing template entity: `'screen_print'` (underscore — SQL naming)
- Domain `ServiceType`: `'screen-print'` (hyphen)
- Both `PricingTemplateCard` and `page.tsx` have `// TODO(Wave2C)` adapter shims
- Wave 2C will align entities into a single discriminated union

---

## Review Orchestration Results

**Run 1**: Gate FAIL — 1 critical (MarginIndicator percentage={0} hardcoded)
**Run 2**: Gate NEEDS_FIXES — 7 major (D-MOB-2 ×4, U-TYPE-2 ×2, U-MOD-4 ×1)
**Run 3**: Gate PASS_WITH_WARNINGS

Fixes applied across runs:

1. Critical → MarginIndicator: percentage optional, removed hardcoded 0
2. Major → D-MOB-2: min-h-11 md:min-h-0 on all action buttons (Save All ×2, Add Tier, Remove row)
3. Major → U-TYPE-2: Comments added on type assertions in handleWizardSave
4. Major → U-MOD-4: Module-level customers call documented with Phase 1 comment
5. Major → D-MOB-4: sm:grid-cols-2 → md:grid-cols-2 in template grids
6. Major (icon sizes): Loader2 size-3 → size-4 in both editors
7. Major (focus ring): ring-ring → ring-action in PricingTemplateCard
8. Major (duplication): formatRelativeTime extracted to shared lib
9. Major (extraction): CellInput moved to separate file

Deferred warnings → GitHub Issues:

- U-MOD-1: page.tsx 362 lines (usePricingHub hook)
- U-MOD-1: RushTierEditor 320 lines (extract helpers to .helpers.ts)
- D-FIN-7: flatFee prefix="$" vs formatCurrency

---

## Tests

- 24 tests for RushTierEditor pure helpers
- 19 tests for GarmentMarkupEditor pure helpers
- 2243 total tests passing across 109 test files
- TypeScript clean (tsc --noEmit exit 0)
- Build clean (Next.js production build passes)
