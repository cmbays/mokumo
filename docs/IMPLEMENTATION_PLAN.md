---
title: 'IMPLEMENTATION_PLAN'
description: "Phase 1 build record and Phase 1.5 demo week plan. Tracks what was built, what's in progress, and what's next."
category: canonical
status: active
phase: 1
last_updated: 2026-02-15
last_verified: 2026-02-15
current_step: 'Phase 1.5 — Demo Prep'
depends_on:
  - docs/PRD.md
  - docs/APP_FLOW.md
  - docs/ROADMAP.md
---

# Mokumo — Implementation Plan

**Current Phase**: Phase 1.5 — Demo Prep (Feb 15-21)
**Demo Date**: February 21, 2026

---

## Build Principles

1. **Shape Up methodology**: Shaping → Betting → Building → Cool-down cycles
2. **7-step vertical pipeline**: Discovery → Scope → Breadboard → Implementation Planning → Build → Review → Demo
3. **Parallel execution**: Multiple verticals built concurrently via git worktrees + subagent-driven development
4. **Breadboard-first**: Every vertical gets a breadboard before the first line of code
5. **User review checkpoints**: Demo with Gary (shop owner) to validate design decisions

---

## Phase 1: Frontend Mockups (COMPLETE)

All 7 verticals built and demo-ready. 529 tests passing, 26 test files, zero rollbacks.

### Vertical Build Record

| Vertical                | Pipeline Stage | Key PRs                                 | Build Approach                                                                                                                                                                                                  |
| ----------------------- | -------------- | --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Dashboard**           | Demo           | #13 (scaffold)                          | Sequential — first vertical, established patterns                                                                                                                                                               |
| **Quoting**             | Demo           | #13, #14, #20, #44                      | Full pipeline: discovery → scope → breadboard → build → review                                                                                                                                                  |
| **Customer Management** | Demo           | #24, #33, #35, #44                      | Full pipeline with SmartViewTabs pattern that propagated to other verticals                                                                                                                                     |
| **Price Matrix**        | Demo           | #45, #47, #49                           | 4-agent research team → breadboard (167 affordances) → 3-agent parallel build                                                                                                                                   |
| **Invoicing**           | Demo           | #46, #48, #50                           | 5-agent research → breadboard (99 UI + 44 code affordances) → build with big.js financial precision                                                                                                             |
| **Jobs**                | Demo           | #58, #64, #77                           | 10-competitor analysis → Kanban with dnd-kit → polish pass → CodeRabbit fixes                                                                                                                                   |
| **Garments**            | Demo           | #102, #104, #109, #141                  | Catalog + mockup engine. Subagent-driven 18-task build. SVG composition engine.                                                                                                                                 |
| **Screen Room**         | Integrated     | #98, #109, #115                         | Not standalone page — integrated as customer screens tab + job detail + quote-time reuse detection                                                                                                              |
| **Mobile**              | Demo           | #99, #101, #114, #148, #167, #174, #175 | 4-sprint plan complete. Nav shell (Sprint 1) + responsive pages (Sprint 2) + shared components, form layouts, detail views (Sprint 3+4) + mobile filter sheets, tab grouping, scroll-to-error + pricing mobile. |

### Infrastructure Built

| Component             | PRs                             | Description                                                                            |
| --------------------- | ------------------------------- | -------------------------------------------------------------------------------------- |
| **Data Layer**        | Multiple                        | 15 Zod schemas, 42 colors, 17 garments, reverse lookup helpers, big.js money utilities |
| **Knowledge Base**    | #62                             | Astro 5.3, 36+ session docs, Pagefind search, Gary tracker, pipeline stepper           |
| **DevX Vertical**     | #92, #94, #96, #100, #103, #108 | `work` CLI, 8 agents, 14 skills, session orchestration, Zellij layouts                 |
| **PM Foundation**     | #91                             | Shape Up methodology, ROADMAP.md, cool-down skill, 28 GitHub labels                    |
| **Worktree Workflow** | #118                            | No worktree limits, push-after-commit, ownership rules                                 |

### Phase 1 Velocity

