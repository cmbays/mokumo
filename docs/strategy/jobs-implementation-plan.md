---
title: 'Jobs & Production Vertical — Implementation Plan'
description: 'Comprehensive build blueprint for the Jobs vertical: 5 waves, 31 components, 126 UI affordances, session prompts, agent strategy, quality gates, and definition of done'
category: strategy
status: active
phase: 1
vertical: jobs-production
created: 2026-02-12
last-verified: 2026-02-12
depends-on:
  - docs/strategy/jobs-scope-definition.md
  - docs/strategy/jobs-improved-journey.md
  - docs/breadboards/jobs-breadboard.md
  - docs/APP_FLOW.md
  - docs/competitive-analysis/jobs-vertical-synthesis.md
---

# Jobs & Production Vertical — Implementation Plan

## 1. Executive Summary

We're building the **Jobs & Production vertical** — the core of Mokumo. Three screens: **Production Board** (two-section Kanban with 5 universal lanes), **Jobs List** (sortable/filterable table), and **Job Detail Command Center** (tasks, notes, actions, linked entities). This replaces the old 6-stage production pipeline with a universal lane model (Ready → In Progress → Review → Blocked → Done) that works across all service types (Screen Printing, DTF, Embroidery).

**Why waves**: Dependencies cascade — schemas must exist before mock data, mock data before UI, board before drag-and-drop, core screens before integration. Each wave produces a demoable checkpoint, isolates risk, and allows quality gates between phases. Wave 4 parallelizes two independent screens (Job Detail + Jobs List) for efficiency.

**Key numbers**:

- 126 UI affordances (U1–U126) from breadboard
- 34 code affordances (N1–N34)
- 28 data stores (S1–S28)
- 31 components (4 shared, 27 vertical-specific)
- 5 waves across 6 sessions (1 serial, 1 serial, 1 serial, 2 parallel, 1 serial)
- 3 new schema files, 1 major schema rewrite, 2 file updates

---

## 2. Prerequisites Checklist

Everything that must exist before Wave 1 begins:

- [x] Competitive analysis — Printavo + PrintLife exploration, synthesis doc (`docs/competitive-analysis/jobs-vertical-synthesis.md`)
- [x] User interview — 12-question structured interview with 4Ink owner
- [x] Improved journey design — 10 principles, board architecture, card design (`docs/strategy/jobs-improved-journey.md`)
- [x] Scope definition — CORE/PERIPHERAL/INTERCONNECTIONS features, schema changes, acceptance criteria (`docs/strategy/jobs-scope-definition.md`)
- [x] APP_FLOW updated — Production Board, Jobs List, Job Detail pages with full page-level details (`docs/APP_FLOW.md`)
- [x] Breadboard — 126 UI affordances, 34 code affordances, 28 data stores, 31 components, build order (`docs/breadboards/jobs-breadboard.md`)
- [x] Implementation plan — THIS document
- [ ] shadcn/ui `progress` component — may need to add for TaskProgressBar (check if needed during Wave 2)

**Existing infrastructure confirmed**:

- 26 shadcn/ui primitives installed (including checkbox, collapsible, dialog, dropdown-menu, popover, select, sheet, tabs)
- 12 shared feature components (StatusBadge, CustomerCombobox, ColumnHeaderMenu, NotesPanel, OverdueBadge, etc.)
- Invoice vertical as gold-standard build pattern (30 files, 314 tests, 10/10 quality gate)
- Financial arithmetic via `big.js` + `lib/helpers/money.ts` (no monetary calculations needed for jobs, but pattern available)
- Current job schema at `lib/schemas/job.ts` (37 lines, minimal — needs major rewrite)
- Current mock data has 6 jobs using old schema (lines 393–531 of `lib/mock-data.ts`)
- No existing `app/(dashboard)/jobs/` directory — building from scratch

---

## 3. Wave Plan

### Wave 1: Foundation (Schema + Constants + Mock Data + Tests)

**Objective**: Replace the minimal job schema with the full lane-based production model, create all supporting schemas, update constants, generate comprehensive mock data, and write tests. This is the data layer that everything else depends on.

**Sessions**: 1 (serial)
**Agent type**: `general-purpose` (no UI work — schema, data, and tests only)
**Skills**: None required (pure TypeScript/Zod work)
**Branch**: `session/0212-jobs-w1-foundation`
**Port**: N/A (no dev server needed)
**Depends on**: Nothing — first wave

**Steps**:

| #    | Task                                                                                                                                                                                                                       | File(s)                                                                                        | Breadboard Reference          | Complexity |
| ---- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- | ----------------------------- | ---------- |
| 1.1  | Define `laneEnum` replacing `productionStateEnum`                                                                                                                                                                          | `lib/schemas/job.ts`                                                                           | Breadboard Schema Gaps #6     | Low        |
| 1.2  | Define `riskLevelEnum`                                                                                                                                                                                                     | `lib/schemas/job.ts`                                                                           | N8 computeRiskLevel           | Low        |
| 1.3  | Define `jobNoteSchema` (id, type, content, author, createdAt)                                                                                                                                                              | `lib/schemas/job.ts`                                                                           | Breadboard Schema Gaps #3     | Low        |
| 1.4  | Define `jobTaskSchema` (id, label, detail, isCompleted, completedAt, isCanonical, sortOrder)                                                                                                                               | `lib/schemas/job.ts`                                                                           | Breadboard Schema Gaps #2     | Low        |
| 1.5  | Define `jobHistoryEntrySchema` (fromLane, toLane, timestamp, note)                                                                                                                                                         | `lib/schemas/job.ts`                                                                           | S8 job.history                | Low        |
| 1.6  | Rewrite `jobSchema` with full lane model (lane, serviceType, startDate, dates, riskLevel, quantity, garmentDetails, printLocations, complexity, tasks, blockReason, assignee, linked entities, history, notes, isArchived) | `lib/schemas/job.ts`                                                                           | Breadboard Schema Gaps #1     | Medium     |
| 1.7  | Create `scratchNoteSchema` (id, content, createdAt, isArchived)                                                                                                                                                            | `lib/schemas/scratch-note.ts` (NEW)                                                            | Breadboard Schema Gaps #5     | Low        |
| 1.8  | Create `boardCardSchema` (discriminated union: scratch_note, quote, job)                                                                                                                                                   | `lib/schemas/board-card.ts` (NEW)                                                              | Breadboard Schema Gaps #4     | Medium     |
| 1.9  | Add lane constants: `LANE_LABELS`, `LANE_COLORS`, `LANE_BADGE_COLORS`                                                                                                                                                      | `lib/constants.ts`                                                                             | Breadboard Schema Gaps #7     | Low        |
| 1.10 | Add risk constants: `RISK_LABELS`, `RISK_COLORS`                                                                                                                                                                           | `lib/constants.ts`                                                                             | Breadboard Schema Gaps #7     | Low        |
| 1.11 | Add service type constants: `SERVICE_TYPE_BORDER_COLORS`, `SERVICE_TYPE_ICONS`                                                                                                                                             | `lib/constants.ts`                                                                             | Breadboard Schema Gaps #7     | Low        |
| 1.12 | Add canonical task templates: `CANONICAL_TASKS` (per service type)                                                                                                                                                         | `lib/constants.ts`                                                                             | Scope: Canonical Task Lists   | Low        |
| 1.13 | Replace jobs section in mock data: 10-12 jobs across all lanes/service types/risk levels, each with tasks (partially completed per lane), 2-4 history entries, 1-3 notes, block reasons, linked entities                   | `lib/mock-data.ts`                                                                             | Breadboard Schema Gaps #8     | High       |
| 1.14 | Add quote board cards to mock data: 5-6 quotes with lane positions for board rendering                                                                                                                                     | `lib/mock-data.ts`                                                                             | Scope: Mock Data Requirements | Medium     |
| 1.15 | Add scratch notes to mock data: 2-3 examples                                                                                                                                                                               | `lib/mock-data.ts`                                                                             | Scope: Mock Data Requirements | Low        |
| 1.16 | Add reverse lookup helpers: `getJobTasks()`, `getJobNotes()`, `getJobsByLane()`, `getJobsByServiceType()`                                                                                                                  | `lib/mock-data.ts`                                                                             | N1, N8, N9, N17-N20           | Low        |
| 1.17 | Rewrite `lib/schemas/__tests__/job.test.ts`: enum tests, sub-schema tests, main schema with full objects + edge cases + invariants                                                                                         | `lib/schemas/__tests__/job.test.ts`                                                            | —                             | Medium     |
| 1.18 | Write tests for new schemas: scratch-note, board-card                                                                                                                                                                      | `lib/schemas/__tests__/scratch-note.test.ts`, `lib/schemas/__tests__/board-card.test.ts` (NEW) | —                             | Low        |

**Checkpoint**: Before moving to Wave 2, ALL of the following must be true:

- `npm test` passes (all schema tests green, including new job, scratch-note, board-card tests)
- `npx tsc --noEmit` passes (no type errors)
- Mock data compiles and exports correctly
- Each of the 10-12 mock jobs has: correct lane, service type, 3+ tasks with partial completion, 2+ history entries, 1+ notes
- Constants export lane labels/colors, risk labels/colors, canonical task templates, service type border colors/icons

**Demoable**: Not visually demoable (no UI). Developer can inspect mock data structure in console.

---

### Wave 2: Board Core (Static Board Layout + Card Components)

**Objective**: Build the Production Board page with its two-section layout (Quotes row + Jobs row), 5 universal lanes, all 3 card types, filter bar, and capacity summary. This wave renders the board from mock data but does NOT include drag-and-drop (Wave 3). This is the **critical path** — highest complexity wave.

**Sessions**: 1 (serial)
**Agent type**: `frontend-builder` (with screen-builder skill)
**Skills**: screen-builder, quality-gate
**Branch**: `session/0212-jobs-w2-board-core`
**Port**: 3001
**Depends on**: Wave 1

**Steps**:

| #    | Task                                                                                                                                                                                                    | Component(s)                                              | Breadboard Affordances             | Complexity |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- | ---------------------------------- | ---------- |
| 2.1  | Create `ServiceTypeBadge` shared component (color border + icon: Printer for screen print, Palette for DTF, Scissors for embroidery)                                                                    | `components/features/ServiceTypeBadge.tsx`                | U16, U27, U63, U72                 | Low        |
| 2.2  | Create `RiskIndicator` shared component (no dot / orange dot / red dot)                                                                                                                                 | `components/features/RiskIndicator.tsx`                   | U21, U65, U78                      | Low        |
| 2.3  | Create `LaneBadge` shared component (colored badge per lane with label)                                                                                                                                 | `components/features/LaneBadge.tsx`                       | U64, U79                           | Low        |
| 2.4  | Create `TaskProgressBar` shared component (X/Y mini progress bar + label)                                                                                                                               | `components/features/TaskProgressBar.tsx`                 | U22, U66, U87                      | Low        |
| 2.5  | Extend `StatusBadge` for lane status variants (if not handled by LaneBadge)                                                                                                                             | `components/features/StatusBadge.tsx`                     | —                                  | Low        |
| 2.6  | Build `JobBoardCard` (service type left-border + icon, assignee initials, customer + name, quantity + complexity, due date + risk dot, task progress bar, click → `/jobs/[id]`, hover lift)             | `app/(dashboard)/jobs/_components/JobBoardCard.tsx`       | U16–U26                            | Medium     |
| 2.7  | Build `QuoteBoardCard` (service type indicator, customer + description, quantity + due date, quote total, "New" badge on accepted, "Create Job from Quote" button on Done lane, click → `/quotes/[id]`) | `app/(dashboard)/jobs/_components/QuoteBoardCard.tsx`     | U27–U34                            | Medium     |
| 2.8  | Build `ScratchNoteCard` (text content, distinct visual style, "Create Quote" button, dismiss/archive button)                                                                                            | `app/(dashboard)/jobs/_components/ScratchNoteCard.tsx`    | U35–U38                            | Low        |
| 2.9  | Build `BoardLane` (droppable container with lane header label, card count per section, empty placeholder, Done lane collapse/expand toggle)                                                             | `app/(dashboard)/jobs/_components/BoardLane.tsx`          | U12–U15, U43                       | Medium     |
| 2.10 | Build `BoardSection` (row container — either "Quotes" or "Jobs" — renders cards into 5 lane slots)                                                                                                      | `app/(dashboard)/jobs/_components/BoardSection.tsx`       | —                                  | Medium     |
| 2.11 | Build `BoardFilterBar` (Today toggle, Service Type multi-select, Section filter, Risk filter, Time Horizon selector) — all filters wired to URL state                                                   | `app/(dashboard)/jobs/_components/BoardFilterBar.tsx`     | U4–U8, N2–N6, S1–S5                | Medium     |
| 2.12 | Build `CapacitySummaryBar` (rush orders count, total quantity, card count by lane)                                                                                                                      | `app/(dashboard)/jobs/_components/CapacitySummaryBar.tsx` | U1–U3, N1                          | Low        |
| 2.13 | Build `ProductionBoard` page — full layout: CapacitySummaryBar → BoardFilterBar → header actions ("New Quote", view toggle, breadcrumb) → BoardSection × 2 (Quotes + Jobs) → 5 lanes each               | `app/(dashboard)/jobs/board/page.tsx`                     | All P1 affordances                 | High       |
| 2.14 | Update sidebar "Jobs" link from `/jobs` to `/jobs/board`                                                                                                                                                | `components/layout/sidebar.tsx`                           | Breadboard Integration Touchpoints | Low        |
| 2.15 | Wire view toggle: Board (active) ↔ List (`/jobs`)                                                                                                                                                       | Page-level                                                | U10                                | Low        |
| 2.16 | Wire breadcrumb: Dashboard > Jobs > Board                                                                                                                                                               | Page-level                                                | U11                                | Low        |
| 2.17 | Implement `computeCapacitySummary()` — count rush orders, sum quantities, count cards per lane from visible (filtered) cards                                                                            | Inline in page or utility                                 | N1                                 | Low        |
| 2.18 | Implement `computeRiskLevel()` — compare dueDate vs remaining tasks vs today → no dot / orange / red                                                                                                    | `lib/helpers/job-utils.ts` (NEW)                          | N8                                 | Low        |
| 2.19 | Implement `computeTaskProgress()` — count completed/total, compute percentage, allComplete flag                                                                                                         | `lib/helpers/job-utils.ts`                                | N9                                 | Low        |
| 2.20 | Implement `computeFilteredCards()` — apply all active filters (today, serviceType, section, risk, horizon) to card arrays                                                                               | Inline in page or utility                                 | N33                                | Medium     |
| 2.21 | Add empty states: empty lane placeholder ("No cards"), empty board state                                                                                                                                | Components                                                | U43, U44                           | Low        |

