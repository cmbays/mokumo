---
title: 'Print Life Jobs/Production Workflow — Competitive Exploration'
description: "Comprehensive analysis of Print Life's production management, invoice dashboard, job tracking, and workflow stages based on screenshot analysis and web research"
category: competitive-analysis
status: complete
phase: 1
vertical: jobs-production
created: 2026-02-12
last-verified: 2026-02-12
---

# Print Life — Jobs/Production Workflow Exploration

**Purpose**: Document Print Life's production/job management workflow to inform Mokumo's Jobs vertical design
**Input**: Screenshot analysis (3 captures from live app), web research (theprintlife.com pages, Q1 2025 updates, 2024 updates, 2025 roadmap), and cross-reference with existing quoting analysis
**Status**: Complete (web research + screenshot analysis; browser automation not available)

---

## 1. Navigation Map

### Sidebar Navigation (11 items, observed from screenshot)

| #   | Section             | Route (estimated)  | Sub-sections                                     | Purpose                                                 |
| --- | ------------------- | ------------------ | ------------------------------------------------ | ------------------------------------------------------- |
| 1   | **Invoices**        | `/invoices`        | Invoice Dashboard, Purchase Orders, Invoice List | Primary production hub                                  |
| 2   | **Quotes**          | `/quotes`          | Quote list                                       | Pre-invoice quotes                                      |
| 3   | **Stores**          | `/stores`          | Store management                                 | Fundraising/merch stores                                |
| 4   | **Todo**            | `/todo`            | Task list                                        | Daily task management                                   |
| 5   | **Receivables**     | `/receivables`     | Outstanding payments                             | A/R tracking                                            |
| 6   | **Clients**         | `/clients`         | Client list + detail                             | CRM                                                     |
| 7   | **Staff**           | `/staff`           | Staff management                                 | Team management (limited — multi-user planned for 2025) |
| 8   | **Product**         | `/product`         | Product catalog                                  | Custom products                                         |
| 9   | **Reports**         | `/reports`         | Business reports                                 | Analytics                                               |
| 10  | **Matrix Settings** | `/matrix-settings` | Pricing matrices                                 | Price configuration                                     |
| 11  | **Settings**        | `/settings`        | Business Info, Email Templates, etc.             | App configuration                                       |

### Top Bar (persistent across all pages)

- **Search bar**: "Search Clients, Quotes, and Invoices" — global search across 3 entities
- **+ NEW CLIENT** button
- **+ NEW QUOTE** button (with blue notification dot)
- **Help icon** (?)
- **Notifications bell**
- **User profile** dropdown (shows name + account)

### Invoice Dashboard (Primary Production View)

Three tabs observed at the top:

1. **INVOICE DASHBOARD** — Kanban-style production lanes (active/underlined)
2. **PURCHASE ORDERS** — Vendor order management
3. **INVOICE LIST** — Table/list view of all invoices

---

## 2. Production Workflow — The 4-Lane Kanban

### Overview (from Screenshot: printlife-01-dashboard.png)

The Invoice Dashboard is the production nerve center. It displays **4 production lanes** arranged left-to-right:

```text
┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│   DESIGN     │  │    P.O.      │  │  PRODUCTION  │  │   SHIPPING   │
│              │  │              │  │              │  │              │
│ ASSIGN       │  │ ORDER QUEUE  │  │ PRODUCTION   │  │ SHIP         │
│ MOCK-UP      │  │ ORDERED      │  │              │  │ LOCAL PICKUP │
│ SUBMITTED    │  │              │  │              │  │              │
└──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘
```

### Lane Details

#### Lane 1: DESIGN

**Substages** (clickable tabs within lane):

- **ASSIGN** — Job assigned to designer, not yet started
- **MOCK-UP** — Designer creating mockup/proof
- **SUBMITTED** — Mockup sent to customer for approval

**Workflow**: Job enters Design after quote-to-invoice conversion. Mock-ups are sent automatically to customers for approval. The system auto-notifies the customer's production manager at key stages.

