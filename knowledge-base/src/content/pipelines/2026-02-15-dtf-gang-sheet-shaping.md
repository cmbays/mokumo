---
title: 'DTF Gang Sheet Builder — Shaping (R x S)'
subtitle: 'Requirements definition, 4 shapes explored, Shape D selected for Feb 21 demo'
date: 2026-02-15
phase: 1
pipelineName: dtf-gang-sheet
pipelineType: vertical
products: [quotes, jobs]
tools: []
stage: shape
tags: [decision, research]
sessionId: '0ba68ef8-1b02-40be-a039-2c63d6d15cd1'
branch: 'session/0215-dtf-gang-sheet-research'
status: complete
---

## Context

Shaping session for the DTF Gang Sheet Builder vertical, following the R x S methodology. Built on the competitive research (5 competitors) and pre-build interview (17 questions) completed earlier in the same session. The shaping defines requirements, explores 4 competing shapes, and selects Shape D for the Feb 21 demo build.

## Resume Command

```bash
claude --resume 0ba68ef8-1b02-40be-a039-2c63d6d15cd1
```

## Requirements Summary

6 requirement groups, 16 individual requirements:

| ID        | Requirement                                                                | Status                  |
| --------- | -------------------------------------------------------------------------- | ----------------------- |
| R0        | Gary can create DTF film-only quotes with auto-arranged gang sheet layouts | Core goal               |
| R1        | Quoting architecture supports multiple service types (tabs)                | Must-have               |
| R2        | DTF line items follow content-first workflow                               | Must-have               |
| R3        | Sheet optimization calculates cheapest arrangement                         | Must-have               |
| R4        | Visual confirmation of gang sheet layout (read-only canvas)                | Must-have               |
| R5.1-R5.2 | Sibling jobs + shipping gate                                               | Out (separate vertical) |
| R5.3      | DTF jobs use simplified production steps                                   | Must-have               |
| R6        | Demo-ready for Feb 21 with mock data                                       | Must-have               |

## Shapes Explored

| Shape | Approach                                                                   | Verdict                                                   |
| ----- | -------------------------------------------------------------------------- | --------------------------------------------------------- |
| **A** | Full 3-wave vision (tabs + DTF + canvas + sibling jobs + artwork overhaul) | Too much for 6 days; 6 flagged unknowns                   |
| **B** | DTF-only quote flow (bypass multi-service tabs)                            | Fails R1; creates silo requiring later refactor           |
| **C** | Tabs + DTF math, no visual canvas                                          | Fails R4; missing the "wow" for demo                      |
| **D** | Tabs + full DTF experience + canvas, defer sibling jobs                    | **Selected** — passes all must-haves, no flagged unknowns |

## Selected Shape: D

**Tabs + Full DTF Experience, Defer Sibling Jobs**

6 parts, zero flagged unknowns:

| Part | What It Builds                                                 |
| ---- | -------------------------------------------------------------- |
| D1   | Service type tab navigation in quote builder                   |
| D2   | DTF line item builder (artwork + size preset + quantity)       |
| D3   | Sheet optimization algorithm (shelf-packing + cost comparison) |
| D4   | Read-only visual canvas (SVG, 22"-wide sheets)                 |
| D5   | DTF production steps on job cards                              |
| D6   | Standalone DTF size presets (small/medium/large + custom)      |

## Key Decisions

### Shape D over Shape A

Shape A (full 3-wave plan) has 7 major parts with 6 flagged unknowns in 6 days. Shape D delivers the same demo impact by deferring sibling jobs and the artwork model overhaul — both of which are invisible in the quoting demo flow.

### Standalone Size Presets (D6)

DTF line item form has 3 hardcoded size presets ("Small/Collectibles" 4x4", "Medium/Pocket" 6x6", "Large/Shirts" 10x12") plus custom entry. Size is a property of the line item, NOT the artwork. Later, the artwork model overhaul (#212) adds per-artwork DTF size templates, and the line item form pulls from artwork metadata instead of hardcoded presets. Zero rework needed.

### Sibling Jobs Deferred

Sibling job creation requires job schema changes, Kanban board updates, and job detail page changes. This is architecturally significant but invisible to the quoting demo. Created as separate issue #211.

## Deferred Items (GitHub Issues)

| Issue                                               | Title                                                               | Priority |
| --------------------------------------------------- | ------------------------------------------------------------------- | -------- |
| [#211](https://github.com/cmbays/mokumo/issues/211) | Sibling jobs + shipping gate for multi-service-type quotes          | Next     |
| [#212](https://github.com/cmbays/mokumo/issues/212) | Artwork model overhaul — service-type-specific metadata per artwork | Next     |
| [#213](https://github.com/cmbays/mokumo/issues/213) | DTF + Press service type — garment selection + pressing workflow    | Later    |

## Artifacts

- Frame: [`docs/shaping/dtf-gang-sheet/frame.md`](https://github.com/cmbays/mokumo/blob/main/docs/shaping/dtf-gang-sheet/frame.md)
- Shaping doc: [`docs/shaping/dtf-gang-sheet/shaping.md`](https://github.com/cmbays/mokumo/blob/main/docs/shaping/dtf-gang-sheet/shaping.md)
- Spike doc: [`docs/spikes/spike-dtf-gang-sheet-builder.md`](https://github.com/cmbays/mokumo/blob/main/docs/spikes/spike-dtf-gang-sheet-builder.md)

## Next Step

Breadboarding — map Shape D's 6 parts into concrete affordances, wiring, and vertical slices for implementation planning.

## Sources

- Pre-build interview (2026-02-15, 17 questions): [KB doc](https://github.com/cmbays/mokumo/blob/main/knowledge-base/src/content/pipelines/2026-02-15-dtf-gang-sheet-interview.md)
- Competitive research (5 competitors): [KB doc](https://github.com/cmbays/mokumo/blob/main/knowledge-base/src/content/pipelines/2026-02-15-dtf-gang-sheet-research.md)
- Shaping skill: R x S methodology adapted from [rjs/shaping-skills](https://github.com/rjs/shaping-skills)
