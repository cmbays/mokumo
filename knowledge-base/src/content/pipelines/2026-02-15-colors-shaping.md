---
title: 'Colors — Shaping: Entity-Owned Favorites with Live Inheritance'
subtitle: 'R x S analysis selecting Shape A for hierarchical color preferences — 3 shapes explored, 12 decisions logged'
date: 2026-02-15
phase: 1
pipelineName: colors
pipelineType: vertical
products: [customers]
domains: [garments]
tools: []
stage: shape
tags: [decision, plan]
sessionId: '08cc4e02-a47a-42b3-b9c9-d47e392c498b'
branch: 'session/0215-color-prefs'
status: complete
---

## Summary

Applied the R x S shaping methodology to design a hierarchical color preference system for Mokumo. Defined 9 requirements (R0-R8), explored 3 competing shapes, selected Shape A (entity-owned favorites with live inheritance) via fit check, and resolved the brand detail view spike. This shaping feeds directly into the breadboard at `docs/breadboards/color-preference-breadboard.md`.

## Requirements (9 top-level)

| ID  | Requirement                                                                 | Status       |
| --- | --------------------------------------------------------------------------- | ------------ |
| R0  | Visual color filtering — swatches not text                                  | Core goal    |
| R1  | Honest garment card colors — favorites + count                              | Must-have    |
| R2  | Three-level favorites hierarchy (global, brand, customer)                   | Must-have    |
| R3  | Safe inheritance behavior (additive auto-propagation, removal confirmation) | Must-have    |
| R4  | Non-technical usability — single-layer thinking                             | Must-have    |
| R5  | Graceful degradation — each level optional                                  | Must-have    |
| R6  | Entity-context editing — edit where the entity lives                        | Must-have    |
| R7  | Configurable swatch display — flat/grouped                                  | Nice-to-have |
| R8  | Full palette access via detail drawer                                       | Must-have    |

## Three Shapes Explored

### Shape A: Entity-Owned Favorites with Live Inheritance (SELECTED)

Each entity owns its own `favoriteColorIds[]`. Inheritance computed at read time by walking the hierarchy (global → brand → customer). Figma-model live inheritance: additions auto-propagate, removals require confirmation. Beth Meyer toggle at each level for inherit/customize.

7 parts (A1-A7) covering visual filter, favorites-first cards, global/brand/customer management, inheritance engine, and removal dialog.

### Shape B: Centralized Preference Store (REJECTED)

Single `preferences` table with scoped entries (`entityType`, `entityId`, `scope`, `preferenceType`, `valueIds[]`). Query engine resolves applicable preferences by walking scope hierarchy.

**Rejected**: Over-abstract. Exposes implementation concepts that don't match how shop owners think. "Our Gildan favorites" becomes a multi-column query — the indirection adds cognitive load without user benefit.

### Shape C: Cascading Profiles with CSS-style Override (REJECTED)

Each level has a preference profile with specificity rules. Most-specific profile wins. Per-property override tracking with cascade resolution.

**Rejected**: Too complex for non-technical users. Selective propagation (R3.4) breaks the cascade model — you can't selectively remove from some children without per-entity override rules that compound specificity. Needing a debug view is a usability failure.

## Fit Check

| Req | A    | B    | C    |
| --- | ---- | ---- | ---- |
| R0  | Pass | Pass | Pass |
| R1  | Pass | Pass | Pass |
| R2  | Pass | Pass | Pass |
| R3  | Pass | Pass | Fail |
| R4  | Pass | Fail | Fail |
| R5  | Pass | Pass | Pass |
| R6  | Pass | Pass | Pass |
| R7  | Pass | Pass | Pass |
| R8  | Pass | Pass | Pass |

Shape A is the only shape that passes all requirements.

## Key Decisions

| #   | Decision               | Outcome                                                     |
| --- | ---------------------- | ----------------------------------------------------------- |
| D1  | Data model approach    | Entity-owned (A) over centralized (B) and cascading (C)     |
| D2  | Inheritance model      | Live inheritance with override preservation (Figma model)   |
| D3  | Inheritance control UX | Beth Meyer toggle (binary: inherit/customize)               |
| D4  | Favorite indication    | Section grouping, not star overlays                         |
| D5  | Propagation asymmetry  | Additive = auto, removal = confirm                          |
| D6  | Removal UX             | Three-option dialog + progressive disclosure                |
| D7  | Swatch display default | Flat grid (Sammar-style, Gary's preference)                 |
| D8  | Where each level lives | Global→Settings, Brand→Garments drawer, Customer→Detail tab |
| D9  | Brand detail view      | Drawer in garments section (consistent with garment detail) |
| D10 | Customer axes          | Independent (colors, brands, garments — each optional)      |
| D11 | Level requirement      | None — each level optional, graceful degradation            |
| D12 | Auto-propagation       | Configurable setting, default yes                           |

## Spike: Brand Detail View (A4.1)

Investigated how a brand detail view integrates into garments since no sub-routing or brand schema exists. Resolved: **brand detail drawer** accessed via brand name click, consistent with the garment detail drawer pattern (P1.1).

Entry points: (1) brand name on garment cards, (2) brand name in toolbar when filter active, (3) future "Brands" sub-tab.

## Artifacts

- **Shaping doc**: [`docs/shaping/colors/shaping.md`](https://github.com/cmbays/mokumo/blob/main/docs/shaping/colors/shaping.md)
- **Frame**: [`docs/shaping/colors/frame.md`](https://github.com/cmbays/mokumo/blob/main/docs/shaping/colors/frame.md)
- **Spike**: [`docs/shaping/colors/spike-brand-detail-view.md`](https://github.com/cmbays/mokumo/blob/main/docs/shaping/colors/spike-brand-detail-view.md)
- **Design doc**: [`docs/plans/2026-02-15-color-preference-system-design.md`](https://github.com/cmbays/mokumo/blob/main/docs/plans/2026-02-15-color-preference-system-design.md)

## Pipeline

**Previous stage**: Interview (`2026-02-15-colors-interview.md`)
**Next stage**: Breadboarding (`2026-02-15-colors-breadboarding.md`)
