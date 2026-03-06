---
title: 'Jobs Vertical — Competitive Analysis Synthesis'
description: 'Combined competitive analysis of Printavo and PrintLife production workflows, synthesized with Playwright exploration and user interview findings'
category: competitive-analysis
status: complete
phase: 1
vertical: jobs-production
created: 2026-02-12
last-verified: 2026-02-12
depends-on:
  - docs/competitive-analysis/printavo-jobs-exploration.md
  - docs/competitive-analysis/printlife-jobs-exploration.md
  - discovery-screenshots/NOTES.md
---

# Jobs Vertical — Competitive Analysis Synthesis

**Purpose**: Synthesize all competitor research into actionable insights for Mokumo's Jobs vertical (F2: Jobs List, F3: Job Detail, F4: Production Board)
**Inputs**: Printavo Playwright exploration (18 screenshots), PrintLife Playwright exploration (7 screenshots), web research reports, user interview with 4Ink owner
**Status**: Complete

---

## 1. Head-to-Head Comparison

### Architecture Philosophy

| Dimension               | Printavo                                 | PrintLife                   | Mokumo (Our Plan)                                    |
| ----------------------- | ---------------------------------------- | --------------------------- | ---------------------------------------------------- |
| **Core model**          | Status-based pipeline                    | 4-lane Kanban               | Universal-lane board with service type awareness     |
| **Default view**        | Calendar (monthly)                       | Invoice Dashboard (Kanban)  | Production Board (2-week horizon)                    |
| **Quote ↔ Job**         | Separate entities (Quote → Invoice)      | Quote = Invoice (conflated) | Separate entities with manual conversion gate        |
| **Workflow engine**     | Status changes + automations             | Stage transitions (manual)  | Lane transitions + task checklists driving state     |
| **Customization**       | Fully customizable statuses (13 default) | Fixed 4-lane structure      | Universal lanes with configurable service type flows |
| **Dates**               | Dual (Production Due + Customer Due)     | Single delivery date        | Dual dates + start date for "Today" filtering        |
| **Production tracking** | Calendar + Power Scheduler (Premium)     | Kanban lanes                | Board + capacity-aware planning tools                |
| **Service types**       | Types of Work (Premium only)             | Screen printing focused     | Color-coded service types on every card              |
| **Capacity**            | None                                     | None                        | Conservative overbooking warnings + what-if tool     |

### Feature Matrix

| Feature                 |             Printavo              |          PrintLife          |                   SPP Target                   |
| ----------------------- | :-------------------------------: | :-------------------------: | :--------------------------------------------: |
| Kanban-style board      |    Power Scheduler only ($399)    |        Yes (4 lanes)        |             Yes (universal lanes)              |
| Drag-and-drop           |           Calendar only           |     Unknown (likely no)     |                      Yes                       |
| Status customization    |     Full (name, color, order)     |        Fixed stages         |     Universal lanes + sub-stage indicators     |
| Automations             | 13 pre-configured, trigger/action | Auto-email on mockup submit |         Task completion → state change         |
| Preset task lists       | Yes (auto-applied via automation) |             No              |     Yes (canonical tasks per service type)     |
| Dual dates              |                Yes                |             No              |                Yes + start date                |
| Service type visibility |      Types of Work (Premium)      |        Not explicit         |           Color + icon on every card           |
| Quality gates           |        No explicit QC step        |             No              |           Review lane + QC checklist           |
| Capacity awareness      |               None                |            None             |      What-if date picker, load indicators      |
| Blocked items tracking  |       No dedicated concept        |             No              | Blocked lane with external dependency tracking |
| Quick capture           |   No (full quote form required)   |             No              |          Scratch notes → create quote          |
| Production analytics    |       None (financial only)       |            Basic            |   Inferred throughput, daily output, trends    |
| Screen room tracking    |               None                |            None             |        Future vertical (not Jobs scope)        |
| Multi-user assignment   |        Single owner field         |      Single user only       |      Assignee with icon (future-proofed)       |

---

## 2. Key Friction Points Across Both Competitors

### What Neither Does Well

1. **No production board accessible to all users** — Printavo gates their board behind $399/mo Premium tier. PrintLife has a board but it's fixed-structure with no urgency indicators. Neither provides the at-a-glance production awareness that shop owners need.

2. **No capacity awareness whatsoever** — Neither product tracks capacity, warns about overbooking, or helps with delivery date commitments. This is the single biggest gap in the market.

3. **No quality gates** — Neither has an explicit QC checkpoint before shipping. The 4Ink embroidery story (shipped bad work twice) illustrates why this matters.

4. **No "what do I work on today?" view** — Printavo's calendar shows everything; PrintLife's board shows everything. Neither helps filter to today's priorities.

5. **No blocked-item tracking** — Neither has a concept of "this job can't proceed because of an external dependency." Jobs just sit in their current stage with no visibility into why.

6. **No quick capture** — Both require starting a full quote form to log a new opportunity. No lightweight "don't forget this" mechanism.

7. **No production analytics** — Printavo has 9 analytics reports, all financial. PrintLife has basic reports. Neither tracks throughput, cycle time, on-time delivery, or capacity utilization.

8. **No screen room tracking** — Neither tracks screen prep (mesh count, emulsion, burn status). This is a critical gap for screen printing shops specifically.

### Printavo-Specific Friction

- **Calendar-centric, not production-centric** — Default landing page is a calendar, not a production dashboard
- **Everything on one page for quotes** — No validation, no guardrails, can save empty quotes
- **Power Scheduler gated behind Premium** — Core production feature locked at highest tier
- **Financial accuracy issues** — User reviews cite accounting bugs, sales tax problems
- **Mobile app unreliable** — Periods of non-functionality reported
- **Automation skipping** — Jumping statuses bypasses automation chain

