# Invoicing UX Patterns — Recommendations for Mokumo

> **Context**: Pre-build research for Mokumo invoicing vertical
> **Date**: 2026-02-10
> **Branch**: `session/0210-invoicing-research`

---

## Information Architecture

### Sidebar Position

Add "Invoices" between Quotes and Customers (natural workflow order):

```
Dashboard    /
Jobs         /jobs
Quotes       /quotes
Invoices     /invoices       <-- NEW
Customers    /customers
Screen Room  /screens
Garments     /garments
```

### Route Map

| Screen         | Route                 | Description                                       |
| -------------- | --------------------- | ------------------------------------------------- |
| Invoices List  | `/invoices`           | Filterable table with KPI stats bar               |
| Invoice Detail | `/invoices/[id]`      | Full view with payment ledger                     |
| New Invoice    | `/invoices/new`       | Create (standalone or from quote via `?quoteId=`) |
| Edit Invoice   | `/invoices/[id]/edit` | Edit draft invoice only                           |

### Cross-Links

```
Quote Detail → [Create Invoice] → /invoices/new?quoteId=[id]
Quote Detail → [View Invoice] → /invoices/[invoiceId]
Invoice Detail → [customer] → /customers/[customerId]
Invoice Detail → [quote] → /quotes/[quoteId]
Invoice Detail → [job] → /jobs/[jobId]
Customer Detail → Invoices tab → /invoices/[invoiceId]
```

---

## Key Screens

### Screen 1: Invoices List (`/invoices`)

**Pattern**: Mirrors Customers page — `StatsBar` + `SmartViewTabs` + `DataTable`

**Stats Bar (4 KPI Cards):**

| Metric            | Icon            | Purpose                      |
| ----------------- | --------------- | ---------------------------- |
| Total Outstanding | `DollarSign`    | Sum of all unpaid invoices   |
| Overdue           | `AlertTriangle` | Count and total past due     |
| Paid This Month   | `TrendingUp`    | Revenue collected this month |
| Avg Days to Pay   | `Clock`         | DSO metric                   |

**Smart View Tabs:**

| Tab         | Filter                  |
| ----------- | ----------------------- |
| All         | No filter               |
| Draft       | status === "draft"      |
| Outstanding | sent but not fully paid |
| Overdue     | past dueDate + unpaid   |
| Paid        | status === "paid"       |

**Data Table Columns:**

| Column       | Sortable | Notes                                        |
| ------------ | -------- | -------------------------------------------- |
| Invoice #    | Yes      | Clickable, action color                      |
| Customer     | Yes      | Links to customer detail                     |
| Status       | Yes      | StatusBadge with filter                      |
| Amount       | Yes      | Right-aligned, tabular-nums                  |
| Due Date     | Yes      | Relative ("Due in 5 days", "3 days overdue") |
| Balance Due  | Yes      | Remaining after partial payments             |
| Date Created | Yes      | Default sort: newest first                   |

**Batch Operations** (toolbar when rows selected):

- Send Selected
- Mark as Paid
- Send Reminder

### Screen 2: Invoice Detail (`/invoices/[id]`)

**Pattern**: Mirrors QuoteDetailView

**Layout:**

1. Sticky header: invoice # + status badge + action buttons
2. Customer info card with billing contact
3. Source info: linked quote #, linked job # (clickable)
4. Line items table
5. Pricing summary (subtotal, discounts, shipping, tax, total)
6. Payment section: Balance Due (prominent) + payment ledger + "Record Payment"
7. Reminder timeline
8. Notes (internal + customer-facing)

**Actions by Status:**

| Status    | Available Actions                               |
| --------- | ----------------------------------------------- |
| Draft     | Edit, Send, Delete                              |
| Sent/Open | Record Payment, Send Reminder, Void, Duplicate  |
| Overdue   | Record Payment, Send Reminder (escalated), Void |
| Paid      | View Receipt, Duplicate                         |
| Void      | Duplicate, Delete                               |

### Screen 3: New Invoice (`/invoices/new`)

**Pattern**: Mirrors QuoteForm with collapsible sections + sticky summary bar

**Two Entry Points:**

1. From scratch: sidebar/list "New Invoice" button
2. From accepted quote: `/invoices/new?quoteId=xxx` (auto-populates everything)

**Sections:**

1. Customer (auto-populated if from quote)
2. Line Items (from quote, editable, configurable itemization level)
3. Pricing (auto-calculated, can add extra charges)
4. Payment Terms (from customer default, editable) + Deposit Request
5. Notes (internal + customer-facing)

**Actions**: Cancel | Save as Draft | Review & Send

---

## Status Badge Design

| Status         | Style                                                 | Token                  |
| -------------- | ----------------------------------------------------- | ---------------------- |
| Draft          | `bg-muted text-muted-foreground`                      | Neutral, low emphasis  |
| Sent / Open    | `bg-action/10 text-action border border-action/20`    | Niji blue              |
| Partially Paid | `bg-warning/10 text-warning border border-warning/20` | Gold                   |
| Paid           | `bg-success/10 text-success border border-success/20` | Green                  |
| Overdue        | `bg-error/10 text-error border border-error/20`       | Red                    |
| Void           | `bg-muted text-muted-foreground`                      | Struck through, dimmed |

---

## Component Reuse Strategy

### Existing Components to Reuse