**Key automation**: "Mocks-ups are sent automatically to your customers for approval" — this is a critical automation point. When a mockup is uploaded and submitted, the customer receives an automatic notification.

#### Lane 2: P.O. (Purchase Order)

**Substages**:

- **ORDER QUEUE** — Items ready to be ordered from vendor
- **ORDERED** — Purchase order sent to vendor

**Workflow**: After mockup approval, blanks need to be ordered. The P.O. system (currently in development per 2025 roadmap) supports universal vendor ordering — not just S&S Activewear.

**From 2025 roadmap**: "Purchase Order (PO) System — Universal vendor support... displays items from invoices with brand, color, size, quantity details... shows which invoice each item belongs to... vendor pricing display and dropdown selection"

#### Lane 3: PRODUCTION

**Substages**:

- **PRODUCTION** — Single stage (no sub-steps)

**Workflow**: Once blanks arrive, job moves to production (screen printing, embroidery, DTF). This is the actual press/printing stage.

**Notable gap**: No sub-stages for screen room prep (burning screens, registration, etc.). This is a major workflow gap for screen printers who need to track screen prep separately from actual printing.

#### Lane 4: SHIPPING

**Substages**:

- **SHIP** — Standard shipping
- **LOCAL PICKUP** — Customer picks up in-person

**Workflow**: After production completes, job moves to shipping. EasyPost integration available for carrier options. Site-wide toggles for enabling/disabling Local Pickup and Shipping options.

### Stage Transition Mechanism

**How jobs move between stages**: Based on the 2024 update notes, there's a feature for "Auto-updating project cards post-mock approval to order queue" — suggesting some automatic transitions exist. However, the primary mechanism appears to be manual stage changes by the shop operator.

**Unknown (not observed)**:

- Whether drag-and-drop is supported between lanes
- Whether stage transitions trigger automated emails
- What information is shown on each job card within a lane
- Whether there are timestamps for when jobs enter/leave stages

---

## 3. Happy Path Walkthrough: Quote to Shipped

### Complete Journey (estimated from research)

```text
START: Customer calls requesting 50 black tees with front print
  │
  ├─ STEP 1: Create Client (if new)
  │   • Click "+ NEW CLIENT" in top bar
  │   • Enter name, contact info, address
  │   • Clicks: ~3-5
  │
  ├─ STEP 2: Create Quote (6-step wizard)
  │   • Click "+ NEW QUOTE" in top bar
  │   • Step 1: Add Items — browse catalog, select product, choose color
  │   • Step 2: Select QTY — enter sizes (BLOCKED by recalculation)
  │   • Step 3: Add Art — upload artwork, select print locations
  │   • Step 4: Choose Ink Style — mandatory even if not used
  │   • Step 5: Select Finishing — mandatory even if not used
  │   • Step 6: Project Overview — review and submit
  │   • Clicks: ~20-30
  │   • Time: ~10 minutes
  │
  ├─ STEP 3: Quote → Invoice conversion
  │   • In Print Life, quote IS the invoice (no separate entity)
  │   • Job appears on Invoice Dashboard in DESIGN > ASSIGN lane
  │   • Clicks: ~0 (automatic)
  │
  ├─ STEP 4: Design Stage
  │   • Open job from ASSIGN substage
  │   • Upload mockup/separation files to the invoice
  │   • Move to MOCK-UP substage
  │   • Submit mockup to customer (automatic email sent)
  │   • Move to SUBMITTED substage
  │   • Wait for customer approval
  │   • Clicks: ~5-8 (upload + stage changes)
  │
  ├─ STEP 5: Purchase Order
  │   • After mockup approval, auto-moves to ORDER QUEUE (per 2024 update)
  │   • Create P.O. for blank garments
  │   • Move to ORDERED when P.O. sent
  │   • Wait for delivery
  │   • Clicks: ~3-5
  │
  ├─ STEP 6: Production
  │   • Move job to PRODUCTION lane when blanks arrive
  │   • Complete printing
  │   • Clicks: ~2-3
  │
  └─ STEP 7: Shipping
      • Move to SHIP or LOCAL PICKUP
      • Create shipping label (EasyPost integration)
      • Mark as complete
      • Clicks: ~3-5

END: Job completed and shipped

TOTAL ESTIMATED CLICKS: ~35-50 (quote creation + production journey)
TOTAL ESTIMATED TIME: ~15-20 minutes (mostly quote creation)
```

