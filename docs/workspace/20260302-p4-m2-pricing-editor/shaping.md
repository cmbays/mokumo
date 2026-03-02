---
shaping: true
pipeline: 20260302-p4-m2-pricing-editor
created: 2026-03-02
---

# P4 M2: Pricing Editor UI — Shaping

---

## Requirements (R)

| ID  | Requirement                                                                                                        | Status     |
| --- | ------------------------------------------------------------------------------------------------------------------ | ---------- |
| R0  | Gary can view all named pricing templates for his shop and create new ones                                         | Must-have  |
| R1  | Gary can edit the decoration cost matrix: a sparse grid (qty_anchor × color_count → costPerPiece) per template    | Must-have  |
| R2  | Gary can configure a garment markup multiplier per category (tshirt, hoodie, hat, tank, polo, jacket) for the shop | Must-have  |
| R3  | Gary can configure rush tiers (name, daysUnderStandard, flatFee, pctSurcharge) for the shop                       | Must-have  |
| R4  | DTF templates collapse the matrix to a 1D qty curve (colorCount = null; no color-count column dimension)          | Must-have  |
| R5  | One template per (shopId, serviceType) can be marked isDefault; setting a new default clears the old one          | Must-have  |
| R6  | Interpolation mode (linear | step) is configurable per template and clearly visible in the editor                   | Must-have  |
| R7  | The matrix editor uses a PrintLife-style inline cell-editing grid (direct value entry per cell)                    | Must-have  |
| R8  | All mutations persist to Supabase via the P4 M1 repository; no mock data reaches production code paths            | Must-have  |
| R9  | The Phase 1 page structure, routing, breadcrumbs, and tab navigation are preserved where compatible               | Nice-to-have |

---

## Context: Entity Shape Gap (Critical)

The Phase 1 prototype used a fundamentally different entity model from P4 M1's DB schema.
This gap drives the shape decision:

**Old entity (`@domain/entities/price-matrix`):**
```ts
PricingTemplate {
  matrix: {
    quantityTiers: QuantityTier[]      // {minQty, maxQty} pairs — DOES NOT EXIST in new model
    basePriceByTier: number[]          // derived from S&S pricing — NOT stored in template
    colorPricing: ColorPricing[]       // {colorCount, ratePerHit} — formula, NOT cells
    locationUpcharges: LocationUpcharge[]  // per-location surcharges — NOT in new schema
    garmentTypePricing: GarmentTypePricing[] // per-template garment markups — moved to shop level
    setupFeeConfig: SetupFeeConfig     // complex 4-field struct — simplified to 1 field
    priceOverrides: Record<string, number>  // manual cell overrides — the old "power mode"
  }
}
```

**New entity (`@domain/entities/pricing-template`) — what's actually in DB:**
```ts
PricingTemplate {
  id, shopId, name, serviceType, interpolationMode,
  setupFeePerColor, sizeUpchargeXxl, standardTurnaroundDays, isDefault
}
PrintCostMatrixCell { templateId, qtyAnchor, colorCount | null, costPerPiece }
GarmentMarkupRule   { shopId, garmentCategory, markupMultiplier }
RushTier            { shopId, name, daysUnderStandard, flatFee, pctSurcharge, displayOrder }
```

The old entity had ~15 nested fields that don't exist in the new schema. An adapter
is not viable — the concepts are incompatible, not just differently named.

---

## Shapes

### A: Full Replacement — Throw away Phase 1, build everything fresh

New components built from scratch against new entity shapes. Old editor.tsx, dtf-editor-client.tsx,
and all `_components/` deleted. New matrix grid, new hub page, new server actions.

| Part | Mechanism                                                    | Flag |
| ---- | ------------------------------------------------------------ | :--: |
| A1   | Delete all Phase 1 pricing components                        |      |
| A2   | New Pricing Hub server component + client wrapper            |      |
| A3   | New sparse matrix editor grid (qty_anchor × color_count)     |      |
| A4   | New Garment Markup editor section                            |      |
| A5   | New Rush Tier editor section                                 |      |
| A6   | Server actions: listTemplates, getTemplate, save, delete     |      |

---

### B: Adapter Bridge — Keep Phase 1 components, add a mapping layer

Keep existing components unchanged. Add adapter functions that map new entity shape ↔ old.

| Part | Mechanism                                                          | Flag |
| ---- | ------------------------------------------------------------------ | :--: |
| B1   | Adapter: PricingTemplateWithMatrix → old PricingTemplate shape     |  ⚠️  |
| B2   | Map `cells[]` → `quantityTiers`, `basePriceByTier`, `colorPricing` |  ⚠️  |
| B3   | Map `GarmentMarkupRule[]` → old `garmentTypePricing`               |  ⚠️  |
| B4   | Reverse adapter: old shape → cells[] on save                       |  ⚠️  |
| B5   | Old components render without modification                         |      |

