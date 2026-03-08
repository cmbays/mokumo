---
title: 'PRD'
description: "Phase 1 features, user stories, acceptance criteria, and scope boundaries. Defines what 'done' means for the mockup."
category: canonical
status: active
phase: 1
last_updated: 2026-02-15
last_verified: 2026-02-15
depends_on: []
---

# Mokumo — Product Requirements Document

> Phase 1: High-fidelity mockup with mock data for user acceptance testing.

**Primary User**: Shop owner/operator of 4Ink, a screen-printing business

---

## Problem Statement

The 4Ink shop owner currently tracks production across spreadsheets, text messages, and memory. There is no single view of what's blocked, what's in progress, and what needs attention next. Jobs fall through cracks. Artwork approval stalls silently. Screen room status is verbal.

Mokumo replaces this with a unified production dashboard that gives instant clarity on the full garment lifecycle: **Quote -> Artwork Approval -> Screen Room -> Production -> Shipping**.

---

## User Persona

**Chris** — Owner/operator of 4Ink

- Runs a small screen-printing shop (1-3 employees)
- Manages 5-20 active jobs at any time
- Needs to know: What's blocked? What's due soon? What's next?
- Works from desktop primarily (shop office)
- Values speed and clarity over features
- Current tools: existing shop management software, spreadsheets, phone

---

## Phase 1 Scope

### IN Scope (build these)

| #   | Feature             | Description                                        | Acceptance Criteria                                                                                                                                |
| --- | ------------------- | -------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| F1  | **Dashboard**       | Production overview with priority-ordered sections | Shows blocked items first, then in-progress, then recently shipped. Summary cards for key metrics.                                                 |
| F2  | **Jobs List**       | Sortable, filterable table of all jobs             | Sort by status, priority, due date, customer. Filter by status. Search by job number or title.                                                     |
| F3  | **Job Detail**      | Full view of a single job                          | Shows customer, garments (with sizes), print locations (with artwork status), production state, priority, due date. Status timeline visualization. |
| F4  | **Kanban Board**    | Drag-and-drop production board                     | Columns for each production state. Cards show job number, title, customer, due date. Drag to change status.                                        |
| F5  | **Quotes List**     | Table of quotes with status                        | Sort/filter by status, customer, date. Show line item count and total.                                                                             |
| F6  | **Quote Detail**    | Full view of a single quote                        | Customer info, line items with pricing breakdown, setup fees, total. Status badge.                                                                 |
| F7  | **New Quote Form**  | Create a quote with dynamic line items             | Add/remove line items. Auto-calculate unit price, line total, setup fees, grand total. Customer selection.                                         |
| F8  | **Customers List**  | Table of customers                                 | Name, company, email, phone. Click to view details.                                                                                                |
| F9  | **Customer Detail** | Single customer view                               | Contact info, linked jobs (with status), linked quotes (with status).                                                                              |
| F10 | **Screen Room**     | Screen inventory and status                        | Table of screens with mesh count, emulsion type, burn status, linked job. Filter by burn status.                                                   |
| F11 | **Garment Catalog** | Browse available garment styles                    | List of garments used across jobs. Group by brand. Show SKU, style, color.                                                                         |

### OUT of Scope (Phase 2/3)