| Component            | Location                                    | Reuse For                      |
| -------------------- | ------------------------------------------- | ------------------------------ |
| `StatusBadge`        | `components/features/StatusBadge.tsx`       | Extend for InvoiceStatus       |
| `ColumnHeaderMenu`   | `components/features/ColumnHeaderMenu.tsx`  | Table column sorting/filtering |
| `CustomerCombobox`   | `components/features/CustomerCombobox.tsx`  | Customer selection             |
| `CollapsibleSection` | `quotes/_components/CollapsibleSection.tsx` | Form sections                  |
| `LineItemRow`        | `quotes/_components/LineItemRow.tsx`        | Invoice line items             |
| `PricingSummary`     | `quotes/_components/PricingSummary.tsx`     | Pricing section                |
| `DiscountRow`        | `quotes/_components/DiscountRow.tsx`        | Discount display               |
| `ArtworkPreview`     | `quotes/_components/ArtworkPreview.tsx`     | Line item artwork              |
| `EmailPreviewModal`  | `quotes/_components/EmailPreviewModal.tsx`  | Email preview                  |

### New Components Needed

| Component                 | Purpose                                   |
| ------------------------- | ----------------------------------------- |
| `InvoiceStatsBar`         | 4 KPI cards for list page                 |
| `PaymentLedger`           | Table of payments on invoice detail       |
| `RecordPaymentSheet`      | Slide-out form for recording payments     |
| `InvoiceActions`          | Context-aware action buttons per status   |
| `PaymentReminderTimeline` | Timeline of sent/scheduled reminders      |
| `OverdueBadge`            | Badge with days overdue + pulse animation |

---

## Design System Alignment

### "Linear Calm" Layer

- Status transitions: subtle opacity fades (200ms ease)
- Payment recording: smooth number counter animation for balance update
- Table row hover: `bg-muted/50`

### "Raycast Polish" Layer

- Real-time total calculation as line items edited
- Sticky summary bar on form (customer, total, status)
- Glass effect (`backdrop-blur-sm`) on sticky elements
- Toast notifications: "Invoice INV-1024 sent", "Payment recorded"

### "Neobrutalist Delight" Layer

- Primary CTAs: `shadow-brutal shadow-action/30` with press animation
- Status badge transitions: scale up briefly (1.05x) then settle
- Overdue status: subtle pulse animation on badge

---

## Payment Recording UX

**RecordPaymentSheet Fields:**

- Amount (pre-filled with balance due)
- Date (default: today)
- Method (dropdown: Check, Cash, Square, Venmo, Zelle, Credit Card, ACH, Other)
- Reference/Note (optional — check number, transaction ID)

**Payment Ledger Display:**

```
Payment History
───────────────────────────────────────────
Date         Method    Amount     Reference
Jan 15       Square    $500.00    Deposit
Feb 03       Check     $500.00    #4821
───────────────────────────────────────────
Total Paid:   $1,000.00
Balance Due:       $0.00
```

**Auto-transitions:**

- First payment < total → status becomes "partial"
- Total payments >= total → status becomes "paid"

---

## Payment Reminder Cadence

| Timing            | Message Tone      | Trigger        |
| ----------------- | ----------------- | -------------- |
| 3 days before due | Friendly reminder | Automatic      |
| On due date       | Payment due today | Automatic      |
| 3 days overdue    | Gentle follow-up  | Automatic      |
| 7 days overdue    | Second reminder   | Automatic      |
| 14+ days overdue  | Final notice      | Manual trigger |

(Phase 1: show timeline on detail page. Actual sending in Phase 3.)

---

## User Journeys

### Journey: Create Invoice from Accepted Quote

1. Chris sees quote with "Accepted" status
2. Opens quote detail → clicks "Create Invoice"
3. Navigates to `/invoices/new?quoteId=xxx`
4. All data pre-populated
5. Chris reviews, adjusts if needed (add rush fee, etc.)
6. Clicks "Review & Send" → review sheet opens
7. Invoice saved and "sent" (mock)
8. Navigates to invoice detail
9. Toast: "Invoice INV-1024 sent to River City Brewing Co."

### Journey: Record a Payment

1. Chris finds invoice in list (or via search)
2. Opens invoice detail
3. Clicks "Record Payment"
4. Sheet opens with balance due pre-filled
5. Selects "Check", enters check number
6. Clicks "Record"
7. Payment appears in ledger, balance updates
8. Status transitions to "Paid" (or "Partial")
9. Toast: "Payment of $487.50 recorded"

### Journey: Follow Up on Overdue

1. Dashboard shows "2 Overdue Invoices"
2. Chris clicks overdue invoice
3. Detail shows overdue badge, days count, reminder history
4. Clicks "Send Reminder" → email preview opens
5. Reviews, clicks "Send"
6. Reminder logged in timeline

---

## Anti-Patterns to Avoid

1. Don't bury invoice creation behind multiple menus
2. Don't show tax codes/categories simultaneously (use collapsible sections)
3. Reserve red exclusively for overdue/error states
4. Always pair status colors with text labels (accessibility)
5. Always use portrait PDF layout
6. Use real reply-to email address (not noreply@)
7. Show payment amount in email body (not just PDF attachment)
8. Auto-generate invoice numbers (never manual)
9. Design empty states with clear CTAs
10. Invoice form MUST mirror quote form pattern (consistency)
11. Don't separate invoicing from production workflow (reachable from job detail)
12. Never require double data entry from quote to invoice

---

## Sources

- Stripe Invoicing — status model, dashboard, workflow transitions
- FreshBooks — quote-to-invoice conversion, recurring invoices
- Square Invoices — installment payments, mobile-first
- Linear UI — dark mode design, clean aesthetic
- Existing Mokumo codebase — QuoteForm, CustomersDataTable patterns
- UX research: Eleken fintech best practices, InvoiceMaster psychology, designmodo billing forms
