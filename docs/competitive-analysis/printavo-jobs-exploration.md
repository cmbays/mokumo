# Printavo Competitive Analysis — Jobs & Production Workflow

> **Date**: 2026-02-12
> **Method**: Web research (help docs, blog posts, API docs, review sites, forums)
> **Note**: Browser automation was unavailable; this analysis is compiled from public documentation, user reviews, marketing materials, and API schema exploration.

---

## 1. Navigation Map

### Primary Navigation (Left Sidebar)

| Section             | Purpose                    | Sub-sections                                                                               |
| ------------------- | -------------------------- | ------------------------------------------------------------------------------------------ |
| **Dashboard/Home**  | Today's overview           | Today screen (mobile), calendar overview                                                   |
| **Sales**           | Quotes pipeline            | Quotes list, new quote creation                                                            |
| **Invoices/Orders** | Active & completed jobs    | Invoices list, sorted by status                                                            |
| **Calendar**        | Visual scheduling          | Monthly / Weekly / Daily views                                                             |
| **Tasks**           | Action items               | Tasks tab (all tasks across jobs)                                                          |
| **Customers**       | CRM                        | Customer list, customer detail/portal                                                      |
| **Financials**      | Money                      | Analytics, Revenue & Expenses, Payments                                                    |
| **Power Scheduler** | Production board (Premium) | Gantt-style multi-department view                                                          |
| **Merch Stores**    | E-commerce                 | Online storefronts                                                                         |
| **My Account**      | Settings                   | Statuses, Automations, Workflow Customization, Preset Task Lists, Approvals, Types of Work |

### Key Routes / Views

- `/quotes` — Quotes pipeline (all estimates, sales funnel)
- `/invoices` — Invoices/orders list (jobs that left quote status)
- `/calendar` — Monthly/Weekly/Daily calendar views
- `/tasks` — Central tasks tab
- `/customers` — Customer management
- `/analytics` — Revenue & Expenses reporting
- `/power-scheduler` — Premium production scheduling board
- `/my-account/statuses` — Status customization
- `/my-account/automations` — Automation rules builder
- `/my-account/workflow` — Workflow customization (Types of Work, Add Work to Schedule)

---

## 2. Happy Path Walkthrough — Creating a Job

### Step-by-Step Flow

