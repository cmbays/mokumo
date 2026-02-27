---
title: 'APP_FLOW'
description: 'Every screen, route, navigation path, and user journey. The authoritative reference for how users move through the app.'
category: canonical
status: active
phase: 1
last_updated: 2026-02-27
last_verified: 2026-02-16
depends_on:
  - docs/PRD.md
  - docs/strategy/jobs-scope-definition.md
  - docs/APP_IA.md
---

# Screen Print Pro — App Flow

> **See also**: `docs/APP_IA.md` — the *why* behind this inventory. Governing principles for where features go, how settings vs nav is decided, interaction patterns, and feature placement criteria. Read APP_IA before placing a new feature in the nav or Settings.

---

## Tool Overview

**Name**: Screen Print Pro
**Purpose**: Production management for a screen-printing shop — manage jobs from quote through production to completion
**Primary User**: Shop owner/operator (Chris at 4Ink)
**Entry Point**: Opens app in browser, lands on Dashboard (`/`)

---

## Screen Inventory

| #   | Screen              | Route                                 | Description                                                          | PRD Feature |
| --- | ------------------- | ------------------------------------- | -------------------------------------------------------------------- | ----------- |
| 1   | Dashboard           | `/`                                   | Production overview: blocked, in-progress, at-risk, completed        | F1          |
| 2   | Jobs List           | `/jobs`                               | Sortable/filterable table with lane, service type, risk columns      | F2          |
| 3   | Job Detail          | `/jobs/[id]`                          | Job command center: tasks, notes, quick actions, linked entities     | F3          |
| 4   | Production Board    | `/jobs/board`                         | Two-section Kanban (Quotes + Jobs), 5 universal lanes, drag-and-drop | F4          |
| 5   | Quotes List         | `/quotes`                             | Table of quotes with status                                          | F5          |
| 6   | Quote Detail        | `/quotes/[id]`                        | Full quote breakdown                                                 | F6          |
| 7   | New Quote           | `/quotes/new`                         | Create quote with dynamic line items                                 | F7          |
| 8   | Customers List      | `/customers`                          | Searchable customer table                                            | F8          |
| 9   | Customer Detail     | `/customers/[id]`                     | Customer info + linked jobs/quotes/invoices                          | F9          |
| 10  | Screen Room         | `/screens`                            | Screen inventory with burn status                                    | F10         |
| 11  | Garment Catalog     | `/garments`                           | Browse garment styles by brand                                       | F11         |
| 12  | Invoices List       | `/invoices`                           | Stats bar + smart view tabs + filterable invoice table               | F12         |
| 13  | Invoice Detail      | `/invoices/[id]`                      | Full invoice view: line items, payments, reminders, linked entities  | F13         |
| 14  | New Invoice         | `/invoices/new`                       | Create invoice from scratch or from accepted quote                   | F14         |
| 15  | Edit Invoice        | `/invoices/[id]/edit`                 | Edit draft invoice (reuses invoice form)                             | F15         |
| 16  | Edit Quote          | `/quotes/[id]/edit`                   | Edit draft quote (reuses quote form)                                 | F7          |
| 17  | Pricing Hub         | `/settings/pricing`                   | Template cards with service type tabs (Screen Print / DTF)           | F16         |
| 18  | Screen Print Editor | `/settings/pricing/screen-print/[id]` | Simple/Power mode matrix editor with margin indicators               | F16         |
| 19  | DTF Editor          | `/settings/pricing/dtf/[id]`          | Sheet tier editor with pricing calculator                            | F16         |
| 20  | Color Settings      | `/settings/colors`                    | Global favorite color management with flat/grouped display           | F17         |

---

## Navigation Map

### Sidebar (persistent, always visible)

```
Dashboard          /
Quotes             /quotes
Invoices           /invoices
Jobs               /jobs/board
Screen Room        /screens
Customers          /customers
Garments           /garments
Pricing Settings   /settings/pricing
Color Settings     /settings/colors
```

Active state: highlighted background when route matches (exact for `/`, prefix for others).

> **Note**: "Jobs" sidebar link defaults to `/jobs/board` (board is the primary view). List view is accessible via the view toggle on the board page. The sidebar `href` will be updated from `/jobs` to `/jobs/board` during the Jobs build phase.

### Breadcrumb Trails

