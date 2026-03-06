---
title: 'Jobs & Production Vertical — Scope Definition'
description: "What we'll build (CORE), what we'll mock (PERIPHERAL), what we'll minimize (INTERCONNECTIONS) for the production board, jobs list, and job detail"
category: strategy
status: complete
phase: 1
vertical: jobs-production
created: 2026-02-12
last-verified: 2026-02-12
depends-on:
  - docs/competitive-analysis/jobs-vertical-synthesis.md
  - docs/competitive-analysis/jobs-journey-map.md
  - docs/strategy/jobs-improved-journey.md
---

# Jobs & Production Vertical — Scope Definition

**Purpose**: Define boundaries for the Jobs/Production mockup in Mokumo
**Status**: Complete (finalized after competitive analysis + user interview + improved journey design)
**Depends on**: Printavo + PrintLife analysis (complete), user interview (complete), improved journey design (complete)

---

## Design Philosophy

> "The board is the single source of truth. Today is a filter, not a separate dashboard."

The production board replaces wall calendars, memory, and disconnected tools with a unified view that answers two questions in 5 seconds:

1. **What do I work on today?** (Today filter, start-date-based)
2. **What's at risk?** (Due date risk indicators, blocked lane, capacity summary)

### Key Principles (From Discovery)

- **Universal lanes, not per-service lanes** — Ready/In Progress/Review/Blocked/Done works for all service types
- **Service type is the primary visual** — color + icon, instantly scannable across the board
- **Cards are command centers** — task checklists, action buttons, history feed, links to related entities
- **Quick capture over forced structure** — scratch notes for lightweight logging
- **Guardrails, not gates** — quality checkpoints that help without burdening
- **Conservative warnings only** — flag overbooking only when highly confident, never false positives
- **Two horizontal sections** — Quotes row and Jobs row share the same vertical lanes

---

## Terminology

| Term                    | Definition                                                                          | Phase               |
| ----------------------- | ----------------------------------------------------------------------------------- | ------------------- |
| **Board Card**          | Universal entity on the board. Can be a scratch note, quote, or job.                | **Phase 1**         |
| **Lane**                | Vertical column on the board: Ready, In Progress, Review, Blocked, Done             | **Phase 1**         |
| **Row Section**         | Horizontal board division: Quotes (top) and Jobs (bottom)                           | **Phase 1**         |
| **Service Type**        | Screen Printing, DTF, or Embroidery — color-coded on every card                     | **Phase 1**         |
| **Canonical Tasks**     | Default task checklist per service type, auto-populated on job creation             | **Phase 1**         |
| **Scratch Note**        | Lightweight quick capture — text only, lives in Ready lane of Quotes row            | **Phase 1**         |
| **Risk Indicator**      | Color-coded dot on card based on due date proximity vs remaining work               | **Phase 1**         |
| **Block Reason**        | Text explanation of why a card is in the Blocked lane                               | **Phase 1**         |
| **What-If Date Picker** | Tool to visualize work landscape between now and a potential due date               | **Phase 2**         |
| **Capacity Summary**    | Aggregate stats above the board (rush count, total quantity, due date distribution) | **Phase 1** (basic) |

---

## CORE Features (Must Build)

These workflows are critical to demonstrating the production board experience. Fully functional in the mockup.

### Production Board (`/jobs/board`)

**Purpose**: The primary production view — two-section Kanban with universal lanes, replacing wall calendars and memory

**Layout**:

```text
              Ready       In Progress    Review       Blocked       Done
           ┌───────────┬──────────────┬───────────┬──────────────┬───────────┐
  Quotes   │ cards...  │  cards...    │ cards...  │  cards...    │ cards...  │
           ├───────────┼──────────────┼───────────┼──────────────┼───────────┤
  Jobs     │ cards...  │  cards...    │ cards...  │  cards...    │ cards...  │
           └───────────┴──────────────┴───────────┴──────────────┴───────────┘
```

**Features**:

- [ ] Two horizontal sections: Quotes row (top) and Jobs row (bottom)
- [ ] Five universal lanes: Ready, In Progress, Review, Blocked, Done
- [ ] Lane headers with card counts per section
- [ ] Drag-and-drop cards between lanes (within same row — quotes stay in quotes, jobs stay in jobs)
- [ ] Cards display: service type color + icon, customer + job name, quantity + complexity, due date + risk dot, task progress bar
- [ ] Filter bar above board:
  - **Today**: Filters to cards with start date <= today and not yet done
  - **Service Type**: Screen Printing / DTF / Embroidery (multi-select)
  - **Section**: All / Quotes Only / Jobs Only
  - **Risk**: All / At Risk / Blocked
