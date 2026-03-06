---
title: 'Invoicing Breadboard'
subtitle: 'UI affordances, code affordances, wiring, and component boundaries for the invoicing vertical — the buildable blueprint before code.'
date: 2026-02-11
phase: 1
pipelineName: invoicing
pipelineType: vertical
products: [invoices, quotes, customers]
tools: []
stage: breadboard
tags: [plan, research]
sessionId: 'ba5ae290-306e-47a6-b09b-c2c10320dad0'
branch: 'session/0211-invoicing-breadboard'
status: complete
---

## Source Document

[docs/breadboards/invoicing-breadboard.md](https://github.com/cmbays/mokumo/blob/session/0211-invoicing-breadboard/docs/breadboards/invoicing-breadboard.md) →

## At a Glance

| Stat             | Value |
| ---------------- | ----- |
| Places           | 9     |
| UI Affordances   | 99    |
| Code Affordances | 44    |
| Data Stores      | 25    |
| Components       | 18    |
| Build Steps      | 13    |

## Places (Screens & Modals)

| ID   | Name             | Type              | Route               |
| ---- | ---------------- | ----------------- | ------------------- |
| P1   | Invoices List    | Page              | /invoices           |
| P2   | Invoice Detail   | Page              | /invoices/[id]      |
| P2.1 | Record Payment   | Sheet             | —                   |
| P2.2 | Send Reminder    | Modal             | —                   |
| P2.3 | Void Invoice     | Dialog            | —                   |
| P2.4 | Credit Memo      | Modal             | —                   |
| P3   | New Invoice Form | Page              | /invoices/new       |
| P3.1 | Review & Send    | Sheet             | —                   |
| P4   | Edit Invoice     | Page (Draft only) | /invoices/[id]/edit |

## Key Design Decisions

### Single Invoice + Partial Payments

One invoice for the full amount. Deposits recorded as partial payments. Balance due updates automatically. Simpler than two-invoice approach.

### Smart Deposit Defaults

Deposit amount pre-calculated from customer tier (standard=50%, contract=per agreement). Manual override with % or flat $ toggle.

### Quote-to-Invoice Conversion

One-click from accepted quote. Prices locked from quote (never recalculated). Change tracking shows what diverged. Tax recalculated from customer exempt status.

### Configurable Itemization

Toggle between itemized view (every component as separate line) and bundled view (one line per garment style) per invoice.

### Status Lifecycle

`draft → sent → partial → paid` with computed `overdue` (past due + unpaid). Void from any non-paid state. Credit memos for paid invoices.

## Component Reuse from Quoting

| Component          | Source                 | Reuse Strategy                  |
| ------------------ | ---------------------- | ------------------------------- |
| StatusBadge        | `components/features/` | Extend for invoice statuses     |
| CustomerCombobox   | `components/features/` | Reuse as-is                     |
| CollapsibleSection | `quotes/_components/`  | Reuse for form sections         |
| PricingSummary     | `quotes/_components/`  | Pattern reference (new impl)    |
| EmailPreviewModal  | `quotes/_components/`  | Pattern reference for reminders |

## New Components

| Component             | Purpose                                                             |
| --------------------- | ------------------------------------------------------------------- |
| InvoiceStatsBar       | 4 KPI cards: Outstanding, Overdue, Paid This Month, Avg Days to Pay |
| InvoicesDataTable     | Filterable table with smart view tabs and batch operations          |
| InvoiceForm           | Create/edit form shared between new + edit pages                    |
| PaymentLedger         | Table of payments with running balance                              |
| RecordPaymentSheet    | Slide-out form for recording payments                               |
| DepositSection        | Smart deposit with % / flat toggle                                  |
| ChangeDiffPanel       | Quote vs invoice change tracking                                    |
| ReminderTimeline      | Timeline of sent/scheduled payment reminders                        |
| CreateCreditMemoModal | Formal CM document creation                                         |
| OverdueBadge          | Shared badge with days count + pulse animation                      |

## Build Order

1. **Schema creation** (Medium) — invoice.ts, credit-memo.ts, payment method enum
2. **Constants update** (Low) — Status labels/colors, payment methods, CM reasons
3. **Mock data** (Medium) — 6-8 invoices, 10+ payments, 1-2 credit memos
4. **Shared components** (Low) — StatusBadge extension + OverdueBadge (parallel)
5. **Invoices List page** (Medium) — StatsBar + DataTable + smart view tabs + batch ops
6. **InvoiceForm + line items + pricing** (High) — Critical path — highest complexity, shared between new + edit
7. **Invoice Detail + actions + payment ledger** (High) — Detail view, context-aware actions, reminders, change diff
8. **New Invoice page + Review Sheet** (Medium) — Quote-to-invoice populate logic is key
9. **Detail modals/sheets** (Medium) — RecordPayment, SendReminder, Void, CreditMemo
10. **Edit Invoice page** (Low) — Reuses InvoiceForm, draft only
11. **Customer Detail integration** (Medium) — Invoices tab + financial summary on customer page
12. **Sidebar nav link** (Low) — Add "Invoices" between Quotes and Customers
13. **Quote Detail wiring** (Low) — "Create Invoice" button on accepted quotes

**Critical path:** 1 → 2 → 3 → 6 → 8 (InvoiceForm with quote-to-invoice conversion)

## Deferred to Phase 2

| Feature                   | Why Deferred                                        |
| ------------------------- | --------------------------------------------------- |
| PDF generation            | Requires library (react-pdf), not critical for mock |
| Real email sending        | Requires backend + SMTP                             |
| QuickBooks sync           | Requires OAuth + QBO API                            |
| Square payment gateway    | Requires Square SDK                                 |
| Late fee auto-calculation | Schema supports, UI deferred                        |
| Read receipts             | Requires customer portal                            |
| Customer portal           | Separate vertical per decision #7                   |
| Recurring invoices        | Contract customer feature, Phase 2                  |

## Input Documents

- [Invoicing Vertical Research](2026-02-10-invoicing-vertical-research.html) — Industry analysis, competitor deep-dive, 19 key decisions
- `docs/spikes/invoicing-decisions.md` — Decision record
- `docs/spikes/invoicing-ux-patterns.md` — Screen designs and component reuse
- `docs/spikes/invoicing-integration-map.md` — Schema dependencies and data flow
- `docs/spikes/invoicing-compliance.md` — Tax, legal, audit requirements
- `docs/breadboards/quoting-breadboard.md` — Upstream quoting vertical
