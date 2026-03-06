---
title: 'DAL Migration: Invoices Route Group'
subtitle: 'Wave 2 consumer migration — all mock-data imports replaced with DAL calls'
date: 2026-02-17
phase: 1
pipelineName: 'Data Access Layer'
pipelineType: horizontal
products: [invoices]
tools: []
stage: build
tags: [build]
sessionId: '0ba68ef8-1b02-40be-a039-2c63d6d15cd1'
branch: 'session/0217-dal-migrate-invoices'
status: complete
---

## What Was Built

Migrated all 7 mock-data import sites in the invoices route group to use the Data Access Layer (DAL). This is Wave 2, Task 2.3 of the [DAL Architecture plan](https://github.com/cmbays/mokumo/blob/main/docs/plans/2026-02-16-dal-impl-plan.md).

**Epic:** #360 (DAL Architecture) | **Issue:** #158 | **PR:** #412

## Files Changed

| File                          | Pattern   | Change                                                                                           |
| ----------------------------- | --------- | ------------------------------------------------------------------------------------------------ |
| `invoices/page.tsx`           | Pattern 1 | Made async, `Promise.all([getInvoices(), getCustomers()])`, passes to children                   |
| `invoices/[id]/page.tsx`      | Pattern 2 | 4 array ops → `getInvoiceById`, `getCustomerById`, `getInvoicePayments`, `getInvoiceCreditMemos` |
| `invoices/[id]/edit/page.tsx` | Pattern 2 | `invoices.find()` → `getInvoiceById`, fetches customers+sourceQuote for form                     |
| `invoices/new/page.tsx`       | Pattern 2 | New fetch: customers, sourceQuote, invoiceCount → `initialInvoiceNumber`                         |
| `InvoiceStatsBar.tsx`         | Pattern 4 | Accepts `invoices: Invoice[]` prop                                                               |
| `InvoicesDataTable.tsx`       | Pattern 4 | Accepts `customers: Customer[]` prop                                                             |
| `InvoiceForm.tsx`             | Pattern 4 | Replaces `mockCustomers`, `mockQuotes`, `mockInvoices` with props                                |

## Key Decisions

### Invoice number generation moved server-side

`InvoiceForm` previously called `generateInvoiceNumber()` which used `mockInvoices.length + 1`. After migration, `new/page.tsx` fetches `getInvoices()`, computes `INV-NNNN`, and passes it as `initialInvoiceNumber` prop. In edit mode, `initialData.invoiceNumber` is used directly (no prop needed).

### `quoteId` prop removed from `InvoiceForm`

The form previously accepted `quoteId?: string` and resolved the quote from `mockQuotes` inside a `useMemo`. After migration, parent pages (`new/page.tsx`, `edit/page.tsx`) resolve the quote server-side via `getQuoteById()` and pass the resolved `Quote | null` as `sourceQuote` prop.

### `InvoiceForm` useMemo deps updated

`customerOptions` useMemo dependency updated from `[]` to `[customers]` to correctly track the prop.

## Self-Review Findings

| #   | Severity | Finding                                                                | Action            |
| --- | -------- | ---------------------------------------------------------------------- | ----------------- |
| 1   | warning  | `getInvoices` unused import in `edit/page.tsx`                         | Fixed immediately |
| 2   | major    | Duplicate "not found" block across `[id]` and `[id]/edit` pages        | Filed #409        |
| 3   | major    | Dead `<Suspense>` boundary — data pre-fetched, fallback can never fire | Filed #410        |
| 4   | warning  | `sm:grid-cols-4` in `InvoiceStatsBar` should be `md:`                  | Filed #411        |

## Verification

```bash
grep -r "from.*mock-data" app/(dashboard)/invoices/
# → zero results

npm run build   # ✓ clean
npm test        # ✓ 1027 tests pass
npx tsc --noEmit  # ✓ no errors
```