| Feature                                           | Why Deferred                                                                                                                            |
| ------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| User authentication / login                       | Phase 3 — no multi-user in Phase 1                                                                                                      |
| Real API / database                               | Phase 3 — Zod schemas inform future backend                                                                                             |
| Garment supplier integration (SanMar/AlphaBroder) | Phase 3 — requires real API                                                                                                             |
| ~~Invoice generation~~                            | **BUILT** in Phase 1 (PRs #48, #50) — full invoicing vertical with payments, credit memos, reminders                                    |
| Email notifications                               | Phase 3 — requires backend                                                                                                              |
| File upload (artwork images)                      | Phase 2 — requires storage backend                                                                                                      |
| Reporting / analytics                             | Phase 2 — need real data first                                                                                                          |
| ~~Mobile-optimized layout~~                       | **BUILT** in Phase 1 (PRs #101, #114, #148, #167, #174, #175) — full responsive mobile with bottom tabs, filter sheets, scroll-to-error |
| Print labels / packing slips                      | Phase 2 — need user feedback on shipping flow                                                                                           |
| Multi-shop / multi-user                           | Phase 3+ — single operator for now                                                                                                      |

---

## User Stories

### Dashboard (F1)

- **US-1.1**: As a shop owner, I want to see blocked jobs immediately so I can unblock them.
- **US-1.2**: As a shop owner, I want to see in-progress jobs with their status so I know what's active.
- **US-1.3**: As a shop owner, I want summary metrics (blocked count, in-progress count, shipped count) so I get a quick pulse.
- **US-1.4**: As a shop owner, I want to click a job from the dashboard to see its details.

### Jobs (F2, F3, F4)

- **US-2.1**: As a shop owner, I want to see all jobs in a sortable table so I can find any job quickly.
- **US-2.2**: As a shop owner, I want to filter jobs by production status so I can focus on one stage.
- **US-2.3**: As a shop owner, I want to search jobs by number or title.
- **US-2.4**: As a shop owner, I want to view a job's full details: customer, garments, sizes, print locations, artwork status.
- **US-2.5**: As a shop owner, I want a visual timeline showing a job's production state progression.
- **US-2.6**: As a shop owner, I want a Kanban board to drag jobs between production stages.
- **US-2.7**: As a shop owner, I want to see which artwork approvals are pending per job.

### Quotes (F5, F6, F7)

- **US-3.1**: As a shop owner, I want to list all quotes with their status and total.
- **US-3.2**: As a shop owner, I want to create a new quote with dynamic line items.
- **US-3.3**: As a shop owner, I want pricing to auto-calculate based on quantity, colors, and locations.
- **US-3.4**: As a shop owner, I want to add setup fees to a quote.
- **US-3.5**: As a shop owner, I want to view a quote's full breakdown.

### Customers (F8, F9)

- **US-4.1**: As a shop owner, I want to see all customers in a searchable list.
- **US-4.2**: As a shop owner, I want to view a customer's details with their linked jobs and quotes.

### Screen Room (F10)

- **US-5.1**: As a shop owner, I want to see all screens with their burn status and linked job.
- **US-5.2**: As a shop owner, I want to filter screens by burn status (pending, burned, reclaimed).

### Garments (F11)

- **US-6.1**: As a shop owner, I want to browse garment styles used across my jobs.
- **US-6.2**: As a shop owner, I want to see which jobs use a particular garment style.

---

## Navigation Structure

See `docs/APP_FLOW.md` for the complete route map and navigation paths.

**Sidebar** (always visible on desktop, bottom tab bar on mobile):

- Dashboard (`/`)
- Jobs (`/jobs/board`)
- Quotes (`/quotes`)
- Customers (`/customers`)
- Invoices (`/invoices`)
- Screen Room (`/screens`)
- Garments (`/garments`)
- Pricing Settings (`/settings/pricing`)

---

## Data Model

All data shapes defined as Zod schemas in `lib/schemas/`. See source files for exact definitions.

| Entity       | Schema File                   | Key Fields                                                                                                |
| ------------ | ----------------------------- | --------------------------------------------------------------------------------------------------------- |
| Job          | `lib/schemas/job.ts`          | jobNumber, title, customerId, lane, serviceType, priority, dueDate, tasks[], garments[], printLocations[] |
| Quote        | `lib/schemas/quote.ts`        | quoteNumber, customerId, lineItems[], setupFees, total, status                                            |
| Customer     | `lib/schemas/customer.ts`     | name, company, lifecycle, health, typeTags, favoriteGarments, favoriteColors                              |
| Garment      | `lib/schemas/garment.ts`      | sku, style, brand, color, sizes (record), isEnabled, isFavorite                                           |
| Screen       | `lib/schemas/screen.ts`       | meshCount, emulsionType, burnStatus, jobId                                                                |
| Invoice      | `lib/schemas/invoice.ts`      | invoiceNumber, customerId, lineItems[], status, payments[], balance, dueDate                              |
| Credit Memo  | `lib/schemas/credit-memo.ts`  | invoiceId, reason, lineItems[], total                                                                     |
| Board Card   | `lib/schemas/board-card.ts`   | JobCard, QuoteCard, ScratchNoteCard union types                                                           |
| Price Matrix | `lib/schemas/price-matrix.ts` | templateName, serviceType, tiers[], margins                                                               |
| DTF Pricing  | `lib/schemas/dtf-pricing.ts`  | sheetTiers[], filmTypes, rushFees                                                                         |

**Universal Lanes**: `ready -> in_progress -> review -> blocked -> done` (same for quotes and jobs)
**Quote Statuses**: `draft -> sent -> accepted -> declined -> revised`
**Invoice Statuses**: `draft -> sent -> partial -> paid -> overdue -> void`
**Burn Statuses**: `pending -> burned -> reclaimed`
**Priority Levels**: `low, medium, high, rush`

---

## Success Criteria for Phase 1

Phase 1 is complete when the 4Ink owner can:

1. **Open the dashboard** and understand the shop's state in 5 seconds
2. **Find any job** by searching, sorting, or filtering the jobs list
3. **View a job's full details** including garments, sizes, artwork status, and production state
4. **Drag jobs on the Kanban board** to visualize and (mock) update production flow
5. **Create a quote** with dynamic line items and auto-calculated pricing
6. **View a customer's history** — their jobs and quotes in one place
7. **Check screen room status** — which screens need burning, which are ready
8. **Navigate between any two screens** within 3 clicks
9. **Say "this looks right"** — the mockup accurately reflects real shop workflows

---

## Non-Goals

- This is NOT a production-ready app. It's a clickable mockup for validation.
- Data does NOT persist between sessions. All state is mock data.
- Status changes (drag on Kanban, form submissions) are client-side only.
- There is NO error handling for network failures (there is no network).
- Performance optimization is NOT a concern — small dataset, no real API calls.

---

## Related Documents

- `docs/APP_FLOW.md` — Routes, screens, navigation
- `docs/TECH_STACK.md` — Tool choices and constraints
- `docs/IMPLEMENTATION_PLAN.md` — Build order
- `CLAUDE.md` — AI operating rules
- `docs/reference/FRONTEND_GUIDELINES.md` — Design system
