---
pipeline: 20260302-p4-m2-pricing-editor
created: 2026-03-02
phase: build
---

# P4 M2: Pricing Editor UI — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use `build-session-protocol` at the end of every session.

**Goal:** Wire the Pricing Settings UI to the P4 M1 Supabase repository, replacing incompatible
Phase 1 mock code, and add the two missing editor surfaces (Garment Markup Rules, Rush Tiers).

**Architecture:** Clean Architecture — server actions in `features/pricing/actions/` call the
port-backed Supabase repo; async RSC pages fetch and pass initial data to client components;
client components manage optimistic state and call server actions via startTransition. Two new
port methods (`deleteTemplate`, `setDefaultTemplate`) extend the P4 M1 foundation.

**Tech Stack:** Next.js App Router (async RSC + `'use client'`), Drizzle + Supabase, Zod,
React Hook Form, shadcn/ui, Tailwind, big.js for financial arithmetic.

---

## Dependency Graph

```
Wave 0 ──► Wave 1A ──► Wave 2A (sp-editor-rebuild)
           (matrix)     Wave 2B (dtf-editor-rebuild)
                  ╲
Wave 0 ──► Wave 1B ──► Wave 2C (pricing-hub-rebuild)
           (hub-surfaces)
                              ╲
                               Wave 3 (cleanup)
```

---

## Wave 0: Backend Foundation (Serial)

One session. All UI waves depend on this being merged.

### Task 0.1: Port extension + server actions (`pricing-backend`)

**Goal:** Extend the P4 M1 repository port with 2 new methods and implement all 11 server actions
that the editor UI will call.

**Files touched:**

- `src/domain/ports/pricing-template.repository.ts` — add `deleteTemplate` + `setDefaultTemplate`
- `src/infrastructure/repositories/pricing/supabase-pricing-template.repository.ts` — implement both
- `src/infrastructure/repositories/pricing-templates.ts` — add 2 facade exports
- `src/features/pricing/actions/pricing-templates.ts` — NEW: 11 server actions
- `src/features/pricing/actions/__tests__/pricing-templates.test.ts` — NEW: action tests

**Port methods to add:**

```ts
deleteTemplate(id: string, shopId: string): Promise<void>
// DELETE WHERE id = ? AND shop_id = ? (shop scope guard)

setDefaultTemplate(shopId: string, id: string, serviceType: string): Promise<void>
// TX: UPDATE SET is_default=false WHERE (shopId, serviceType)
//     UPDATE SET is_default=true  WHERE id = ?
```

**Server actions (in `src/features/pricing/actions/pricing-templates.ts`):**

```ts
// All call verifySession() → { shopId } first
listPricingTemplates(serviceType?: string)  → repo.listTemplates(shopId, serviceType?)
getPricingTemplate(id: string)              → repo.getTemplateById(id)
createPricingTemplate(data)                 → repo.upsertTemplate({ ...data, shopId })
updatePricingTemplate(id, data)             → repo.upsertTemplate({ id, ...data })
deletePricingTemplate(id)                   → repo.deleteTemplate(id, shopId)
savePricingMatrix(templateId, cells[])      → repo.upsertMatrixCells(templateId, cells)
setDefaultTemplate(id, serviceType)         → repo.setDefaultTemplate(shopId, id, serviceType)
getMarkupRules()                            → repo.getMarkupRules(shopId)
saveMarkupRules(rules[])                    → repo.upsertMarkupRules(shopId, rules)
getRushTiers()                              → repo.getRushTiers(shopId)
saveRushTiers(tiers[])                      → repo.upsertRushTiers(shopId, tiers)
```

**Quality gates:** 80% test coverage on new repo methods + server actions. Use TDD skill.

---

## Wave 1: Shared Components (Parallel)

Two independent sessions. Both depend on Wave 0 being merged.

### Task 1.1: MatrixCellGrid (`matrix-cell-grid`)

**Goal:** Build the new shared `MatrixCellGrid` component that replaces the incompatible Phase 1
grid components. Used by both SP and DTF editors.

**Files created:**

- `src/features/pricing/components/MatrixCellGrid.tsx` — main component
- `src/features/pricing/components/MatrixCellGrid.test.ts` — logic tests

