---
title: 'Invoicing Vertical Build'
subtitle: 'Full invoicing system — schemas, list page, form, detail view, overlays, and integrations. 30 new files, 8 modified, 314 tests passing.'
date: 2026-02-11
phase: 1
pipelineName: invoicing
pipelineType: vertical
products: [invoices, quotes, customers]
tools: []
stage: build
tags: [feature, build]
sessionId: 'ba5ae290-306e-47a6-b09b-c2c10320dad0'
branch: 'session/0211-invoicing-build'
status: complete
---

## Build Summary

| Stat           | Value |
| -------------- | ----- |
| New Files      | 30    |
| Modified Files | 8     |
| Tests Passing  | 314   |
| Quality Gate   | 10/10 |

## Build Phases

### Phase 0 — Data Foundation

Zod schemas for invoices and credit memos. Status state machine (`isValidStatusTransition`), financial calculators with big.js precision, mock data (8 invoices, 11 payments, 2 credit memos). All math uses `money()` / `round2()` / `toNumber()` — zero floating-point.

### Phase 1 — List Page

Stats bar (outstanding, overdue, paid this month, avg days to pay), smart view tabs (All/Draft/Outstanding/Overdue/Paid), data table with sort, search, batch ops, desktop table + mobile cards, and overdue badge with pulse animation.

### Phase 2 — Form + Detail View

Full invoice form (customer, line items, pricing summary, deposit, payment terms), detail view with payment ledger, reminder timeline, change diff panel, audit log, and context-aware action buttons per status.

### Phase 3 — Overlays + Edit

Record Payment sheet, Send Reminder modal, Void Invoice dialog (destructive, permanent), Create Credit Memo modal (line-item selection, bounded by invoice total), and edit page (draft-only guard).

### Phase 4 — Integration Points

Sidebar navigation (Receipt icon), Customer detail invoices tab, Quote detail "Create Invoice" button (accepted quotes only), and all cross-vertical navigation wiring.

## Key Architecture Decisions

### big.js for All Financial Arithmetic

Every monetary calculation goes through `lib/helpers/money.ts`. Schema invariants use `Big.eq()` for exact comparison. IEEE 754 floating-point is never used for money — not even for simple addition.

### Status State Machine

`isValidStatusTransition()` enforces: draft→sent→partial→paid, with void as terminal from any non-paid state. All UI actions check transitions before enabling buttons.

### Immutability After Send

Edit page redirects to detail view for non-draft invoices. InvoiceForm rejects non-draft mode. No backdoor to modify sent/partial/paid invoices.

### Overdue Is Computed, Never Stored

Single `computeIsOverdue()` function used everywhere (stats, table, detail, badge). Compares `dueDate < today AND balanceDue > 0 AND status in [sent, partial]`.

### Conditional Rendering for Dialog State

React 19 ESLint forbids `setState` in effects. All sheet/dialog components use conditional rendering (`{show && <Component />}`) so React unmounts/remounts, naturally resetting useState hooks.

## Quality Gate Results

| #   | Category              | Result |
| --- | --------------------- | ------ |
| 1   | Visual Hierarchy      | Pass   |
| 2   | Spacing & Layout      | Pass   |
| 3   | Typography            | Pass   |
| 4   | Color Usage           | Pass   |
| 5   | Interactive States    | Pass   |
| 6   | Icons                 | Pass   |
| 7   | Motion & Animation    | Pass   |
| 8   | Empty & Error States  | Pass   |
| 9   | Accessibility         | Pass   |
| 10  | Jobs Filter (Density) | Pass   |

Fixes applied during quality gate: `font-bold`→`font-semibold` (1), `role="alert"` additions (2), `aria-hidden="true"` on decorative icons (3), empty state icon sizes to `size-12` (2), search no-results now quotes query.

## Files Created