| #   | Action                               | Clicks       | Notes                                               |
| --- | ------------------------------------ | ------------ | --------------------------------------------------- |
| 1   | Click "+ Quote" (or Sales > + Quote) | 1            | Top-level action, always accessible                 |
| 2   | Select or create customer            | 1-3          | Search existing or "+ New Customer"                 |
| 3   | Add Line Items (garments)            | 2+           | Search products, select sizes/quantities            |
| 4   | Group into Line Item Groups (LIG)    | 1-2          | Bundle by imprint/decoration type                   |
| 5   | Add Imprint info per LIG             | 2-3          | Print location, pantone colors, thread counts       |
| 6   | Upload mockups/artwork               | 2-3          | "+ Mockup" button in imprint modal, drag-drop files |
| 7   | Apply pricing matrix                 | 2            | Select matrix + delineator, click "Refresh Pricing" |
| 8   | Add Details (dates, notes, PO#)      | 3-5          | Customer Due Date, Production Due Date, notes       |
| 9   | Save Quote                           | 1            | Quote created with default gray "Quote" status      |
| 10  | Send for approval                    | 2-3          | Via messaging system or automation trigger          |
| 11  | Customer approves                    | 0            | Customer clicks approve link in email               |
| 12  | Status changes → Invoice             | 1 (or auto)  | Manual status change or automation                  |
| 13  | Move through production statuses     | 1 per status | Each status change = 1 click or barcode scan        |

**Estimated total clicks**: ~20-30 for full quote creation to production handoff

### Mobile App Flow (Simplified)

The mobile app uses a 3-step wizard:

1. **Sales > + Quote** → Select customer
2. **Line Items** tab → Add products
3. **Details** tab → Dates, notes → **Save**

---

## 3. Production Workflow

### 3.1 Status System

Statuses are the **core workflow engine**. They are:

- **Fully customizable** — name, color, order
- **Color-coded** — shops choose colors, typically by department
- **Binary type** — each status is either "Quote" or "Invoice" type
- **Default** — gray "Quote" status (not editable) is default for new quotes

**Typical Status Flow**:

```text
Quote (gray, default)
  → Quote Sent / Out for Approval
  → Quote Approved
  → Art Approved / Pre-Production
  → In Production / On Press
  → Quality Check
  → Ready for Pickup / Shipping
  → Completed / Delivered
  → Paid / Closed
```

**Configuration**: My Account > Customize Order Statuses

- Name, edit, delete statuses
- Select colors
- Set as "Quote" or "Invoice" type
- Reorder workflow sequence

**Key insight**: Statuses are "stopping points" — they represent waiting states:

- Waiting for department action
- Waiting for customer response
- Waiting for vendor/distributor
- Job complete

### 3.2 Calendar System

Three views with drag-and-drop scheduling:

| View        | Granularity | Use Case                            |
| ----------- | ----------- | ----------------------------------- |
| **Monthly** | Day-level   | Overview of entire month's schedule |
| **Weekly**  | Hour-level  | Detailed weekly planning            |
| **Daily**   | Hour-level  | Granular daily scheduling           |

**Key behaviors**:

- Dragging a job to a new date automatically updates **Production Due Date**
- Alert fires if Production Due Date is dragged past Customer Due Date (failsafe)
- Jobs appear on calendar based on configurable status trigger
- Tasks associated with a job visible when clicking the order on calendar

### 3.3 Dual Dates

Every order has TWO dates:

| Date                    | Purpose                        | Calendar Behavior                                    |
| ----------------------- | ------------------------------ | ---------------------------------------------------- |
| **Production Due Date** | When job should be produced    | Drives calendar placement, updated by drag-drop      |
| **Customer Due Date**   | When customer expects delivery | Failsafe boundary, syncs to QuickBooks as "Due Date" |

Production Due Date should always be BEFORE Customer Due Date. This separation is critical for shops that need buffer time between production and delivery.

### 3.4 Power Scheduler (Premium Only)

A Gantt-style production board for multi-department tracking:

**Core Concept**: "Types of Work" — each decoration method (screen printing, embroidery, digital, finishing) is an independent workflow with custom steps.

**Configuration**:

- My Account > Workflow Customization > Types of Work
- Each Type of Work has custom steps and step statuses
- Types of Work are associated with Stations
- Can be preassigned to pricing matrices

**Scheduling Methods**:

1. Click "Date" cell → select from popup calendar
2. Click and drag imprint row onto a date row
3. Reschedule by dragging to new date

**Filters & Views**:

- Filter by dates, types of work, stations
- Save custom views (Super Admins can share views with all users)
- Track multiple decoration types on a single job simultaneously

**Key strength**: Shops with screen printing AND embroidery AND heat press can track all departments independently on one board.

### 3.5 Tasks & Preset Task Lists

**Tasks** are non-sequential action items (e.g., "Mix ink", "Set up screens", "Re-order blanks").

**Where tasks appear**:

- Calendar preview modal (click a job)
- "Tasks" tab on individual job
- Central "Tasks" tab in left sidebar

**Preset Task Lists**:

- Created at My Account > Preset Task List
- One-click application to any job
- Can be auto-applied via automation (e.g., when artwork approved → assign production task list)
- Each task can be assigned to specific users/departments

### 3.6 Automations

**Location**: My Account > Automation

**Available Triggers**:

| Trigger                                  | Example                   |
| ---------------------------------------- | ------------------------- |
| If status changed to...                  | "Artwork Approved"        |
| If all tasks in preset list completed... | All pre-press tasks done  |
| If imprints added to Power Scheduler...  | Work scheduled            |
| If type of work step status changed...   | Screen burning complete   |
| If requested approval is approved...     | Customer approved artwork |
| If quote/invoice paid in full...         | Payment received          |

**Available Actions**:

| Action                       | Example                   |
| ---------------------------- | ------------------------- |
| Change status to...          | Move to "In Production"   |
| Send email and/or text to... | Notify customer of status |
| Apply preset task list...    | Assign production tasks   |
| Request payment for X%...    | Request 50% deposit       |
| Request approval...          | Send artwork for approval |

**Key behavior**: One trigger can fire MULTIPLE actions. Example chain:

1. Trigger: Customer approves quote
2. Actions: Change status to "Quote Approved" + Request 50% payment + Assign production task list

### 3.7 Barcoding (Premium)

- QR codes built into every quote/invoice
- Scan with phone camera or barcode scanner
- Pulls up job details instantly
- Departments can scan to update status, check artwork, log defects
- Enables hands-free status tracking on production floor

### 3.8 Customer-Facing Features

**Customer Portal**:

- View all orders, quotes, artwork approvals, account balance
- Enlarge artwork files from public invoice view
- Approve quotes and artwork via email links

**Approval Types**:

- Quote Approval (pricing/scope)
- Artwork Approval (mockups/proofs)
- Approvals can be separated or combined
- Created at My Account > Approvals
- Sent via messaging system or automated

**Messaging System**:

- Accessible on every quote
- Hosts all order details and communications
- Thread-based per order
- Supports shortcodes for dynamic content

### 3.9 Shortcodes (Template Variables)

Dynamic content injection for emails/messages:

| Category | Examples                                                                         |
| -------- | -------------------------------------------------------------------------------- |
| Customer | `[customer-full-name]`, `[customer-company-name]`, `[customer-email-address]`    |
| Invoice  | `[invoice-id]`, `[invoice-status]`, `[invoice-nickname]`, `[invoice-public-url]` |
| Owner    | `[invoice-owner-first-name]`, `[invoice-owner-email-address]`                    |
| Payment  | `[payment-request-amount]`                                                       |
| Address  | `[invoice-shipping-address]`, `[invoice-billing-address]`                        |
| Custom   | `[work-order-public-url]`                                                        |

### 3.10 Purchase Orders & Receiving (Premium)

- Create and share purchase orders
- **Receiving** tracks goods against POs
- Bulk and partial receiving options
- Smart filters: "Needs to Receive" / "Received"
- Color coding: Yellow = partially received, Green = fully received
- "Managed Goods" tab organizes all purchasing/receiving tools

### 3.11 Analytics & Reporting

- Located under Financials > Analytics > Revenue & Expenses
- Total sales tracking (paid and unpaid)
- Sales by status, by owner, by date range
- Sales tax reporting
- Expense tracking per job and per shop
- Profit/loss per individual order
- Charts: sales by date, employee, invoice status

---

## 4. Data Model (from GraphQL API)

### Core Entities

```text
OrderUnion (Quote | Invoice)
├── id, visualId
├── contact / owner
├── customerNote, productionNote
├── customerDueAt (Customer Due Date)
├── tags[]
├── shippingAddress
│   ├── companyName, customerName
│   ├── address1, address2, city, stateIso, zipCode
├── LineItemGroup[]
│   ├── LineItem[]
│   │   └── status (LineItemStatus enum)
│   └── Imprint (mockups, print details)
├── Task[]
│   └── status, taskable (TaskableUnion)
├── Status
│   └── statusType enum
├── Transaction[]
│   └── TransactionDetail[]
└── Thread[] (messaging)

Customer
├── id, fullName, email
├── addresses (CustomerAddress[])
└── contacts (Contact[])

Status
├── id, statusType
├── color, name, order
└── type (quote | invoice)
```

### Query Capabilities

- Filter orders by production date range, status IDs
- Sort by visual ID
- Cursor-based pagination
- Full CRUD via mutations

---

## 5. Pricing Tiers

| Plan         | Price                | Key Features                                                                                                                  |
| ------------ | -------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| **Starter**  | $99/mo               | Core quoting, invoicing, calendar, basic workflow                                                                             |
| **Standard** | $149/mo              | + Automations, enhanced features                                                                                              |
| **Premium**  | $199-399/mo (varies) | + Power Scheduler, Barcoding, Receiving, Tags, Text Messaging, Pricing Matrices, Domain Customization, Production File Upload |

Free trial available. All plans are cloud-hosted with web + mobile access.

---

## 6. Friction Points

### Critical

| Issue                         | Description                                                                                                                             |
| ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| **Accounting inaccuracies**   | Doesn't handle customer overpayments, sales tax reporting has "horror stories", QuickBooks sync requires manual review of every invoice |
| **Payment processor lock-in** | Removed all third-party payment processors after VC buyout; only their in-house processor remains                                       |
| **Mobile app reliability**    | Periods where app won't open for months; won't load on some current iPhones                                                             |

### High

| Issue                         | Description                                                               |
| ----------------------------- | ------------------------------------------------------------------------- |
| **No role-based permissions** | No read/write permission system; problematic for shops with 20+ employees |
| **PO/Receiving limitations**  | Must receive entire order at once — no shortage/overage handling          |
| **No third-party brokerage**  | Can't manage outsourced/brokered orders                                   |
| **Slow feature development**  | Known for promising fixes and ignoring them "for literally years"         |

### Medium

| Issue                                    | Description                                                                   |
| ---------------------------------------- | ----------------------------------------------------------------------------- |
| **Status skipping bypasses automations** | Jumping statuses means associated automations don't fire                      |
| **Mobile editing bugs**                  | Editing jobs in app adds zeros to unfilled columns, auto-adds print locations |
| **No automated job run times**           | Can't automatically assign production time estimates                          |
| **Limited customization**                | Users want more workflow and UI customization options                         |
| **Power Scheduler premium-only**         | Core production feature locked behind highest tier                            |

### Low

| Issue                              | Description                                                            |
| ---------------------------------- | ---------------------------------------------------------------------- |
| **Scalability ceiling**            | Works well for small shops; users report outgrowing it at 20-30 people |
| **InkSoft integration fragmented** | Separate subscriptions despite shared parent company; separate logins  |

---

## 7. Strengths

### What Works Well

| Strength                                     | Why It Helps Shop Owners                                                                                      |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| **Color-coded, fully customizable statuses** | Instant visual scan of workflow state; matches any shop's actual process                                      |
| **Dual date system**                         | Separates "when to produce" from "when customer expects it" — critical for scheduling buffer                  |
| **Calendar drag-and-drop with failsafe**     | Fast rescheduling with built-in guard against missing customer deadlines                                      |
| **Automation chains**                        | One trigger → multiple actions eliminates manual busywork (status change + payment request + task assignment) |
| **Preset task lists**                        | One-click assignment of standard production checklists; ensures nothing is missed                             |
| **Barcode scanning**                         | Hands-free status updates on production floor; every department can track jobs                                |
| **Line Item Groups + Imprints**              | Flexible bundling by decoration type; each group gets its own mockups and pricing                             |
| **Mockup Creator**                           | Built-in tool to place designs on product images; no external design tool needed                              |
| **Types of Work (Power Scheduler)**          | Track screen printing, embroidery, digital, finishing as independent workflows on same job                    |
| **Customer portal with approvals**           | Self-service for customers reduces back-and-forth; automated approval workflow                                |
| **Shortcode system**                         | Dynamic personalization in all communications; reduces errors in notifications                                |
| **Simple onboarding**                        | Frequently praised for ease of setup and intuitive interface                                                  |

### Community & Ecosystem

- Large user base (thousands of shops)
- Active blog with best practices content ("PrintHustlers")
- Zapier integration for extending capabilities
- QuickBooks Online integration for accounting
- GraphQL API for custom integrations

---

## 8. Key Insights for Mokumo

### What to Learn From

1. **Status-centric workflow is the right model** — Printavo proves that customizable, color-coded statuses are the heart of shop management. Every feature (calendar, automations, scheduler) connects through statuses.

2. **Dual dates are essential** — Production Due Date vs. Customer Due Date is universally needed. The drag-drop failsafe (alert when production > customer date) is elegant.

3. **Automation = status triggers + action chains** — The trigger/action model (status change → email + task list + payment request) is powerful and shops love it. This should be a core feature, not premium.

4. **Preset task lists solve consistency** — Shops need repeatable checklists per job type. One-click application + automation integration makes this frictionless.

5. **Line Item Groups with imprint separation** — Grouping garments by decoration method and attaching mockups/pricing per group is the right data model for multi-decoration jobs.

6. **Barcode/QR scanning on production floor** — Physical-digital bridge is crucial for production tracking. Phone camera scanning is minimum viable; dedicated scanners are better.

7. **Types of Work for multi-department tracking** — Screen printing ≠ embroidery ≠ digital. Independent workflows per decoration type is a must-have for mature shops.

### What to Do Better

1. **Role-based permissions from Day 1** — Printavo's biggest architectural gap. Design user roles (Owner, Manager, Artist, Press Operator, Shipping) with granular permissions early.

2. **Better financial accuracy** — Use proper money arithmetic (we already have `big.js`). Accurate sales tax, overpayment tracking, and QuickBooks sync quality.

3. **Partial receiving/shortage handling** — Real shops deal with shorted orders constantly. Track partial receipts, overages, and substitutions per PO line item.

4. **Desktop-first, mobile-parity** — Printavo's mobile app is unreliable. Build responsive-first but ensure core flows work perfectly on desktop where production managers actually live.

5. **Don't gate production features behind premium** — Power Scheduler (production tracking) is a core need, not a luxury. Make basic production tracking available at all tiers.

6. **Faster status change (fewer clicks)** — Consider keyboard shortcuts, bulk status changes, and production-floor-optimized views with large touch targets.

7. **Brokerage/outsource tracking** — Support jobs that are partially or fully outsourced to contract printers. This is a gap competitors haven't solved either.

8. **Smart scheduling with capacity** — Printavo's calendar is date-based but doesn't track press capacity, estimated run times, or utilization. Add capacity-aware scheduling.

9. **Thread-per-topic messaging** — Printavo's per-order messaging is good but flat. Consider structured communication threads (artwork feedback, shipping questions, payment issues) within each job.

10. **Offline-capable production floor** — WiFi in shops is unreliable. Consider offline barcode scanning with sync-when-connected for production floor status updates.

---

## 9. Printavo Feature Matrix

| Feature                | Starter ($99) | Standard ($149) | Premium ($199+) |
| ---------------------- | :-----------: | :-------------: | :-------------: |
| Quoting & Invoicing    |       ✓       |        ✓        |        ✓        |
| Customer Management    |       ✓       |        ✓        |        ✓        |
| Calendar (3 views)     |       ✓       |        ✓        |        ✓        |
| Custom Statuses        |       ✓       |        ✓        |        ✓        |
| Tasks                  |       ✓       |        ✓        |        ✓        |
| Approvals              |       ✓       |        ✓        |        ✓        |
| QuickBooks Sync        |       ✓       |        ✓        |        ✓        |
| Zapier Integration     |       ✓       |        ✓        |        ✓        |
| Automations            |       ?       |        ✓        |        ✓        |
| Pricing Matrices       |               |                 |        ✓        |
| Power Scheduler        |               |                 |        ✓        |
| Barcoding              |               |                 |        ✓        |
| Receiving              |               |                 |        ✓        |
| Tags                   |               |                 |        ✓        |
| Text Messaging         |               |                 |        ✓        |
| Domain Customization   |               |                 |        ✓        |
| Production File Upload |               |                 |        ✓        |

---

## 10. Sources

### Official Documentation

- [Printavo Support: Customizing Job Statuses](https://support.printavo.com/hc/en-us/articles/360054178254-4-2-Customizing-Job-Statuses)
- [Printavo Support: Power Scheduler (Premium)](https://support.printavo.com/hc/en-us/articles/4414754434587-4-8-Power-Scheduler-Premium)
- [Printavo Support: Calendar Management Basics](https://support.printavo.com/hc/en-us/articles/360055969893-4-7-Calendar-Management-Basics)
- [Printavo Support: Automations](https://support.printavo.com/hc/en-us/articles/1500001649682-Printavo-s-Automations-What-You-Need-To-Know)
- [Printavo Support: Tasks & Task Lists](https://support.printavo.com/hc/en-us/articles/360054180054-4-6-Tasks-Task-Lists-Built-in-Accountability)
- [Printavo Support: Line Items and Line Item Groups](https://support.printavo.com/hc/en-us/articles/1260803273410-3-6-Line-Items-and-Line-Item-Groups)
- [Printavo Support: Adding Imprint Information](https://support.printavo.com/hc/en-us/articles/1260803671270-3-7a-Adding-Imprint-Information-Mockups-and-Pricing)
- [Printavo Support: Workflow FAQ](https://support.printavo.com/hc/en-us/articles/26953574954779-4-11-Printavo-Success-Workflow-FAQ)
- [Printavo Support: Statuses](https://support.printavo.com/hc/en-us/articles/1260804469010-Statuses)

### Blog Posts

- [Printavo Blog: Power Scheduler](https://www.printavo.com/blog/power-scheduler/)
- [Printavo Blog: Status Guide](https://www.printavo.com/blog/status-guide/)
- [Printavo Blog: 3 Ways To Use Statuses](https://www.printavo.com/blog/3-ways-to-use-statuses-in-printavo/)
- [Printavo Blog: What Statuses Should I Have?](https://www.printavo.com/blog/what-statuses-should-i-have-in-printavo/)
- [Printavo Blog: Barcodes in Your Shop](https://www.printavo.com/blog/barcodes-in-your-screen-printing-shop-with-printavo/)
- [Printavo Blog: Purchase Orders](https://www.printavo.com/blog/purchase-orders-have-arrived/)
- [Printavo Blog: Receiving](https://www.printavo.com/blog/print-shop-receiving-for-printavo/)
- [Printavo Blog: Shortcodes](https://www.printavo.com/blog/new-printavo-shortcodes-for-automation/)
- [Printavo Blog: Approvals Automation](https://www.printavo.com/blog/announcing-approvals-automation-in-printavo/)
- [Printavo Blog: Line Item Customization](https://www.printavo.com/blog/line-item-customization/)
- [Printavo Blog: 16 Status Change Notification Ideas](https://www.printavo.com/blog/16-status-change-notifications-for-screen-printing/)

### API Documentation

- [Printavo API v2.0 (GraphQL)](https://www.printavo.com/docs/api/v2)
- [Printavo API Query Operations](https://www.printavo.com/docs/api/v2/operation/query/)

### Review Sites

- [Capterra: Printavo Reviews](https://www.capterra.com/p/154421/Printavo/reviews/)
- [GetApp: Printavo](https://www.getapp.com/website-ecommerce-software/a/printavo/)
- [Software Advice: Printavo](https://www.softwareadvice.com/print-estimating/printavo-profile/)
- [SoftwareSuggest: Printavo](https://www.softwaresuggest.com/printavo)

### Competitor Comparisons

- [YoPrint: 6 Best Printavo Alternatives](https://www.yoprint.com/blog/6-best-printavo-alternatives)
- [DecoNetwork: Top 8 Screen Printing Software](https://www.deconetwork.com/top-8-screen-printing-shop-management-software-picks/)
- [DecoNetwork vs Printavo](https://www.deconetwork.com/deconetwork-vs-printavo/)
- [Teesom: InkSoft vs Printavo vs Teesom](https://teesom.com/the-essential-guide-inksoft-vs-printavo/)

### Forums

- [T-Shirt Forums: Teesom vs Printavo](https://www.t-shirtforums.com/threads/teesom-vs-printavo.896546/)
- [T-Shirt Forums: Has Anyone Used Printavo?](https://www.t-shirtforums.com/threads/has-anyone-actually-used-printavo.216153/)

### Mobile App

- [Printavo iOS App Store](https://apps.apple.com/us/app/printavo/id1191027240)
- [Printavo Blog: Mobile App](https://www.printavo.com/blog/printavo-mobile-app-now-on-android-and-ios/)
