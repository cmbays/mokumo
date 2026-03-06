---
title: 'Colors — Implementation Plan: 4 Waves, 7 Sessions'
subtitle: 'Wave-parallelized execution manifest for 48 UI + 25 code affordances across 6 vertical slices'
date: 2026-02-15
phase: 1
pipelineName: colors
pipelineType: vertical
products: [customers]
domains: [garments]
tools: []
stage: plan
tags: [plan]
sessionId: '08cc4e02-a47a-42b3-b9c9-d47e392c498b'
branch: 'session/0215-color-prefs'
status: complete
---

## Summary

Transformed the sliced color preference breadboard (6 vertical slices, 48 UI + 25 code affordances) into a wave-parallelized implementation plan with 7 build sessions. Key optimization: extracting shared components to Wave 0 enables V1+V2+V3 to run in parallel despite the breadboard's V3->V4->V5 sequential dependency chain (runtime hierarchy dependencies don't affect file-level parallelism).

## Wave Architecture

| Wave                                 | Sessions | Mode     | Topics                                                                |
| ------------------------------------ | -------- | -------- | --------------------------------------------------------------------- |
| Wave 0: Foundation                   | 1        | serial   | colors-foundation                                                     |
| Wave 1: Catalog UX + Global Settings | 3        | parallel | colors-swatch-filter, colors-drawer-favorites, colors-global-settings |
| Wave 2: Brand Hierarchy              | 1        | serial   | colors-brand-drawer                                                   |
| Wave 3: Customer + Removal           | 2        | parallel | colors-customer-prefs, colors-removal-dialog                          |

**Total: 7 sessions, 4 waves**

## Wave 0: Foundation (Serial)

Single session creating everything subsequent waves need:

- **Schemas**: `color-preferences.ts` — brandPreferenceSchema, customerPreferenceSchema, inheritanceModeSchema, displayPreferenceSchema, propagationConfigSchema
- **Customer schema evolution**: `favoriteColors` from `Record<garmentId, colorId[]>` to `string[]`; add `favoriteBrandNames: string[]`
- **Mock data**: brandPreferences map (Gildan, Bella+Canvas, Comfort Colors), updated customer favorites, auto-propagation config
- **Shared helpers**: `resolveEffectiveFavorites()`, `getInheritanceChain()`, `propagateAddition()`, `getImpactPreview()`
- **ColorSwatchPicker extension**: `multiSelect`, `selectedColorIds`, `onToggleColor` props
- **Shared components**: FavoritesColorSection, InheritanceToggle, InheritanceDetail
- **Navigation**: `/settings/colors` in sidebar + constants

## Wave 1: V1 + V2 + V3 (Parallel)

Three sessions running concurrently — no file conflicts:

| Session                 | Slice | Touches                   | Demo                                                                   |
| ----------------------- | ----- | ------------------------- | ---------------------------------------------------------------------- |
| colors-swatch-filter    | V1    | Toolbar, Card, page.tsx   | "Click color swatches to filter; cards show favorites + count"         |
| colors-drawer-favorites | V2    | GarmentDetailDrawer only  | "Open drawer: favorites at top, full palette below, scrolls correctly" |
| colors-global-settings  | V3    | New /settings/colors page | "Settings > Colors: tap swatches to set shop-wide favorites"           |

## Wave 2: V4 (Serial)

Brand detail drawer with Beth Meyer inheritance toggle. Wires brand name clicks from V1 cards, toolbar, and V2 drawer. Depends on V3 (brand preferences read global favorites).

## Wave 3: V5 + V6 (Parallel)

| Session               | Slice | Touches                                                    | Demo                                                               |
| --------------------- | ----- | ---------------------------------------------------------- | ------------------------------------------------------------------ |
| colors-customer-prefs | V5    | New CustomerPreferencesTab + CustomerTabs modify           | "Customer > Preferences: set ACME Corp's colors, brands, garments" |
| colors-removal-dialog | V6    | New RemovalConfirmationDialog + modify V3 page + V4 drawer | "Remove global color -> '5 customers affected' -> choose targets"  |

## Key Decisions

| #   | Decision                                            | Rationale                                                                                                                                         |
| --- | --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| D1  | Extract shared components to Wave 0                 | Enables V1+V2+V3 parallelism — all use FavoritesColorSection but touch different page files                                                       |
| D2  | V1+V2+V3 parallel despite breadboard's V3->V4 chain | Runtime hierarchy (brand reads global) is a data dependency, not a file conflict. In Phase 1 with mock data, each session can build independently |
| D3  | Stubs for forward dependencies                      | V1 cards have onBrandClick stub (wired in V4); V3/V4 have console.log removal stubs (wired in V6)                                                 |
| D4  | Single Wave 0 session (~1000 lines)                 | Could split schemas/components into 2 sessions, but all pieces are foundational and interdependent. One session avoids coordination overhead      |
| D5  | Wave 2 depends on V3 not V1+V2                      | Brand drawer reads global favorites (from V3). V1/V2 integration is additive (brand name clicks) — can be wired in V4                             |

## File Conflict Analysis

Verified no file conflicts within parallel waves:

**Wave 1 (V1 || V2 || V3):**

- V1: GarmentCatalogToolbar, GarmentCard, garments/page.tsx, ColorFilterGrid (new)
- V2: GarmentDetailDrawer only
- V3: settings/colors/page.tsx (new), no overlap with garments/

**Wave 3 (V5 || V6):**

- V5: customers/[id]/ components only
- V6: RemovalConfirmationDialog (new), settings/colors/page.tsx, BrandDetailDrawer
- No overlap: V5 touches customers, V6 touches settings + garments

## Artifacts

- **Implementation plan**: [`docs/plans/2026-02-15-colors-impl-plan.md`](https://github.com/cmbays/mokumo/blob/main/docs/plans/2026-02-15-colors-impl-plan.md)
- **Execution manifest**: [`docs/plans/2026-02-15-colors-manifest.yaml`](https://github.com/cmbays/mokumo/blob/main/docs/plans/2026-02-15-colors-manifest.yaml)
- **Breadboard (input)**: [`docs/breadboards/color-preference-breadboard.md`](https://github.com/cmbays/mokumo/blob/main/docs/breadboards/color-preference-breadboard.md)
- **Shaping (input)**: [`docs/shaping/colors/shaping.md`](https://github.com/cmbays/mokumo/blob/main/docs/shaping/colors/shaping.md)

## Pipeline

**Previous stage**: BB Reflection (`2026-02-15-colors-breadboard-reflection.md`)
**Next stage**: Build (Wave 0 → Wave 1 → Wave 2 → Wave 3)
