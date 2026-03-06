---
title: 'DTF Gang Sheet Builder — Breadboard Reflection'
subtitle: '5 wiring smells found and fixed, 17 affordances pass naming test, 7 user stories traced'
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

Breadboard reflection (QA audit) for the DTF Gang Sheet Builder breadboard. Traces user stories through wiring, applies the naming test to all 17 code affordances, checks for diagram-only nodes, and fixes detected smells. No structural changes — all affordance IDs, slice boundaries, and build order remain unchanged.

## Resume Command

```bash
claude --resume 0ba68ef8-1b02-40be-a039-2c63d6d15cd1
```

## Audit Summary

| Check               | Result                                        |
| ------------------- | --------------------------------------------- |
| User stories traced | 7 (R0, R1.1, R1.2, R1.3, R2.1, R2.3+R3, R4.1) |
| Naming test         | 17/17 pass                                    |
| Diagram-only nodes  | 0                                             |
| Smells found        | 5                                             |
| Smells fixed        | 5                                             |

## Smells Found & Fixed

### 1. N47 Returns To Misplacement (Medium)

N47 `calculateSheetLayout()` had writes to S22/S24 and trigger of N54 in the Returns To column. These are control flow (Wires Out), not data flow. N47 is a void function — it writes side effects, doesn't return a value.

**Fix**: Moved writes and trigger to Wires Out; Returns To set to "—".

### 2. N50 Returns To Misplacement (Low)

N50 `recalculateOnChange()` claimed S22/S24 writes in Returns To, but those are N47's responsibility. N50 just conditionally triggers N47.

**Fix**: Returns To set to "—".

### 3. N51 → N52 Missing Wire (Medium)

N52 `scaleToViewport()` lists "N51 call" as its trigger, but N51's Wires Out didn't include → N52. Incomplete wire.

**Fix**: Added → N52 to N51's Wires Out.

### 4. N41/N22 Circular Reference (Medium)

N41 `validateTabCompletion()` "calls existing N22 logic" for SP validation AND "returns to N22 extended." This reads as N41 calling N22 AND N22 reading N41 — circular.

**Fix**: Clarified that N41 contains extracted SP validation rules (doesn't call N22 the function). N22 is extended to delegate per-tab checks to N41. Updated Connection Points section.

### 5. State Placement vs Tab Switching (Low)

S21-S24, S27 are placed in P2.4 (conceptually correct — that's where they enable behavior) but P2.4 is a conditional render zone. If React unmounts DtfTabContent on tab switch, state is lost, violating R1.2.

**Fix**: Added implementation note: state must be lifted to P2 (QuoteForm) — matching the existing pattern where S6 lives in QuoteForm. CSS-based show/hide is the alternative but less preferred.

## Key Decision

**No structural changes needed.** All 5 smells were wiring column corrections and an implementation note. The breadboard's places, affordance set, slices, and build order are sound. The breadboard is ready for implementation planning.

## Next Step

Implementation planning — take the sliced breadboard and produce an execution manifest with waves, parallel agent assignments, and per-task specs.

## Artifacts

- Breadboard (updated): [`docs/breadboards/dtf-gang-sheet-breadboard.md`](https://github.com/cmbays/mokumo/blob/main/docs/breadboards/dtf-gang-sheet-breadboard.md)

## Sources

- Breadboard: [`docs/breadboards/dtf-gang-sheet-breadboard.md`](https://github.com/cmbays/mokumo/blob/main/docs/breadboards/dtf-gang-sheet-breadboard.md)
- Shaping doc: [`docs/shaping/dtf-gang-sheet/shaping.md`](https://github.com/cmbays/mokumo/blob/main/docs/shaping/dtf-gang-sheet/shaping.md)
- Breadboard reflection skill: `.claude/skills/breadboard-reflection/SKILL.md`