| Current Screen      | Breadcrumb                                       |
| ------------------- | ------------------------------------------------ |
| Dashboard           | (none — root)                                    |
| Jobs List           | Dashboard > Jobs                                 |
| Job Detail          | Dashboard > Jobs > J-1024                        |
| Production Board    | Dashboard > Jobs > Board                         |
| Quotes List         | Dashboard > Quotes                               |
| Quote Detail        | Dashboard > Quotes > Q-2048                      |
| New Quote           | Dashboard > Quotes > New Quote                   |
| Customers List      | Dashboard > Customers                            |
| Customer Detail     | Dashboard > Customers > River City Brewing Co.   |
| Screen Room         | Dashboard > Screen Room                          |
| Garment Catalog     | Dashboard > Garments                             |
| Invoices List       | Dashboard > Invoices                             |
| Invoice Detail      | Dashboard > Invoices > INV-1024                  |
| New Invoice         | Dashboard > Invoices > New Invoice               |
| Edit Invoice        | Dashboard > Invoices > INV-1024 > Edit           |
| Edit Quote          | Dashboard > Quotes > Q-2048 > Edit               |
| Pricing Hub         | Dashboard > Settings > Pricing                   |
| Screen Print Editor | Dashboard > Settings > Pricing > [Template Name] |
| DTF Editor          | Dashboard > Settings > Pricing > [Template Name] |
| Color Settings      | Dashboard > Settings > Colors                    |

### Cross-Links (navigation between related entities)

```
Dashboard
  ├── [click blocked job]       → /jobs/[id]
  ├── [click in-progress job]   → /jobs/[id]
  ├── [click at-risk job]       → /jobs/[id]
  └── [View Board]              → /jobs/board

Production Board (/jobs/board)
  ├── [click job card]          → /jobs/[id]
  ├── [click quote card]        → /quotes/[id]
  ├── ["+"]                     → scratch note (inline)
  ├── ["New Quote"]             → /quotes/new
  └── [view toggle: List]       → /jobs

Job Detail (/jobs/[id])
  ├── [click customer name]     → /customers/[customerId]
  ├── [click linked quote]      → /quotes/[quoteId]
  ├── [click linked invoice]    → /invoices/[invoiceId]
  ├── [View on Board]           → /jobs/board
  └── [back to list]            → /jobs

Quote Detail (/quotes/[id])
  ├── [click customer name]     → /customers/[customerId]
  ├── [Create Job from Quote]   → creates job, navigates to /jobs/[newJobId]
  ├── [Create Invoice]          → /invoices/new?quoteId=[id]
  └── [back to list]            → /quotes

Invoice Detail (/invoices/[id])
  ├── [click customer name]     → /customers/[customerId]
  ├── [click linked quote]      → /quotes/[quoteId]
  ├── [click linked job]        → /jobs/[jobId]
  └── [back to list]            → /invoices

Customer Detail (/customers/[id])
  ├── [click job row]           → /jobs/[jobId]
  ├── [click quote row]         → /quotes/[quoteId]
  ├── [click invoice row]       → /invoices/[invoiceId]
  └── [back to list]            → /customers

Screen Room (/screens)
  └── [click linked job]        → /jobs/[jobId]

Garment Catalog (/garments)
  ├── [click brand name on card] → Brand Detail Drawer (sheet overlay)
  ├── [click brand name in toolbar] → Brand Detail Drawer (sheet overlay)
  └── [click garment card]       → Garment Detail Drawer (sheet overlay)

Color Settings (/settings/colors)
  └── [remove global favorite]   → Removal Confirmation Dialog (if children exist)

Customer Detail (/customers/[id])
  └── [Preferences tab]          → Color/brand/garment favorites management (inline)
```

---

## User Journeys

### Journey 1: Morning Status Check

**Goal**: Understand shop state in 5 seconds
**Trigger**: Shop owner opens app at start of day
**Prerequisites**: None

#### Flow

1. **Land on Dashboard** (`/`)
   - System shows: Summary cards (Blocked, In Progress, At Risk, Total Jobs)
   - System shows: "Needs Attention" section with blocked jobs (lane = `blocked`), including block reason and service type
   - System shows: "In Progress" section with active jobs (lane = `in_progress` or `review`), showing task progress and risk indicator
   - User scans in 5 seconds: "1 blocked, 3 in progress, 1 at risk"

2. **Check blocked job**
   - User clicks blocked job row
   - System navigates to `/jobs/[id]`
   - User sees: block reason banner, which tasks are incomplete, customer contact info
   - User knows: "I need to follow up with Sarah on the Lacrosse jersey artwork"

3. **Optionally view the board**
   - User clicks "View Board" → `/jobs/board`
   - Board shows all active quotes and jobs organized by lane
   - User activates "Today" filter to see what's due today
   - User gets full production picture at a glance

4. **Return to dashboard**
   - User clicks "Dashboard" in sidebar or breadcrumb
   - Back to overview

#### Success State

- User knows shop state without scrolling or clicking more than once

---

### Journey 2: Find and Review a Job

**Goal**: Look up a specific job and see its full status
**Trigger**: Customer calls asking about their order

#### Flow

1. **Navigate to Jobs List** (`/jobs`)
   - User clicks "Jobs" in sidebar (lands on board), then toggles to "List" view
   - OR navigates directly to list from dashboard link

2. **Search for job**
   - User types job number, customer name, or job name in search
   - Table filters in real-time
   - User sees matching row with lane badge, service type icon, risk indicator, and task progress