**Checkpoint**: Before moving to Wave 3, ALL of the following must be true:

- `npm run build` passes
- `npx tsc --noEmit` passes
- `npm run lint` passes
- Board renders at `/jobs/board` with all mock data cards in correct lanes
- All 5 filters work (Today, Service Type, Section, Risk, Time Horizon) with URL state
- Capacity summary bar shows correct counts
- All 3 card types render with correct visual design
- Done lane collapses/expands
- Card clicks navigate to correct detail pages
- Sidebar "Jobs" link goes to `/jobs/board`
- Breadcrumb trail correct
- Empty lane states render when filters remove all cards from a lane
- Run `design-auditor` agent for formal audit of board visual design

**Demoable**: User can see the production board with all mock data, use filters to narrow the view, and click cards. No drag-and-drop yet, but the board layout and card design are fully visible.

---

### Wave 3: Board Interactivity (Drag-and-Drop + Dialogs)

**Objective**: Add dnd-kit drag-and-drop between lanes, block reason dialog on drop-to-blocked, scratch note quick capture, move lane dialog, and view toggle wiring. This completes the Production Board's full interactivity.

**Sessions**: 1 (serial, builds directly on Wave 2)
**Agent type**: `frontend-builder`
**Skills**: screen-builder, quality-gate
**Branch**: `session/0212-jobs-w3-board-dnd`
**Port**: 3001 (same worktree as Wave 2, or new)
**Depends on**: Wave 2

**Steps**:

| #    | Task                                                                                                                                                                                                                                                           | Component(s)                                              | Breadboard Affordances | Complexity |
| ---- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- | ---------------------- | ---------- |
| 3.1  | Install/verify dnd-kit packages (`@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`) — already in TECH_STACK? Check first                                                                                                                              | `package.json`                                            | —                      | Low        |
| 3.2  | Implement `DndContext` + `DragOverlay` wrapping the board                                                                                                                                                                                                      | `app/(dashboard)/jobs/board/page.tsx`                     | U39–U42                | Medium     |
| 3.3  | Make `BoardLane` a droppable target (each lane per section = unique droppable ID)                                                                                                                                                                              | `app/(dashboard)/jobs/_components/BoardLane.tsx`          | U41                    | Medium     |
| 3.4  | Make card components draggable (drag handle, drag preview with shadow, ghost in original position)                                                                                                                                                             | Card components                                           | U24, U34, U39, U40     | Medium     |
| 3.5  | Implement `handleDragEnd()` — determine card ID + new lane; validate same-row constraint (quotes stay in quotes, jobs stay in jobs); if target = blocked → open BlockReasonDialog; else update card lane in client state + add history entry + add system note | Page-level                                                | N10, N11               | High       |
| 3.6  | Build `BlockReasonDialog` (textarea for reason, "Block" confirm button, "Cancel" button) — shared between board drop and job detail "Mark Blocked"                                                                                                             | `app/(dashboard)/jobs/_components/BlockReasonDialog.tsx`  | U48–U50, U115–U117     | Low        |
| 3.7  | Build `MoveLaneDialog` (lane selector, conditional block reason input, "Move" confirm, "Cancel") — for card quick action from board                                                                                                                            | `app/(dashboard)/jobs/_components/MoveLaneDialog.tsx`     | U51–U54                | Low        |
| 3.8  | Build `ScratchNoteCapture` (text input, Enter to submit, Escape to cancel) — triggered from "+" button in Quotes Ready lane                                                                                                                                    | `app/(dashboard)/jobs/_components/ScratchNoteCapture.tsx` | U45–U47, N13           | Low        |
| 3.9  | Implement `confirmBlock()` — update card lane to blocked, set blockReason + blockedAt + blockedBy, add history + system note                                                                                                                                   | Page-level                                                | N14                    | Low        |
| 3.10 | Implement `cancelBlock()` — return card to pre-drag position                                                                                                                                                                                                   | Page-level                                                | N15                    | Low        |
| 3.11 | Implement `createScratchNote()` — create new scratch note in state, place in Quotes Ready lane                                                                                                                                                                 | Page-level                                                | N13                    | Low        |
| 3.12 | Implement `dismissScratchNote()` — set isArchived, remove from board                                                                                                                                                                                           | Page-level                                                | N12                    | Low        |
| 3.13 | Done lane auto-collapse: collapsed by default showing card count only, click to expand                                                                                                                                                                         | `BoardLane` update                                        | U15, N7                | Low        |
| 3.14 | Lane drop target highlight (accent color on lane header during drag-over)                                                                                                                                                                                      | `BoardLane` update                                        | U41                    | Low        |
| 3.15 | Wire card quick action: "Move Lane" → open MoveLaneDialog                                                                                                                                                                                                      | Card components                                           | U68, P1.3              | Low        |

**Checkpoint**: Before moving to Wave 4:

- Drag-and-drop works for both job cards and quote cards
- Cards can only be dragged within their row (quotes ↔ quotes, jobs ↔ jobs)
- Dropping on Blocked lane opens block reason dialog
- Block reason dialog creates block with reason, timestamp, and system note
- Cancel on block dialog returns card to original position
- Scratch note capture works via "+" button (Enter to submit, Escape to cancel)
- New scratch notes appear immediately in Quotes Ready lane
- Scratch notes can be dismissed/archived
- Move Lane dialog works from card quick action
- Done lane is collapsed by default, expandable
- Lane highlights during drag-over
- All build checks pass (`npm run build`, `tsc`, `lint`)

**Demoable**: Full interactive production board — user can drag cards between lanes, block/unblock jobs, capture scratch notes, and see the board update in real-time.

---

### Wave 4: Detail Views (PARALLEL — 2 Sessions)

**Objective**: Build both the Job Detail Command Center and the Jobs List table view in parallel. These two screens are independent — they both depend on Wave 1 schemas/data but not on each other.

**Depends on**: Wave 1 (schemas + mock data). Can start as soon as Wave 1 is complete, even while Wave 2/3 are in progress. However, for branch cleanliness, recommend starting after Wave 3 merges.

#### Wave 4A: Job Detail Command Center

**Sessions**: 1
**Agent type**: `frontend-builder`
**Skills**: screen-builder, quality-gate
**Branch**: `session/0212-jobs-w4a-job-detail`
**Port**: 3002

**Steps**:

| #     | Task                                                                                                                                                                                                                         | Component(s)                                                 | Breadboard Affordances   | Complexity |
| ----- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ | ------------------------ | ---------- |
| 4A.1  | Build `JobHeader` (service type color bar + icon, customer name linked to `/customers/[customerId]`, job name + number, primary contact with click-to-copy, date row: Due/Start/Created, risk indicator + label, lane badge) | `app/(dashboard)/jobs/_components/JobHeader.tsx`             | U72–U80                  | Medium     |
| 4A.2  | Build `QuickActionsBar` ("Move Lane" dropdown, "Mark Blocked"/"Unblock" toggle, "View Quote" button, "View Invoice" button, "Edit Job" button, overflow menu placeholder)                                                    | `app/(dashboard)/jobs/_components/QuickActionsBar.tsx`       | U81–U86                  | Medium     |
| 4A.3  | Build `TaskItem` (checkbox, label, detail text, strikethrough + timestamp when complete)                                                                                                                                     | `app/(dashboard)/jobs/_components/TaskItem.tsx`              | U89–U92                  | Low        |
| 4A.4  | Build `TaskChecklist` (progress bar, "Ready for next lane" indicator, task items list, "Add Custom Task" button)                                                                                                             | `app/(dashboard)/jobs/_components/TaskChecklist.tsx`         | U87–U93, N9, N28         | Medium     |
| 4A.5  | Build `AddCustomTaskInput` (inline: task label input, optional detail input, "Add" button, Cancel)                                                                                                                           | `app/(dashboard)/jobs/_components/AddCustomTaskInput.tsx`    | U118–U121, N32           | Low        |
| 4A.6  | Build `JobDetailsSection` (quantity, garment info with sizes, print locations with color counts, screen count, service type + instructions)                                                                                  | `app/(dashboard)/jobs/_components/JobDetailsSection.tsx`     | U94–U98                  | Low        |
| 4A.7  | Build `NoteItem` (type badge [Internal]/[Customer]/[System], timestamp, author, content)                                                                                                                                     | `app/(dashboard)/jobs/_components/NoteItem.tsx`              | U103–U105                | Low        |
| 4A.8  | Build `NotesFeed` (quick-add note input + type selector at top, chronological feed, filter tabs: All/Internal/Customer/System)                                                                                               | `app/(dashboard)/jobs/_components/NotesFeed.tsx`             | U99–U106, N29, N31       | Medium     |
| 4A.9  | Build `LinkedEntitiesSection` (source quote link with total, linked invoice link with status, customer link, attached files count)                                                                                           | `app/(dashboard)/jobs/_components/LinkedEntitiesSection.tsx` | U107–U110                | Low        |
| 4A.10 | Build `BlockReasonBanner` (prominent banner with reason text, timestamp, who blocked, "Unblock" button)                                                                                                                      | `app/(dashboard)/jobs/_components/BlockReasonBanner.tsx`     | U111–U113, N26           | Low        |
| 4A.11 | Build `JobDetailView` page — orchestrates all sections: breadcrumb → BlockReasonBanner (if blocked) → JobHeader → QuickActionsBar → TaskChecklist → JobDetailsSection → NotesFeed → LinkedEntitiesSection                    | `app/(dashboard)/jobs/[id]/page.tsx`                         | All P3 affordances       | High       |
| 4A.12 | Implement `toggleTask()` — flip isCompleted, set/clear completedAt, add system note, recompute progress                                                                                                                      | Page-level                                                   | N28                      | Low        |
| 4A.13 | Implement `addNote()` — create new note with type + content + author + timestamp                                                                                                                                             | Page-level                                                   | N29                      | Low        |
| 4A.14 | Implement `addCustomTask()` — create task with label + detail + isCanonical:false + next sortOrder                                                                                                                           | Page-level                                                   | N32                      | Low        |
| 4A.15 | Implement `moveLaneFromDetail()` — update lane, if blocked open BlockReasonDialog, add history + system note                                                                                                                 | Page-level                                                   | N25                      | Low        |
| 4A.16 | Implement `unblockJob()` — restore previous lane from history, clear block fields, add history + system note                                                                                                                 | Page-level                                                   | N26, N34                 | Low        |
| 4A.17 | Implement `copyToClipboard()` — for email/phone copy action with toast                                                                                                                                                       | Page-level                                                   | N24                      | Low        |
| 4A.18 | Implement `filterNotes()` — filter notes feed by type (All/Internal/Customer/System)                                                                                                                                         | Page-level                                                   | N31                      | Low        |
| 4A.19 | Handle invalid job ID → "Job not found" page with link to jobs list                                                                                                                                                          | `app/(dashboard)/jobs/[id]/page.tsx`                         | U114                     | Low        |
| 4A.20 | Wire breadcrumb: Dashboard > Jobs > J-1024                                                                                                                                                                                   | Page-level                                                   | U80                      | Low        |
| 4A.21 | Wire all cross-links: customer → `/customers/[id]`, quote → `/quotes/[id]`, invoice → `/invoices/[id]`, "View on Board" → `/jobs/board`                                                                                      | Page-level                                                   | U73, U83, U84, U107–U109 | Low        |