**Props interface:**

```ts
type MatrixCellGridProps = {
  cells: PrintCostMatrixCell[]
  mode: 'sp' | 'dtf' // 'dtf' = single column, colorCount always null
  onChange: (cells: PrintCostMatrixCell[]) => void
  readOnly?: boolean
}
```

**Behavior:**

- Rows = sorted unique `qty_anchor` values from cells
- Columns = sorted unique `color_count` values (sp-mode) OR single unlabeled column (dtf-mode)
- Click cell → inline `<input type="number">` edit mode (S8/S11 pattern)
- Blur or Enter → commit value to cells array → call onChange
- Cell background tint: green-tinted for low cost, warming toward amber for high (range-relative)
- "Add Qty" button: prompts (controlled input) for new qty_anchor → inserts blank cells for all existing color counts
- "Add Color" button (sp-mode only): prompts for new color_count → inserts blank cells for all existing qty anchors
- Remove row (×): removes all cells where qty_anchor matches
- Remove column (×): removes all cells where color_count matches (sp-mode only)

**Note:** All cell value arithmetic must use `big.js` via `money()` helper.

### Task 1.2: Hub editor surfaces + card adaptation (`hub-surfaces`)

**Goal:** Build the two new Hub tab surfaces (GarmentMarkupEditor, RushTierEditor) and adapt
PricingTemplateCard to the new entity shape.

**Files touched/created:**

- `src/features/pricing/components/GarmentMarkupEditor.tsx` — NEW
- `src/features/pricing/components/RushTierEditor.tsx` — NEW
- `src/features/pricing/components/PricingTemplateCard.tsx` — UPDATE props

**GarmentMarkupEditor:**

- Table with 6 rows: tshirt, hoodie, hat, tank, polo, jacket (human-readable labels)
- Each row: category label + multiplier input (number, step 0.1)
- Display format: show both raw multiplier (e.g. `2.0×`) and percentage (e.g. `(100% markup)`)
- "Save All" button → calls `saveMarkupRules(rules[])` server action
- Accepts initial rules as props; manages local state for edits

**RushTierEditor:**

- Table with add/remove rows
- Columns: Name | Days Under Standard | Flat Fee ($) | Surcharge (%)
- Inline editing for all fields
- "Add Tier" appends blank row; Remove (×) per row deletes it
- Row order = displayOrder; reordering is row position
- "Save All" button → calls `saveRushTiers(tiers[])` server action

**PricingTemplateCard adaptation (props to remove):**

- Remove: `pricingTier`, `isIndustryDefault`, `healthPercentage`, `lastUpdated`
- Add: `serviceType: 'screen_print' | 'dtf'`, `isDefault: boolean`, `updatedAt: Date`
- Keep: MarginIndicator (show 'unknown' state until cell data is passed in)

---

## Wave 2: Editor Pages (Parallel)

Three independent sessions. SP and DTF editors depend on `matrix-cell-grid` (Wave 1A).
Hub rebuild depends on `hub-surfaces` (Wave 1B).

### Task 2.1: Screen Print editor rebuild (`sp-editor-rebuild`)

**Goal:** Replace the Phase 1 SP editor (which used `@domain/entities/price-matrix`) with a new
async RSC + client component using the real P4 M1 entity and MatrixCellGrid.

**Files rewritten:**

- `src/app/(dashboard)/settings/pricing/screen-print/[id]/page.tsx` — async RSC
- `src/app/(dashboard)/settings/pricing/screen-print/[id]/editor.tsx` → keep filename, rewrite contents as `SpEditorClient`

**Page (async RSC):**

```tsx
// Calls getPricingTemplate(id) server action
// If not found: notFound()
// Passes template + cells to SpEditorClient as initial props
```

**SpEditorClient (client component) fields:**

- Template name input
- Interpolation mode toggle: `linear` | `step` (shadcn/ui ToggleGroup or RadioGroup)
- Setup fee per color input (currency, big.js)
- Size upcharge XXL input (currency, big.js)
- Standard turnaround days input (number)
- isDefault badge (read-only display, set via Hub not editor)
- MatrixCellGrid (sp-mode) fed from local cells state
- "Save" header button: calls `updatePricingTemplate` then `savePricingMatrix`

