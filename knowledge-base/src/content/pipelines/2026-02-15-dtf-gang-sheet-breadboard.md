---
title: 'DTF Gang Sheet Builder — Breadboarding'
subtitle: 'Shape D mapped to 28 UI + 17 code affordances, 5 vertical slices for Feb 21 demo'
date: 2026-02-15
phase: 1
pipelineName: dtf-gang-sheet
pipelineType: vertical
products: [quotes]
tools: []
stage: breadboard
tags: [plan, decision]
sessionId: '0ba68ef8-1b02-40be-a039-2c63d6d15cd1'
branch: 'session/0215-dtf-gang-sheet-research'
status: complete
---

## Context

Breadboarding phase for the DTF Gang Sheet Builder vertical. Takes Shape D (Tabs + Full DTF Experience, Defer Sibling Jobs) from the shaping phase and maps its 6 parts into concrete UI affordances, code affordances, data stores, and wiring. Extends the existing quoting breadboard (P1-P4) with new DTF-specific subplaces and components.

## Resume Command

```bash
claude --resume 0ba68ef8-1b02-40be-a039-2c63d6d15cd1
```

## Breadboard Summary

### Places

| ID   | Place                     | Description                                        |
| ---- | ------------------------- | -------------------------------------------------- |
| P2   | New Quote Form (modified) | Gains service type tab bar above line items        |
| P2.3 | Service Type Tab Bar      | Tab navigation for switching between service types |
| P2.4 | DTF Tab Content           | DTF line items, sheet optimization, visual canvas  |

### Affordance Counts

| Type             | Count | ID Range |
| ---------------- | ----- | -------- |
| UI Affordances   | 28    | U66–U93  |
| Code Affordances | 17    | N40–N56  |
| Data Stores      | 9     | S19–S27  |

### Vertical Slices

| #   | Slice                    | Parts  | Demo                                             |
| --- | ------------------------ | ------ | ------------------------------------------------ |
| V1  | Tab Architecture         | D1     | Click between SP/DTF tabs — state preserved      |
| V2  | DTF Line Items + Presets | D2, D6 | Add 3 designs with different sizes, see subtotal |
| V3  | Sheet Calculation        | D3     | Calculate Layout — 2 sheets at optimal tiers     |
| V4  | Visual Canvas            | D4     | See auto-arranged designs on 22×24" SVG          |
| V5  | DTF Production Steps     | D5     | DTF job card shows simplified steps              |

### Build Order & Parallelization

```
Wave 1:  V1 (tabs)
Wave 2:  V2 (line items)  ‖  V5 (production steps)  ‖  V3-algo (pure function)
Wave 3:  V3-UI (wire into form)  ‖  V2-integration (save/validate)
Wave 4:  V4 (canvas)
```

Critical path: V1 → V2 → V3 → V4

## Key Decisions

### Tab Architecture Within P2

The service type tabs are NOT new Places — they're conditional render zones within the existing P2 (New Quote Form). The customer picker and pricing summary remain shared above and below the tab content area. This minimizes disruption to the existing quoting flow (R1.4).

### Separate Data Stores Per Tab

Screen print line items (existing S6) and DTF line items (new S21) live in separate React state arrays. This ensures tab switching preserves all data (R1.2) and avoids schema conflicts between garment-oriented and image-oriented line items.

### Pure Function Algorithm

The sheet calculation algorithm (N48 shelfPack + N49 optimizeCost) is designed as a pure function with no UI dependencies. This enables parallel development with V2's UI and independent unit testing.

### ID Range Convention

DTF affordances use ranges that avoid conflicts with the existing quoting breadboard (U66+, N40+, S19+). This allows both breadboards to be referenced together during implementation planning.

## New Components

| Component             | File                                           | Slice |
| --------------------- | ---------------------------------------------- | ----- |
| ServiceTypeTabBar     | `quotes/_components/ServiceTypeTabBar.tsx`     | V1    |
| DtfTabContent         | `quotes/_components/DtfTabContent.tsx`         | V2    |
| DtfLineItemRow        | `quotes/_components/DtfLineItemRow.tsx`        | V2    |
| SheetCalculationPanel | `quotes/_components/SheetCalculationPanel.tsx` | V3    |
| GangSheetCanvas       | `quotes/_components/GangSheetCanvas.tsx`       | V4    |

Plus utility modules:

- `lib/dtf/shelf-pack.ts` — shelf-packing algorithm (V3)
- `lib/dtf/cost-optimize.ts` — cost optimization (V3)
- `lib/dtf/dtf-constants.ts` — size presets + task template (V2, V5)

## Scope Coverage

All Must-have requirements (R0-R4, R5.3, R6) have corresponding affordances. R5.1 and R5.2 (sibling jobs, shipping gate) are Out — deferred to issue #211.

## Next Step

Breadboard reflection — audit the breadboard for design smells, trace user stories through wiring, apply naming test, then hand off to implementation planning.

## Artifacts

- Breadboard: [`docs/breadboards/dtf-gang-sheet-breadboard.md`](https://github.com/cmbays/mokumo/blob/main/docs/breadboards/dtf-gang-sheet-breadboard.md)

## Sources

- Shape D: [`docs/shaping/dtf-gang-sheet/shaping.md`](https://github.com/cmbays/mokumo/blob/main/docs/shaping/dtf-gang-sheet/shaping.md)
- Frame: [`docs/shaping/dtf-gang-sheet/frame.md`](https://github.com/cmbays/mokumo/blob/main/docs/shaping/dtf-gang-sheet/frame.md)
- Spike: [`docs/spikes/spike-dtf-gang-sheet-builder.md`](https://github.com/cmbays/mokumo/blob/main/docs/spikes/spike-dtf-gang-sheet-builder.md)
- Existing quoting breadboard: [`docs/breadboards/quoting-breadboard.md`](https://github.com/cmbays/mokumo/blob/main/docs/breadboards/quoting-breadboard.md)
