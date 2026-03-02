---
title: 'ROADMAP'
description: 'Strategic planning document. Vision, phases, vertical inventory, current bets, and forward planning. Every Claude session reads this for strategic context.'
category: canonical
status: active
phase: all
last_updated: 2026-03-01
last_verified: 2026-03-01
depends_on:
  - docs/PRD.md
  - docs/IMPLEMENTATION_PLAN.md
  - PROGRESS.md
---

# Screen Print Pro — Roadmap

## Vision

Production management software for 4Ink, a screen-printing shop. Manages the full garment lifecycle: Quote > Artwork Approval > Screen Room > Production > Shipping. The primary user is the shop owner/operator who needs instant clarity on job status, blocked items, and next actions.

**Long-term trajectory**: Web app > user feedback iteration > production backend > mobile optimization > native mobile app (app stores).

## Methodology: Shape Up (Adapted for Solo Dev + AI)

We follow a Shape Up cycle adapted for one developer working with Claude Code agents:

| Phase         | What Happens                                                              | Artifacts                                  |
| ------------- | ------------------------------------------------------------------------- | ------------------------------------------ |
| **Shaping**   | Define the problem, research competitors, map affordances, set boundaries | Vertical BRIEF, breadboard, spike docs     |
| **Betting**   | Decide what to build next and in what order                               | Updated ROADMAP, IMPLEMENTATION_PLAN       |
| **Building**  | Execute the vertical through the 7-step pipeline                          | Code, KB sessions, PR                      |
| **Cool-down** | Synthesize feedback, review progress, shape next cycle                    | Updated BRIEFs, new issues, shaped pitches |

### 7-Step Vertical Pipeline

```
Discovery > Scope > Breadboard > Implementation Planning > Build > Review > Demo
```

Each vertical passes through these stages. The KB tracks progress per vertical per stage.

## Phases

### Phase 1: Frontend Mockups (COMPLETE)

**Goal**: High-fidelity UI with mock data for user acceptance testing. No backend.