3. **Open Job Detail** (`/jobs/[id]`)
   - User clicks job row
   - System shows the job command center: header with service type and lane, quick actions bar, task checklist with progress, job details, notes & history feed, linked entities

4. **Check task progress and notes**
   - Tasks section shows which production steps are complete (e.g., "6/8 tasks done")
   - Notes section shows chronological history — internal notes, customer communication, system events
   - User tells customer: "Your shirts are on press now, we expect to ship Thursday"

#### Success State

- User found job and answered customer question in <30 seconds

#### Error States

| Condition               | User Sees                   | Recovery                       |
| ----------------------- | --------------------------- | ------------------------------ |
| No search results       | "No jobs match your search" | Clear search, browse full list |
| Job not found (bad URL) | "Job not found"             | Link to Jobs list              |

---

### Journey 3: Move Jobs Through Production (Board)

**Goal**: Visually manage production flow by dragging jobs between lanes
**Trigger**: Job completes a production task or changes state

#### Flow

1. **Navigate to Production Board** (`/jobs/board`)
   - User clicks "Jobs" in sidebar (board is default view)
   - Board shows two horizontal sections: Quotes (top) and Jobs (bottom)
   - Five vertical lanes: Ready, In Progress, Review, Blocked, Done

2. **Scan the board**
   - Each card shows: service type color border + icon, customer + name, quantity, due date + risk dot, task progress bar
   - Capacity summary bar shows: rush count, total quantity, cards per lane
   - User activates "Today" filter to focus on today's work

3. **Drag job to next lane**
   - User drags "J-1024" from In Progress → Review (all tasks complete, ready for QC)
   - Card animates to new lane
   - Lane card counts update

4. **QC review flow**
   - User opens job card in Review lane → sees QC checklist
   - QC passes: drag to Done lane → card shows "Complete"
   - QC fails: drag back to In Progress with system note explaining why

5. **Handle a blocked job**
   - User drags "J-1027" to Blocked lane
   - System prompts for block reason: "Waiting on digitized art from vendor"
   - Card shows block reason, timestamp logged
   - Later: user unblocks → card returns to previous lane

6. **Verify board state**
   - Cards are in correct lanes
   - Done lane auto-collapses to keep focus on active work
   - Click Done lane header to expand and verify completed jobs

#### Success State

- Jobs visually tracked through production, board reflects reality

---

### Journey 4: Create a New Quote

**Goal**: Build a quote for a customer inquiry
**Trigger**: Customer requests pricing

#### Flow

1. **Navigate to Quotes** (`/quotes`)
   - User clicks "Quotes" in sidebar

2. **Click "New Quote"** button
   - System navigates to `/quotes/new`

3. **Select customer**
   - User picks customer from dropdown (existing customers)

4. **Add line items**
   - User clicks "Add Line Item"
   - Fills in: description, quantity, color count, locations
   - System auto-calculates unit price and line total
   - User can add multiple line items

5. **Set setup fees**
   - User enters setup fee amount

6. **Review totals**
   - System shows: subtotal (sum of line items), setup fees, grand total

7. **Save quote**
   - User clicks "Save as Draft"
   - System navigates to `/quotes/[new-id]` (quote detail)
   - Toast: "Quote Q-2051 created"

#### Success State

- Quote saved with accurate pricing, visible in quotes list

#### Error States

| Condition               | User Sees                      | Recovery                |
| ----------------------- | ------------------------------ | ----------------------- |
| Missing required fields | Red validation on empty fields | Fill in required fields |
| No line items           | "Add at least one line item"   | Add a line item         |

---

### Journey 5: View Customer History

**Goal**: See all jobs and quotes for a customer
**Trigger**: Customer calls, or owner reviewing account

#### Flow

1. **Navigate to Customers** (`/customers`)
   - User clicks "Customers" in sidebar

2. **Find customer**
   - User searches or scrolls the customer table

3. **Open Customer Detail** (`/customers/[id]`)
   - User clicks customer row
   - System shows: contact info, linked jobs table (with lane/priority), linked quotes table (with status/total), linked invoices table (with status/balance)

4. **Jump to related entity**
   - User clicks a job row → navigates to `/jobs/[id]`
   - OR clicks a quote row → navigates to `/quotes/[id]`
   - OR clicks an invoice row → navigates to `/invoices/[id]`

#### Success State

- User sees complete customer relationship in one view

---

### Journey 6: Check Screen Room

**Goal**: See which screens need burning before production can start
**Trigger**: Before starting a production run

#### Flow

1. **Navigate to Screen Room** (`/screens`)
   - User clicks "Screen Room" in sidebar

2. **Filter by status**
   - User filters to "Pending" burn status
   - Table shows screens that need burning

3. **Check linked job**
   - User sees job number linked to each screen
   - User clicks job link → navigates to `/jobs/[id]`

