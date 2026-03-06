---
title: 'DAL Migration — Dashboard & Jobs Route Group'
subtitle: 'Wave 2.1: Migrate mock-data imports to DAL in dashboard page and all jobs routes'
date: 2026-02-17
phase: 1
pipelineName: 'Jobs'
pipelineType: vertical
products: []
tools: []
stage: build
tags: [build, decision]
sessionId: '84c8dfef-25b4-44d1-a0f5-7d5b7e2d6cce'
branch: 'session/0217-dal-migrate-dashboard-jobs'
status: complete
---

## Summary

Wave 2.1 of the DAL consumer migration. Converted the Dashboard page and all four Jobs route group files from direct `mock-data` imports to the Data Access Layer (DAL). Applied three migration patterns across six files.

**PR**: https://github.com/cmbays/mokumo/pull/413

## Files Migrated

| File                                                         | Pattern   | Change                                                                    |
| ------------------------------------------------------------ | --------- | ------------------------------------------------------------------------- |
| `app/(dashboard)/page.tsx`                                   | Pattern 1 | Async SC; moved module-level computations inside component                |
| `app/(dashboard)/jobs/_components/JobsDataTable.tsx`         | Pattern 4 | Added `customers: Customer[]` prop, removed direct mock-data import       |
| `app/(dashboard)/jobs/page.tsx`                              | Pattern 3 | SC shell; split into server page + `JobsList.tsx` client component        |
| `app/(dashboard)/jobs/_components/JobsList.tsx`              | Pattern 3 | New client component extracted from old page                              |
| `app/(dashboard)/jobs/board/page.tsx`                        | Pattern 3 | SC shell; split into server page + `ProductionBoard.tsx` client component |
| `app/(dashboard)/jobs/board/_components/ProductionBoard.tsx` | Pattern 3 | New client component extracted from old board page                        |
| `app/(dashboard)/jobs/[id]/page.tsx`                         | Pattern 3 | SC shell with server-side pre-computation of derived data                 |
| `app/(dashboard)/jobs/[id]/_components/JobDetail.tsx`        | Pattern 3 | New client component with all state mutations                             |

## Key Decisions

### Server-side pre-computation for `jobs/[id]`

The job detail page fetches 6 related entities (customer, quote, invoice, garment, color, artworks) server-side and pre-computes `customerName`, `quoteTotal`, `invoiceStatus`, and `mockupData` before passing to the client component. This reduces client bundle size and eliminates per-render array searches.

### `DragOverlayWrapper` at module scope

`DragOverlayWrapper` (used in the DnD board overlay) must be defined at module scope — not inside the render body. Defining it inside a component body causes React to treat it as a new component type on every render, forcing full remounts. It was extracted with `prefersReducedMotion` as an explicit prop.

### Type predicate over type assertion for artwork filter

```tsx
// Bad: blanket assertion
.filter((p) => p.artworkUrl) as ArtworkPlacement[]

// Good: type predicate narrows correctly
.filter((p): p is ArtworkPlacement => Boolean(p.artworkUrl))
```

## Self-Review Findings Addressed

Three major findings from the `build-reviewer` agent:

1. **Removed redundant `as InvoiceStatus | undefined` assertion** — TypeScript infers the type correctly from the Zod schema; the assertion was unnecessary and masked future type drift.
2. **Type predicate for ArtworkPlacement filter** — replaced blanket assertion with proper narrowing.
3. **DragOverlayWrapper module scope** — extracted from render body to prevent component identity instability.

Two pre-existing warnings (minor breakpoint usage) were deferred as out-of-scope for this migration session.

## Build Results

- `npm run build`: Clean — 17 routes, no errors
- `npm test`: 1027 tests pass
- `npx tsc --noEmit`: No errors

## Session Resume

```bash
claude --resume 84c8dfef-25b4-44d1-a0f5-7d5b7e2d6cce
```