### PrintLife-Specific Friction

- **Quote = Invoice** — No separate entities, can't track quote pipeline independently
- **Blocking recalculation** — 2-3 min wasted per quote on server-side recalc
- **Mandatory wizard steps** — Ink Style and Finishing required even when unused
- **Single Production stage** — No sub-stages for screen prep, QC, etc.
- **No urgency indicators** — Board shows no due dates, no color-coding for risk
- **Single-user only** — No staff accounts or assignment capability
- **Fixed lane structure** — Can't customize stages to match shop's actual workflow

---

## 3. What Each Competitor Does Well (Adopt or Improve)

### From Printavo — Adopt These Patterns

| Pattern                                   | Why It Works                                           | Our Adaptation                                                          |
| ----------------------------------------- | ------------------------------------------------------ | ----------------------------------------------------------------------- |
| **Dual dates** (Production + Customer)    | Separates internal scheduling from customer commitment | Adopt directly + add start date                                         |
| **Automation chains** (trigger → actions) | Eliminates manual busywork at status transitions       | Task completion drives state changes instead of status-triggered chains |
| **Preset task lists**                     | Ensures no step gets skipped                           | Canonical tasks per service type, auto-applied on lane entry            |
| **Color-coded statuses**                  | Instant visual scan                                    | Color-code by service type (more useful than by status)                 |
| **Line Item Groups + Imprints**           | Flexible data model for multi-decoration jobs          | Adopt for job detail view                                               |
| **Production Notes vs Customer Notes**    | Internal/external separation                           | Adopt — notes feed with visibility flags                                |
| **"Getting Started" onboarding**          | Guides new users through setup                         | Adopt for first-time board experience                                   |

### From PrintLife — Adopt These Patterns

| Pattern                              | Why It Works                     | Our Adaptation                                                           |
| ------------------------------------ | -------------------------------- | ------------------------------------------------------------------------ |
| **Kanban dashboard as primary view** | Production-first thinking        | Board is our primary view, not calendar                                  |
| **Substage tabs within lanes**       | Granularity without complexity   | Sub-stage indicators within universal lanes                              |
| **Auto-email on mockup submission**  | Removes manual follow-up         | Expand to configurable notifications at any transition                   |
| **Delivery-date organization**       | Simple, effective prioritization | Due date + risk indicator on every card                                  |
| **4-lane left-to-right flow**        | Matches physical production flow | Adapt to universal lanes (Ready → In Progress → Review → Blocked → Done) |

---

## 4. Our Differentiation — What Neither Competitor Offers

### Tier 1: Core Differentiators (Must Have for Launch)

1. **Universal board with service type awareness** — One board that handles Screen Printing, DTF, and Embroidery with visual service type indicators
2. **Blocked lane with dependency tracking** — Explicit tracking of external blockers
3. **Quality gate (Review lane)** — Mandatory QC checkpoint before Done
4. **Quick capture (scratch notes)** — Lightweight "don't forget this" → Create Quote
5. **Today filter** — Start-date-based filtering to focus on today's work
6. **Due date risk indicators** — Color-coded warnings based on proximity + estimated work

### Tier 2: Capacity Intelligence (Key Differentiator)

7. **What-if date picker** — Pick a potential due date, see the work landscape
8. **Conservative overbooking warnings** — Only when highly confident, never false positives
9. **Complexity scoring** — Beyond quantity: locations, screen count, garment variety
10. **Inferred productivity tracking** — Daily output from state transitions, not manual logging

### Tier 3: Workflow Automation

11. **Task checklists drive state changes** — Complete all tasks → card eligible for next lane
12. **Quote → Job auto-generation** — Accepted quote creates Job card (configurable: auto or manual gate)
13. **Notification on card events** — Email + in-app bell for approvals, blocks, completions
14. **End-of-day summary** — Optional productivity celebration

---

## 5. Data Model Implications

### Card Entity (Universal)

```text
Card
├── type: "scratch_note" | "quote" | "job"
├── serviceType: "screen_printing" | "dtf" | "embroidery"
├── lane: "ready" | "in_progress" | "review" | "blocked" | "done"
├── customer: Customer reference
├── quantity: number (total garment count)
├── complexity: { locations, screenCount, garmentVariety }
├── dates: { created, startDate, productionDue, customerDue }
├── assignee?: User reference
├── tasks: Task[] (canonical + custom)
├── notes: Note[] (internal/external with timestamps)
├── blockReason?: string (when lane = blocked)
├── quote?: Quote reference (for jobs generated from quotes)
├── invoice?: Invoice reference
└── history: StateChange[] (lane transitions with timestamps)
```

### Board Configuration

```text
BoardConfig
├── lanes: ["ready", "in_progress", "review", "blocked", "done"]
├── reviewLaneEnabled: boolean (configurable)
├── autoInvoiceOnQuoteAccept: boolean (default: false for 4Ink)
├── serviceTypes: ServiceType[] (colors, icons)
├── sprintHorizon: number (default: 14 days)
└── capacitySettings: { warnings, whatIf, productivityTracking }
```

---

## 6. Sources

### Playwright Exploration (25 screenshots)

- PrintLife: 7 screenshots (`printlife-01` through `printlife-07`)
- Printavo: 18 screenshots (`printavo-01` through `printavo-18`)
- Detailed notes: `discovery-screenshots/NOTES.md`

### Web Research Reports

- `docs/competitive-analysis/printavo-jobs-exploration.md` (497 lines)
- `docs/competitive-analysis/printlife-jobs-exploration.md` (469 lines)

### User Interview

- 12-question structured interview with 4Ink owner (2026-02-12)
- Key themes: capacity awareness, universal board, quality gates, quick capture, service type visibility