#### Success State

- User knows exactly which screens to burn and for which jobs

---

### Journey 7: Quick Capture

**Goal**: Capture a new lead or request with minimum friction
**Trigger**: Phone call, walk-in, or email with a new request

#### Flow

1. **Open the board** (`/jobs/board`)
   - User is already on the board, or navigates via sidebar

2. **Click "+" button** (in Quotes Ready lane)
   - System opens inline text input or small card

3. **Type a scratch note**
   - User types: "John called, 200 black tees with front print, wants by Friday"
   - Presses Enter

4. **Note appears on board**
   - Scratch note card appears in Quotes row → Ready lane
   - Distinct visual (scratch note style, not a full quote card)

5. **Later: convert to quote** (optional)
   - User clicks "Create Quote from this" on the scratch note card
   - System navigates to `/quotes/new` with note content pre-filled in internal notes
   - OR user dismisses/archives the scratch note without creating a quote

#### Success State

- Lead captured in < 5 seconds, visible on board, convertible to quote when ready

---

### Journey 8: Quote-to-Job Conversion

**Goal**: Convert an accepted quote into a production job
**Trigger**: Customer accepts a quote

#### Flow

1. **Quote reaches Done lane**
   - Quote is accepted (manually marked or via customer response)
   - Quote card appears in Quotes row → Done lane with "New" badge

2. **Create Job from Quote**
   - User clicks "Create Job from Quote" on the accepted quote card (or from Quote Detail page)
   - System creates a new Job card in Jobs row → Ready lane
   - Job auto-inherits from quote: customer, service type, quantity, garment details, print locations
   - Canonical tasks auto-populate based on service type (e.g., 8 tasks for screen printing)
   - Source quote is linked on the job

3. **Optionally create invoice**
   - User clicks "Create Invoice" on the quote detail page
   - System navigates to `/invoices/new?quoteId=[id]` with line items pre-populated

4. **Verify new job**
   - Toast: "Job J-1034 created from Quote Q-1024"
   - Job card visible on board in Ready lane
   - Job detail shows linked quote and inherited data

#### Success State

- Job created with all quote data inherited, canonical tasks ready, no data re-entry

---

### Journey 9: Block and Unblock

**Goal**: Track when a job is blocked by an external dependency, and resume when resolved
**Trigger**: External blocker arises (blanks not arrived, waiting on art, equipment down)

#### Flow

1. **Mark job as blocked**
   - From board: User drags job card to Blocked lane
   - System prompts for block reason: text input
   - User types: "Blanks not arrived — supplier delayed until Feb 15"
   - OR from Job Detail: User clicks "Mark Blocked" → enters reason

2. **Blocked state visible**
   - Card appears in Blocked lane with block reason visible
   - Job Detail shows prominent block reason banner with timestamp
   - Dashboard "Needs Attention" section includes this job

3. **Resolve the blocker**
   - Blanks arrive (or art is approved, equipment fixed)
   - From board: User drags card out of Blocked lane → card returns to previous lane (e.g., In Progress)
   - OR from Job Detail: User clicks "Unblock" → card moves back to previous lane
   - System note logged: "Unblocked — blanks received"

#### Success State

- Block reason documented, visible across board and dashboard, clean unblock with history

---

## Conceptual Model — Lanes vs Tasks

This section explains the architectural shift from the old 6-stage production pipeline to the new universal board model.

### The Old Model (Replaced)

The original design used 6 production-specific columns as board stages: each column represented a specific production step. This broke down for non-screen-printing services (DTF, Embroidery) which have different production steps.

### The New Model: Universal Lanes + Service-Specific Tasks

**Lanes** represent work-in-progress status. They are universal across all service types:

| Lane            | Meaning                         | Quote Context                     | Job Context                                      |
| --------------- | ------------------------------- | --------------------------------- | ------------------------------------------------ |
| **Ready**       | Logged, not started             | New lead, need to build quote     | Quote accepted, need to prep for production      |
| **In Progress** | Actively being worked on        | Drafting/building the quote       | Production underway (screens, press, embroidery) |
| **Review**      | Quality gate / approval pending | Customer reviewing our quote      | QC check before shipping                         |
| **Blocked**     | External dependency             | Waiting on customer decision      | Blanks not arrived, art revision needed          |
| **Done**        | Work complete, still tracking   | Accepted → ready for job creation | Completed, may still need payment                |

**Tasks** represent actual production steps within a lane. They are service-type-specific canonical checklists that auto-populate when a job is created:

| Service Type    | Task Count | Example Tasks                                                                                                                           |
| --------------- | ---------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Screen Printing | 8          | Art files finalized, Film positives printed, Screens burned, Screens registered, Blanks received, Press run complete, QC passed, Packed |
| DTF             | 6          | Art files finalized, Gang sheet prepared, DTF printed, Transfers pressed, QC passed, Packed                                             |
| Embroidery      | 7          | Art files finalized, Design digitized, Machine set up, Blanks received, Run complete, QC passed, Packed                                 |

