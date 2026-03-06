---
title: 'DTF Gang Sheet Builder -- Implementation Planning'
subtitle: '5 waves, 8 sessions, critical path of 5 sessions targeting Feb 21 demo'
date: 2026-02-15
phase: 1
pipelineName: dtf-gang-sheet
pipelineType: vertical
products: [quotes]
tools: []
stage: plan
tags: [plan, decision]
sessionId: '0ba68ef8-1b02-40be-a039-2c63d6d15cd1'
branch: 'session/0215-dtf-gang-sheet-research'
status: complete
---

## Context

Implementation planning for the DTF Gang Sheet Builder vertical. Takes the sliced breadboard (5 vertical slices, 28 UI + 17 code affordances) and produces a wave-based execution manifest for parallel Claude sessions via `work build`.

## Resume Command

```bash
claude --resume 0ba68ef8-1b02-40be-a039-2c63d6d15cd1
```

## Wave Summary

| Wave | Name             | Sessions                                                | Serial? | Key Output                                                              |
| ---- | ---------------- | ------------------------------------------------------- | ------- | ----------------------------------------------------------------------- |
| 0    | Foundation       | 1 (dtf-foundation)                                      | Yes     | Schemas, constants, mock data, empty component stubs                    |
| 1    | Tab Architecture | 1 (dtf-tab-architecture)                                | Yes     | ServiceTypeTabBar, QuoteForm state lift                                 |
| 2    | Core Features    | 3 (dtf-line-items, dtf-production-steps, dtf-algorithm) | No      | DTF line items UI, production task template, shelf-pack + cost-optimize |
| 3    | Integration      | 2 (dtf-calculation-ui, dtf-save-validate)               | No      | SheetCalculationPanel, form validation + save                           |
| 4    | Visual Canvas    | 1 (dtf-canvas)                                          | Yes     | GangSheetCanvas SVG visualization                                       |

**Total**: 8 sessions, critical path = 5 (waves 0-4 sequential, wave 2-3 parallelized)

## Dependency Graph

```
Wave 0: dtf-foundation
            |
Wave 1: dtf-tab-architecture
            |
     +------+------+------------------+
     |             |                   |
Wave 2: dtf-line-items  dtf-production-steps  dtf-algorithm
     |                                 |
     +------+------+                   |
            |                          |
Wave 3: dtf-save-validate  dtf-calculation-ui
                                       |
Wave 4:                      dtf-canvas
```

## Key Decisions

### State Placement

DTF state (S21-S24, S27) lives in QuoteForm (P2), NOT in DtfTabContent (P2.4). This follows the breadboard reflection finding that conditional rendering of DtfTabContent would destroy state on tab switch, violating R1.2. Matches existing pattern where S6 (lineItems) lives in QuoteForm.

### Algorithm Isolation

The shelf-pack and cost-optimize algorithms (N48, N49) are pure functions in `lib/dtf/` with no UI dependencies. This enables Wave 2 parallel development with V2's UI and independent Vitest unit testing.

### Financial Arithmetic

All cost calculations use big.js via `lib/helpers/money.ts` wrapper. This is called out in every session prompt that touches pricing.

### Merge Conflict Prevention

Wave 1 is serial because it modifies QuoteForm.tsx (the 1022-line primary file). Wave 2 tasks touch different files (DtfTabContent vs job cards vs lib/dtf/), enabling safe parallelism.

## Artifacts

- Implementation plan: [`docs/plans/2026-02-15-dtf-gang-sheet-impl-plan.md`](https://github.com/cmbays/mokumo/blob/main/docs/plans/2026-02-15-dtf-gang-sheet-impl-plan.md)
- Execution manifest: [`docs/plans/2026-02-15-dtf-gang-sheet-manifest.yaml`](https://github.com/cmbays/mokumo/blob/main/docs/plans/2026-02-15-dtf-gang-sheet-manifest.yaml)

## Sources

- Breadboard: [`docs/breadboards/dtf-gang-sheet-breadboard.md`](https://github.com/cmbays/mokumo/blob/main/docs/breadboards/dtf-gang-sheet-breadboard.md)
- Shaping doc: [`docs/shaping/dtf-gang-sheet/shaping.md`](https://github.com/cmbays/mokumo/blob/main/docs/shaping/dtf-gang-sheet/shaping.md)
- Implementation planning skill: `.claude/skills/implementation-planning/SKILL.md`
