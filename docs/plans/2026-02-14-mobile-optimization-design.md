---
title: 'Mobile Optimization — Design'
description: "Interview-validated design for Mokumo's mobile experience"
category: plan
status: approved
phase: 1
created: 2026-02-14
---

# Mobile Optimization — Design

## Context

The mobile optimization vertical completed competitive analysis, journey mapping, and scope definition in a prior session. This session conducted a 10-question user interview that validated some assumptions, challenged others, and uncovered new priorities.

## Design Philosophy

**"Bring the business to the app. Bring the app to Gary."**

The mobile experience has two layers:

1. **Untethered access** (Phase 1) — Check the board, see KPIs, log notes, update tasks from anywhere
2. **The app comes to you** (Phase 2+) — Notifications push decisions. Integrations pull business from scattered channels into one hub.

## Build Strategy: Foundation + Value Hybrid

### Sprint 1: Foundation (~1 week)

Build the responsive infrastructure that all mobile screens depend on.

| Step | What                                 | Why First                             |
| ---- | ------------------------------------ | ------------------------------------- |
| 1    | Bottom tab bar navigation            | Unlocks all mobile navigation         |
| 2    | Mobile drawer ("More" menu)          | Secondary nav items                   |
| 3    | Design tokens (mobile-specific)      | Foundation for all mobile components  |
| 4    | Hide sidebar on mobile, show tab bar | Switch navigation modes by breakpoint |
| 5    | Global touch target audit + fixes    | Affects every page                    |
| 6    | `<MobileCardList>` shared component  | Reused by all list views              |

### Sprint 2: High-Value Screens (~1 week)

Jump to the screens Gary actually needs on his phone, based on interview findings.

| Step | What                                                | Why Now                                                  |
| ---- | --------------------------------------------------- | -------------------------------------------------------- |
| 7    | Mobile Kanban board (swipe columns + quick actions) | #1 use case: capacity awareness + status management      |
| 8    | Dashboard mobile layout with "coming up" filter     | Evening check-in + morning status check                  |
| 9    | Quick note capture with optional state change       | "As fast as texting" — notes that can block/unblock jobs |

### Sprint 3: List Views + Forms (~1 week)

| Step | What                                         |
| ---- | -------------------------------------------- |
| 10   | Quotes list → mobile cards                   |
| 11   | Jobs list → mobile cards                     |
| 12   | Invoices list → mobile cards                 |
| 13   | Customers list → mobile cards                |
| 14   | Form mobile layouts (New Quote, New Invoice) |

### Sprint 4: Detail Views + Polish (~1 week)

| Step | What                                                |
| ---- | --------------------------------------------------- |
| 15   | Detail view layouts (Job, Quote, Invoice, Customer) |
| 16   | `<BottomActionBar>` for detail views                |
| 17   | Dialog/modal → full-screen on mobile                |
| 18   | `<BottomSheet>` component                           |
| 19   | Desktop regression testing                          |

## Key Design Decisions

### 1. Kanban Board Mobile Pattern

Single-column view with horizontal swipe tabs for lanes. Each lane shows job cards with quick-action buttons ("Move to next lane"). No drag-and-drop on mobile — tap-based lane changes instead.

### 2. Notes With Side Effects

Note input includes an optional "Block this job" toggle. When enabled, submitting the note also changes the job's lane to Blocked with the note as the block reason. Unblocking works similarly — log a note with "Unblock" toggle.

### 3. Capacity Summary

Lightweight view showing: jobs this week (count + shirt volume), jobs next week, rush orders flagged. Accessible from dashboard or board. Not a full calendar — just the numbers Gary needs for a phone call.

### 4. Mobile Quoting (Promoted)

Simplified quote form for mobile: customer picker → quantity → colors → locations → instant price. Shareable via text/email. Full quote details can be edited on desktop later.

### 5. Notification Priorities (Phase 2)

Only 3 notification types initially:

- Quote accepted (action: schedule production)
- Rush order request (action: assess capacity)
- Job at risk (action: intervene before deadline)

## Success Criteria

| Metric                                      | Target                            |
| ------------------------------------------- | --------------------------------- |
| Job status check from mobile                | < 5 seconds                       |
| Note capture speed                          | As fast as sending a text message |
| Capacity assessment (can we take this job?) | < 15 seconds                      |
| Mobile Lighthouse usability score           | >= 90                             |
| Touch target compliance                     | 100%                              |

## What's Next

1. **Breadboarding** — Map UI affordances for mobile nav shell, mobile Kanban, quick note capture
2. **Implementation planning** — Detailed task breakdown per sprint
3. **Build** — Sprint 1 foundation first