### Key Distinction

Production steps like screen burning and press runs happen **within the "In Progress" lane**, tracked by task checkboxes rather than separate board columns. The task progress bar on each card shows completion (e.g., "6/8 tasks"). This means the same 5-lane board works for all service types without different column configurations.

### Board Sections

The board has two horizontal rows sharing the same 5 vertical lanes:

- **Quotes row** (top): Quote cards and scratch notes
- **Jobs row** (bottom): Job cards

Cards move horizontally within their own row (quotes stay in quotes, jobs stay in jobs). Cards do not move between rows — a quote becomes a job via explicit conversion ("Create Job from Quote").

### Reference: Board Values

| Dimension     | Values                                                           |
| ------------- | ---------------------------------------------------------------- |
| Lanes         | Ready, In Progress, Review, Blocked, Done                        |
| Service Types | Screen Printing (blue), DTF (gold), Embroidery (green)           |
| Risk Levels   | On Track (no dot), Getting Tight (orange dot), At Risk (red dot) |
| Priority      | Low, Medium, High, Rush                                          |
| Card Types    | Scratch Note, Quote Card, Job Card                               |

---

## State Definitions

### Empty States

| Screen                     | Condition                | Message                                                                      | Action                    |
| -------------------------- | ------------------------ | ---------------------------------------------------------------------------- | ------------------------- |
| Dashboard — Blocked        | No blocked jobs          | "All clear — no blocked jobs"                                                | None needed               |
| Dashboard — At Risk        | No at-risk jobs          | "Everything on track"                                                        | None needed               |
| Jobs List                  | No jobs exist            | "No jobs yet — jobs will appear here when quotes are accepted"               | None                      |
| Quotes List                | No quotes exist          | "No quotes yet."                                                             | "New Quote" button        |
| Customer Detail — Jobs     | Customer has no jobs     | "No jobs for this customer"                                                  | None                      |
| Customer Detail — Quotes   | Customer has no quotes   | "No quotes for this customer"                                                | None                      |
| Customer Detail — Invoices | Customer has no invoices | "No invoices for this customer"                                              | None                      |
| Screen Room                | No screens               | "No screens tracked yet"                                                     | None                      |
| Search results             | No matches               | "No results for '[query]'"                                                   | Clear search              |
| Production Board — lane    | Lane has no cards        | Subtle "No cards" placeholder                                                | None                      |
| Production Board — all     | No active cards on board | "No active quotes or jobs. Create a quote or capture a note to get started." | "New Quote" or "+" button |
| Job Detail — tasks         | No tasks on job          | "No tasks yet"                                                               | "Add Custom Task" button  |
| Job Detail — notes         | No notes on job          | Quick-add note input visible                                                 | Note input focused        |
| Invoices List              | No invoices exist        | "No invoices yet."                                                           | "New Invoice" button      |

### Board-Specific States

| State                   | Visual                                                               |
| ----------------------- | -------------------------------------------------------------------- |
| Done lane collapsed     | Card count badge only, click to expand                               |
| Done lane expanded      | Full card list visible                                               |
| Card dragging           | Card lifts with shadow, ghost remains in original position           |
| Lane drop target        | Lane header highlights with accent color                             |
| Block reason prompt     | Text input appears when card is dropped into Blocked lane            |
| Risk indicator — none   | No dot (on track, > 3 days buffer)                                   |
| Risk indicator — orange | Orange dot (getting tight, estimated work approaches remaining time) |
| Risk indicator — red    | Red dot (at risk, estimated work > remaining time, or overdue)       |

### Loading States

Not applicable for Phase 1 (mock data is synchronous). Design loading skeleton patterns for Phase 2.

### Error States

| Condition           | Screen            | Shows                      | Recovery               |
| ------------------- | ----------------- | -------------------------- | ---------------------- |
| Invalid route       | Any               | 404 page: "Page not found" | Link to Dashboard      |
| Invalid job ID      | `/jobs/[id]`      | "Job not found"            | Link to Jobs list      |
| Invalid quote ID    | `/quotes/[id]`    | "Quote not found"          | Link to Quotes list    |
| Invalid customer ID | `/customers/[id]` | "Customer not found"       | Link to Customers list |
| Invalid invoice ID  | `/invoices/[id]`  | "Invoice not found"        | Link to Invoices list  |

---

## Page-Level Details

### Dashboard (`/`)

**Layout**: Full width within main content area
**Sections** (top to bottom):

1. Page header: "Dashboard" + subtitle
2. Summary cards row: Blocked, In Progress, At Risk, Total Jobs (4 columns)
3. "Needs Attention" card — blocked jobs (`lane === "blocked"`), showing block reason + service type
4. "In Progress" card — active jobs (`lane === "in_progress"` or `"review"`), showing task progress + risk indicator