| File                                                   | Phase |
| ------------------------------------------------------ | ----- |
| `lib/schemas/invoice.ts`                               | 0     |
| `lib/schemas/credit-memo.ts`                           | 0     |
| `lib/helpers/invoice-utils.ts`                         | 0     |
| `lib/helpers/money.ts`                                 | 0     |
| `lib/schemas/__tests__/invoice.test.ts`                | 0     |
| `lib/schemas/__tests__/credit-memo.test.ts`            | 0     |
| `components/features/OverdueBadge.tsx`                 | 1     |
| `invoices/page.tsx`                                    | 1     |
| `invoices/_components/InvoiceStatsBar.tsx`             | 1     |
| `invoices/_components/InvoicesSmartViewTabs.tsx`       | 1     |
| `invoices/_components/InvoicesDataTable.tsx`           | 1     |
| `invoices/_components/InvoiceForm.tsx`                 | 2     |
| `invoices/_components/InvoiceLineItemRow.tsx`          | 2     |
| `invoices/_components/InvoicePricingSummary.tsx`       | 2     |
| `invoices/_components/DepositSection.tsx`              | 2     |
| `invoices/_components/PaymentTermsSection.tsx`         | 2     |
| `invoices/new/page.tsx`                                | 2     |
| `invoices/_components/ReviewSendSheet.tsx`             | 2     |
| `invoices/[id]/page.tsx`                               | 2     |
| `invoices/_components/InvoiceDetailView.tsx`           | 2     |
| `invoices/_components/InvoiceActions.tsx`              | 2     |
| `invoices/_components/PaymentLedger.tsx`               | 2     |
| `invoices/_components/ChangeDiffPanel.tsx`             | 2     |
| `invoices/_components/ReminderTimeline.tsx`            | 2     |
| `invoices/_components/RecordPaymentSheet.tsx`          | 3     |
| `invoices/_components/SendReminderModal.tsx`           | 3     |
| `invoices/_components/VoidInvoiceDialog.tsx`           | 3     |
| `invoices/_components/CreateCreditMemoModal.tsx`       | 3     |
| `invoices/[id]/edit/page.tsx`                          | 3     |
| `customers/[id]/_components/CustomerInvoicesTable.tsx` | 4     |

## Mock Data Coverage

| Invoice  | Status       | Total  | Notes                        |
| -------- | ------------ | ------ | ---------------------------- |
| INV-0001 | Paid         | $765   | 2 payments (check + square)  |
| INV-0002 | Sent/Overdue | $2,614 | Past due 27 days, 1 reminder |
| INV-0003 | Draft        | $855   | Deposit requested $427.50    |
| INV-0004 | Paid         | $1,850 | Holiday merch, 2 payments    |
| INV-0005 | Partial      | $840   | Deposit received, due in 4d  |
| INV-0006 | Sent         | $3,200 | Wholesale, due in 17d        |
| INV-0007 | Partial      | $2,100 | ACH + Zelle, due in 9d       |
| INV-0008 | Void         | $450   | Customer cancelled           |

Plus 11 payment records and 2 credit memos covering check, cash, square, venmo, zelle, and ACH methods.

## Lessons Learned

### big.js Is Non-Negotiable for Financial UI

Even "display-only" components that compute stats (sums, averages) must use big.js. Floating-point errors compound across 8 invoices with multi-payment ledgers. The `money()` wrapper makes it painless.

### Quality Gate Catches Real Issues

The 10-category audit found 8 fixable issues across typography (`font-bold`), accessibility (`role="alert"`, `aria-hidden`), and empty states (icon sizing). All fixed in 3 commits with zero regressions.

### Conditional Rendering Beats useEffect Reset

React 19 ESLint flags `setState` in effects. The pattern `{show && <Sheet />}` is cleaner — unmount/remount naturally resets all hooks. Applied to RecordPaymentSheet, SendReminderModal, VoidInvoiceDialog, and CreateCreditMemoModal.

---

## Artifacts

- **PR**: [#50 — Invoicing vertical build](https://github.com/cmbays/mokumo/pull/50)
- **Breadboard**: `docs/breadboards/invoicing-breadboard.md`
- **Research spikes**: `docs/spikes/invoicing-*.md` (6 files)
- **Plan**: `.claude/plans/zesty-wibbling-river.md`