**Checkpoint**:

- All 7 sections render correctly (Header, Quick Actions, Tasks, Details, Notes, Linked Entities, Block Banner)
- Task checkboxes toggle with strikethrough and timestamp
- Custom tasks can be added
- Notes can be added with type selection
- Notes can be filtered by type
- Move Lane dropdown works from detail view
- Mark Blocked/Unblock works with reason
- Block reason banner shows when lane = blocked
- All cross-links navigate correctly
- Invalid job ID shows "Job not found"
- Build checks pass

#### Wave 4B: Jobs List

**Sessions**: 1 (parallel with Wave 4A)
**Agent type**: `frontend-builder`
**Skills**: screen-builder, quality-gate
**Branch**: `session/0212-jobs-w4b-jobs-list`
**Port**: 3003

**Steps**:

| #     | Task                                                                                                                                                                                                                                                                                                                     | Component(s)                                         | Breadboard Affordances | Complexity |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------- | ---------------------- | ---------- |
| 4B.1  | Build `JobsDataTable` — custom sort/filter pipeline (NOT TanStack Table), URL state via `useSearchParams()`, Zod-validated sort keys, debounced search. Columns: Job #, Service Type (ServiceTypeBadge), Customer, Job Name, Quantity, Due Date (RiskIndicator), Lane (LaneBadge), Risk, Task Progress (TaskProgressBar) | `app/(dashboard)/jobs/_components/JobsDataTable.tsx` | U55–U71, N17–N22       | High       |
| 4B.2  | Implement desktop table layout + mobile card list (responsive, following InvoicesDataTable pattern)                                                                                                                                                                                                                      | Part of JobsDataTable                                | —                      | Medium     |
| 4B.3  | Implement search: debounced 300ms, filters by jobNumber, customer name, job title, URL param `?q=`                                                                                                                                                                                                                       | Part of JobsDataTable                                | U55, N17, S16          | Low        |
| 4B.4  | Implement lane filter dropdown (All / Ready / In Progress / Review / Blocked / Done), URL param `?lane=`                                                                                                                                                                                                                 | Part of JobsDataTable                                | U56, N18, S17          | Low        |
| 4B.5  | Implement service type filter (Screen Printing / DTF / Embroidery), URL param `?serviceType=`                                                                                                                                                                                                                            | Part of JobsDataTable                                | U57, N19, S18          | Low        |
| 4B.6  | Implement risk filter (All / At Risk / On Track), URL param `?risk=`                                                                                                                                                                                                                                                     | Part of JobsDataTable                                | U58, N20, S19          | Low        |
| 4B.7  | Implement column header sort (Zod-validated sort keys, click to toggle direction), default sort by due date ascending                                                                                                                                                                                                    | Part of JobsDataTable                                | U62, N22, S20          | Low        |
| 4B.8  | Implement quick actions per row: Move Lane (opens dropdown/dialog), Mark Blocked/Unblock, View Detail                                                                                                                                                                                                                    | Part of JobsDataTable                                | U68–U70                | Low        |
| 4B.9  | Build Jobs List page — toolbar (search, filters, "New Job" button placeholder, view toggle List/Board) + JobsDataTable + breadcrumb + empty state                                                                                                                                                                        | `app/(dashboard)/jobs/page.tsx`                      | U55–U71                | Medium     |
| 4B.10 | Wire view toggle: List (active) ↔ Board (`/jobs/board`)                                                                                                                                                                                                                                                                  | Page-level                                           | U59                    | Low        |
| 4B.11 | Wire row click → `/jobs/[id]`                                                                                                                                                                                                                                                                                            | Page-level                                           | U67                    | Low        |
| 4B.12 | Wire breadcrumb: Dashboard > Jobs                                                                                                                                                                                                                                                                                        | Page-level                                           | U61                    | Low        |
| 4B.13 | Implement empty state: "No jobs yet — jobs will appear here when quotes are accepted"                                                                                                                                                                                                                                    | Page-level                                           | U71                    | Low        |
| 4B.14 | Implement "New Job" button (placeholder toast — Phase 2 will add full form)                                                                                                                                                                                                                                              | Page-level                                           | U60, N21               | Low        |

**Checkpoint**:

- Table renders all mock jobs with correct columns
- All 3 filters work with URL state
- Search filters in real-time (debounced)
- Sort by any column via column header click
- Row click navigates to `/jobs/[id]`
- View toggle switches to board
- Quick actions work (move lane, block/unblock)
- Mobile card list renders correctly
- Empty state shows when no jobs match
- Build checks pass

**Demoable (end of Wave 4)**: All three screens are functional — board, list, and detail. User can navigate between all views, manage tasks, add notes, and see the full job command center.

---

### Wave 5: Integration & Polish

**Objective**: Wire cross-vertical connections (quote-to-job conversion, dashboard updates, cross-links), add empty/error states everywhere, polish keyboard accessibility and ARIA, run final design audit.

**Sessions**: 1 (serial)
**Agent type**: `frontend-builder` + `design-auditor` checkpoint
**Skills**: screen-builder, quality-gate
**Branch**: `session/0212-jobs-w5-integration`
**Port**: 3001
**Depends on**: Waves 2–4 (all screens built)

**Steps**:

| #    | Task                                                                                                                                                                                                                                              | Component(s)                         | Breadboard Affordances        | Complexity |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------ | ----------------------------- | ---------- |
| 5.1  | Implement `createJobFromQuote()` — read accepted quote, create new Job with inherited data (customer, serviceType, quantity, garments, printLocations), auto-populate canonical tasks, set lane=ready, link sourceQuoteId, add system note, toast | Board page or utility                | N30, U32                      | Medium     |
| 5.2  | Wire "Create Job from Quote" button on accepted quote cards in Done lane                                                                                                                                                                          | `QuoteBoardCard` update              | U32                           | Low        |
| 5.3  | Verify all cross-links: quote card → `/quotes/[id]`, job detail "View Quote" → `/quotes/[quoteId]`, job detail "View Invoice" → `/invoices/[invoiceId]`, customer name → `/customers/[customerId]`                                                | All pages                            | U33, U73, U83, U84, U107–U109 | Low        |
| 5.4  | Verify payment status badge on Done lane job cards (reads from invoices mock data)                                                                                                                                                                | `JobBoardCard` update                | U26                           | Low        |
| 5.5  | Update Dashboard summary cards to use lane-based counts (Blocked, In Progress, At Risk, Total)                                                                                                                                                    | `app/(dashboard)/page.tsx`           | Dashboard integration         | Medium     |
| 5.6  | Update Dashboard "Needs Attention" to show blocked jobs with block reason + service type                                                                                                                                                          | `app/(dashboard)/page.tsx`           | Dashboard integration         | Medium     |
| 5.7  | Update Dashboard "In Progress" to show active jobs with task progress + risk indicator                                                                                                                                                            | `app/(dashboard)/page.tsx`           | Dashboard integration         | Medium     |
| 5.8  | Add "View Board" link to Dashboard                                                                                                                                                                                                                | `app/(dashboard)/page.tsx`           | Dashboard integration         | Low        |
| 5.9  | Verify empty states: all board lanes, all detail sections (tasks, notes, linked entities), list table                                                                                                                                             | All components                       | U43, U44, U71                 | Low        |
| 5.10 | Verify error states: invalid job ID → "Job not found" with link to jobs list                                                                                                                                                                      | `app/(dashboard)/jobs/[id]/page.tsx` | U114                          | Low        |
| 5.11 | Keyboard accessibility: Tab to cards on board, Enter to open, arrow keys within lanes (basic)                                                                                                                                                     | Board components                     | Scope: QC                     | Medium     |
| 5.12 | ARIA labels: lane headers (`role="region"`, `aria-label`), card roles (`role="article"`), drag handles (`aria-roledescription`), task checkboxes (labeled)                                                                                        | All components                       | Scope: QC                     | Medium     |
| 5.13 | Verify breadcrumb trails on all 3 pages                                                                                                                                                                                                           | All pages                            | U11, U61, U80                 | Low        |
| 5.14 | Verify hover/focus/active states on all interactive elements (cards, buttons, rows, checkboxes, filters)                                                                                                                                          | All components                       | Scope: QC                     | Low        |
| 5.15 | Run `design-auditor` agent for full formal audit of all 3 screens                                                                                                                                                                                 | —                                    | —                             | —          |
| 5.16 | Fix any Critical/Fail items from design audit                                                                                                                                                                                                     | As needed                            | —                             | Variable   |

**Checkpoint**: FINAL — this is the Definition of Done checkpoint (see Section 14).

**Demoable**: Complete Jobs & Production vertical. All 3 screens functional, cross-linked with existing verticals, accessible, and design-audited.

---

## 4. Session Prompts

### Wave 1 Session Prompt

````
TASK: Jobs Vertical — Wave 1: Foundation (Schema + Constants + Mock Data + Tests)

You are building the data layer for the Jobs & Production vertical in Mokumo. This is Phase 1 (mock data, no backend). Your job is to:

1. REWRITE the job schema from the old 6-stage pipeline to the new universal lane model
2. CREATE new schemas (scratch-note, board-card)
3. UPDATE constants with lane/risk/service-type mappings and canonical task templates
4. REPLACE the mock data jobs section with 10-12 comprehensive jobs
5. WRITE schema tests

## Files to Read First