**Key Actions**:

- Click any job row → `/jobs/[id]`
- "View Board" → `/jobs/board`

---

### Jobs List (`/jobs`)

**Layout**: Full width table with toolbar
**Toolbar**: Search input, filter dropdowns, view toggle (List | Board)
**Table Columns**: Job #, Service Type (icon + label), Customer, Job Name, Quantity, Due Date, Lane (badge), Risk (dot), Task Progress (mini bar)
**Sorting**: Click column headers, default by due date ascending
**Filtering**:

- Lane: All, Ready, In Progress, Review, Blocked, Done
- Service Type: Screen Printing, DTF, Embroidery
- Risk: All, At Risk, On Track

**Key Actions**:

- Click row → `/jobs/[id]`
- Click "Board" toggle → `/jobs/board`
- Search → filters table in real-time
- Quick actions per row: Move Lane, Mark Blocked/Unblock

---

### Job Detail / Command Center (`/jobs/[id]`)

**Layout**: Full-width page with structured sections

**1. Header**:

- Service type color bar + icon (prominent)
- Customer name + company (linked to `/customers/[customerId]`)
- Job name/nickname + job number
- Primary contact: name, email, phone (click to copy)
- Date row: Due Date + Start Date + Created Date
- Risk indicator with label (On Track / Getting Tight / At Risk)
- Current lane badge (Ready / In Progress / Review / Blocked / Done)

**2. Quick Actions Bar**:

- "Move Lane →" dropdown (next logical lane, with all options)
- "Mark Blocked" / "Unblock" toggle (opens block reason input when blocking)
- "View Quote" button (links to source quote if exists)
- "View Invoice" button (links to linked invoice if exists)
- "Edit Job" button

**3. Tasks Section**:

- Canonical task checklist (auto-populated per service type)
- Progress bar above task list (X/Y tasks complete)
- Checkbox per task — click to complete/uncomplete
- Task details inline (e.g., "Screens burned — 4 screens, 230 mesh")
- Completed tasks show strikethrough with timestamp
- "Add Custom Task" button
- When all tasks complete: visual indicator "Ready for next lane"

**4. Details Section**:

- Quantity: total garment count
- Garment info: Brand + Style + Color + Size breakdown (S:10, M:50, L:80...)
- Print locations: Position + color count per location (Front 4-color, Back 1-color)
- Screen count (for screen printing jobs)
- Service type + any special instructions

**5. Notes & History Section**:

- Chronological feed mixing three note types:
  - **[Internal]** — shop-only notes (observations, instructions)
  - **[Customer]** — notes from/about customer communication
  - **[System]** — auto-generated events (lane changes, task completions, created from quote)
- Each note: timestamp + author + content
- Quick-add note input at top of section
- Filter by type (All / Internal / Customer / System)

**6. Linked Entities Section**:

- Source quote: link to `/quotes/[quoteId]` with quote total
- Linked invoice: link to `/invoices/[invoiceId]` with payment status
- Customer: link to `/customers/[customerId]`

**7. Block Reason Banner** (when lane = Blocked):

- Prominent banner with block reason + timestamp
- "Unblock" button to move back to previous lane

**Key Actions**:

- Click customer name → `/customers/[customerId]`
- Click linked quote → `/quotes/[quoteId]`
- Click linked invoice → `/invoices/[invoiceId]`
- "View on Board" → `/jobs/board`
- Back button / breadcrumb → `/jobs`

---

### Production Board (`/jobs/board`)

**Layout**: Two horizontal sections (Quotes row + Jobs row) × 5 vertical lanes

```
              Ready       In Progress    Review       Blocked       Done
           ┌───────────┬──────────────┬───────────┬──────────────┬───────────┐
  Quotes   │ cards...  │  cards...    │ cards...  │  cards...    │ cards...  │
           ├───────────┼──────────────┼───────────┼──────────────┼───────────┤
  Jobs     │ cards...  │  cards...    │ cards...  │  cards...    │ cards...  │
           └───────────┴──────────────┴───────────┴──────────────┴───────────┘
```

**Lane Headers**: Lane name + card count per section

**Capacity Summary Bar** (above filters): Rush orders count, total quantity, cards per lane distribution

**Filter Bar**:

- **Today**: Filters to cards with start date <= today and not yet done
- **Service Type**: Screen Printing / DTF / Embroidery (multi-select)
- **Section**: All / Quotes Only / Jobs Only
- **Risk**: All / At Risk / Blocked
- **Time Horizon**: 1 week / 2 weeks (default) / 1 month — filters cards by due date window

**Card Design** (on board):