- [ ] Basic capacity summary bar above filters: Rush orders count, total quantity, card count by lane
- [ ] "+" button in Quotes Ready lane: Opens scratch note quick capture
- [ ] "New Quote" button: Navigates to `/quotes/new`
- [ ] View toggle: Board | List (links to `/jobs`)
- [ ] Board is the default landing from sidebar "Jobs" link
- [ ] Time horizon selector: 1 week / 2 weeks (default) / 1 month — filters cards by due date window
- [ ] Done lane auto-collapses to save space (expandable)
- [ ] Breadcrumb: Dashboard > Jobs > Board

**Card Design (Closed — On Board)**:

```text
┌──────────────────────────────────┐
│ 🟢 Screen Printing    [JD]      │  ← Service type color + icon, Assignee initials
│                                  │
│ Acme Corp — Company Tees         │  ← Customer + Job nickname
│ 200 shirts · 2 locations         │  ← Quantity + complexity indicator
│                                  │
│ Due: Feb 14 ●                    │  ← Due date, risk dot (green/orange/red)
│ ████████░░ 6/8 tasks             │  ← Task completion progress bar
└──────────────────────────────────┘
```

**Risk Indicator Logic**:

- No dot = on track (> 3 days buffer)
- Orange dot = getting tight (estimated work approaches remaining time)
- Red dot = at risk (estimated work > remaining time) or overdue

**Acceptance Criteria**:

- Can see all active quotes and jobs organized by lane
- Can drag cards between lanes (same row only)
- Can filter by Today, Service Type, Section, Risk
- Cards show service type, customer, quantity, due date, risk, task progress at a glance
- Can quick-capture a scratch note from the board
- Time horizon selector filters cards by due date window
- Board loads with realistic mock data showing variety across all lanes

**Quality Checklist**:

- [ ] Visual hierarchy: Lane headers clear, card content scannable in 2 seconds
- [ ] Spacing: Cards have consistent padding, lanes have clear separation
- [ ] Typography: Customer name prominent, metadata secondary, progress bar minimal
- [ ] Color: Service type left-border color (blue = screen print, gold = DTF, green = embroidery). Risk dots only when needed.
- [ ] Interactive states: Cards have hover lift, drag preview, lane drop target highlight
- [ ] Empty states: Empty lanes show subtle "No cards" placeholder
- [ ] Keyboard: Tab to cards, arrow keys within lane, Enter to open card detail
- [ ] Accessibility: ARIA labels on lane headers, card roles, drag handles

---

### Jobs List (`/jobs`)

**Purpose**: Alternative list/table view of all jobs — sortable, filterable, useful for bulk operations and detailed filtering

**Features**:

- [ ] DataTable display with columns: Job #, Service Type (icon + label), Customer, Job Name, Quantity, Due Date, Lane, Risk, Task Progress
- [ ] Search by customer name, job name, or job number (URL query param)
- [ ] Filter by:
  - Lane: All, Ready, In Progress, Review, Blocked, Done
  - Service Type: Screen Printing, DTF, Embroidery
  - Risk: All, At Risk, On Track
- [ ] Sort by clicking column headers (due date default sort)
- [ ] Click row → navigate to `/jobs/[id]`
- [ ] View toggle: List | Board (links to `/jobs/board`)
- [ ] "New Job" button (creates a job directly — for cases not flowing from quotes)
- [ ] Empty state: "No jobs yet — jobs will appear here when quotes are accepted"
- [ ] Quick actions per row: Move Lane, Mark Blocked/Unblock, View Detail
- [ ] Breadcrumb: Dashboard > Jobs

**Acceptance Criteria**:

- Can search for jobs by customer name, job name, or number
- Can filter by lane, service type, and risk
- Can sort by any column
- Clicking job opens detail view
- View toggle switches to board view

**Quality Checklist**:

- [ ] Visual hierarchy: Service type icon + color immediately visible per row
- [ ] Spacing: Tailwind tokens only
- [ ] Typography: Max 3 sizes (header, body, small metadata)
- [ ] Color: Service type color on icon, risk dot in Due Date column, lane badges color-coded
- [ ] Interactive states: All rows have hover state, sort indicators on active column
- [ ] Keyboard: Tab to row, Enter to open, arrow keys to navigate