**Note:** B1–B4 are all flagged because the mapping is not possible without loss of
information. `basePriceByTier` doesn't exist in the new model at all (it comes from S&S
pricing, not the template). `locationUpcharges` have no equivalent. The old grid formula
is `base + colorPricing[n].ratePerHit * basePrices[tier]` — fundamentally different
from the new model where `costPerPiece` is the direct cell value. This shape fails R1 and R8.

---

### C: Surgical Rewire — Keep structure, replace data layer, simplify editors

Keep page routing, breadcrumbs, Topbar, template card list, tab navigation. Replace the
data source (mock → server actions → real repo). Simplify/replace editor internals to match
the new entity shape. Add Garment Markup and Rush Tiers as new tabs on the Hub.

| Part | Mechanism                                                                                | Flag |
| ---- | ---------------------------------------------------------------------------------------- | :--: |
| C1   | New `pricing/actions.ts` with 10 server actions (see C1 detail below)                   |      |
| C2   | Hub page becomes async RSC; fetches listTemplates + getMarkupRules + getRushTiers        |      |
| C3   | Hub client receives initial data as props; mutations via startTransition → server action |      |
| C4   | Sparse matrix grid: new `MatrixCellGrid` component (inline cell editing, qty/color axes) |      |
| C5   | SP editor rebuilt using new entity: name, interpolationMode, setupFeePerColor inputs     |      |
| C6   | DTF editor rebuilt using new entity: 1D qty curve, colorCount=null cells                 |      |
| C7   | `GarmentMarkupEditor`: table with 6 category rows, multiplier input per row             |      |
| C8   | `RushTierEditor`: table with add/remove rows, inline name/days/flatFee/pct inputs       |      |
| C9   | isDefault toggle with UX: badge swap + optimistic clear of previous default             |      |
| C10  | Port extension: `deleteTemplate` + `setDefaultTemplate` added to port + Supabase impl   |      |

**C1 — Server Actions detail:**
```
listPricingTemplates(serviceType?)  → repo.listTemplates(shopId)
getPricingTemplate(id)              → repo.getTemplateById(id)
createPricingTemplate(data)         → repo.upsertTemplate({...data})
updatePricingTemplate(id, data)     → repo.upsertTemplate({id, ...data})
deletePricingTemplate(id)           → NEW repo.deleteTemplate(id, shopId)
savePricingMatrix(templateId, cells) → repo.upsertMatrixCells(templateId, cells)
setDefaultTemplate(id, serviceType) → NEW repo.setDefaultTemplate(shopId, id, serviceType)
getMarkupRules()                    → repo.getMarkupRules(shopId)
saveMarkupRules(rules)              → repo.upsertMarkupRules(shopId, rules)
getRushTiers()                      → repo.getRushTiers(shopId)
saveRushTiers(tiers)                → repo.upsertRushTiers(shopId, tiers)
```

**Old components deleted:** ColorPricingGrid, PowerModeGrid, QuantityTierEditor,
LocationUpchargeEditor, GarmentTypePricingEditor, CostConfigSheet, MatrixPreviewSelector,
MobileToolsSheet, SetupWizard (replaced by inline form), TagTemplateMapper (Wave 2),
ComparisonView (nice-to-have, can be re-added), allScreenPrintTemplates mock.

**Old components kept:** PricingTemplateCard (adapted to new entity props),
MarginIndicator, MarginLegend, DTFPricingCalculator (simplified to 1D qty curve).

---

## Fit Check

| Req | Requirement                                                                                                        | Status       | A   | B   | C   |
| --- | ------------------------------------------------------------------------------------------------------------------ | ------------ | --- | --- | --- |
| R0  | Gary can view all named pricing templates for his shop and create new ones                                         | Must-have    | ✅  | ✅  | ✅  |
| R1  | Gary can edit the decoration cost matrix: a sparse grid (qty_anchor × color_count → costPerPiece) per template    | Must-have    | ✅  | ❌  | ✅  |
| R2  | Gary can configure a garment markup multiplier per category (tshirt, hoodie, hat, tank, polo, jacket) for the shop | Must-have    | ✅  | ❌  | ✅  |
| R3  | Gary can configure rush tiers (name, daysUnderStandard, flatFee, pctSurcharge) for the shop                       | Must-have    | ✅  | ❌  | ✅  |
| R4  | DTF templates collapse the matrix to a 1D qty curve (colorCount = null; no color-count column dimension)          | Must-have    | ✅  | ❌  | ✅  |
| R5  | One template per (shopId, serviceType) can be marked isDefault; setting a new default clears the old one          | Must-have    | ✅  | ❌  | ✅  |
| R6  | Interpolation mode (linear | step) is configurable per template and clearly visible in the editor                   | Must-have    | ✅  | ❌  | ✅  |
| R7  | The matrix editor uses a PrintLife-style inline cell-editing grid (direct value entry per cell)                    | Must-have    | ✅  | ❌  | ✅  |
| R8  | All mutations persist to Supabase via the P4 M1 repository; no mock data reaches production code paths            | Must-have    | ✅  | ❌  | ✅  |
| R9  | The Phase 1 page structure, routing, breadcrumbs, and tab navigation are preserved where compatible               | Nice-to-have | ❌  | ✅  | ✅  |