Read these files before writing ANY code:
- `docs/strategy/jobs-scope-definition.md` — Schema changes section (lines 549-682), Mock Data Requirements section (lines 684-728)
- `docs/breadboards/jobs-breadboard.md` — Schema Gaps section (lines 23-35)
- `lib/schemas/job.ts` — Current schema (37 lines, needs complete rewrite)
- `lib/schemas/invoice.ts` — Gold standard pattern: enums → sub-schemas → main schema with .refine() → type exports
- `lib/schemas/quote.ts` — For serviceTypeEnum (reuse, don't duplicate)
- `lib/constants.ts` — Current pattern: Record<EnumType, string> for labels, colors, badge colors
- `lib/mock-data.ts` — Current structure (jobs section lines 393-531, customer IDs at top for reference)
- `lib/schemas/__tests__/invoice.test.ts` — Gold standard test pattern
- `CLAUDE.md` — Coding standards (Zod-first types, no `any`, no floating-point for money)

## Schema Design

### Job Schema (`lib/schemas/job.ts`)

Replace the entire file. The new schema has:

**Enums**:
- `laneEnum`: "ready" | "in_progress" | "review" | "blocked" | "done"
- `riskLevelEnum`: "on_track" | "getting_tight" | "at_risk"
- `jobNoteTypeEnum`: "internal" | "customer" | "system"

**Sub-schemas**:
- `jobTaskSchema`: { id: uuid, label: string, detail?: string, isCompleted: boolean, completedAt?: datetime, isCanonical: boolean, sortOrder: number }
- `jobNoteSchema`: { id: uuid, type: jobNoteTypeEnum, content: string, author: string, createdAt: datetime }
- `jobHistoryEntrySchema`: { fromLane: laneEnum, toLane: laneEnum, timestamp: datetime, note?: string }
- `garmentDetailSchema`: { garmentId: string, colorId: string, sizes: z.record(z.string(), z.number()) }
- `jobPrintLocationSchema`: { position: string, colorCount: number, artworkApproved: boolean }
- `jobComplexitySchema`: { locationCount: number, screenCount?: number, garmentVariety: number }

**Main schema** (`jobSchema`):
- id, jobNumber (J-XXXX), title, customerId
- lane (laneEnum), serviceType (reuse serviceTypeEnum from quote.ts)
- startDate, dueDate, customerDueDate?, createdAt, updatedAt?, completedAt?
- priority (reuse priorityEnum), riskLevel (riskLevelEnum)
- quantity, garmentDetails[], printLocations[], complexity
- tasks: jobTaskSchema[]
- blockReason?, blockedAt?, blockedBy?
- assigneeId?, assigneeName?, assigneeInitials?
- sourceQuoteId?, invoiceId?, artworkIds: string[]
- history: jobHistoryEntrySchema[]
- notes: jobNoteSchema[]
- isArchived (default false)

Keep `productionStateEnum` and `priorityEnum` exports for backward compatibility (dashboard still references them).
Export all new types via z.infer.

### Scratch Note Schema (`lib/schemas/scratch-note.ts` — NEW)

{ id: uuid, content: string.min(1), createdAt: datetime, isArchived: boolean.default(false) }

### Board Card Schema (`lib/schemas/board-card.ts` — NEW)

Discriminated union on "type" field:
- scratch_note: { type: "scratch_note", ...scratchNoteSchema fields, lane: always "ready" }
- quote: { type: "quote", quoteId: uuid, customerId: uuid, customerName: string, description: string, serviceType?, quantity?: number, dueDate?: string, total?: number, quoteStatus: quoteStatusEnum, lane: laneEnum }
- job: { type: "job", ...subset of jobSchema fields for card rendering (id, jobNumber, title, customerId, customerName, lane, serviceType, quantity, dueDate, riskLevel, priority, taskProgress: { completed: number, total: number }, assigneeInitials?, sourceQuoteId?, invoiceId?, invoiceStatus?) }

This is a VIEW MODEL — not stored, projected from underlying entities.

## Constants Updates (`lib/constants.ts`)

Add these AFTER the existing production state / priority sections:

```typescript
// Lane labels and colors (for board and badges)
LANE_LABELS: Record<Lane, string>
LANE_COLORS: Record<Lane, string>  // text colors
LANE_BADGE_COLORS: Record<Lane, string>  // bg + text + border (match invoice badge pattern)

// Risk indicators
RISK_LABELS: Record<RiskLevel, string>
RISK_COLORS: Record<RiskLevel, string>

// Service type visual encoding
SERVICE_TYPE_BORDER_COLORS: Record<ServiceType, string>  // left-border color on cards
SERVICE_TYPE_ICONS: Record<ServiceType, string>  // Lucide icon name

// Canonical task templates per service type
CANONICAL_TASKS: Record<ServiceType, Array<{ label: string; detail?: string }>>
````

Lane badge colors should follow the invoice badge pattern:

- ready: "bg-muted text-muted-foreground"
- in_progress: "bg-action/10 text-action border border-action/20"
- review: "bg-warning/10 text-warning border border-warning/20"
- blocked: "bg-error/10 text-error border border-error/20"
- done: "bg-success/10 text-success border border-success/20"

Service type border colors:

- screen-print: border-action (Niji blue)
- dtf: border-warning (Niji gold)
- embroidery: border-success (Niji green)

## Mock Data

Replace the `jobs` array entirely. Create 10-12 jobs following the table in scope definition (lines 688-700). For each job:

- Full `jobSchema` compliance (new lane model)
- Canonical tasks from CANONICAL_TASKS[serviceType], partially completed based on lane position
- 2-4 history entries (lane transitions with timestamps over past 2 weeks)
- 1-3 notes (mix of internal, customer, system)
- Block reason for blocked jobs
- sourceQuoteId linking to existing quotes where appropriate
- invoiceId for done jobs

Add quote board cards (5-6): project existing quotes into board lane positions.
Add scratch notes (2-3): quick capture examples.
Add helper functions: getJobsByLane(), getJobsByServiceType(), etc.

Use existing customer IDs from mock data. Use UUID format that passes Zod validation (RFC-4122 compliant — remember the variant byte lesson from CLAUDE.md).

## Tests

Rewrite `lib/schemas/__tests__/job.test.ts`:

- Enum tests: laneEnum accepts/rejects, riskLevelEnum accepts/rejects
- Sub-schema tests: jobTaskSchema valid/invalid, jobNoteSchema valid/invalid, jobHistoryEntrySchema valid/invalid
- Main schema: full valid object, missing required fields, invalid lane value, empty tasks array (should pass — new jobs can have 0 tasks initially)

Write new test files:

- `lib/schemas/__tests__/scratch-note.test.ts`
- `lib/schemas/__tests__/board-card.test.ts`

## What NOT to Do

- Do NOT create any UI components or page files
- Do NOT modify any files in `app/` or `components/`
- Do NOT delete the old productionStateEnum — keep it exported for backward compatibility
- Do NOT use floating-point arithmetic for any numeric calculations
- Do NOT hand-craft UUIDs that fail Zod's RFC-4122 validation (variant byte must start with 8,9,a,b)
- Do NOT commit PROGRESS.md, for_human/index.html, or for_human/README.md

## Verification

Before committing, run:

1. `npm test` — ALL tests must pass (including existing 314 tests)
2. `npx tsc --noEmit` — no type errors
3. `npm run build` — must compile successfully
4. Manually verify mock data structure makes sense

## Commit

Stage and commit:

- lib/schemas/job.ts
- lib/schemas/scratch-note.ts (NEW)
- lib/schemas/board-card.ts (NEW)
- lib/constants.ts
- lib/mock-data.ts
- lib/schemas/**tests**/job.test.ts
- lib/schemas/**tests**/scratch-note.test.ts (NEW)
- lib/schemas/**tests**/board-card.test.ts (NEW)

```

---

### Wave 2 Session Prompt

```

TASK: Jobs Vertical — Wave 2: Board Core (Static Board + Card Components)

You are building the Production Board page and all supporting components for Mokumo. This is the CRITICAL PATH — the highest-complexity wave. You'll build 21 items: 4 shared components, 8 vertical-specific components, 1 page, 3 utility functions, and supporting wiring.

Wave 1 (schemas + mock data) is already complete and merged. You have the full lane-based job model, scratch notes, board card types, and comprehensive mock data available.

## Files to Read First

Read ALL of these before writing ANY code:

- `docs/breadboards/jobs-breadboard.md` — Your PRIMARY build blueprint. Focus on: P1 (Production Board), Component Boundaries section (lines 606-687), all U1-U44 affordances, N1-N9 code affordances
- `docs/strategy/jobs-scope-definition.md` — Production Board section (lines 66-136), Card Design section (lines 100-135)
- `docs/APP_FLOW.md` — Production Board page details (lines 637-692)
- `lib/schemas/job.ts` — New lane-based schema (Wave 1 output)
- `lib/schemas/board-card.ts` — Discriminated union for 3 card types (Wave 1 output)
- `lib/schemas/scratch-note.ts` — Scratch note schema (Wave 1 output)
- `lib/constants.ts` — New lane/risk/service-type constants (Wave 1 output)
- `lib/mock-data.ts` — New mock data with 10-12 jobs, quote cards, scratch notes (Wave 1 output)
- `app/(dashboard)/invoices/page.tsx` — Reference pattern for list page with StatsBar + DataTable
- `app/(dashboard)/invoices/_components/InvoiceStatsBar.tsx` — Reference for CapacitySummaryBar pattern
- `app/(dashboard)/invoices/_components/InvoicesDataTable.tsx` — Reference for custom sort/filter pipeline (NOT TanStack)
- `components/features/StatusBadge.tsx` — Reference for badge component pattern
- `components/features/OverdueBadge.tsx` — Reference for indicator component pattern
- `components/features/ColumnHeaderMenu.tsx` — Reference for filter/sort UI pattern
- `components/layout/sidebar.tsx` — Need to update Jobs link
- `CLAUDE.md` — Design system tokens, quality checklist

## Design System Quick Reference

Colors:

- Service type borders: screen-print = `border-action`, dtf = `border-warning`, embroidery = `border-success`
- Lane badges: ready = muted, in_progress = action, review = warning, blocked = error, done = success
- Risk dots: on_track = no dot, getting_tight = `text-warning`, at_risk = `text-error`
- Background scale: `bg-background` → `bg-card` → `bg-surface`

Typography:

- Card customer name: `text-sm font-medium text-foreground`
- Card metadata: `text-xs text-muted-foreground`
- Lane header: `text-sm font-medium uppercase tracking-wide text-muted-foreground`
- Section label: `text-xs font-semibold uppercase tracking-widest text-muted-foreground`

Icons (Lucide):

- Screen print: `Printer` (h-3.5 w-3.5)
- DTF: `Palette` (h-3.5 w-3.5)
- Embroidery: `Scissors` (h-3.5 w-3.5)

## Component Build Order

Build in this exact order (respects dependencies):

1. **Shared components** (in `components/features/`):
   - ServiceTypeBadge.tsx — icon + color-coded label, used on cards, table rows, detail header
   - RiskIndicator.tsx — colored dot with optional label, used on cards, table rows, detail header
   - LaneBadge.tsx — colored badge with lane label, used on table rows and detail header
   - TaskProgressBar.tsx — mini progress bar with "X/Y tasks" label, used on cards, table rows, detail

2. **Card components** (in `app/(dashboard)/jobs/_components/`):
   - JobBoardCard.tsx — full card design per scope definition card mockup
   - QuoteBoardCard.tsx — quote card with "Create Job" action on Done lane
   - ScratchNoteCard.tsx — distinct visual (lighter bg, dashed border?)

3. **Board infrastructure**:
   - BoardLane.tsx — droppable container with header, card count, empty state
   - BoardSection.tsx — row container (Quotes or Jobs) with 5 lane slots

4. **Board controls**:
   - BoardFilterBar.tsx — 5 filters with URL state
   - CapacitySummaryBar.tsx — 3 stat cards

5. **Page assembly**:
   - board/page.tsx — full layout orchestration

6. **Utilities** (in `lib/helpers/job-utils.ts`):
   - computeRiskLevel(job) — dueDate vs tasks vs today
   - computeTaskProgress(tasks) — { completed, total, percentage, allComplete }
   - computeCapacitySummary(cards, filters) — { rushCount, totalQuantity, byLane }
   - computeFilteredCards(allCards, filters) — apply all filters

## Card Component Design

Follow this EXACT card layout (from scope definition):

```
┌──────────────────────────────────┐
│ [icon] Screen Printing    [JD]  │  ← ServiceTypeBadge + assignee initials
│                                  │
│ Acme Corp — Company Tees         │  ← customer + job name (font-medium)
│ 200 shirts · 2 locations         │  ← quantity + complexity (text-xs muted)
│                                  │
│ Due: Feb 14 ●                    │  ← due date + RiskIndicator
│ ████████░░ 6/8 tasks             │  ← TaskProgressBar
└──────────────────────────────────┘
```

Card has: `bg-card rounded-lg border p-3` with left-border color for service type (4px).
Card hover: `hover:bg-surface transition-colors` with subtle lift (`hover:-translate-y-0.5`).
Card click: entire card is clickable → navigates to detail page.

## URL State for Filters

Follow the InvoicesDataTable pattern — use useSearchParams():

- `?today=true` — Today filter active
- `?serviceType=screen-print,dtf` — Comma-separated service types
- `?section=quotes` or `?section=jobs` — Section filter (default: all)
- `?risk=at-risk` — Risk filter
- `?horizon=1w` or `?horizon=2w` or `?horizon=1m` — Time horizon (default: 2w)

## Important Patterns

- Server component for the page, `"use client"` for interactive sub-components
- Import types from schemas via `z.infer<typeof schema>`
- Use `cn()` from `@/lib/utils` for conditional classes
- All spacing via Tailwind utilities
- No TanStack Table — custom sort/filter pipeline
- Empty lane state: subtle text "No cards" centered vertically
- Done lane: collapsed by default (show card count badge), click to expand

## File Structure to Create

```
components/features/
  ServiceTypeBadge.tsx        <- NEW
  RiskIndicator.tsx           <- NEW
  LaneBadge.tsx               <- NEW
  TaskProgressBar.tsx         <- NEW

app/(dashboard)/jobs/
  board/
    page.tsx                  <- NEW: Production Board
  _components/
    CapacitySummaryBar.tsx    <- NEW
    BoardFilterBar.tsx        <- NEW
    BoardSection.tsx          <- NEW
    BoardLane.tsx             <- NEW
    JobBoardCard.tsx          <- NEW
    QuoteBoardCard.tsx        <- NEW
    ScratchNoteCard.tsx       <- NEW

lib/helpers/
  job-utils.ts               <- NEW: risk, progress, capacity, filter utils
```

## Sidebar Update

In `components/layout/sidebar.tsx`, update the Jobs link:

- href: `/jobs/board` (was `/jobs`)
- This makes the board the primary entry point

## What NOT to Do

- Do NOT implement drag-and-drop (that's Wave 3)
- Do NOT build the Jobs List page (that's Wave 4B)
- Do NOT build the Job Detail page (that's Wave 4A)
- Do NOT build BlockReasonDialog, MoveLaneDialog, ScratchNoteCapture (that's Wave 3)
- Do NOT modify quoting or invoicing components (extend shared components only)
- Do NOT commit PROGRESS.md or for_human files

## Verification

1. `npm run build` — must pass
2. `npx tsc --noEmit` — must pass
3. `npm run lint` — must pass
4. Visual check: board renders at `/jobs/board` with all mock data in correct lanes
5. All 5 filters work with URL state persistence
6. Cards show all visual elements (service type, customer, quantity, due date, risk, progress)
7. Done lane collapses/expands
8. Card clicks navigate to correct URLs
9. Empty states render when filters remove all cards from a lane

```

---

### Wave 3 Session Prompt

```

TASK: Jobs Vertical — Wave 3: Board Interactivity (Drag-and-Drop + Dialogs)

You are adding interactivity to the Production Board built in Wave 2. Your job is to:

1. Integrate dnd-kit for drag-and-drop between lanes
2. Build the BlockReasonDialog, MoveLaneDialog, and ScratchNoteCapture components
3. Wire all board-level interactions: drag, block, unblock, scratch notes, done lane

Wave 2 (static board + cards) is already complete and merged. The board renders with all mock data, filters work, cards display correctly.

## Files to Read First

- `docs/breadboards/jobs-breadboard.md` — Focus on: Drag-and-Drop Interactions (U39-U42), P1.1 (Scratch Note Capture), P1.2 (Block Reason Input), P1.3 (Move Lane Dialog), N10-N16 code affordances
- `docs/strategy/jobs-scope-definition.md` — Drag-and-drop behavior, scratch note capture, block/unblock flow
- `app/(dashboard)/jobs/board/page.tsx` — Current board page (Wave 2 output) — you'll be modifying this
- `app/(dashboard)/jobs/_components/*.tsx` — All board components (Wave 2 output)
- `components/ui/dialog.tsx` — shadcn Dialog for BlockReasonDialog and MoveLaneDialog
- `components/ui/popover.tsx` — For ScratchNoteCapture (alternative: inline)
- `app/(dashboard)/invoices/_components/VoidInvoiceDialog.tsx` — Reference for destructive confirmation dialog pattern
- `app/(dashboard)/invoices/_components/RecordPaymentSheet.tsx` — Reference for form-in-overlay pattern
- `CLAUDE.md` — Lessons: React 19 ESLint — don't use useEffect to reset form state; parent conditionally renders dialog

## dnd-kit Integration

Check if dnd-kit is already in package.json. If not, install:

```bash
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

Architecture:

- Wrap board in `<DndContext>` with sensors (PointerSensor + KeyboardSensor)
- Each lane cell (section + lane combination) is a unique droppable: e.g., "quotes-ready", "jobs-in_progress"
- Each card is draggable with a unique ID
- `DragOverlay` renders a preview copy of the dragged card
- `onDragEnd` handler: extracts card ID + destination droppable → validates same-row constraint → applies move

Constraint: Cards can ONLY move within their row (quotes row or jobs row). Cross-row moves are rejected silently (card returns to original position).

When dropping on Blocked lane: interrupt the move, open BlockReasonDialog. If confirmed → complete the move with block reason. If cancelled → card returns to original position.

## Components to Build

### BlockReasonDialog (`_components/BlockReasonDialog.tsx`)

- AlertDialog from shadcn (not Dialog — this is a blocking confirmation)
- Props: open, onConfirm(reason: string), onCancel
- Textarea for block reason (required, min 1 char)
- "Block" button (destructive variant) + "Cancel" button
- Parent conditionally renders (not controlled open state): `{showBlockDialog && <BlockReasonDialog />}`

### MoveLaneDialog (`_components/MoveLaneDialog.tsx`)

- Dialog from shadcn
- Props: open, currentLane, onMove(targetLane: Lane, blockReason?: string), onCancel
- Lane selector (radio group or select) showing all 5 lanes
- Current lane disabled/highlighted
- If Blocked selected → show block reason textarea
- "Move" button + "Cancel" button

### ScratchNoteCapture (`_components/ScratchNoteCapture.tsx`)

- Popover or inline input that appears when "+" button is clicked
- Single textarea (auto-focused)
- Enter to submit (creates scratch note), Escape to cancel
- Minimum input: 1 character
- On submit: creates new scratch note in state, note appears in Quotes Ready lane immediately
- Close popover after submit

## State Management

Board state lives in the page component using useState:

- `jobs` array (mutable copy of mock data)
- `scratchNotes` array
- Quote lane positions (client-side mapping)

When a card moves:

1. Update the card's lane in state
2. Add a history entry { fromLane, toLane, timestamp, note? }
3. Add a system note "Moved from [fromLane] to [toLane]"
4. If blocked: set blockReason, blockedAt, blockedBy
5. If unblocking: clear block fields, restore previous lane

## What NOT to Do

- Do NOT implement within-lane reordering (Phase 2)
- Do NOT build Job Detail or Jobs List (Waves 4A/4B)
- Do NOT modify shared components in `components/features/`
- Do NOT commit PROGRESS.md or for_human files
- Do NOT add keyboard shortcuts (Phase 2, just basic tab/enter)

## Verification

1. `npm run build` — must pass
2. `npx tsc --noEmit` — must pass
3. `npm run lint` — must pass
4. Drag job cards between lanes → card moves, history updated
5. Drag quote cards between lanes → card moves
6. Cross-row drag rejected (card returns to original)
7. Drop on Blocked → block reason dialog appears
8. Block confirmed → card in Blocked lane with reason
9. Block cancelled → card returns to original position
10. "+" button → scratch note capture opens
11. Type + Enter → scratch note appears in Quotes Ready
12. Escape → scratch note capture closes
13. Dismiss scratch note → removed from board
14. Done lane collapses/expands correctly
15. Lane highlights during drag-over

```

---

### Wave 4A Session Prompt

```

TASK: Jobs Vertical — Wave 4A: Job Detail Command Center

You are building the Job Detail page at `/jobs/[id]` — the "command center" where Gary manages all aspects of a production job. This has 7 sections: Header, Quick Actions, Tasks, Details, Notes, Linked Entities, and Block Banner.

Wave 1 (schemas + mock data) is complete. You have the full lane-based job model with tasks, notes, history, and linked entities.

## Files to Read First

- `docs/breadboards/jobs-breadboard.md` — Focus on: P3 (Job Detail), all U72-U126 affordances, P3.1-P3.4 subplaces, N24-N34 code affordances, Component Boundaries for P3 components
- `docs/strategy/jobs-scope-definition.md` — Job Detail section (lines 175-254), acceptance criteria, quality checklist
- `docs/APP_FLOW.md` — Job Detail page details (lines 574-634), cross-links section
- `lib/schemas/job.ts` — Full schema with tasks, notes, history, block tracking
- `lib/mock-data.ts` — Mock jobs with all data populated
- `lib/constants.ts` — Lane labels/colors, risk labels/colors, service type labels/icons
- `lib/helpers/job-utils.ts` — computeRiskLevel, computeTaskProgress (Wave 2 output)
- `app/(dashboard)/invoices/[id]/page.tsx` — Reference for detail page pattern
- `app/(dashboard)/invoices/_components/InvoiceDetailView.tsx` — Reference for multi-section detail layout
- `components/features/NotesPanel.tsx` — Reference for notes display (may not be directly reusable — jobs need type-filtered feed)
- `components/features/StatusBadge.tsx` — For lane badge display
- `components/ui/checkbox.tsx` — For task checkboxes
- `components/ui/collapsible.tsx` — For section collapse/expand
- `CLAUDE.md` — Design system, quality checklist, React 19 ESLint lesson

## Component Build Order

Build in this order:

1. `JobHeader.tsx` — Header section (service type bar, customer, dates, risk, lane)
2. `QuickActionsBar.tsx` — Action buttons (move lane, block/unblock, view quote/invoice)
3. `TaskItem.tsx` — Single task row (checkbox, label, detail, strikethrough)
4. `AddCustomTaskInput.tsx` — Inline form for adding custom tasks
5. `TaskChecklist.tsx` — Task list with progress bar and "Ready for next lane" indicator
6. `JobDetailsSection.tsx` — Garment info, print locations, complexity
7. `NoteItem.tsx` — Single note display (type badge, timestamp, author, content)
8. `NotesFeed.tsx` — Note list with quick-add input, type filter tabs
9. `LinkedEntitiesSection.tsx` — Links to quote, invoice, customer
10. `BlockReasonBanner.tsx` — Prominent block reason display with unblock button
11. `page.tsx` — Page orchestration

## Page Layout

Full-width page with sections stacked vertically:

1. Breadcrumb: Dashboard > Jobs > J-1024
2. Block Reason Banner (ONLY when lane = blocked, above everything)
3. JobHeader (service type accent, customer, dates, risk, lane)
4. QuickActionsBar (move lane, block, view quote/invoice, edit)
5. TaskChecklist (progress bar + task list + add custom task)
6. JobDetailsSection (quantity, garments, locations, screens)
7. NotesFeed (add note + filter tabs + chronological feed)
8. LinkedEntitiesSection (quote, invoice, customer, files)

## Interactive Behaviors

**Task toggle**: Click checkbox → flip isCompleted, set/clear completedAt, add system note ("Task 'X' completed" or "Task 'X' uncompleted"), recompute progress.

**Add custom task**: Click "Add Custom Task" → show inline form (conditionally rendered, NOT controlled dialog). Enter label + optional detail → Add to tasks array with isCanonical: false.

**Add note**: Type in quick-add input → select type (Internal/Customer) → submit → new note added with author "Gary", createdAt: now. System notes are auto-generated (not user-created).

**Filter notes**: Tabs above feed: All | Internal | Customer | System → filters displayed notes.

**Move lane**: Dropdown in QuickActionsBar → select target lane → if Blocked: open BlockReasonDialog (reuse from Wave 3 or build local copy) → update lane + history + system note.

**Block/Unblock**: Toggle button. Blocking: opens BlockReasonDialog. Unblocking: restores previous lane from history.

**Copy to clipboard**: Click email/phone → navigator.clipboard.writeText() → toast "Copied to clipboard".

## State Management

Page is a `"use client"` component. Load job from mock data by route `[id]` param.
Use useState for mutable job state (tasks, notes, lane changes).
Cross-link data (customer, quote, invoice) loaded via lookup helpers.

## Error State

Invalid job ID → show "Job not found" page:

- Lucide `FileQuestion` icon
- "Job not found" heading
- "The job you're looking for doesn't exist or has been removed."
- Button: "Back to Jobs" → `/jobs`

## What NOT to Do

- Do NOT build the Jobs List page (that's Wave 4B, running in parallel)
- Do NOT modify the Production Board (Wave 2/3)
- Do NOT modify shared components
- Do NOT add job editing capability (Phase 2)
- Do NOT commit PROGRESS.md or for_human files

## Verification

1. `npm run build` — must pass
2. `npx tsc --noEmit` — must pass
3. `npm run lint` — must pass
4. Each mock job renders with all 7 sections
5. Task checkboxes toggle with visual feedback
6. Custom tasks can be added
7. Notes can be added and filtered by type
8. Move Lane dropdown updates the lane badge + adds history
9. Block/Unblock works with reason banner
10. All cross-links navigate to correct pages
11. Invalid job ID shows error page
12. Breadcrumb trail correct

```

---

### Wave 4B Session Prompt

```

TASK: Jobs Vertical — Wave 4B: Jobs List (Table View)

You are building the Jobs List page at `/jobs` — a sortable, filterable table view of all jobs. This runs in PARALLEL with Wave 4A (Job Detail). You are independent — you don't need Wave 4A to be complete.

Wave 1 (schemas + mock data) is complete.

## Files to Read First

- `docs/breadboards/jobs-breadboard.md` — Focus on: P2 (Jobs List), U55-U71, N17-N22, Component Boundaries for JobsDataTable
- `docs/strategy/jobs-scope-definition.md` — Jobs List section (lines 139-172)
- `docs/APP_FLOW.md` — Jobs List page details (lines 555-570)
- `lib/schemas/job.ts` — Full schema
- `lib/mock-data.ts` — Mock jobs
- `lib/constants.ts` — Lane/risk/service-type labels and colors
- `lib/helpers/job-utils.ts` — computeRiskLevel, computeTaskProgress (if available)
- `app/(dashboard)/invoices/page.tsx` — GOLD STANDARD reference for list page
- `app/(dashboard)/invoices/_components/InvoicesDataTable.tsx` — GOLD STANDARD for custom sort/filter pipeline
- `app/(dashboard)/invoices/_components/InvoicesSmartViewTabs.tsx` — Reference for tab-based filtering
- `components/features/ColumnHeaderMenu.tsx` — For sort + inline filter on column headers
- `components/features/ServiceTypeBadge.tsx` — Shared component (Wave 2 output)
- `components/features/RiskIndicator.tsx` — Shared component (Wave 2 output)
- `components/features/LaneBadge.tsx` — Shared component (Wave 2 output)
- `components/features/TaskProgressBar.tsx` — Shared component (Wave 2 output)
- `CLAUDE.md` — Design system, quality checklist

## Critical Pattern: NO TanStack Table

The codebase uses a CUSTOM sort/filter pipeline, NOT TanStack Table. Follow InvoicesDataTable exactly:

1. `useSearchParams()` for all filter/search state
2. Zod schema for validated sort keys: `const jobSortKeySchema = z.enum(["jobNumber", "customer", "dueDate", "lane", "serviceType", "risk", "quantity"])`
3. `useMemo` to compute filtered + sorted jobs from mock data
4. Debounced search input (300ms)
5. Desktop: `<Table>` from shadcn/ui. Mobile: card list.
6. ColumnHeaderMenu on each sortable column header

## Table Columns

| Column       | Content                                            | Sortable           | Filterable             |
| ------------ | -------------------------------------------------- | ------------------ | ---------------------- |
| Job #        | jobNumber (text)                                   | Yes                | No (covered by search) |
| Service Type | ServiceTypeBadge (icon + label)                    | Yes                | Yes (filter dropdown)  |
| Customer     | customerName (text)                                | Yes                | No (covered by search) |
| Job Name     | title (text)                                       | No                 | No (covered by search) |
| Quantity     | quantity (number)                                  | Yes                | No                     |
| Due Date     | formatted date + RiskIndicator                     | Yes (default sort) | No                     |
| Lane         | LaneBadge                                          | Yes                | Yes (filter dropdown)  |
| Risk         | RiskIndicator                                      | Yes                | Yes (filter dropdown)  |
| Tasks        | TaskProgressBar (mini)                             | No                 | No                     |
| Actions      | Quick action menu (Move Lane, Block/Unblock, View) | No                 | No                     |

## URL State

- `?q=` — Search query (debounced)
- `?lane=` — Lane filter (all/ready/in_progress/review/blocked/done)
- `?serviceType=` — Service type filter (screen-print/dtf/embroidery)
- `?risk=` — Risk filter (all/at-risk/on-track)
- `?sort=` — Sort column
- `?dir=` — Sort direction (asc/desc)

## Quick Actions Per Row

Dropdown menu (DropdownMenu from shadcn) with:

- "Move Lane →" → opens MoveLaneDialog (or inline lane selector)
- "Mark Blocked" / "Unblock" → toggles block state
- "View Detail" → navigates to `/jobs/[id]`

## File Structure

```
app/(dashboard)/jobs/
  page.tsx                    <- NEW: Jobs List page
  _components/
    JobsDataTable.tsx         <- NEW: custom sort/filter data table
```

## What NOT to Do

- Do NOT use TanStack Table — use custom sort/filter pipeline
- Do NOT build the Job Detail page (that's Wave 4A)
- Do NOT modify the Production Board (Waves 2/3)
- Do NOT build smart view tabs (keep it simple — filter dropdowns only)
- Do NOT commit PROGRESS.md or for_human files

## Verification

1. `npm run build` — must pass
2. `npx tsc --noEmit` — must pass
3. `npm run lint` — must pass
4. Table shows all mock jobs with correct columns
5. Search filters by job number, customer name, job name
6. Lane filter works via URL state
7. Service type filter works via URL state
8. Risk filter works via URL state
9. Column sort works (click header, toggle direction)
10. Row click → `/jobs/[id]`
11. View toggle → `/jobs/board`
12. Quick actions work (move lane, block/unblock)
13. Empty state shows when no jobs match filters
14. Mobile card layout renders correctly
15. Breadcrumb: Dashboard > Jobs

```

---

### Wave 5 Session Prompt

```

TASK: Jobs Vertical — Wave 5: Integration & Polish

You are completing the Jobs vertical by wiring cross-vertical connections, updating the dashboard, adding empty/error states everywhere, polishing accessibility, and running the final design audit.

All 3 screens are built (Board, List, Detail) from Waves 2-4. This wave connects everything together and ensures production quality.

## Files to Read First

- `docs/breadboards/jobs-breadboard.md` — Integration Touchpoints section (lines 785-851), N30 (createJobFromQuote)
- `docs/strategy/jobs-scope-definition.md` — INTERCONNECTIONS section (lines 416-469), Quote-to-Job Conversion (lines 365-374)
- `docs/APP_FLOW.md` — Cross-Links section (lines 87-130), Dashboard page details (lines 540-553)
- `app/(dashboard)/page.tsx` — Current dashboard (needs lane-based updates)
- `app/(dashboard)/jobs/board/page.tsx` — Board page (Wire createJobFromQuote)
- `app/(dashboard)/jobs/_components/QuoteBoardCard.tsx` — Wire "Create Job from Quote" button
- `app/(dashboard)/jobs/[id]/page.tsx` — Job Detail (verify all cross-links)
- `app/(dashboard)/jobs/_components/JobBoardCard.tsx` — Wire payment status badge
- `lib/mock-data.ts` — Need to access invoices for payment status, quotes for conversion
- `CLAUDE.md` — Quality checklist (all items), accessibility requirements

## Cross-Vertical Integration Tasks

### Quote-to-Job Conversion (N30)

Implement `createJobFromQuote(quoteId)`:

1. Read accepted quote from mock data
2. Create new Job: inherit customerId, serviceType (map from quote), quantity (sum from lineItems), garmentDetails, printLocations
3. Auto-populate canonical tasks from CANONICAL_TASKS[serviceType]
4. Set lane = "ready"
5. Set sourceQuoteId = quoteId
6. Add system note: "Created from Quote Q-XXXX"
7. Add to jobs state array
8. Show toast: "Job J-XXXX created from Quote Q-XXXX"
9. New card appears in Jobs Ready lane on board

Wire this to the "Create Job from Quote" button on QuoteBoardCard (visible only on accepted quotes in Done lane).

### Dashboard Updates

Update `app/(dashboard)/page.tsx`:

- Summary cards: use lane-based counts instead of old production states
  - "Blocked" card: count of jobs where lane === "blocked"
  - "In Progress" card: count where lane === "in_progress" or "review"
  - "At Risk" card: count where riskLevel === "at_risk" or "getting_tight"
  - "Total Jobs" card: count of all non-archived jobs
- "Needs Attention" section: show blocked jobs with block reason + ServiceTypeBadge
- "In Progress" section: show active jobs with TaskProgressBar + RiskIndicator
- Add "View Board" link (→ /jobs/board)
- Job rows clickable → /jobs/[id]

### Payment Status Badge

On JobBoardCard in Done lane: if job.invoiceId exists, look up invoice from mock data and show payment status badge (Paid/Partial/Sent/Draft) using existing StatusBadge or INVOICE_STATUS_BADGE_COLORS.

## Empty & Error State Verification

Verify ALL of these render correctly:

- Board: empty lane placeholder, empty board state (all lanes empty after filtering)
- Board: Done lane collapsed state with count badge
- List: empty table ("No jobs yet — jobs will appear here when quotes are accepted")
- List: empty search results ("No jobs match your search")
- Detail: empty tasks section ("No tasks yet" + "Add Custom Task")
- Detail: empty notes section (quick-add input visible)
- Detail: no linked quote (button hidden)
- Detail: no linked invoice (button hidden)
- Detail: invalid job ID → "Job not found" page

## Accessibility Audit

- All board lanes: `role="region"`, `aria-label="Ready lane"` etc.
- All card components: `role="article"` or appropriate role
- Drag handles: `aria-roledescription="draggable"`, `aria-label="Drag to move"`
- Task checkboxes: proper `<label>` association
- Note type tabs: proper `role="tablist"` + `role="tab"` (or shadcn Tabs handles this)
- Filter controls: proper `aria-label` on each filter
- Breadcrumbs: proper `aria-label="Breadcrumb"` on nav
- Focus management: Tab order makes sense across all 3 pages
- Keyboard: Tab to board cards, Enter to open, Tab through filters

## Final Design Audit

After all integration work is complete, invoke the design-auditor agent:
"Use the design-auditor agent to audit the Production Board, Jobs List, and Job Detail pages"

Fix any Critical/Fail items from the audit before marking the wave complete.

## What NOT to Do

- Do NOT rebuild or significantly modify the 3 core screens
- Do NOT add features not in the scope definition
- Do NOT modify quoting or invoicing screens (only read data from them)
- Do NOT commit PROGRESS.md, for_human/index.html, or for_human/README.md

## Verification (FINAL)

1. `npm run build` — must pass
2. `npx tsc --noEmit` — must pass
3. `npm run lint` — must pass
4. `npm test` — must pass
5. "Create Job from Quote" creates a job with inherited data + canonical tasks
6. Dashboard summary cards show lane-based counts
7. Dashboard blocked/in-progress sections show correct jobs with new badges
8. Payment status badge appears on Done lane cards with invoices
9. ALL cross-links verified: board ↔ list, detail → quote, detail → invoice, detail → customer, customer name links, breadcrumbs
10. ALL empty states render correctly
11. Error state (invalid job ID) works
12. ARIA labels present on lanes, cards, drag handles, checkboxes, filters
13. Tab navigation works across all 3 pages
14. Design audit passes with no Critical/Fail items

````

---

## 5. Agent & Tooling Strategy

### Agent Selection per Wave

| Wave | Agent Type | Why | Calling Convention |
|------|-----------|-----|-------------------|
| 1 | `general-purpose` | Schema, data, and tests — no UI work, needs full file read/write | Direct session (no subagent needed) |
| 2 | `frontend-builder` | UI-intensive board construction | "Use the frontend-builder agent to build the Production Board" |
| 3 | `frontend-builder` | dnd-kit integration, dialog components | "Use the frontend-builder agent to add drag-and-drop to the board" |
| 4A | `frontend-builder` | Job Detail page with all sections | "Use the frontend-builder agent to build the Job Detail Command Center" |
| 4B | `frontend-builder` | Jobs List DataTable | "Use the frontend-builder agent to build the Jobs List page" |
| 5 | `frontend-builder` + `design-auditor` | Integration + final audit | Builder for code, then "Use the design-auditor agent to audit all Jobs screens" |

### Skill Usage

| Skill | When | Purpose |
|-------|------|---------|
| `screen-builder` | Waves 2–5 | Preloaded by frontend-builder. Provides templates, checklists, design token reference |
| `quality-gate` | End of Waves 2–5 | Preloaded by frontend-builder. 10-category audit with pass/fail per category |
| `design-audit` | End of Waves 2, 5 | Preloaded by design-auditor. 15-dimension deep audit with phased refinement plan |
| `breadboarding` | N/A (already complete) | Was used pre-build to create `docs/breadboards/jobs-breadboard.md` |

### Subagents vs Teams

- **Sequential subagents**: Use within each wave session for dependent work (e.g., build shared components → then build page that uses them). The frontend-builder handles this naturally.
- **Teams (parallel worktrees)**: Use ONLY for Wave 4 where Job Detail (4A) and Jobs List (4B) are fully independent. Two separate worktrees, two separate branches, two separate ports.
- **Design auditor as checkpoint**: Invoke as a read-only subagent at end of Wave 2 and Wave 5. It produces an audit report; fixes are implemented by the main session's frontend-builder.

### When NOT to Use Subagents

- Wave 1 (foundation): Single session, no UI, no need for frontend-builder agent
- Within a single component build: Don't spawn a subagent for each component — build them sequentially in one session
- For simple utility functions: Build inline, don't delegate

---

## 6. Quality Gate Protocol

After **each wave**, run these checks in order:

### Build Checks (Automated)

| # | Check | Command | Must Pass |
|---|-------|---------|-----------|
| 1 | TypeScript | `npx tsc --noEmit` | Yes |
| 2 | ESLint | `npm run lint` | Yes |
| 3 | Build | `npm run build` | Yes |
| 4 | Tests | `npm test` | Yes (especially Wave 1) |

### Visual Checks (Manual)

| # | Check | How | When |
|---|-------|----|------|
| 5 | Card design | Compare rendered cards to breadboard card mockup | Waves 2, 3 |
| 6 | Board layout | Verify 2 sections × 5 lanes, correct data in each lane | Waves 2, 3 |
| 7 | Detail sections | Verify all 7 sections render with correct data | Wave 4A |
| 8 | Table columns | Verify all columns render with correct data + sort/filter | Wave 4B |
| 9 | Responsive | Verify desktop + tablet widths (board, list, detail) | All waves |

### Cross-Link Checks

| # | Check | How | When |
|---|-------|----|------|
| 10 | Route references | `grep -r "/jobs" --include="*.tsx"` — verify all resolve | All waves |
| 11 | Breadcrumbs | Navigate each page, verify trail matches APP_FLOW | All waves |
| 12 | Cross-vertical links | Click quote/invoice/customer links from job detail | Wave 5 |

### Accessibility Checks

| # | Check | How | When |
|---|-------|----|------|
| 13 | ARIA labels | Inspect DOM for lanes, cards, drag handles, checkboxes | Waves 2, 5 |
| 14 | Keyboard navigation | Tab through pages, verify focus order and interaction | Waves 2, 5 |
| 15 | Focus management | Verify dialogs trap focus, return focus on close | Waves 3, 5 |

### Design System Compliance

| # | Check | How | When |
|---|-------|----|------|
| 16 | Colors from tokens only | `grep` for hardcoded hex values in new files | All waves |
| 17 | Lucide icons only | No emoji icons, no custom SVGs | All waves |
| 18 | Inter font | No other fonts used in UI text | All waves |
| 19 | Tailwind spacing | No hardcoded px values | All waves |

### Formal Audits

| Checkpoint | Agent | Output |
|-----------|-------|--------|
| End of Wave 2 | `design-auditor` | `agent-outputs/jobs/wave-2-board-audit.md` |
| End of Wave 5 | `design-auditor` | `agent-outputs/jobs/wave-5-final-audit.md` |

---

## 7. Review Process

### After Each Wave

1. **Run quality gate** (Section 6) — all checks must pass
2. **Fix failures** — issues found during quality gate are fixed in the same wave before moving on
3. **Commit** — stage specific files, commit with descriptive message
4. **Push** — `git push -u origin <branch>`
5. **Create/update PR** — `gh pr create` with wave description

### Bug & Issue Tracking

- **Quality gate failures**: Fix immediately, in the same wave
- **Design audit findings**: Critical items fixed in current wave; Refinement/Polish items can be deferred to Wave 5
- **Cross-vertical issues**: If a bug is found in quoting/invoicing/customer pages, create a GitHub issue — do NOT fix in the jobs branch
- **Phase 2 items**: Discovered during build → create a GitHub issue labeled "Phase 2"

### Learning Capture

- **CLAUDE.md Lessons Learned**: Update if a new pattern is discovered (e.g., dnd-kit gotchas, board state management patterns)
- **Auto-memory**: Update memory files for cross-session patterns
- **Breadboard validation**: If breadboard affordances were wrong or missing, note in session context for future breadboard improvements

### User Review Points

| Checkpoint | What User Reviews | When |
|-----------|-------------------|------|
| End of Wave 2 | Production Board visual design, card layout, filter UX | After Wave 2 PR |
| End of Wave 5 | Complete vertical: board + list + detail, cross-links, accessibility | After Wave 5 PR |

---

## 8. PR Strategy

### Branch Naming

| Wave | Branch Name | Base |
|------|-----------|------|
| 1 | `session/0212-jobs-w1-foundation` | `main` |
| 2 | `session/0212-jobs-w2-board-core` | `main` |
| 3 | `session/0212-jobs-w3-board-dnd` | `main` |
| 4A | `session/0212-jobs-w4a-job-detail` | `main` |
| 4B | `session/0212-jobs-w4b-jobs-list` | `main` |
| 5 | `session/0212-jobs-w5-integration` | `main` |

**NOT stacked** — each wave merges to main independently. This means each wave must be mergeable without the others (except for data dependencies handled by Wave 1 merging first).

### Merge Order

Strict sequential merge: Wave 1 → Wave 2 → Wave 3 → Wave 4A + 4B (either order) → Wave 5

Wave 4A and 4B can merge in either order since they don't conflict (different files). Wave 5 must merge last since it touches files from all previous waves.

### PR Description Template

```markdown
## Wave N: [Wave Name]

### What was built
- [Component/feature list]

### Breadboard coverage
- UI affordances: [X/Y] implemented
- Code affordances: [X/Y] implemented

### Quality gate
- tsc: ✅
- lint: ✅
- build: ✅
- tests: ✅
- Design audit: [Pass / N/A]

### Files changed
- [List of new/modified files]

### Screenshots
[If visual changes]

---
🤖 Generated with [Claude Code](https://claude.com/claude-code)
````

### Hot File Protocol

**NEVER commit on feature branches**:

- `PROGRESS.md` — update on main after PR merge
- `for_human/index.html` — auto-generated, never hand-edit
- `for_human/README.md` — auto-generated, never hand-edit

**After each PR merges to main**:

1. Pull latest main: `git -C ~/Github/mokumo pull origin main`
2. Update PROGRESS.md on main
3. Run `npm run gen:index` (on main only)

### for_human Doc

Create `for_human/2026-02-12-jobs-vertical-build.html` in Wave 5 (or as a separate commit on main after all waves merge). Include:

- Tags: Feature (green), Build (green)
- Session resume command
- Links to all 5 PRs
- Summary of what was built
- Related sessions: link to `for_human/2026-02-12-jobs-vertical-discovery.html`

---

## 9. Risk Register

| #   | Risk                                                                                                                          | Likelihood | Impact | Mitigation                                                                                                                                                                  |
| --- | ----------------------------------------------------------------------------------------------------------------------------- | ---------- | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **dnd-kit 2-section board complexity** — Two droppable rows sharing 5 lane columns may require complex ID management          | Medium     | High   | Spike if stuck after 2 hours. Fallback: build single-section board first (Jobs only), add Quotes row later. Use composite droppable IDs: `{section}-{lane}`                 |
| 2   | **Board performance with many cards** — Rendering 15-20 cards across 10 lane cells may cause re-render issues                 | Low        | Medium | Keep mock data to 15-20 total cards. Use `useMemo` for filtered cards. React.memo on card components. Virtualize lanes if needed (Phase 2)                                  |
| 3   | **Cross-vertical breakage** — Modifying mock data structure could break existing quoting/invoicing pages                      | Medium     | High   | Keep old `productionStateEnum` exported for backward compatibility. Run full `npm run build` after Wave 1 to catch breaks early. Do NOT modify quoting/invoicing components |
| 4   | **Schema migration breaks existing tests** — Rewriting job schema changes mock data shape, breaking dashboard and other tests | Medium     | Low    | Update `job.test.ts` in Wave 1 before any UI work. Old mock data replaced entirely. Run all 314+ tests after Wave 1                                                         |
| 5   | **Task state management complexity** — Managing task toggle + progress recomputation + system note generation in client state | Medium     | Medium | Keep tasks as simple array on job state. No separate task store. Pure functional state updates. Compute progress from tasks array on each render via useMemo                |
| 6   | **Wave 4 parallel merge conflicts** — Two branches modifying `_components/` simultaneously                                    | Low        | Low    | Waves 4A and 4B create different files in the same directory. No shared file modifications. Merge one first, then rebase the other if needed                                |
| 7   | **shadcn/ui progress component missing** — TaskProgressBar may need the `progress` shadcn component                           | Low        | Low    | Check during Wave 2. If needed: `npx shadcn@latest add progress`. If not available, build a simple div-based bar                                                            |
| 8   | **dnd-kit package not in project** — May need to install                                                                      | Low        | Low    | Check `package.json` at start of Wave 3. Install if needed: `npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities`                                                |

---

## 10. Schema Changes Manifest

### Files Changed

| File                                         | Action            | Summary                                                                                                                                                                                                                                                                                                                                                                                                       |
| -------------------------------------------- | ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `lib/schemas/job.ts`                         | **MAJOR REWRITE** | Replace 37-line minimal schema with full lane-based model. New enums: `laneEnum`, `riskLevelEnum`, `jobNoteTypeEnum`. New sub-schemas: `jobTaskSchema`, `jobNoteSchema`, `jobHistoryEntrySchema`, `garmentDetailSchema`, `jobPrintLocationSchema`, `jobComplexitySchema`. Main schema expands from 10 fields to 30+ fields. Keep `productionStateEnum` and `priorityEnum` exported for backward compatibility |
| `lib/schemas/scratch-note.ts`                | **NEW**           | Simple schema: id (uuid), content (string.min(1)), createdAt (datetime), isArchived (boolean, default false). Type export: `ScratchNote`                                                                                                                                                                                                                                                                      |
| `lib/schemas/board-card.ts`                  | **NEW**           | Discriminated union on "type": scratch_note, quote, job. View model — not stored, projected from underlying entities. Each variant has fields needed for card rendering only                                                                                                                                                                                                                                  |
| `lib/constants.ts`                           | **UPDATE**        | Add: `LANE_LABELS`, `LANE_COLORS`, `LANE_BADGE_COLORS` (Record<Lane, string>), `RISK_LABELS`, `RISK_COLORS`, `SERVICE_TYPE_BORDER_COLORS`, `SERVICE_TYPE_ICONS`, `CANONICAL_TASKS` (Record<ServiceType, TaskTemplate[]>)                                                                                                                                                                                      |
| `lib/mock-data.ts`                           | **UPDATE**        | Replace `jobs` array (6 old-model jobs → 10-12 new-model jobs with tasks, history, notes). Add `quoteBoardCards` array (5-6). Add `scratchNotes` array (2-3). Add helper functions. Keep all other mock data unchanged                                                                                                                                                                                        |
| `lib/helpers/job-utils.ts`                   | **NEW**           | Utility functions: `computeRiskLevel()`, `computeTaskProgress()`, `computeCapacitySummary()`, `computeFilteredCards()`, `getPreviousLane()`                                                                                                                                                                                                                                                                   |
| `lib/schemas/__tests__/job.test.ts`          | **MAJOR REWRITE** | Rewrite all tests for new schema structure                                                                                                                                                                                                                                                                                                                                                                    |
| `lib/schemas/__tests__/scratch-note.test.ts` | **NEW**           | Tests for scratch note schema                                                                                                                                                                                                                                                                                                                                                                                 |
| `lib/schemas/__tests__/board-card.test.ts`   | **NEW**           | Tests for board card discriminated union                                                                                                                                                                                                                                                                                                                                                                      |

### Backward Compatibility

The old `productionStateEnum` ("design", "approval", "burning", "press", "finishing", "shipped") must remain exported from `job.ts` because the dashboard currently references it. The dashboard will be updated to use lane-based logic in Wave 5, at which point `productionStateEnum` can be deprecated (but not removed — other verticals may reference it).

---

## 11. Component Build Manifest

### Shared Components (New — `components/features/`)

| Component        | File Path                                  | Wave | Complexity | Dependencies                                                                                           | Breadboard Affordances |
| ---------------- | ------------------------------------------ | ---- | ---------- | ------------------------------------------------------------------------------------------------------ | ---------------------- |
| ServiceTypeBadge | `components/features/ServiceTypeBadge.tsx` | 2    | Low        | `SERVICE_TYPE_LABELS`, `SERVICE_TYPE_BORDER_COLORS`, `SERVICE_TYPE_ICONS` from constants, Lucide icons | U16, U27, U63, U72     |
| RiskIndicator    | `components/features/RiskIndicator.tsx`    | 2    | Low        | `RISK_LABELS`, `RISK_COLORS` from constants                                                            | U21, U65, U78          |
| LaneBadge        | `components/features/LaneBadge.tsx`        | 2    | Low        | `LANE_LABELS`, `LANE_BADGE_COLORS` from constants                                                      | U64, U79               |
| TaskProgressBar  | `components/features/TaskProgressBar.tsx`  | 2    | Low        | shadcn/ui `progress` (or custom div bar)                                                               | U22, U66, U87          |

### Shared Components (Extended)

| Component   | File Path                             | Wave | Change                                                                    | Breadboard Affordances |
| ----------- | ------------------------------------- | ---- | ------------------------------------------------------------------------- | ---------------------- |
| StatusBadge | `components/features/StatusBadge.tsx` | 2    | Extend for lane status variants (if needed — may be handled by LaneBadge) | —                      |

### Vertical-Specific Components (`app/(dashboard)/jobs/_components/`)

| Component             | File Path                                      | Wave | Complexity | Dependencies                                                                                     | Breadboard Affordances |
| --------------------- | ---------------------------------------------- | ---- | ---------- | ------------------------------------------------------------------------------------------------ | ---------------------- |
| CapacitySummaryBar    | `…/jobs/_components/CapacitySummaryBar.tsx`    | 2    | Low        | computeCapacitySummary, Card from shadcn                                                         | U1–U3, N1              |
| BoardFilterBar        | `…/jobs/_components/BoardFilterBar.tsx`        | 2    | Medium     | Select, Button from shadcn, useSearchParams                                                      | U4–U8, N2–N6, S1–S5    |
| BoardSection          | `…/jobs/_components/BoardSection.tsx`          | 2    | Medium     | BoardLane, card components                                                                       | —                      |
| BoardLane             | `…/jobs/_components/BoardLane.tsx`             | 2    | Medium     | Collapsible from shadcn, droppable (Wave 3)                                                      | U12–U15, U43           |
| JobBoardCard          | `…/jobs/_components/JobBoardCard.tsx`          | 2    | Medium     | ServiceTypeBadge, RiskIndicator, TaskProgressBar                                                 | U16–U26                |
| QuoteBoardCard        | `…/jobs/_components/QuoteBoardCard.tsx`        | 2    | Medium     | ServiceTypeBadge                                                                                 | U27–U34                |
| ScratchNoteCard       | `…/jobs/_components/ScratchNoteCard.tsx`       | 2    | Low        | —                                                                                                | U35–U38                |
| BlockReasonDialog     | `…/jobs/_components/BlockReasonDialog.tsx`     | 3    | Low        | AlertDialog from shadcn, Textarea                                                                | U48–U50, U115–U117     |
| MoveLaneDialog        | `…/jobs/_components/MoveLaneDialog.tsx`        | 3    | Low        | Dialog from shadcn, Select                                                                       | U51–U54                |
| ScratchNoteCapture    | `…/jobs/_components/ScratchNoteCapture.tsx`    | 3    | Low        | Popover or inline, Textarea                                                                      | U45–U47                |
| JobsDataTable         | `…/jobs/_components/JobsDataTable.tsx`         | 4B   | High       | ColumnHeaderMenu, ServiceTypeBadge, RiskIndicator, LaneBadge, TaskProgressBar, Table from shadcn | U55–U71, N17–N22       |
| JobHeader             | `…/jobs/_components/JobHeader.tsx`             | 4A   | Medium     | ServiceTypeBadge, RiskIndicator, LaneBadge                                                       | U72–U80                |
| QuickActionsBar       | `…/jobs/_components/QuickActionsBar.tsx`       | 4A   | Medium     | Button, DropdownMenu from shadcn                                                                 | U81–U86                |
| TaskChecklist         | `…/jobs/_components/TaskChecklist.tsx`         | 4A   | Medium     | TaskItem, AddCustomTaskInput, TaskProgressBar                                                    | U87–U93, N9, N28       |
| TaskItem              | `…/jobs/_components/TaskItem.tsx`              | 4A   | Low        | Checkbox from shadcn                                                                             | U89–U92                |
| AddCustomTaskInput    | `…/jobs/_components/AddCustomTaskInput.tsx`    | 4A   | Low        | Input from shadcn                                                                                | U118–U121              |
| JobDetailsSection     | `…/jobs/_components/JobDetailsSection.tsx`     | 4A   | Low        | —                                                                                                | U94–U98                |
| NotesFeed             | `…/jobs/_components/NotesFeed.tsx`             | 4A   | Medium     | NoteItem, Tabs from shadcn, Textarea                                                             | U99–U106, N29, N31     |
| NoteItem              | `…/jobs/_components/NoteItem.tsx`              | 4A   | Low        | Badge from shadcn                                                                                | U103–U105              |
| LinkedEntitiesSection | `…/jobs/_components/LinkedEntitiesSection.tsx` | 4A   | Low        | —                                                                                                | U107–U110              |
| BlockReasonBanner     | `…/jobs/_components/BlockReasonBanner.tsx`     | 4A   | Low        | Button from shadcn                                                                               | U111–U113              |

### Page Components

| Page            | File Path                             | Wave | Complexity | Contains                                                                                                          |
| --------------- | ------------------------------------- | ---- | ---------- | ----------------------------------------------------------------------------------------------------------------- |
| ProductionBoard | `app/(dashboard)/jobs/board/page.tsx` | 2    | High       | CapacitySummaryBar, BoardFilterBar, BoardSection × 2, header actions, breadcrumb                                  |
| JobDetailView   | `app/(dashboard)/jobs/[id]/page.tsx`  | 4A   | High       | JobHeader, QuickActionsBar, TaskChecklist, JobDetailsSection, NotesFeed, LinkedEntitiesSection, BlockReasonBanner |
| JobsList        | `app/(dashboard)/jobs/page.tsx`       | 4B   | Medium     | JobsDataTable, toolbar, breadcrumb                                                                                |

### Utility Files

| File                       | Wave | Contents                                                                                             |
| -------------------------- | ---- | ---------------------------------------------------------------------------------------------------- |
| `lib/helpers/job-utils.ts` | 2    | computeRiskLevel, computeTaskProgress, computeCapacitySummary, computeFilteredCards, getPreviousLane |

**Total**: 4 shared + 27 vertical-specific + 3 pages + 1 utility = **35 files** (31 components + 4 supporting)

---

## 12. Cross-Vertical Integration Checklist

Every touchpoint that must be verified before the vertical is complete:

### Quoting → Jobs

- [ ] Quote cards appear on board in Quotes row (correct lanes based on status)
- [ ] Click quote card → `/quotes/[id]` (navigates correctly)
- [ ] "Create Job from Quote" button visible on accepted quotes in Done lane
- [ ] Clicking "Create Job from Quote" creates job with inherited data + canonical tasks
- [ ] New job appears in Jobs Ready lane on board
- [ ] Toast confirms: "Job J-XXXX created from Quote Q-XXXX"
- [ ] Job detail "View Quote" → `/quotes/[quoteId]` (navigates correctly)
- [ ] Scratch note "Create Quote from this" → `/quotes/new` with note content

### Invoicing → Jobs

- [ ] Job cards in Done lane show payment status badge if invoice exists
- [ ] Badge shows correct status (Paid / Partial / Sent / Draft)
- [ ] Job detail "View Invoice" → `/invoices/[invoiceId]` (navigates correctly)
- [ ] Job detail Linked Entities section shows invoice reference with status

### Customer Management → Jobs

- [ ] Customer name links on board cards → `/customers/[customerId]`
- [ ] Job detail customer name link → `/customers/[customerId]`
- [ ] Job detail primary contact info displays correctly (from customer mock data)
- [ ] Click-to-copy on email and phone works with toast

### Dashboard → Jobs

- [ ] Dashboard summary cards use lane-based counts (Blocked, In Progress, At Risk, Total)
- [ ] Dashboard "Needs Attention" shows blocked jobs with block reason + service type
- [ ] Dashboard "In Progress" shows active jobs with task progress + risk indicator
- [ ] Dashboard "View Board" link → `/jobs/board`
- [ ] Dashboard job row clicks → `/jobs/[id]`

### Navigation

- [ ] Sidebar "Jobs" → `/jobs/board` (board is primary)
- [ ] Board view toggle → `/jobs` (list)
- [ ] List view toggle → `/jobs/board` (board)
- [ ] Job detail breadcrumb: Dashboard > Jobs > J-1024
- [ ] Board breadcrumb: Dashboard > Jobs > Board
- [ ] List breadcrumb: Dashboard > Jobs
- [ ] Job detail back navigation → `/jobs`

---

## 13. Definition of Done

The Jobs & Production vertical is **COMPLETE** when ALL of the following are true:

### Functional Completeness

- [ ] **Production Board** (`/jobs/board`): 2 sections × 5 lanes, 3 card types, drag-and-drop, 5 filters, capacity bar, scratch note capture, block/unblock flow
- [ ] **Jobs List** (`/jobs`): DataTable with all columns, search, 3 filter dropdowns, sort, quick actions, responsive
- [ ] **Job Detail** (`/jobs/[id]`): All 7 sections functional (Header, Quick Actions, Tasks, Details, Notes, Linked Entities, Block Banner)
- [ ] All CORE features from scope definition have passing acceptance criteria
- [ ] All PERIPHERAL features are present (capacity bar, assignee display, done lane collapse, quote-to-job conversion)
- [ ] All INTERCONNECTION touchpoints verified (quotes on board, invoice status, customer links, dashboard updates)

### Quality Gates

- [ ] `npm run build` passes
- [ ] `npx tsc --noEmit` passes
- [ ] `npm run lint` passes
- [ ] `npm test` passes (including all new schema tests)
- [ ] Design auditor produces a passing report (0 Critical/Fail items)
- [ ] 10/10 quality gate categories pass (visual hierarchy, spacing, typography, color, interactive states, icons, motion, empty/error states, accessibility, density)

### States

- [ ] Empty states designed for: all board lanes, board (all empty), list (no jobs), list (no search results), detail (no tasks, no notes, no linked entities)
- [ ] Error state: invalid job ID → "Job not found" page
- [ ] Block state: block reason banner shows on detail, card in Blocked lane on board

### Accessibility

- [ ] ARIA labels on lanes, cards, drag handles, checkboxes, filters, breadcrumbs
- [ ] Keyboard navigation: Tab to interactive elements, Enter to activate, Escape to close dialogs
- [ ] Focus management: dialogs trap focus, return focus on close
- [ ] 4.5:1 contrast minimum on all text

### Documentation

- [ ] All PRs merged to main
- [ ] PROGRESS.md updated on main
- [ ] for_human doc created
- [ ] `npm run gen:index` run on main

---

## 14. Post-Build Actions

After the Jobs vertical is complete and all PRs are merged:

1. **Update PROGRESS.md on main**:
   - Add "Jobs & Production Vertical" to "What's Built" with details
   - Update "Next Actions" — remove jobs, add next vertical
   - Update stats (test count, schema count, etc.)

2. **Create for_human doc**:
   - `for_human/2026-02-12-jobs-vertical-build.html`
   - Tags: Feature (green), Build (green)
   - Include session resume commands for all waves
   - Link to all PRs
   - Related sessions: link to discovery doc

3. **Run `npm run gen:index`** on main (regenerates for_human index)

4. **Update IMPLEMENTATION_PLAN.md**:
   - Mark Jobs steps as complete (Steps 2, 3, 4 in current plan)
   - Update current_step
   - Note that jobs now uses universal lanes instead of 6-stage pipeline

5. **Doc-sync pass**:
   - Verify APP_FLOW matches built screens
   - Verify PRD features marked as built
   - Check for any stale references to old production states in docs

6. **Create GitHub issues for Phase 2 items** discovered during build:
   - Job editing form (`/jobs/[id]/edit`)
   - Within-lane card reordering
   - Keyboard shortcuts (T, 1-5, N, F, ?)
   - Automation rules (task completion → lane transition)
   - What-if date picker
   - Overbooking warnings with historical data
   - End-of-day productivity summary
   - Real-time multi-user sync
   - Board configuration settings page

7. **Demo to user**:
   - Walk through all 3 screens
   - Show board with filters and drag-and-drop
   - Show job detail with task management and notes
   - Show cross-vertical links (quote → job → invoice)
   - Collect feedback for Phase 2 priorities

---

## Related Documents

- `docs/strategy/jobs-scope-definition.md` — CORE/PERIPHERAL/INTERCONNECTION features, schema changes, acceptance criteria
- `docs/strategy/jobs-improved-journey.md` — 10 design principles, board architecture, card design
- `docs/breadboards/jobs-breadboard.md` — 126 UI affordances, 34 code affordances, 28 data stores, 31 components
- `docs/APP_FLOW.md` — Page-level details for Production Board, Jobs List, Job Detail
- `docs/competitive-analysis/jobs-vertical-synthesis.md` — Competitive insights
- `docs/AGENTS.md` — Agent registry, orchestration patterns
- `CLAUDE.md` — Session protocol, design system, quality checklist
