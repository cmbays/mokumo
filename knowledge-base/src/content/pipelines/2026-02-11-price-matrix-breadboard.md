---
title: 'Price Matrix Breadboard'
subtitle: 'UI affordance map, wiring, component boundaries, and parallelized build order for the Price Matrix vertical'
date: 2026-02-11
phase: 1
pipelineName: price-matrix
pipelineType: vertical
products: [quotes]
domains: [pricing]
tools: []
stage: breadboard
tags: [plan, decision]
sessionId: 'ac42f9fb-92e3-4d10-971d-bec20c749009'
branch: 'session/0210-price-matrix'
status: complete
---

## At a Glance

| Stat             | Value |
| ---------------- | ----- |
| Places           | 8     |
| UI Affordances   | 167   |
| Code Affordances | 80    |
| Data Stores      | 14    |

The breadboard maps the full Price Matrix vertical: a centralized pricing engine living under Settings, with a peek/shortcut from Quotes. Two service types (Screen Print + DTF), multiple templates with tag-based customer mapping, real-time margin indicators, sandbox what-if mode, and a 5-minute setup wizard.

## Source Document

### Breadboard Blueprint

[docs/breadboards/price-matrix-breadboard.md](https://github.com/cmbays/mokumo/blob/session/0210-price-matrix/docs/breadboards/price-matrix-breadboard.md)

Full affordance tables, wiring verification, component boundaries, and scope coverage matrix.

## Places Mapped

| ID   | Type  | Name                       | Route                               |
| ---- | ----- | -------------------------- | ----------------------------------- |
| P1   | Page  | Pricing Hub                | /settings/pricing                   |
| P1.1 | Modal | New Template Wizard        | 5-step setup                        |
| P1.2 | Sheet | Tag-Template Mapping       | customer tag → template             |
| P2   | Page  | Screen Print Matrix Editor | /settings/pricing/screen-print/[id] |
| P2.1 | Modal | Side-by-Side Comparison    | current vs. proposed                |
| P2.2 | Sheet | Cost Configuration         | garment + ink + overhead            |
| P3   | Page  | DTF Matrix Editor          | /settings/pricing/dtf/[id]          |
| P4   | Sheet | Matrix Peek (from Quotes)  | read-only + quick adjust            |

## Build Plan — Critical Path

The build follows a dependency chain with three parallelization windows. Foundation work is sequential, then the plan fans out.

```text
PHASE A — Foundation (sequential)

#1 Schemas → #2 Pricing Engine → #3 Mock Data
     |
#4 Shared Components (MarginIndicator, CostBreakdownTooltip)
     |
#5 Sidebar Update + #6 Pricing Hub

PHASE B — Editors (parallel after Hub)

  [Agent A] #7 Setup Wizard (P1.1)
  [Agent B] #8 Screen Print Editor (P2)
  [Agent C] #9 DTF Editor (P3)

PHASE C — Features (parallel after SP Editor)

  [Agent A] #8a Sandbox + Comparison (P2.1)
  [Agent B] #8b Power Mode Grid
  [Agent C] #8c Cost Config Sheet (P2.2)

PHASE D — Integration (parallel)

  [Agent A] #10 Matrix Peek Sheet (P4)
  [Agent B] #11 Tag-Template Mapping (P1.2)
```

## Parallelization Strategy

### Phase A — Sequential Foundation

Schemas, pricing engine, mock data, shared components, sidebar, and hub page. Each step depends on the previous. Single-agent work.

- **#1 Zod Schemas** — `price-matrix.ts`, `dtf-pricing.ts`, `tag-template-mapping.ts`
- **#2 Pricing Engine** — Pure functions in `lib/pricing-engine.ts`, fully testable
- **#3 Mock Data** — 3 SP templates, 2 DTF templates, tag mappings, cost configs
- **#4 Shared Components** — `MarginIndicator`, `CostBreakdownTooltip`, `PricingTemplateCard`
- **#5 Sidebar** — Add Settings section with Pricing link
- **#6 Pricing Hub** — Template cards, service type tabs, search

### Phase B — 3 Parallel Agents

Once the hub is built, three independent editors can be built simultaneously. No shared state between them.

- **Agent A: Setup Wizard** — 5-step modal with industry defaults and live preview (P1.1)
- **Agent B: Screen Print Editor** — Simple Mode with quantity, color, location, garment sections + margin indicators (P2)
- **Agent C: DTF Editor** — Sheet-size tiers, customer discounts, rush fees, film types (P3)

### Phase C — 3 Parallel Agents

After the base Screen Print Editor, three feature overlays can be added in parallel. Each is self-contained within P2.

- **Agent A: Sandbox + Comparison** — Enter experiment mode, compare side-by-side, apply or discard (P2.1)
- **Agent B: Power Mode Grid** — TanStack Table inline editing, bulk select, keyboard nav
- **Agent C: Cost Config Sheet** — Configure production costs for margin calculations (P2.2)

### Phase D — 2 Parallel Agents

Integration features that connect price matrix to existing verticals.

- **Agent A: Matrix Peek Sheet** — Read-only pricing view from Quote Detail with quick-adjust options (P4)
- **Agent B: Tag-Template Mapping** — Map customer type tags to pricing templates (P1.2)

## Key Decisions

### Settings-first, Quotes-peek

Pricing configuration lives under `/settings/pricing` (new sidebar section). Quotes get a read-only peek sheet with "override this quote" or "edit template" options. Not a top-level sidebar item.

### Separate matrices for Screen Print vs DTF

Fundamentally different pricing models get separate editors (P2 vs P3), not tabs within the same page. Screen print = qty x colors x locations x garment. DTF = sheet length x customer tier x rush x film type.

### Wizard over import

PrintLife has no export capability. The strategy pivots to an exceptional wizard UX with industry-standard defaults pre-filled. CSV import deferred to Phase 2.

### Tag-to-template customer mapping

Existing `customerTypeTagEnum` (retail, sports-school, corporate, storefront-merch, wholesale) maps to pricing templates. When quoting a customer with tag "sports-school", the school template auto-applies.

## Scope Coverage

All 30 interview findings mapped to specific affordances. Every demo must-have covered:

| Demo Must-Have    | Affordances                                                           |
| ----------------- | --------------------------------------------------------------------- |
| Margin visibility | U67, U130, U163, MarginIndicator component, green/yellow/red per cell |
| 5-minute setup    | P1.1 wizard (U20-U37), industry defaults, live preview                |
| What-if scenarios | Sandbox toggle (U53), comparison modal P2.1 (U100-U107)               |
| Quote integration | Matrix Peek P4 (U160-U167), pricing engine feeds quote calculator     |

## New Files Created

| File                                          | Purpose                                                                                         |
| --------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `docs/breadboards/price-matrix-breadboard.md` | Full breadboard: 8 places, 167 UI affordances, 80 code affordances, 14 data stores, build order |

## Next Steps

1. **Build Phase A** — Schemas, pricing engine, mock data, shared components, sidebar, hub
2. **Spawn parallel agents** for Phase B (wizard + SP editor + DTF editor)
3. **Spawn parallel agents** for Phase C (sandbox + power mode + cost config)
4. **Integration** — Matrix peek from quotes, tag-template mapping
5. **Quality gate** — Design audit against 15-point checklist