### Click Count Breakdown

| Phase                       | Estimated Clicks | Notes                             |
| --------------------------- | ---------------- | --------------------------------- |
| Client creation (new)       | 3-5              | Only if new client                |
| Quote creation              | 20-30            | 6-step wizard, largest click sink |
| Design stage                | 5-8              | Upload art, change substages      |
| P.O. stage                  | 3-5              | Create purchase order             |
| Production stage            | 2-3              | Move to production                |
| Shipping stage              | 3-5              | Ship or pickup                    |
| **Total (new client)**      | **36-56**        | —                                 |
| **Total (existing client)** | **33-51**        | —                                 |

---

## 4. Feature Deep-Dive by Section

### Invoice Dashboard

**What it is**: A Kanban-style board with 4 lanes representing production stages. Each lane has clickable substage tabs.

**Observed layout** (from screenshot):

- Lanes displayed horizontally in a single row
- Each lane has a bold header (DESIGN, P.O., PRODUCTION, SHIPPING)
- Substage tabs displayed as cyan/blue text links below the header, separated by pipes (|)
- Lane backgrounds are light gray cards
- The dashboard was empty in our screenshot (no jobs in progress)

**Strengths**:

- At-a-glance view of entire production pipeline
- Substages within each lane add granularity
- Clear left-to-right flow matches physical production flow

**Weaknesses**:

- No visible count of jobs per stage (no badges/numbers)
- No priority indicators or due date visibility on the board
- No color coding for urgency (overdue, due today, etc.)
- Empty state shows nothing — no guidance or onboarding
- Cannot tell if drag-and-drop is supported (likely not based on tech stack)

### Purchase Orders (Tab 2)

**Status**: Currently being rebuilt (per 2025 roadmap, "close to completion")
**Planned features**:

- Universal vendor support (not just S&S Activewear)
- Display items from invoices with brand, color, size, quantity
- Show which invoice each item belongs to
- Vendor pricing display
- Dropdown vendor selection

### Invoice List (Tab 3)

**Not directly observed**, but likely a table view of all invoices with:

- Search/filter capabilities
- Status column
- Client name
- Total amount
- Date fields

### Quotes Section

**Observed** (from screenshots 02 and 03):

- Product catalog with grid layout (3 columns)
- Product cards showing: image, brand + SKU, price, color count, SBS badge
- Filter sidebar: Sorting Price, Categories, Brand, Colors, Styles, Fit
- Product detail modal with full specs, color swatches, ADD ITEM button
- 6-step wizard at bottom: Add Items → Select Qty → Add Art → Choose Ink Style → Select Finishing → Project Overview

### Todo Section

**Not observed**. Likely a simple task list. The homepage describes: "automates your daily task list freeing up your time to tackle more important tasks"

### Receivables

**Not observed**. Likely an accounts receivable view showing outstanding balances.

### Clients

**Known features** (from existing analysis):