- **24 PRs merged** on Feb 14 alone (#79 → #143)
- **15 issues closed** on Feb 14
- **~21,000 lines added** in one day
- **Zero rollbacks** across all Phase 1 work

---

## Phase 1.5: Demo Prep (IN PROGRESS)

**Goal**: Polish, onboard, and enhance for Gary demo on February 21.

### Three Must-Haves (ranked)

| Priority | Deliverable                 | Issue | Status                                                                                                      |
| -------- | --------------------------- | ----- | ----------------------------------------------------------------------------------------------------------- |
| **#1**   | Mobile Polish (Sprints 3-4) | —     | **DONE** — PRs #148, #167, #174, #175 merged. Filter sheets, tab grouping, scroll-to-error, pricing mobile. |
| **#2**   | Onboarding Wizards          | #145  | Pending — guided first-time experience across verticals                                                     |
| **#3**   | DTF Gang Sheet Builder      | #144  | **DONE** — PRs #232, #237, #249, #280, #284. All 4 waves merged. V5 job card wiring deferred (PRI-155).     |

### Demo Week Schedule

| Day      | Deliverable                                                   | Risk Level                                  |
| -------- | ------------------------------------------------------------- | ------------------------------------------- |
| Day 1    | Cool-down: fix stale docs, triage issues, update Gary tracker | **Done**                                    |
| Day 2    | Mobile polish (Sprints 3-4): forms, detail views, animation   | **Done** (PRs #148, #167, #174, #175)       |
| Days 2-3 | Demo bug fixes (#128, #129, #138)                             | **Done** (PR #157)                          |
| Days 3-4 | Onboarding Wizards (#145)                                     | Pending                                     |
| Days 4-5 | DTF Gang Sheet Builder — discovery through build              | **Done** (PRs #232, #237, #249, #280, #284) |
| Day 6+   | Minimal backend (stretch)                                     | High                                        |

### Demo-Blocking Bugs (ALL RESOLVED)

| Issue | Title                               | Status              |
| ----- | ----------------------------------- | ------------------- |
| #128  | Price matrix: leading zeros         | **Fixed** (PR #157) |
| #129  | Price matrix: defer tier validation | **Fixed** (PR #157) |
| #138  | Price matrix: color pricing doubles | **Fixed** (PR #157) |

### Demo Journeys (Wizard-Guided)

1. **View the job board** — walk through Kanban, understand production flow
2. **Close an invoice** — full financial cycle: view → record payment → mark paid
3. **Create a customer** — demonstrate CRM capability and cross-linking

### Mockup Integration

- Auto-generate garment mockups and attach to quotes when sending
- Wire thumbnails into Job Detail, Kanban Board, Quote Detail
- Replaces Gary's current manual process (create mockup image → email to customer)

---

## Phase 2: Feedback Iteration + Backend Foundation (NOT STARTED)

**Shaped during cool-down, not yet bet on.**

### Shaped Pitches

- Process Gary's demo feedback into vertical BRIEFs
- Backend horizontal: Supabase setup, auth, data model, API patterns (#84)
- Quoting vertical backend (reference implementation)
- New agents: Backend Architect (#119), Data Engineer (#120), Schema Migration (#121)
- TDD skill for Phase 2 (#122)
- Build pipeline upgrade (#123)
- Sentry error monitoring (#86)

### Open Strategic Questions

- Backend scope: one vertical at a time or horizontal foundation first? → **Decided: horizontal first** (ROADMAP.md)
- Mobile path: responsive → PWA → native (phased)
- Multi-user timing: depends on Gary feedback

---

## Phase 3: Production App (NOT SCOPED)

All verticals connected to real backend. Real-time updates, multi-user support.

## Phase 4: Mobile (NOT SCOPED)

Native mobile app on app stores. Will be shaped after Phase 3.

---

## Deferred Tech Debt

Tracked as GitHub issues. Prioritized during cool-down cycles.

| Issue    | Category                                           | Priority             |
| -------- | -------------------------------------------------- | -------------------- |
| #15      | Migrate forms to React Hook Form + Zod             | next                 |
| #16      | Replace local interfaces with schema-derived types | next                 |
| #17      | Sync garment filter with URL params                | next                 |
| #18      | Extract shared formatCurrency/formatDate           | next                 |
| #63      | KB CodeRabbit feedback (a11y, markdown lint)       | later                |
| #70-#76  | Jobs board refactoring (DRY, a11y, types)          | next                 |
| #78      | Rename (dashboard) route group                     | later                |
| #116     | Migrate QuoteForm money arithmetic to big.js       | low                  |
| ~~#151~~ | ~~Unit tests for mobile components~~               | **Closed** (PR #167) |
| ~~#152~~ | ~~Integrate MobileFilterSheet into list views~~    | **Closed** (PR #167) |
| #153     | Extract hardcoded toast messages to constants      | later                |
| #154     | Fix pre-existing lint errors (React 19 compiler)   | later                |
| ~~#155~~ | ~~Customer detail tab grouping~~                   | **Closed** (PR #167) |
| ~~#156~~ | ~~Mobile scroll-to-error~~                         | **Closed** (PR #167) |

---

## Related Documents

- `docs/ROADMAP.md` — Strategic planning, phases, bets
- `PROGRESS.md` — What's been built (updated after PR merges)
- `docs/PRD.md` — Feature definitions and acceptance criteria
- `docs/APP_FLOW.md` — Routes and navigation paths
- `docs/TECH_STACK.md` — Tool choices
- `CLAUDE.md` — AI operating rules and quality checklist
- `knowledge-base/src/content/sessions/` — Historical session records