**Status**: All 7 verticals built and demo-ready. 529 tests, 26 test files, zero rollbacks. Screen Room integrated into existing verticals (customer screens tab, job detail, quote-time reuse detection) rather than standalone page. Mobile optimization complete — 4-sprint plan executed (PRs #101, #114, #148, #167, #174, #175). Garment mockup SVG composition engine designed and built. 37+ KB session docs.

### Phase 1.5: Demo Prep (COMPLETE — Feb 21)

**Goal**: Polish mobile, add onboarding wizards, build DTF Gang Sheet Builder, fix demo-blocking bugs. Demo with Gary on February 21 ✅.

**Delivered**:

1. ~~**Mobile Polish** (Sprints 3-4)~~ — Done (PRs #148, #167, #174, #175).
2. ~~**Onboarding Wizards** (#145)~~ — guided first-time experience across verticals
3. ~~**DTF Gang Sheet Builder** (#144)~~ — Done (PRs #232, #237, #249, #280, #284).

**Demo-blocking bugs**: All resolved — #128 (leading zeros), #129 (tier validation), #138 (color pricing, PR #157).

### Phase 2: Feedback Iteration + Backend Foundation (CURRENT)

**Goal**: Incorporate user feedback, build backend horizontal foundation, connect first vertical end-to-end.

**Progress**: Backend foundation shipped (Supabase, Drizzle, auth, S&S catalog pipeline). Garments catalog live (Epic #714). Customer vertical in progress (P3). Artwork vertical research complete (Epic #717).

> **Per-project detail**: See [docs-site/roadmap/projects.md](docs-site/roadmap/projects.md) — maintained as the richer, living source of truth for each project's milestones, research findings, and key decisions.

### Phase 3: Production App

**Goal**: All verticals connected to real backend. Production-grade reliability.

**Key bets** (not yet shaped):

- Remaining vertical backends
- Real-time updates (WebSockets or Supabase realtime)
- Multi-user support (future employees)
- Mobile optimization

### Phase 4: Mobile

**Goal**: Native mobile app on app stores.

**Not yet scoped.** Will be shaped after Phase 3 is stable.

## Vertical Inventory

| Vertical            | Phase 1 Status | Phase 2 Status  | Pipeline Stage | Epic / BRIEF                     |
| ------------------- | -------------- | --------------- | -------------- | -------------------------------- |
| Dashboard           | Complete       | —               | Demo           | —                                |
| Quoting             | Complete       | Planned         | Demo           | TODO                             |
| Customer Management | Complete       | In Progress     | Build          | TODO                             |
| Invoicing           | Complete       | Planned         | Demo           | TODO                             |
| Price Matrix        | Complete       | —               | Demo           | TODO                             |
| Jobs                | Complete       | Planned         | Demo           | TODO                             |
| Screen Room         | Integrated     | Planned         | Demo           | TODO                             |
| Garments            | Complete       | In Progress     | Build          | Epic #714                        |
| Mobile Optimization | Complete       | —               | Demo           | —                                |
| DTF Gang Sheet      | Complete       | —               | Demo           | PRs #232, #237, #249, #280, #284 |
| **Artwork Library** | Mock entity    | **Research ✅** | **Research**   | **Epic #717**                    |

## Current Bets (What We're Working On)

1. **Garments vertical UX polish** (Epic #714) — Search debounce fix (#695), inventory cron upgrade to 15-min (#706), drawer close animation (#697). Color UX complete (PRs #629, #639, #641). S&S pipeline complete (PRs #707–#713).
2. **Customer vertical** (P3) — Paper design sessions (P1–P4 complete). Customer list, detail, artwork tab, referral balance screens designed and shipped.
3. **Artwork vertical research** (Epic #717) — M0 Research complete 2026-03-01. 8 milestones (#718–#724). M1 blocked by H2 (File Upload Pipeline). Spikes #725 (color detection), #726 (storage limits).
4. **Docs integration** — Mintlify docs-site launched (PR #716 merged). Artwork research integrated into docs-site P5 section and new research page.

## Forward Planning (Shaped But Not Started)

These are shaped ideas waiting for a betting decision:

- **Artwork Library Vertical** (Epic #717) — Research complete. 7 milestones: Storage & Schema → Library UI → {Color Detection, Quote Integration, Approval Workflow} → Separation Metadata → Mockup Enhancement. Blocked by H2 (File Upload Pipeline). See `docs/workspace/20260301-artwork-vertical/research-report.md`.
- **Mockup integration** — Wire garment mockup thumbnails into Quote Detail, Job Detail, Kanban Board. Auto-attach mockups to quote emails. Will be absorbed into Artwork M7.
- **Shop floor display** — Auto-refreshing Kanban board for TV/tablet (replaces physical whiteboard)

## Open Strategic Questions

- Multi-user: when does 4Ink need other employees using the system? This affects auth architecture timing.
- DTF vs Screen Print quoting: will DTF Gang Sheet Builder require revisions to the existing quoting flow?

## Reference Documents

> This file is the fast-load primer read at every session start. When you need depth, reach into the docs-site — do not re-read this file expecting detail that isn't here.

| When you need...                                            | Read                                    |
| ----------------------------------------------------------- | --------------------------------------- |
| Per-project milestones, research findings, locked decisions | `docs-site/roadmap/projects.md`         |
| Phase 2 dependency map, critical path, sequencing risks     | `docs-site/roadmap/phase-2.md`          |
| Current build status, PR history                            | `PROGRESS.md`                           |
| Routes and navigation paths                                 | `docs/APP_FLOW.md`                      |
| Feature definitions and acceptance criteria                 | `docs/PRD.md`                           |
| Tool choices, versions, decisions                           | `docs/TECH_STACK.md`                    |
| PM workflows, label taxonomy, issue templates               | `docs/PM.md`                            |
| Decision history and rationale                              | `knowledge-base/src/content/pipelines/` |