---

### Job Detail / Command Center (`/jobs/[id]`)

**Purpose**: Full view of a single job — the "command center" where Gary manages all aspects of a production job

**Layout**: Full-width page with structured sections

**Header Section**:

- [ ] Service type icon + color bar (prominent)
- [ ] Customer name + company (linked to `/customers/[id]`)
- [ ] Job name/nickname + Job number
- [ ] Primary contact: name, email, phone (click to copy)
- [ ] Date row: Due Date + Start Date + Created Date
- [ ] Risk indicator with label (On Track / Getting Tight / At Risk)
- [ ] Current lane badge (Ready / In Progress / Review / Blocked / Done)
- [ ] Breadcrumb: Dashboard > Jobs > J-1024

**Quick Actions Bar**:

- [ ] "Move Lane →" dropdown (next logical lane, with all options)
- [ ] "Mark Blocked" / "Unblock" toggle (opens block reason input when blocking)
- [ ] "View Quote" button (links to source quote if exists)
- [ ] "View Invoice" button (links to linked invoice if exists)
- [ ] "Edit Job" button (edit mode for job details)
- [ ] Overflow menu: Archive, Duplicate, Print Summary (Phase 2)

**Tasks Section**:

- [ ] Canonical task checklist (auto-populated per service type)
- [ ] Checkbox per task — click to complete/uncomplete
- [ ] Task details inline: e.g., "Screens burned (4 screens, 230 mesh)"
- [ ] Progress bar above task list (X/Y tasks complete)
- [ ] "Add Custom Task" button — adds user-defined task to the list
- [ ] Completed tasks show strikethrough with timestamp
- [ ] When all tasks complete: visual indicator "Ready for next lane"

**Details Section**:

- [ ] Quantity: total garment count
- [ ] Garment info: Brand + Style + Color + Size breakdown (S:10, M:50, L:80...)
- [ ] Print locations: Position + color count per location (Front 4-color, Back 1-color)
- [ ] Screen count (for screen printing jobs)
- [ ] Complexity indicators: location count, screen count, garment variety
- [ ] Service type + any special instructions

**Notes & History Section**:

- [ ] Chronological feed mixing three note types:
  - **[Internal]** — shop-only notes (Gary's observations, instructions)
  - **[Customer]** — notes from/about customer communication
  - **[System]** — auto-generated events (lane changes, task completions, created from quote)
- [ ] Each note: timestamp + author + content
- [ ] Quick-add note input at top of section
- [ ] Notes are tagged with visibility (internal/customer/system)
- [ ] Filter notes by type (All / Internal / Customer / System)

**Linked Entities Section**:

- [ ] Source quote: link to `/quotes/[id]` with quote total
- [ ] Linked invoice: link to `/invoices/[id]` with payment status
- [ ] Customer: link to `/customers/[id]`
- [ ] Attached files count (Phase 2: actual file management)

**Block Reason Display**:

- [ ] When lane = Blocked: prominent banner showing block reason
- [ ] Block timestamp and who blocked it
- [ ] "Unblock" button to move back to previous lane

**Acceptance Criteria**:

- Shows complete job information in organized sections
- Can check/uncheck tasks and see progress update
- Can move job between lanes via Quick Actions
- Can mark blocked with reason, can unblock
- Notes feed shows chronological history
- Linked entities navigate to correct detail pages
- Invalid job ID shows "Job not found" with link to jobs list

**Quality Checklist**:

- [ ] Visual hierarchy: Service type color + job name most prominent, actions accessible
- [ ] Spacing: Clear section separation, consistent card-style sections
- [ ] Typography: Section headers distinct, note content readable, metadata subtle
- [ ] Color: Service type accent, risk indicators, lane badge colors
- [ ] Interactive states: Task checkboxes responsive, action buttons with hover/active
- [ ] Empty states: Each section handles empty gracefully ("No notes yet", etc.)
- [ ] Accessibility: Task checkboxes labeled, notes chronologically announced

---

### Scratch Note Quick Capture

**Purpose**: Lightweight "don't forget this" capture — minimum friction to log a new lead or request

**Features**:

- [ ] Triggered from "+" button on board (Quotes Ready lane)
- [ ] Opens inline card or small modal with single text field
- [ ] Minimum input: just a text note ("John called, 200 black tees, wants by Friday")
- [ ] Auto-placed in Quotes row → Ready lane
- [ ] Card type shows as "Scratch Note" with distinct visual (e.g., handwritten-style or sticky note aesthetic)
- [ ] Action button on scratch note card: "Create Quote from this" → navigates to `/quotes/new` with note content pre-filled in internal notes
- [ ] Scratch notes can be dismissed/archived without creating a quote

**Acceptance Criteria**:

- Can capture a note in < 5 seconds (type + Enter)
- Note appears immediately on board in Quotes Ready lane
- Can create a quote from a scratch note
- Can dismiss/archive scratch notes

---

### Canonical Task Lists (Per Service Type)

**Purpose**: Ensure no production step gets forgotten — auto-populated when a job is created

**Screen Printing Tasks** (8 steps):

1. Art files finalized
2. Film positives printed
3. Screens burned (mesh count: \_\_\_)
4. Screens registered on press
5. Blanks received and counted
6. Press run complete
7. QC inspection passed
8. Packed and labeled

**DTF Tasks** (6 steps):

1. Art files finalized
2. Gang sheet prepared
3. DTF printed
4. Transfers pressed (if applicable)
5. QC inspection passed
6. Packed and labeled

**Embroidery Tasks** (7 steps):

1. Art files finalized
2. Design digitized (stitch file created)
3. Digitizer machine set up
4. Blanks received and counted
5. Embroidery run complete
6. QC inspection passed
7. Packed and labeled

**Features**:

- [ ] Tasks auto-populate based on service type when job enters Ready lane
- [ ] Tasks can be skipped (unchecked) for repeat customers or simplified jobs
- [ ] Custom tasks can be added per job
- [ ] Tasks can be reordered within the list
- [ ] Task metadata: optional detail field (e.g., "230 mesh" for screen burn)
- [ ] All tasks complete → card shows "Ready for next lane" indicator

**Acceptance Criteria**:

- Creating a job with service type X auto-populates X's canonical tasks
- Can check/uncheck individual tasks
- Can add custom tasks
- Progress bar accurately reflects completed/total

---

### Review Lane (Quality Gate)

**Purpose**: Mandatory QC checkpoint before shipping — prevents the "shipped bad work twice" problem

**Features**:

- [ ] Review lane sits between In Progress and Done
- [ ] Jobs MUST pass through Review before Done (when Review lane is enabled)
- [ ] QC checklist in Review: final quality inspection items
- [ ] If QC fails → job returns to In Progress with system note explaining why
- [ ] Review lane enabled by default (configurable in settings, Phase 2)
- [ ] Review can also be used for customer sign-off on completed work

**Acceptance Criteria**:

- Dragging from In Progress → Done first lands in Review (when enabled)
- Can pass QC and move to Done
- Can fail QC and return to In Progress with a note
- Review lane shows clear "QC Checkpoint" purpose

---

## PERIPHERAL Features (Show in UI, Simplified or Non-Functional)

These features are nice-to-have but won't block the demo. Show them in UI so the journey feels complete.

### Capacity Summary Bar (Basic)

**Purpose**: Show aggregate production load at a glance

**Implementation**:

- [ ] Horizontal bar above the board filters
- [ ] Shows: Total cards count, Rush orders count, Total quantity (sum of all garment quantities), Cards by lane distribution
- [ ] Computed from visible (filtered) cards
- [ ] No predictive intelligence (that's Phase 2)
- [ ] Provides context for Gary's gut-level capacity decisions

---

### Quote-to-Job Conversion

**Purpose**: When a quote is accepted, create a corresponding job card

**Implementation**:

- [ ] "Create Job from Quote" button on accepted quote cards in Done lane
- [ ] Clicking creates a new Job card in Jobs row → Ready lane
- [ ] Job auto-inherits: customer, service type, quantity, garment details, print locations from quote
- [ ] Canonical tasks auto-populate based on service type
- [ ] Source quote linked on job detail
- [ ] Manual gate (not automatic) — Gary decides when to create the job
- [ ] Toast: "Job J-1034 created from Quote Q-1024"

---

### Assignee Display (Future-Proofed)

**Purpose**: Show who's assigned to a card — relevant as shops grow

**Implementation**:

- [ ] Initials badge in top-right corner of board cards
- [ ] Single assignee per card (displayed only, no assignment UI)
- [ ] Assignee shown from mock data — not user-assignable in Phase 1
- [ ] Initials derive from assignee name (e.g., "GS" for Gary Smith)
- [ ] **Don't build**: Assignment UI, team management, workload balancing

---

### Done Lane Auto-Collapse

**Purpose**: Keep the board focused on active work — completed cards should be out of the way

**Implementation**:

- [ ] Done lane shows collapsed by default (card count only)
- [ ] Click to expand and see completed cards
- [ ] Cards in Done for 7+ days auto-archive (removed from board, accessible in list view)
- [ ] Done cards still show payment status if invoice exists (paid / awaiting payment)

---

### Board-Level Keyboard Shortcuts

**Purpose**: Speed up board operations for power users

**Implementation**:

- [ ] `T` — Toggle Today filter
- [ ] `1-5` — Jump to lane (1=Ready, 2=In Progress, etc.)
- [ ] `N` — New scratch note
- [ ] `F` — Focus search/filter
- [ ] `?` — Show shortcuts overlay
- [ ] Non-functional in Phase 1 — show in keyboard shortcuts help dialog

---

## INTERCONNECTIONS (Minimal Representation)

These features touch other verticals but won't be fully built yet. Show them in UI to complete the journey.

### → Quoting: Quotes Row on Board

**Current State**: Quotes exist as a separate list at `/quotes`
**Board Integration**:

- [ ] Accepted quotes appear in Quotes row → Done lane with "New" badge
- [ ] Quotes in progress appear in appropriate lanes (Ready = new lead, In Progress = building quote, Blocked = waiting on customer)
- [ ] Quote cards on board show: customer, quantity estimate, due date, quote total
- [ ] Click quote card → opens quote detail at `/quotes/[id]`
- [ ] "Create Quote" action available from scratch notes
- [ ] **Don't rebuild**: Quote form or quote detail — reuse existing quoting vertical
- **Already built**: Quote list, quote detail, new quote form

### → Invoicing: Payment Status on Job Cards

**Current State**: Invoicing vertical is built with full list, detail, and forms
**Board Integration**:

- [ ] Job cards in Done lane show payment status badge if invoice exists (Paid / Partial / Sent / Draft)
- [ ] "View Invoice" quick action on job detail links to `/invoices/[id]`
- [ ] Job detail Linked Entities section shows invoice reference
- [ ] **Don't rebuild**: Invoice forms or invoice detail — link to existing invoicing vertical
- **Already built**: Invoice list, invoice detail, new invoice form, credit memos

### → Customer Management: Customer Links

**Current State**: Full customer management vertical exists
**Board Integration**:

- [ ] Card detail shows customer name + primary contact (click to navigate)
- [ ] Notes on job card can reference customer communication
- [ ] Quote-to-job conversion inherits customer from quote
- [ ] **Don't rebuild**: Customer pages — link to existing customer vertical
- **Already built**: Customer list, customer detail, contact hierarchy

### → Screen Room: Screen Tracking (Future)

**Current State**: Basic screen room exists at `/screens`
**Board Integration**:

- [ ] Screen printing job tasks reference screen preparation (task: "Screens burned")
- [ ] Job detail could link to screen records (Phase 2)
- [ ] **Don't build**: Screen room integration in this scope
- **Phase 2**: Screen room vertical will integrate with job tasks

### → Reporting: Production Analytics (Deferred)

**Current State**: No production analytics exist
**Preparation**:

- [ ] Job state transitions capture timestamps (history array on job schema)
- [ ] Done lane transitions record: quantity completed, date, service type
- [ ] Data model supports future: daily output, weekly averages, monthly trends
- [ ] **Don't build**: Reports, dashboards, analytics views
- **Phase 2**: Production analytics from inferred state transition data

---

## What We're Explicitly NOT Building

### What-If Date Picker

**Why**: Requires historical data and productivity baselines — Phase 2 feature after enough jobs have been completed to establish patterns.

### Overbooking Warnings (Intelligent)

**Why**: Requires tracked daily output averages vs queued work. Phase 1 provides the capacity summary bar as a manual alternative. Phase 2 adds intelligence.

### End-of-Day Productivity Summary

**Why**: Requires accumulated state transition data. The data model supports it, but the feature is Phase 2.

### Drag-and-Drop Reordering Within Lanes

**Why**: Reordering within a lane implies priority sequencing. Phase 1 uses due date sorting. Phase 2 adds manual priority ordering.

### Automation Rules

**Why**: "Task completion auto-triggers lane transition" requires careful UX. Phase 1 is manual lane changes with task progress as a visual guide. Phase 2 adds opt-in automation.

### Notification System (Email + In-App Bell)

**Why**: Requires backend for email sending and real-time events. Phase 1 mock doesn't need notifications. Phase 2 adds the notification bell + email triggers.

### Customer Portal Integration

**Why**: Customer-facing quote approval requires auth + portal. Phase 1 is shop-side only. Phase 2 connects to customer portal.

### Real-Time Multi-User Sync

**Why**: Single-user Phase 1 mockup. Phase 2+ handles concurrent board access.

### Board Configuration Settings

**Why**: Settings page for Review lane toggle, service type colors, canonical task editing, sprint horizon — all deferred to Phase 2. Phase 1 uses sensible defaults.

### Production Time Tracking

**Why**: Manual time logging is burdensome. Phase 2 infers time from state transitions automatically.

---

## Scope Summary

| Component                   | Scope           | Status                                                               |
| --------------------------- | --------------- | -------------------------------------------------------------------- |
| Production Board            | CORE            | Build fully (2 sections, 5 lanes, drag-drop, filters, capacity bar)  |
| Jobs List                   | CORE            | Build fully (table view, search, filter, sort, quick actions)        |
| Job Detail / Command Center | CORE            | Build fully (tasks, notes, actions, linked entities, block tracking) |
| Scratch Note Quick Capture  | CORE            | Build fully (quick text input, creates card on board)                |
| Canonical Task Lists        | CORE            | Build fully (3 service types, auto-populate, custom tasks)           |
| Review Lane (QC Gate)       | CORE            | Build fully (mandatory checkpoint, pass/fail, return to In Progress) |
| Board Card Design           | CORE            | Build fully (service type, customer, quantity, risk, progress)       |
| Due Date Risk Indicators    | CORE            | Build fully (no dot / orange / red logic)                            |
| Quote-to-Job Conversion     | PERIPHERAL      | "Create Job from Quote" button with auto-inherit                     |
| Capacity Summary Bar        | PERIPHERAL      | Basic stats (rush count, total qty, lane distribution)               |
| Assignee Display            | PERIPHERAL      | Initials badge on cards (display only, not assignable)               |
| Done Lane Auto-Collapse     | PERIPHERAL      | Collapsed by default, expandable                                     |
| Keyboard Shortcuts          | PERIPHERAL      | Listed in help dialog, not all functional                            |
| Quotes on Board             | INTERCONNECTION | Quote cards in Quotes row, linked to quoting vertical                |
| Invoice Status on Jobs      | INTERCONNECTION | Payment badge on Done cards, linked to invoicing                     |
| Customer Links              | INTERCONNECTION | Customer name links on cards and detail                              |
| Screen Room Links           | INTERCONNECTION | Task references only, no deep integration                            |
| Analytics Data Model        | INTERCONNECTION | Timestamps on transitions, ready for Phase 2                         |
| What-If Date Picker         | NOT BUILDING    | Phase 2 (requires historical data)                                   |
| Overbooking Warnings        | NOT BUILDING    | Phase 2 (requires productivity baselines)                            |
| End-of-Day Summary          | NOT BUILDING    | Phase 2 (requires accumulated data)                                  |
| Notification System         | NOT BUILDING    | Phase 2 (requires backend)                                           |
| Board Settings Page         | NOT BUILDING    | Phase 2                                                              |
| Automation Rules            | NOT BUILDING    | Phase 2                                                              |

---

## Schema Changes Required

### Existing Job Schema (Needs Major Revision)

The current `jobSchema` is minimal (from initial scaffold). It needs to be expanded to support the production board architecture.

**Current** (`lib/schemas/job.ts`):

```typescript
jobSchema = {
  id: uuid,
  jobNumber: string,
  title: string,
  customerId: uuid,
  status: "design" | "approval" | "burning" | "press" | "finishing" | "shipped",
  priority: "low" | "medium" | "high" | "rush",
  dueDate: string,
  garments: Garment[],
  printLocations: PrintLocation[]
}
```

**New** (`lib/schemas/job.ts` — revised):

```typescript
jobSchema = {
  id: uuid
  jobNumber: string         // "J-1024"
  title: string             // "Company Tees" (nickname)
  customerId: uuid

  // Board placement
  lane: "ready" | "in_progress" | "review" | "blocked" | "done"
  serviceType: "screen-print" | "dtf" | "embroidery"  // reuse existing serviceTypeEnum

  // Dates
  startDate: string (date)    // When work should begin (drives Today filter)
  dueDate: string (date)      // Production due date
  customerDueDate: string (date, optional)  // Customer-facing due date
  createdAt: string (datetime)
  updatedAt: string (datetime, optional)
  completedAt: string (datetime, optional)

  // Priority & Risk
  priority: "low" | "medium" | "high" | "rush"
  riskLevel: "on_track" | "getting_tight" | "at_risk"  // computed, stored for display

  // Production details
  quantity: number           // Total garment count
  garmentDetails: {
    garmentId: string
    colorId: string
    sizes: Record<string, number>  // { S: 10, M: 50, L: 80 }
  }[]
  printLocations: {
    position: string         // "Front", "Back", "L Sleeve"
    colorCount: number
    artworkApproved: boolean
  }[]
  complexity: {
    locationCount: number
    screenCount: number (optional, screen printing only)
    garmentVariety: number   // number of distinct garments
  }

  // Tasks
  tasks: JobTask[]           // Canonical + custom

  // Blocking
  blockReason: string (optional)  // Set when lane = blocked
  blockedAt: string (datetime, optional)
  blockedBy: string (optional)    // Who marked it blocked

  // Assignee
  assigneeId: string (optional)
  assigneeName: string (optional)
  assigneeInitials: string (optional)

  // Linked entities
  sourceQuoteId: uuid (optional)   // Quote this job was created from
  invoiceId: uuid (optional)       // Linked invoice
  artworkIds: string[]

  // History
  history: {
    fromLane: string
    toLane: string
    timestamp: string (datetime)
    note: string (optional)
  }[]

  // Flags
  isArchived: boolean (default false)
}
```

### New Schema: Job Task

```typescript
jobTaskSchema = {
  id: uuid
  label: string              // "Screens burned"
  detail: string (optional)  // "4 screens, 230 mesh"
  isCompleted: boolean
  completedAt: string (datetime, optional)
  isCanonical: boolean       // true = auto-generated from service type template
  sortOrder: number
}
```

### New Schema: Board Card (Union Type)

The board displays three types of cards. A union/discriminated type handles this:

```typescript
boardCardSchema = discriminatedUnion('type', [
  scratchNoteCardSchema, // type: "scratch_note"
  quoteCardSchema, // type: "quote" (projected from existing quote)
  jobCardSchema, // type: "job" (projected from new job schema)
])
```

The board card is a **view model** projected from underlying entities — not stored separately.

### Constants Additions

```typescript
// Lane labels and colors
LANE_LABELS: { ready: "Ready", in_progress: "In Progress", review: "Review", blocked: "Blocked", done: "Done" }
LANE_COLORS: { ready: "...", in_progress: "...", review: "...", blocked: "...", done: "..." }

// Risk level labels and colors
RISK_LABELS: { on_track: "On Track", getting_tight: "Getting Tight", at_risk: "At Risk" }
RISK_COLORS: { on_track: "", getting_tight: "text-warning", at_risk: "text-error" }
```

---

## Mock Data Requirements

### Jobs (10-12 covering all lanes, service types, and risk levels)

| Job    | Service Type | Lane        | Risk          | Customer           | Qty          | Special                       |
| ------ | ------------ | ----------- | ------------- | ------------------ | ------------ | ----------------------------- |
| J-1024 | Screen Print | In Progress | On Track      | River City Brewing | 200 shirts   | 4 screens, 2 locations        |
| J-1025 | DTF          | In Progress | Getting Tight | TikTok Merch Co.   | 50 transfers | Rush order, due tomorrow      |
| J-1026 | Screen Print | Ready       | On Track      | Lonestar Lacrosse  | 300 jerseys  | Large job, 3 locations        |
| J-1027 | Embroidery   | Blocked     | At Risk       | Metro Youth Soccer | 150 hats     | Waiting on digitized art      |
| J-1028 | Screen Print | Review      | On Track      | River City Brewing | 100 hoodies  | QC checkpoint, all tasks done |
| J-1029 | DTF          | Done        | On Track      | Thompson Family    | 25 shirts    | Shipped, awaiting payment     |
| J-1030 | Screen Print | In Progress | At Risk       | Lakeside Festival  | 500 shirts   | Large job, behind schedule    |
| J-1031 | DTF          | Ready       | On Track      | Sunset 5K Run      | 75 shirts    | New job from accepted quote   |
| J-1032 | Embroidery   | In Progress | On Track      | CrossTown Printing | 200 polos    | Wholesale, 1 location         |
| J-1033 | Screen Print | Done        | On Track      | Riverside Church   | 80 shirts    | Completed, paid               |
| J-1034 | DTF          | In Progress | Getting Tight | Various walk-ins   | 30 transfers | DTF rush interrupt            |

Each job includes:

- Full canonical task list for service type (partially completed based on lane)
- 2-4 history entries (lane transitions with timestamps)
- 1-3 notes (mix of internal, customer, system)
- Block reason (for blocked jobs)
- Linked quote ID (for most jobs)
- Linked invoice ID (for done jobs)

### Quote Board Cards (5-6 in various lanes)

| Quote  | Lane        | Customer          | Status                                                   |
| ------ | ----------- | ----------------- | -------------------------------------------------------- |
| Q-1035 | Ready       | New phone lead    | Scratch note: "Sarah called — 100 tees for church event" |
| Q-1036 | In Progress | Mountain View HS  | Building quote, 500 shirts                               |
| Q-1037 | Blocked     | Sunset 5K Run     | Waiting on customer to pick color                        |
| Q-1038 | Done        | Lonestar Lacrosse | Accepted, "New" badge, ready for job creation            |
| Q-1039 | Done        | Thompson Family   | Accepted, job already created                            |
| Q-1040 | Done        | Declined lead     | Declined (will auto-archive)                             |

### Scratch Notes (2-3 examples)

```text
- "John called, 200 black tees with front print, wants by next Friday"
- "Email from sports league — 150 jerseys, need quote for 3-color front + back number"
- "Walk-in asked about DTF pricing for 50 custom transfers"
```

---

## Build Order (Recommended)

The build order respects dependency chains — each step can be demoed independently.

| Step | Component                       | Depends On | Estimated Complexity                                     |
| ---- | ------------------------------- | ---------- | -------------------------------------------------------- |
| 1    | **Job Schema + Constants**      | None       | Low — schema definition, enum additions                  |
| 2    | **Mock Data**                   | Step 1     | Medium — 10-12 jobs, tasks, notes, history               |
| 3    | **Board Card Component**        | Step 1     | Medium — card design with all visual elements            |
| 4    | **Production Board Layout**     | Steps 2-3  | High — 2-section Kanban, 5 lanes, filters                |
| 5    | **Drag-and-Drop**               | Step 4     | Medium — dnd-kit integration for lane transitions        |
| 6    | **Job Detail / Command Center** | Steps 1-2  | High — tasks, notes, actions, linked entities            |
| 7    | **Jobs List (Table View)**      | Steps 1-2  | Medium — TanStack Table, search, filter, sort            |
| 8    | **Scratch Note Capture**        | Step 4     | Low — inline text input on board                         |
| 9    | **Quote-to-Job Conversion**     | Steps 4, 6 | Low — button + data transformation                       |
| 10   | **Polish + Integration**        | All        | Medium — cross-link verification, empty states, keyboard |

---

## Routes

| Route         | Component       | Purpose                               |
| ------------- | --------------- | ------------------------------------- |
| `/jobs`       | JobsList        | Table view of all jobs                |
| `/jobs/board` | ProductionBoard | Primary board view (2-section Kanban) |
| `/jobs/[id]`  | JobDetail       | Job command center                    |

**Sidebar**: "Jobs" link defaults to `/jobs/board` (board is primary view). View toggle on both pages switches between list and board.

---

## Related Documents

- `docs/competitive-analysis/jobs-vertical-synthesis.md` — Combined competitive analysis
- `docs/competitive-analysis/jobs-journey-map.md` — Current journey friction map
- `docs/strategy/jobs-improved-journey.md` — Improved journey design (10 principles, board architecture)
- `docs/strategy/quoting-scope-definition.md` — Quoting vertical scope (interconnection reference)
- `docs/strategy/customer-management-scope-definition.md` — Customer management scope (interconnection reference)
- `CLAUDE.md` — Quality checklist, design system, coding standards