### Task 2.2: DTF editor rebuild (`dtf-editor-rebuild`)

**Goal:** Replace the Phase 1 DTF editor with a 1D qty curve editor using the real entity.

**Files rewritten:**

- `src/app/(dashboard)/settings/pricing/dtf/[id]/page.tsx` — async RSC
- `src/app/(dashboard)/settings/pricing/dtf/[id]/dtf-editor-client.tsx` — rewrite

**DTF editor is the same as SP but:**

- MatrixCellGrid in `dtf-mode` (single column, no color dimension)
- All cells have `colorCount: null`
- No "Add Color" button
- Same metadata form fields

### Task 2.3: Pricing Hub rebuild (`pricing-hub-rebuild`)

**Goal:** Replace the Phase 1 Hub page (full client component with mock data) with an async RSC
that fetches real data and passes it to a 4-tab PricingHubClient.

**Files rewritten/created:**

- `src/app/(dashboard)/settings/pricing/page.tsx` — async RSC (was: full client with mock data)
- `src/app/(dashboard)/settings/pricing/_components/PricingHubClient.tsx` — NEW client component
- `src/app/(dashboard)/settings/pricing/_components/NewTemplateDialog.tsx` — NEW dialog component

**Page (async RSC):**

```tsx
// Parallel-fetches: listPricingTemplates() + getMarkupRules() + getRushTiers()
// Passes all as initial props to PricingHubClient
```

**PricingHubClient 4-tab layout:**

- "Screen Print" tab: list of SP templates using PricingTemplateCard
- "DTF" tab: list of DTF templates using PricingTemplateCard
- "Markup Rules" tab: GarmentMarkupEditor
- "Rush Tiers" tab: RushTierEditor

**PricingTemplateCard actions to wire:**

- "Open" → `router.push('/settings/pricing/{serviceType}/{id}')`
- "Set as Default" → optimistic update S1 + `setDefaultTemplate()` server action
- "Delete" → open `DeleteConfirmDialog` → `deletePricingTemplate()` + remove from local list

**NewTemplateDialog:**

- Dialog trigger: "New Template" button in hub header
- Form: name (required) + service type select
- On create: `createPricingTemplate()` → router.push to new template's editor

---

## Wave 3: Cleanup & Verification (Serial)

One session. Depends on all Wave 2 PRs being merged.

### Task 3.1: Phase 1 component deletion + build verification (`pricing-cleanup`)

**Goal:** Remove all Phase 1 pricing components that are incompatible with the new entity shape,
clean up stale imports, and verify the build is clean.

**Files to delete:**

- `src/app/(dashboard)/settings/pricing/_components/ColorPricingGrid.tsx`
- `src/app/(dashboard)/settings/pricing/_components/PowerModeGrid.tsx`
- `src/app/(dashboard)/settings/pricing/_components/QuantityTierEditor.tsx`
- `src/app/(dashboard)/settings/pricing/_components/LocationUpchargeEditor.tsx`
- `src/app/(dashboard)/settings/pricing/_components/GarmentTypePricingEditor.tsx`
- `src/app/(dashboard)/settings/pricing/_components/CostConfigSheet.tsx`
- `src/app/(dashboard)/settings/pricing/_components/MatrixPreviewSelector.tsx`
- `src/app/(dashboard)/settings/pricing/_components/MobileToolsSheet.tsx`
- `src/app/(dashboard)/settings/pricing/_components/SetupWizard.tsx`
- `src/app/(dashboard)/settings/pricing/_components/TagTemplateMapper.tsx`
- `src/app/(dashboard)/settings/pricing/_components/ComparisonView.tsx`
- `src/app/(dashboard)/settings/pricing/_components/DTFSheetTierEditor.tsx`
- `src/app/(dashboard)/settings/pricing/_components/SetupFeeEditor.tsx`

**Imports to remove from any surviving files:**

- `@domain/entities/price-matrix`
- `@domain/entities/dtf-pricing`
- `@infra/repositories/pricing` (mock module)

**Verification steps:**

1. `npx tsc --noEmit` — must pass with zero errors
2. `npm run lint` — must pass
3. `npm run build` — confirm no dead imports in bundle