**Notes:**
- B fails R1: the old colorPricing formula (base + ratePerHit × colorCount) is irreconcilable with the new direct costPerPiece model — a lossless adapter is impossible
- B fails R2: garmentTypePricing lived inside the template in the old model; in the new model GarmentMarkupRule belongs to the shop, not a template — structural incompatibility
- B fails R3, R4, R5, R6, R7, R8: all contingent on R1/R2 structural viability + mock data still in use
- A fails R9: throws away Phase 1 routing, breadcrumbs, tab structure, PricingTemplateCard, MarginIndicator — significant discarded UX work

---

## Selected Shape: **C — Surgical Rewire**

Passes all must-have requirements. Preserves Phase 1 structural investments (routing,
breadcrumbs, tab layout, template card design). Replaces the incompatible data layer and
editor innards. Adds the two missing surfaces (Markup, Rush) as Hub tabs.

---

## Decision Log

| # | Decision                                    | Choice  | Rationale                                                                                     |
| - | ------------------------------------------- | ------- | --------------------------------------------------------------------------------------------- |
| 1 | Shape selection                             | C       | Only shape that passes all must-haves while preserving Phase 1 UX investment                 |
| 2 | Garment Markup + Rush Tiers placement       | Hub tabs | Shop-wide config belongs on the Hub, not inside a per-template editor. Consistent with APP_IA |
| 3 | Port extension strategy                     | Additive | Add `deleteTemplate` + `setDefaultTemplate` to port + impl rather than workaround in actions |
| 4 | Old components to delete                    | Listed in C | Incompatible with new entity — keeping them would create two parallel entity models       |
| 5 | SetupWizard replacement                     | Inline form | Wizard was a Phase 1 prototype. For M2: simple "New Template" dialog with 3 fields       |
| 6 | TagTemplateMapper (customer tag assignment) | Wave 2  | Explicitly out of scope per task brief                                                        |

---

## Parts Table (Selected Shape C)