- Basic profiles: name, contact info, address
- Tax-exempt filter (added Q1 2025)
- No company/contact hierarchy
- No tags or segmentation
- Customer portal available (but 4Ink doesn't use it)

### Staff

**Current**: Limited (appears to be single-user or basic)
**Planned** (2025 roadmap): "Staff Accounts — Multiple user logins with role-based permissions"

### Reports

**Not observed**. Likely basic business reports.

### Matrix Settings

**Known features** (from Q1 2025 update):

- Linear inches, linear feet, square feet measurement options
- Used for pricing matrix configuration

### Settings > Automated Email Templates

**Not directly observed**, but the system supports:

- Automatic mockup submission emails to customers
- Production stage notifications to customer's print production manager
- Email configuration with Gmail, Workspace, or Outlook
- One-click email connection (fixed in Q1 2025 to properly set From/Reply-To)
- SMS messaging via Twilio integration

---

## 5. Friction Points (Jobs/Production Focus)

### Critical

| #   | Friction Point                        | Impact                            | Details                                                                                                                                                                                                    |
| --- | ------------------------------------- | --------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **No screen room stage**              | Missing critical workflow step    | Screen printing requires burning screens before production. No tracking for mesh count, emulsion, burn status, registration. Jobs jump from mockup approval to ordering to pressing with no prep tracking. |
| 2   | **Quote = Invoice (no separation)**   | Cannot track quotes independently | No draft/sent/accepted/declined states. Quote immediately becomes invoice. Can't send estimates without creating a production item.                                                                        |
| 3   | **Qty entry blocks on recalculation** | 2-3 min wasted per quote          | Each size qty entry triggers server-side recalc. Can't tab through fields. Single biggest time waste.                                                                                                      |

### High

| #   | Friction Point                         | Impact                                     | Details                                                                                                             |
| --- | -------------------------------------- | ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------- |
| 4   | **No job priority/urgency indicators** | Can't see what's overdue                   | Dashboard shows lanes but no visual urgency. No due dates on cards, no color-coding for at-risk jobs.               |
| 5   | **No drag-and-drop between stages**    | Extra clicks to move jobs                  | Likely requires opening each job to change stage (based on Angular tech stack).                                     |
| 6   | **Single PRODUCTION substage**         | No visibility into production sub-steps    | Real production involves: screen prep, registration, printing, quality check, curing. All collapsed into one stage. |
| 7   | **P.O. system not mature**             | Still being built in 2025                  | The P.O. system was listed as "close to completion" in early 2025 — indicating it was missing or broken previously. |
| 8   | **No multi-user/staff assignments**    | Can't assign jobs to specific team members | Staff accounts with role-based permissions listed as 2025 roadmap item. Currently single-user.                      |

### Medium

| #   | Friction Point                              | Impact                             | Details                                                                |
| --- | ------------------------------------------- | ---------------------------------- | ---------------------------------------------------------------------- |
| 9   | **Mandatory wizard steps**                  | Wasted clicks on unused features   | Ink Style and Finishing are mandatory steps that many shops don't use. |
| 10  | **No inventory tracking**                   | Can't track in-house stock         | Listed as 2025 stretch goal. Must check vendor stock manually.         |
| 11  | **No job-level notes visible on dashboard** | Must open each job for context     | Dashboard cards likely show minimal info (job name, customer).         |
| 12  | **Empty dashboard has no guidance**         | New users see a blank white screen | No onboarding, no "create your first quote" CTA, no sample data.       |

### Low

| #   | Friction Point             | Impact                              | Details                                                                          |
| --- | -------------------------- | ----------------------------------- | -------------------------------------------------------------------------------- |
| 13  | **No keyboard navigation** | Mouse-only workflow                 | Tab navigation, keyboard shortcuts not documented.                               |
| 14  | **Limited reporting**      | Can't analyze production throughput | No evidence of production-focused reports (time per stage, bottleneck analysis). |

---

## 6. Strengths (What Print Life Does Well)

### Production-Focused Design

| Strength                                | Why It Matters                                                                                                    | Rating   |
| --------------------------------------- | ----------------------------------------------------------------------------------------------------------------- | -------- |
| **4-lane Kanban matches real workflow** | Design → Order → Print → Ship is the actual production sequence. Intuitive for shop owners.                       | Strong   |
| **Substage tabs within lanes**          | Adds granularity without overwhelming. ASSIGN/MOCK-UP/SUBMITTED under Design is clever.                           | Strong   |
| **Auto mockup submission**              | Automatically emails mockup to customer for approval. Removes manual follow-up step.                              | Strong   |
| **Invoice = single source of truth**    | Everything (art files, mockups, sep files, P.O.s) attaches to the invoice. One place to find everything.          | Moderate |
| **Delivery-date-based organization**    | "Production organized based on delivery date set by you and your customer" — simple but effective prioritization. | Moderate |
| **Integrated vendor catalogs**          | S&S, SanMar, Alphabroder catalogs with live stock levels built into quoting.                                      | Strong   |
| **QuickBooks sync**                     | All invoices auto-sync to QB Online. Critical for most small shops.                                               | Strong   |
| **Multi-payment processor support**     | Stripe, Square, PayPal, Authorize.net, QB Payments — flexibility.                                                 | Moderate |

### What We Should Learn From

1. **The 4-lane model is right** — Design/P.O./Production/Shipping maps to reality. We should adopt a similar high-level structure but add more granularity.
2. **Auto-notification at stage transitions** — Automatically emailing customers when mockups are ready is excellent. We should expand this to all stage transitions.
3. **Files attached to invoices** — The mental model of "everything about this job lives on its invoice" is simple and effective. We should adopt this but with a richer "Job" entity.
4. **Delivery date as organizer** — Simple but powerful. We should sort/filter by delivery date prominently.

---

## 7. Screenshots Index

| #   | Filename                                | Description                        | Key Observations                                                                                                                                                                                                                               |
| --- | --------------------------------------- | ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 01  | `printlife-01-dashboard.png`            | Invoice Dashboard (empty state)    | 4 production lanes visible: Design (Assign/Mock-up/Submitted), P.O. (Order Queue/Ordered), Production (Production), Shipping (Ship/Local Pickup). All lanes empty. 11 sidebar nav items. Search bar + New Client/New Quote buttons in top bar. |
| 02  | `printlife-02-new-quote-step1.png`      | New Quote — Step 1: Add Items      | Product catalog grid view. Filter sidebar (Categories, Brand, Colors, Styles, Fit). Product cards with images, prices, color counts. 6-step stepper at bottom. Two tabs: "Customer Supplied Items" and standard catalog.                       |
| 03  | `printlife-03-product-detail-modal.png` | Product Detail Modal (Gildan 5000) | Full product specs, description text, color swatches along bottom. BACK and ADD ITEM buttons. Shows detailed product info including sustainability certifications.                                                                             |

**Note**: Browser automation tools were not available for this session, so exploration was limited to these 3 previously captured screenshots plus web research. Additional screenshots needed for: Invoice List, Purchase Orders, Todo, Receivables, Clients, Reports, Settings > Email Templates, and individual job detail views.

---

## 8. Key Insights for Mokumo

### What to Adopt (Learn From)

1. **Kanban production dashboard** — The 4-lane model is intuitive and maps to real workflow. Adopt the same high-level structure.
2. **Substage tabs** — Within each lane, substages add needed granularity. The ASSIGN → MOCK-UP → SUBMITTED flow under Design is well-conceived.
3. **Auto-email on stage transitions** — Automatically notifying customers (especially for mockup approval) saves significant time.
4. **Files-on-job model** — Attaching art, mockups, and sep files directly to the job/invoice is the right mental model.
5. **Delivery date organization** — Sort and filter by delivery date as the primary organizer.

### What to Do Better

1. **Add Screen Room stage** — This is Print Life's biggest production gap. Screen printing requires tracking screen prep (mesh count, emulsion type, burn status, registration). We should add a dedicated Screen Room lane between Design and Production.

2. **Separate Quote and Invoice** — Print Life conflates these. We should have distinct entities: Quote (draft → sent → accepted → declined) and Invoice (generated from accepted quote). This enables proper quote tracking.

3. **Rich job cards on dashboard** — Print Life's empty lanes give no context. Our job cards should show: customer name, due date, priority badge, assignment, thumbnail, and progress indicator.

4. **Drag-and-drop stage transitions** — Enable dragging job cards between stages for quick workflow management. Print Life likely requires opening each job to change stages.

5. **Due date urgency indicators** — Color-code job cards: green (on track), yellow (due soon), red (overdue). Print Life has no visible urgency system.

6. **Multi-user with assignments** — Print Life is essentially single-user. We should support assigning jobs to specific team members and filtering the dashboard by assignee.

7. **Production sub-stages** — Break the single "Production" stage into meaningful sub-steps: Screen Prep → Registration → Printing → Quality Check → Curing. Configurable per shop.

8. **Non-blocking calculations** — Print Life's recalculation blocking is their #1 user complaint. All our calculations must be instant and non-blocking.

9. **Keyboard navigation** — Tab through all fields, keyboard shortcuts for common actions (N for new quote, arrow keys for stage navigation).

10. **Empty state with guidance** — When the dashboard is empty, show onboarding guidance: "Create your first quote to see jobs here" with a prominent CTA.

### Proposed Stage Model for Mokumo

```text
┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐
│  DESIGN  │  │  SCREEN  │  │PRODUCTION│  │ FINISHING │  │ SHIPPING │
│          │  │   ROOM   │  │          │  │          │  │          │
│ Assign   │  │ Queue    │  │ Press    │  │ QC       │  │ Pack     │
│ Mockup   │  │ Burn     │  │ Print    │  │ Fold/Tag │  │ Ship     │
│ Approval │  │ Register │  │          │  │          │  │ Pickup   │
│ Revision │  │ Ready    │  │          │  │          │  │ Deliver  │
└──────────┘  └──────────┘  └──────────┘  └──────────┘  └──────────┘
```

**Key additions vs Print Life**:

- **Screen Room** lane (entirely missing in Print Life)
- **Finishing** lane (quality check, fold/tag)
- **Revision** substage under Design (for customer change requests)
- **Pack** substage under Shipping (for bulk order packing)
- P.O. tracking integrated into the job detail (not a separate lane) — purchase orders are a task within the workflow, not a production stage

---

## 9. Technical Observations

- **Tech stack**: Angular SPA with Materialize CSS framework
- **State management**: Session-based (progress lost on navigation)
- **Pricing calculation**: Server-side, slow (blocking issue)
- **Product data**: CDN-sourced from S&S Activewear, SanMar, Alphabroder
- **Email**: Gmail/Workspace/Outlook integration, Twilio for SMS
- **Payments**: Stripe, Square, PayPal, Authorize.net, QB Payments
- **Shipping**: EasyPost integration
- **Accounting**: QuickBooks Online one-way sync
- **Development team**: Solo developer (bus factor = 1)
- **User base**: ~200 shops

---

## 10. Gaps Requiring Further Exploration

The following areas could not be observed due to lack of browser automation tools. These should be explored in a future session with Playwright:

1. **Individual job detail view** — What fields/info appear when you open a job?
2. **Stage transition mechanism** — Is it drag-and-drop, button click, or dropdown?
3. **Job card content** — What info shows on each card within a dashboard lane?
4. **Automated email templates** — What templates exist? What triggers them?
5. **Todo section** — How are tasks structured? Linked to jobs?
6. **Receivables** — What does the A/R view look like?
7. **Reports** — What reports are available?
8. **Invoice List** — What columns, filters, and sorting options?
9. **Purchase Orders tab** — Current state of the rebuilt P.O. system
10. **Settings pages** — Full settings exploration
11. **Drag-and-drop behavior** — Can you drag cards between lanes?
12. **Search behavior** — What happens when you search? Results format?

---

## Related Documents

- `docs/competitive-analysis/print-life-quoting-analysis.md` — Quoting feature analysis
- `docs/competitive-analysis/print-life-journey-quoting.md` — Quoting journey map
- `docs/competitive-analysis/customer-management-competitive-analysis.md` — CRM competitive analysis

## Sources

- [The Print Life Official Site](https://www.theprintlife.com/)
- [The Print Life Services](https://www.theprintlife.com/our-services/)
- [Print Life Q1 2025 Updates](https://www.theprintlife.com/quarter-1-2025-print-life-updates/)
- [Print Life 2025 Dev Roadmap](https://www.theprintlife.com/2025-dev-roadmap/)
- [Print Life 2024 Update](https://www.theprintlife.com/the-print-life-screen-print-management-software-2024-update-is-live/)
- [Print Life Welcome/About](https://www.theprintlife.com/welcome-to-the-print-life-screen-print-management-software/)
- [Print Life Our Story](https://www.theprintlife.com/our-story/)