```
┌──────────────────────────────────┐
│ ● Screen Printing    [JD]       │  ← Service type color + icon, Assignee initials
│                                  │
│ Acme Corp — Company Tees         │  ← Customer + Job nickname
│ 200 shirts · 2 locations         │  ← Quantity + complexity indicator
│                                  │
│ Due: Feb 14 ●                    │  ← Due date, risk dot (orange/red or none)
│ ████████░░ 6/8 tasks             │  ← Task completion progress bar
└──────────────────────────────────┘
```

**3 Card Types**: Scratch note, Quote card, Job card

**Interactions**:

- Drag cards between lanes (within same row — quotes stay in quotes, jobs stay in jobs)
- Click card → detail page (`/jobs/[id]` or `/quotes/[id]`)
- "+" button in Quotes Ready lane → scratch note quick capture
- "New Quote" button → `/quotes/new`
- View toggle → `/jobs` (list view)
- Drop card on Blocked lane → block reason prompt

**Done Lane**: Auto-collapsed (card count only), click to expand. Cards in Done for 7+ days auto-archive.

**Key Actions**:

- Drag card between lanes → update lane (client-side)
- Click card → `/jobs/[id]` or `/quotes/[id]`
- "+" → scratch note
- "New Quote" → `/quotes/new`
- "List" toggle → `/jobs`

---

### Quotes List (`/quotes`)

**Layout**: Full width table with toolbar
**Toolbar**: Search input, status filter, "New Quote" button (primary CTA)
**Table Columns**: Quote #, Customer, Status, Line Items, Total, Date

Quotes also appear as cards on the Production Board (`/jobs/board`) in the Quotes row.

**Key Actions**:

- Click row → `/quotes/[id]`
- Click "New Quote" → `/quotes/new`

---

### Quote Detail (`/quotes/[id]`)

**Layout**: Single column
**Sections**:

- Quote header: number, status badge, date
- Customer info card
- Line items with pricing formula: garment + decoration cost per unit, setup fees, line total with info tooltip
- Summary: subtotal, setup fees, grand total

**Key Actions**:

- Click customer name → `/customers/[customerId]`
- "Create Job from Quote" (visible when quote is accepted) → creates job, navigates to `/jobs/[newJobId]`
- "Create Invoice" → `/invoices/new?quoteId=[id]`
- Back → `/quotes`

---

### New Quote (`/quotes/new`)

**Layout**: Form, single column
**Sections**:

- Customer selector (combobox with search)
- Line items (dynamic, add/remove rows)
- Setup fees input
- Totals (auto-calculated, read-only)
- Actions: "Save as Draft", "Cancel"

**Key Actions**:

- "Save as Draft" → creates quote, navigates to `/quotes/[new-id]`
- "Cancel" → navigates to `/quotes`

---

### Customers List (`/customers`)

**Layout**: Full width table
**Toolbar**: Search input
**Table Columns**: Name, Company, Email, Phone

**Key Actions**:

- Click row → `/customers/[id]`

---

### Customer Detail (`/customers/[id]`)

**Layout**: Header + tabbed content
**Tabs** (9 total — mobile: 5 primary + "More" dropdown with 4 secondary):

1. **Overview**: Quick stats, lifecycle badge, health badge, type tags
2. **Contacts**: Contact list with roles, add contact sheet
3. **Groups**: Group membership, add group sheet
4. **Addresses**: Address list (billing, shipping)
5. **Notes**: Chronological notes feed
6. **Quotes**: Linked quotes table with status, total, date
7. **Activity**: Activity timeline with interactive links
8. **Screens**: Customer screens derived from completed jobs, reclaim workflow
9. **Favorites**: Favorite garments and colors

**Key Actions**:

- Click job row → `/jobs/[jobId]`
- Click quote row → `/quotes/[quoteId]`
- Click invoice row → `/invoices/[invoiceId]`
- Add contact / group / address via slide-out sheets
- Back → `/customers`

---

### Screen Room (`/screens`)

**Layout**: Full width table
**Toolbar**: Burn status filter dropdown
**Table Columns**: Screen ID, Mesh Count, Emulsion Type, Burn Status, Linked Job

**Key Actions**:

- Click job link → `/jobs/[jobId]`
- Filter by burn status

---

### Garment Catalog (`/garments`)

**Layout**: Grid/table toggle with category tabs and filters
**Tabs**: All, T-Shirts, Fleece, Outerwear, Pants, Headwear
**Filters**: Brand, color family, search
**Features**: Price toggle (localStorage), favorite star toggles, detail drawer (Sheet) with size/price matrix and linked jobs

**Key Actions**:

- Grid/table view toggle
- Click garment → opens detail drawer (Sheet) with full info
- Toggle favorites (per-customer)
- Filter by category tab, brand, color family
- Search by name or SKU

---

### Invoices List (`/invoices`)

**Layout**: Full width with stats bar, view tabs, and table

**Stats Bar** (top):

- Total Outstanding ($X,XXX)
- Overdue (count + total, red accent)
- Paid This Month ($X,XXX)
- Avg Days to Pay (XX days)

