---
title: 'Colors — Breadboard: Affordances, Wiring & Vertical Slices'
subtitle: '48 UI affordances, 25 code affordances, 8 data stores across 6 places — sliced into 6 vertical increments'
date: 2026-02-15
phase: 1
pipelineName: colors
pipelineType: vertical
products: [customers]
domains: [garments]
tools: []
stage: breadboard
tags: [plan]
sessionId: '08cc4e02-a47a-42b3-b9c9-d47e392c498b'
branch: 'session/0215-color-prefs'
status: complete
---

## Summary

Transformed Shape A's 7 parts (A1-A7) from the color preference shaping doc into a full breadboard with concrete affordances, wiring, and vertical slices. The breadboard modifies the existing garment catalog (P1, P1.1) and adds 4 new places for color preference management.

## Breadboard Scope

| Metric              | Count                 |
| ------------------- | --------------------- |
| Places              | 6 (2 modified, 4 new) |
| UI affordances      | 48                    |
| Code affordances    | 25                    |
| Data stores         | 8                     |
| New components      | 8                     |
| Modified components | 5                     |
| Vertical slices     | 6                     |

## Places

| #    | Place                       | Type                                                                  |
| ---- | --------------------------- | --------------------------------------------------------------------- |
| P1   | Garment Catalog             | Modified — swatch filter replaces text dropdown; cards show favorites |
| P1.1 | Garment Detail Drawer       | Modified — two-section favorites/all layout, scroll fix               |
| P1.2 | Brand Detail Drawer         | NEW — brand colors with Beth Meyer inherit/customize toggle           |
| P2   | Settings > Colors           | NEW — global favorite management at `/settings/colors`                |
| P3   | Customer Preferences Tab    | NEW — customer favorites (colors, brands, garments)                   |
| P4   | Removal Confirmation Dialog | NEW — impact preview + selective propagation                          |

## Vertical Slices

| #   | Slice                               | Demo                                                                   |
| --- | ----------------------------------- | ---------------------------------------------------------------------- |
| V1  | Swatch filter + honest cards        | "Click color swatches to filter; cards show favorites + count"         |
| V2  | Drawer favorites + scroll fix       | "Open drawer: favorites at top, full palette below, scrolls correctly" |
| V3  | Global favorites page               | "Settings > Colors: tap swatches to set shop-wide favorites"           |
| V4  | Brand detail drawer                 | "Click 'Gildan' → drawer → toggle customize → add Sport Grey"          |
| V5  | Customer preferences                | "Customer > Preferences: set ACME Corp's colors, brands, garments"     |
| V6  | Inheritance engine + removal dialog | "Remove global color → '5 customers affected' → choose targets"        |

### Parallelization Windows

- **V1 + V2** can run concurrently (different components, no data dependency)
- **V3 → V4 → V5** sequential (brand reads global, customer reads brand)
- **V6** depends on V3 + V4 (removal dialog needs hierarchy to exist)

## Key Architecture Decisions

### FavoritesColorSection (reusable component)

A two-section layout component used across P1.1, P1.2, P2, and P3. Top section shows favorite color swatches (tap to remove). Bottom section shows full color palette (tap to add). This avoids star overlays per interview decision D4 — "just have the color swatches in a favorites section."

### Inheritance Resolution (N19)

`resolveEffectiveFavorites(entityType, entityId)` walks the hierarchy: reads global favorites (S2) → applies brand overrides (S3) → applies customer overrides (S4). Phase 1 uses mock data; Phase 2 replaces with a Drizzle DAL function. Returns the effective favorite set for any entity in the system.

### InheritanceToggle (Beth Meyer pattern)

Binary toggle: "Use [parent] colors" / "Customize colors". When inheriting, favorites section is read-only and reflects parent. When customizing, per-color inheritance badges show "inherited" vs "added here", and a progressive disclosure section shows the full inheritance chain.

### ColorSwatchPicker Extension

The existing `ColorSwatchPicker` needs a `multiSelect` prop for the toolbar filter grid (U1). Currently supports only `selectedColorId` (single). New mode uses `selectedColorIds[]` with toggle behavior.

### Customer Schema Evolution

`favoriteColors` changes from `Record<garmentId, colorId[]>` (per-garment mapping) to `string[]` (customer-level color IDs). New field `favoriteBrandNames: string[]` added. Existing `favoriteGarments: string[]` is already correct.

### Scroll Bug Fix

Root cause: nested `ScrollArea` components — the drawer has one and the picker has another. Fix: single outer `ScrollArea` in the drawer wrapping both favorites and all-colors sections.

## Phase 2 Extensions

7 code affordances planned for Phase 2 backend:

- Server actions for all toggle operations (N4, N8, N13)
- DAL function for hierarchy resolution (N19)
- Batch update for propagation (N22)
- S&S API integration for brand catalog (N26)
- Order history analysis for favorite suggestions (N27)

## Artifacts

- **Breadboard**: [`docs/breadboards/color-preference-breadboard.md`](https://github.com/cmbays/mokumo/blob/main/docs/breadboards/color-preference-breadboard.md)
- **Shaping doc**: [`docs/shaping/colors/shaping.md`](https://github.com/cmbays/mokumo/blob/main/docs/shaping/colors/shaping.md)
- **Integration reference**: [`docs/breadboards/garment-catalog-breadboard.md`](https://github.com/cmbays/mokumo/blob/main/docs/breadboards/garment-catalog-breadboard.md)

## Pipeline

**Previous stage**: Shaping (`2026-02-15-colors-shaping.md`)
**Next stage**: Implementation Planning (pending)