| Part    | Mechanism                                                                                    | Flag |
| ------- | -------------------------------------------------------------------------------------------- | :--: |
| **C1**  | **Server actions** — 11 actions in `src/features/pricing/actions/pricing-templates.ts`       |      |
| C1.1    | `listPricingTemplates(serviceType?)` → verifySession + repo.listTemplates(shopId)            |      |
| C1.2    | `getPricingTemplate(id)` → verifySession + repo.getTemplateById(id)                          |      |
| C1.3    | `createPricingTemplate(data)` → verifySession + repo.upsertTemplate                          |      |
| C1.4    | `updatePricingTemplate(id, data)` → verifySession + repo.upsertTemplate({id, ...data})       |      |
| C1.5    | `deletePricingTemplate(id)` → verifySession + repo.deleteTemplate(id, shopId)                |      |
| C1.6    | `savePricingMatrix(templateId, cells[])` → verifySession + repo.upsertMatrixCells            |      |
| C1.7    | `setDefaultTemplate(id, serviceType)` → verifySession + repo.setDefaultTemplate              |      |
| C1.8    | `getMarkupRules()` → verifySession + repo.getMarkupRules(shopId)                             |      |
| C1.9    | `saveMarkupRules(rules[])` → verifySession + repo.upsertMarkupRules(shopId, rules)           |      |
| C1.10   | `getRushTiers()` → verifySession + repo.getRushTiers(shopId)                                 |      |
| C1.11   | `saveRushTiers(tiers[])` → verifySession + repo.upsertRushTiers(shopId, tiers)               |      |
| **C2**  | **Port extension** — 2 new methods added to port + SupabasePricingTemplateRepository         |      |
| C2.1    | `deleteTemplate(id, shopId)`: DELETE WHERE id=? AND shop_id=? (shop scope guard)             |      |
| C2.2    | `setDefaultTemplate(shopId, id, serviceType)`: TX — clear isDefault WHERE (shopId,svcType), set WHERE id=? |      |
| **C3**  | **Pricing Hub page** — async RSC, parallel-fetches templates + markup rules + rush tiers      |      |
| C3.1    | 4-tab layout: Screen Print | DTF | Markup Rules | Rush Tiers (extends existing 3-tab)        |      |
| C3.2    | Passes fetched data as initial props to PricingHubClient                                     |      |
| C3.3    | PricingHubClient: manages optimistic state, calls server actions via startTransition          |      |
| **C4**  | **PricingTemplateCard adaptation** — update props to accept new PricingTemplate entity       |      |
| C4.1    | Remove `pricingTier`, `isIndustryDefault`, `healthPercentage` props (don't exist in new ent) |      |
| C4.2    | Add `serviceType` display, `isDefault` badge, `updatedAt` display                            |      |
| C4.3    | Keep MarginIndicator placeholder (health calculated from cells if available, else 'unknown')  |      |
| **C5**  | **New Template dialog** — replaces SetupWizard                                               |      |
| C5.1    | Simple Dialog: name input, serviceType select (Screen Print / DTF), Create button           |      |
| C5.2    | On create: calls C1.3, router.push to editor page                                           |      |
| **C6**  | **Screen Print Editor rebuild** — page becomes async RSC; client editor simplified           |      |
| C6.1    | Server page: `getPricingTemplate(id)` → passes template + cells to client                   |      |
| C6.2    | Client editor: template name input, interpolationMode toggle, setupFeePerColor, sizeUpchargeXxl, standardTurnaroundDays |      |
| C6.3    | MatrixCellGrid component (C8) embedded with sp-mode (columns = color counts from cells)     |      |
| C6.4    | Save header button: calls C1.4 (template metadata) + C1.6 (matrix cells) in sequence       |      |
| **C7**  | **DTF Editor rebuild** — same structure as SP editor, matrix 1D                             |      |
| C7.1    | Server page: `getPricingTemplate(id)` → client with colorCount=null cells                   |      |
| C7.2    | Client editor: same metadata inputs as SP; MatrixCellGrid in dtf-mode (no color column)    |      |
| C7.3    | Save: calls C1.4 + C1.6 (cells always have colorCount=null)                                 |      |
| **C8**  | **MatrixCellGrid** — new shared component replacing old incompatible grid components        |      |
| C8.1    | Rows = sorted unique qty_anchors from cells + "Add Qty" button                              |      |
| C8.2    | Columns = sorted unique color_counts from cells + "Add Color" button (sp-mode only)        |      |
| C8.3    | Each cell: click to enter edit mode → number input, blur/Enter to commit                   |      |
| C8.4    | Cell color: background tint by value range (PrintLife-style visual feedback)                |      |
| C8.5    | Add row: prompt for new qty_anchor, insert blank cells for all existing color counts        |      |
| C8.6    | Add column (sp-mode): prompt for new color_count, insert blank cells for all existing qtys |      |
| C8.7    | Remove row/column: confirmation, removes all cells for that anchor/color                   |      |
| **C9**  | **GarmentMarkupEditor** — new component, Hub "Markup Rules" tab                            |      |
| C9.1    | Table: 6 rows (tshirt, hoodie, hat, tank, polo, jacket); display as human label            |      |
| C9.2    | Each row: markupMultiplier input (shown as %, 2.0 = 100%); display "2.0× (100%)" format   |      |
| C9.3    | Save All button → calls C1.9 (full replace of shop markup rules)                           |      |
| C9.4    | Defaults seeded from existing rules if present; else empty (Gary enters fresh)             |      |
| **C10** | **RushTierEditor** — new component, Hub "Rush Tiers" tab                                   |      |
| C10.1   | Table with add/remove rows; columns: name, daysUnderStandard, flatFee, pctSurcharge        |      |
| C10.2   | Inline editing for all fields; displayOrder derived from row position                      |      |
| C10.3   | Save All button → calls C1.11 (full replace of shop rush tiers)                            |      |
| C10.4   | "Add Tier" button appends a blank row                                                      |      |
| **C11** | **Delete old Phase 1 components** (dead code removal)                                      |      |
| C11.1   | Remove: ColorPricingGrid, PowerModeGrid, QuantityTierEditor, LocationUpchargeEditor        |      |
| C11.2   | Remove: GarmentTypePricingEditor, CostConfigSheet, MatrixPreviewSelector, MobileToolsSheet  |      |
| C11.3   | Remove: SetupWizard, TagTemplateMapper, ComparisonView                                     |      |
| C11.4   | Remove: `@infra/repositories/pricing` mock module references from all pricing pages        |      |
| C11.5   | Remove: `@domain/entities/price-matrix` and `@domain/entities/dtf-pricing` imports        |      |
