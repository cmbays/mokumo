---
title: 'DAL Migration — Quotes Route Group'
subtitle: 'Wave 2: Replace all mock-data imports in the Quotes vertical with DAL calls'
date: 2026-02-17
phase: 1
pipelineName: 'Quotes'
pipelineType: vertical
products: []
tools: []
stage: build
tags: [build]
sessionId: '49069648-2de5-4610-a3ee-325b98c05b7c'
branch: 'session/0217-dal-migrate-quotes'
status: complete
---

## Summary

Wave 2 of the DAL (Data Access Layer) migration plan. All `@/lib/mock-data` imports in the
Quotes route group were replaced with DAL calls following the patterns established in
`docs/plans/2026-02-16-dal-impl-plan.md`.

## What Was Migrated

### Server Pages (Pattern 1 & 3)

| File                        | Change                                                                               |
| --------------------------- | ------------------------------------------------------------------------------------ |
| `quotes/page.tsx`           | Made async; `Promise.all([getQuotes(), getCustomers()])`                             |
| `quotes/new/page.tsx`       | Parallel fetch for all 5 QuoteForm dependencies; `getQuoteById()` for duplicate flow |
| `quotes/[id]/page.tsx`      | DAL for quote, customer, artworks, garmentCatalog, colors                            |
| `quotes/[id]/edit/page.tsx` | DAL for quote + all 5 QuoteForm dependencies                                         |

### Client Components (Pattern 4 — prop threading)

| Component              | Removed Import                                      | Props Added                                           |
| ---------------------- | --------------------------------------------------- | ----------------------------------------------------- |
| `QuoteForm.tsx`        | `customers`, `colors`, `garmentCatalog`, `artworks` | 4 domain arrays + `dtfSheetTiers`                     |
| `QuotesDataTable.tsx`  | `quotes`, `customers`                               | `quotes: Quote[]`, `customers: Customer[]`            |
| `QuoteDetailView.tsx`  | `garmentCatalog`, `colors`                          | `garmentCatalog: GarmentCatalog[]`, `colors: Color[]` |
| `QuoteReviewSheet.tsx` | (intermediary)                                      | `garmentCatalog`, `colors` passed through             |
| `DtfTabContent.tsx`    | `dtfSheetTiers`                                     | `dtfSheetTiers: DTFSheetTier[]`                       |

## Key Decisions

**State naming conflict**: `QuoteForm` had internal `customers` state that would clash with the new prop.
Renamed to `localCustomers`/`setLocalCustomers` to avoid shadowing.

**`QuoteFormInitialData` extraction**: The `initialData` prop shape was duplicated in
`new/page.tsx` and `[id]/edit/page.tsx`. Extracted as an exported type from `QuoteForm.tsx`.

**React Compiler deps**: After replacing module-level constants with props, useMemo dependency
arrays needed updating: `garmentCatalog`, `colors`, `artworks`, `allColors` added to
the appropriate memo deps to keep the React Compiler happy.

**`MatrixPeekSheet.tsx` deferred**: Still imports from `@/lib/mock-data-pricing`
(`allScreenPrintTemplates`, `tagTemplateMappings`). No settings DAL exists yet for pricing
templates. Filed as [GitHub Issue #417](https://github.com/cmbays/mokumo/issues/417).

## Verification

- `grep -r 'from.*"@/lib/mock-data"' app/(dashboard)/quotes/` → 0 results
- `npm run build` → clean
- `npm test` → 1027 passed
- `npm run lint` → 0 errors

## Links

- PR: https://github.com/cmbays/mokumo/pull/416
- Deferred issue: https://github.com/cmbays/mokumo/issues/417
- DAL migration plan: `docs/plans/2026-02-16-dal-impl-plan.md`

## Resume Command

```bash
claude --resume 49069648-2de5-4610-a3ee-325b98c05b7c
```