**Smart View Tabs**: All | Draft | Outstanding | Overdue | Paid

**Toolbar**: Search input (invoice # or customer name), "New Invoice" button (primary CTA)

**Table Columns**: Invoice #, Customer, Status (badge), Amount, Due Date (relative: "Due in 5 days"), Balance Due, Created

**Batch Actions**: Select rows via checkboxes → Send Selected, Mark as Paid, Send Reminder

**Key Actions**:

- Click row → `/invoices/[id]`
- Click "New Invoice" → `/invoices/new`
- Click customer name → `/customers/[customerId]`
- Smart view tabs → URL param `?view=`
- Search → URL param `?q=`

---

### Invoice Detail (`/invoices/[id]`)

**Layout**: Full-width page with structured sections

**Header**:

- Invoice number (INV-XXXX) + status badge
- Actions (context-aware per status): Edit (draft only), Send (draft only), Record Payment (sent/partial/overdue), Send Reminder (sent/partial/overdue), Void (not paid), Issue Credit Memo (paid), Duplicate

**Customer & Source Info**:

- Customer info card (name, company, billing contact, billing address) — name linked to `/customers/[customerId]`
- Linked quote # (clickable → `/quotes/[quoteId]`)
- Linked job # (clickable → `/jobs/[jobId]`)
- Payment terms display (e.g., "Net 30")
- Due date display

**Line Items & Pricing**:

- Itemization toggle (Itemized / Bundled)
- Line items table: description, qty, unit price, line total
- Change tracking indicator (if from quote): "3 changes from quote" → expandable diff
- Pricing summary: subtotal, discounts, shipping, tax, total

**Payments**:

- Balance Due (large, prominent, color-coded)
- Payment ledger table: date, method, amount, reference
- Total Paid summary
- "Record Payment" button → opens slide-out sheet

**Reminders & Notes**:

- Reminder timeline (sent dates, next scheduled)
- Internal notes display
- Customer notes display
- Audit log entries (collapsible)

**Key Actions**:

- Record Payment → sheet with amount (pre-filled with balance), date, method dropdown, reference
- Send Reminder → modal with email preview
- Void → confirmation dialog with reason input
- Issue Credit Memo → modal with reason, line item selection, credit amounts
- Duplicate → `/invoices/new` (pre-filled)
- Back / breadcrumb → `/invoices`

---

### New Invoice (`/invoices/new`)

**Layout**: Form, single column with sections

**Two entry points**:

1. From scratch: "New Invoice" button on invoices list
2. From accepted quote: `/invoices/new?quoteId=xxx` (auto-populates customer, line items, discounts, shipping)

**Sections**:

1. **Customer**: Combobox with type-ahead search, customer info card on selection
2. **Source**: Linked quote # (read-only if from quote), linked job # selector (optional)
3. **Line Items**: Itemization toggle (Itemized / Bundled), dynamic rows (description, qty, unit price, total), add/remove, additional charges (rush fee, art charges, screen setup)
4. **Pricing**: Subtotal (read-only), discounts, shipping, tax rate input, tax amount (auto-calculated), total
5. **Payment Terms & Deposit**: Payment terms dropdown (from customer default), due date (calculated), deposit toggle with amount input and smart default
6. **Notes** (collapsed): Internal notes textarea, customer notes textarea

**Actions**:

- "Save as Draft" → creates invoice, navigates to `/invoices/[new-id]`
- "Review & Send" → opens slide-out preview with email, "Send Invoice" confirms
- "Cancel" → navigates to `/invoices`

---

### Edit Invoice (`/invoices/[id]/edit`)

**Layout**: Same form as New Invoice, pre-filled with existing invoice data
**Guard**: Only accessible for draft invoices. Non-draft invoices redirect to detail view.

**Key Actions**:

- "Update Invoice" → saves changes, navigates to `/invoices/[id]`
- "Cancel" → navigates to `/invoices/[id]`

---

## Keyboard Shortcuts (Phase 2)

Planned for Phase 2 iteration:

| Key   | Action                  | Context          |
| ----- | ----------------------- | ---------------- |
| `/`   | Focus search            | Global           |
| `Esc` | Close modal/dialog      | When modal open  |
| `?`   | Show keyboard shortcuts | Global           |
| `T`   | Toggle Today filter     | Production Board |
| `N`   | New scratch note        | Production Board |
| `F`   | Focus filters           | Production Board |

---

## Related Documents

- `docs/PRD.md` — Features and acceptance criteria
- `docs/IMPLEMENTATION_PLAN.md` — Build order
- `docs/reference/APP_FLOW_STANDARD.md` — Template this doc follows
- `docs/strategy/jobs-scope-definition.md` — Jobs vertical scope (lanes, tasks, board architecture)
- `docs/strategy/jobs-improved-journey.md` — Improved production journey (10 principles, card design)
- `CLAUDE.md` — AI operating rules
