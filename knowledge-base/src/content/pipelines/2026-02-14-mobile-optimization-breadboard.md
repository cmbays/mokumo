---
title: 'Mobile Optimization — Breadboard'
subtitle: 'Affordance mapping, component boundaries, and build order for the mobile optimization vertical'
date: 2026-02-14
phase: 1
pipelineName: mobile-optimization
pipelineType: horizontal
products: [dashboard, quotes, customers, invoices, jobs]
domains: [garments, pricing]
tools: []
stage: breadboard
tags: [plan, build]
sessionId: 'b7ec7c32-c69d-44ed-9672-b6b7676b0ed9'
branch: 'session/0214-mobile-breadboard'
status: complete
---

## Summary

Produced the breadboard document for the mobile optimization vertical, mapping all UI affordances, code affordances, data stores, wiring, component boundaries, and build order. This follows the interview-validated design doc and uses the hybrid build strategy (Foundation Sprint + Value Sprint).

## Breadboard Stats

- **9 top-level Places** + 6 sub-places (bottom sheets, modals)
- **~100 UI affordances** (U1–U152) covering all 8 CORE features + 4 interview-discovered patterns
- **38 code affordances** (N1–N38 Phase 1) + 7 Phase 2 extensions (N50–N56)
- **22 data stores** (URL params, React state, mock data)
- **15 component boundaries** with shared/vertical-specific classification
- **25-step build order** across 4 sprints

## Key Places

| Place                    | What                                                             | Why                                                       |
| ------------------------ | ---------------------------------------------------------------- | --------------------------------------------------------- |
| P1: Mobile App Shell     | BottomTabBar + MobileHeader (persistent at < 768px)              | Replaces sidebar — unlocks all mobile navigation          |
| P2: Mobile Drawer        | "More" menu overlay                                              | Secondary nav (Invoices, Screen Room, Garments, Settings) |
| P3: Mobile Dashboard     | Priority alerts + "coming up" filter + capacity summary          | Evening check-in and morning status check                 |
| P4: Mobile Kanban        | Swipe lane tabs + single-column cards + quick actions            | #1 use case: capacity awareness + status management       |
| P4.2: Quick Note Capture | Note + entity attachment + block/unblock toggle                  | "As fast as texting" — notes with side effects            |
| P5: Mobile Job Detail    | Tabbed layout + task checkboxes + notes feed + bottom action bar | Two-speed task tracking (granular + quick)                |

## New Interaction Patterns (from Interview)

### Notes with Side Effects

Note input includes an optional "Block this job" toggle. When enabled, submitting the note also changes the job's lane to Blocked with the note as the block reason. Mapped as `<NoteCapture>` shared component (P4.2, P5.1) with affordances U55–U62 and U90–U97.

### Capacity Summary

Lightweight view showing jobs this week (count + shirt volume), rush orders flagged. Mapped as `<CapacitySummary>` shared component used in both dashboard (U27) and board (U40), driven by N6 `calculateCapacity()`.

### Two-Speed Task Tracking

Quick lane move via "Move to [Next Lane] →" button on cards (U34, N9) for the "slide it over" workflow. Granular task checkboxes (U76, N20) for detailed progress tracking. Both mobile-optimized.

## Component Boundaries

15 components identified. Key shared components that unblock multiple screens:

| Component           | Reused By                 | Priority |
| ------------------- | ------------------------- | -------- |
| `<BottomTabBar>`    | All pages                 | Sprint 1 |
| `<BottomSheet>`     | 5 bottom sheet places     | Sprint 1 |
| `<MobileCardList>`  | All 4 list views          | Sprint 1 |
| `<NoteCapture>`     | Board + Job Detail        | Sprint 2 |
| `<CapacitySummary>` | Dashboard + Board         | Sprint 2 |
| `<BottomActionBar>` | All detail views          | Sprint 4 |
| `<LaneSelector>`    | Lane change sheet + board | Sprint 2 |

## Build Order (4 Sprints)

### Sprint 1: Foundation (~1 week)

Steps 1–7: Design tokens, BottomTabBar, MobileDrawer, MobileHeader, layout toggle, touch target audit, MobileCardList, BottomSheet.

### Sprint 2: High-Value Screens (~1 week)

Steps 8–12: MobileKanbanBoard with swipe tabs, CapacitySummary, NoteCapture with side effects, MobileDashboard with "coming up" filter, LaneSelector.

### Sprint 3: List Views + Forms (~1 week)

Steps 13–18: Quotes/Jobs/Invoices/Customers card conversions, MobileFilterSheet, form mobile layouts.

### Sprint 4: Detail Views + Polish (~1 week)

Steps 19–25: BottomActionBar, Job/Quote/Invoice/Customer detail mobile layouts, FullScreenModal, desktop regression testing.

## Scope Coverage

All 8 CORE features (C1–C8), 4 INTERCONNECTIONS (I1–I4), and 4 interview-discovered patterns (notes with side effects, capacity summary, "coming up" filter, two-speed task tracking) have corresponding affordances in the breadboard.

## What's Next

1. **Implementation planning** — Detailed task breakdown per sprint step with acceptance criteria
2. **Build Sprint 1** — Foundation components (BottomTabBar, MobileDrawer, MobileHeader, design tokens)
3. **Spike: mobile Kanban swipe mechanics** — May need a spike doc for touch-based lane tab switching with dnd-kit or Framer Motion

## Artifacts

- [Breadboard document](https://github.com/cmbays/mokumo/blob/main/docs/breadboards/mobile-optimization-breadboard.md)
- [Design doc](https://github.com/cmbays/mokumo/blob/main/docs/plans/2026-02-14-mobile-optimization-design.md)
- [Interview session](https://github.com/cmbays/mokumo/blob/main/knowledge-base/src/content/pipelines/2026-02-14-mobile-optimization-interview.md)
