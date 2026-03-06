---
title: 'Garment Catalog & Customer Screen Intelligence — Build'
subtitle: 'Full vertical build: catalog page, customer screens tab, favorites, and cross-linking polish'
date: 2026-02-14
phase: 1
pipelineName: garments
pipelineType: vertical
products: [customers, jobs]
domains: [garments]
tools: []
stage: build
tags: [feature, build]
sessionId: '3c426af7-3332-4681-bc90-9c5c4d58d74e'
branch: 'session/0214-garment-build'
status: complete
---

## Summary

Implemented the full Garment Catalog vertical from the [breadboard](https://github.com/cmbays/mokumo/blob/main/docs/breadboards/garment-catalog-breadboard.md) and [implementation plan](https://github.com/cmbays/mokumo/blob/main/docs/plans/2026-02-14-garment-catalog-implementation.md). 18 tasks across 6 groups, executed via subagent-driven development.

## What Was Built

### Foundation (Tasks 1-3, 15)

- **Schema updates**: Added `isEnabled`/`isFavorite` to `garmentCatalogSchema`, `favoriteGarments`/`favoriteColors` to `customerSchema`, new `customerScreenSchema`
- **Lookup helpers**: `getGarmentById()` and `getColorById()` in `lib/helpers/garment-helpers.ts`
- **Expanded mock data**: 5 to 17 garments across all categories (t-shirts, fleece, outerwear, pants, headwear)
- **Customer favorites**: Added favorite garments/colors to 3 customer records

### Shared Components (Tasks 4-6)

- **GarmentImage** (`components/features/GarmentImage.tsx`): Shirt icon placeholder with sm/md/lg size variants and SKU text
- **FavoriteStar** (`components/features/FavoriteStar.tsx`): Inline star toggle with aria-pressed, reusable across catalog, drawer, and customer contexts
- **ColorSwatchPicker compact mode**: Added `compact` prop to existing component for 16px swatches with +N overflow indicator

### Garment Catalog Page (Tasks 7-11, 16)

- **GarmentCatalogToolbar**: Category tabs, search, brand/colorFamily filter dropdowns, grid/list view toggle, price visibility toggle (localStorage)
- **GarmentCard**: Grid card with image, compact swatches, enabled badge, favorite star, conditional price
- **GarmentTableRow**: Table row with enable/disable Switch, favorite star, category badge
- **GarmentDetailDrawer**: Right-side Sheet with color swatch grid, size/price matrix (using `money()` for safe arithmetic), linked jobs, favorites
- **GarmentCatalogPage** (`app/(dashboard)/garments/page.tsx`): Orchestrates all components with URL state filters, localStorage sync for price toggle, and conditional drawer rendering

### Customer Screens Tab (Tasks 12-14)

- **deriveScreensFromJobs** (`lib/helpers/screen-helpers.ts`): Derives screen records from completed jobs for a given customer
- **CustomerScreensTab + ScreenRecordRow + ReclaimScreenDialog**: Full screens management UI with reclaim workflow
- **CustomerTabs updated**: Added "Screens" tab with count badge between Artwork and Contacts

### Cross-Linking Polish (Task 17)

- **Fixed raw ID bug** in `JobDetailsSection.tsx`: Replaced `{gd.garmentId}` / `{gd.colorId}` with resolved garment names and color swatches via `getGarmentById`/`getColorById`

## Files Created

| File                                                                 | Purpose                          |
| -------------------------------------------------------------------- | -------------------------------- |
| `lib/schemas/customer-screen.ts`                                     | Customer screen schema           |
| `lib/helpers/garment-helpers.ts`                                     | Garment/color lookup helpers     |
| `lib/helpers/screen-helpers.ts`                                      | Screen derivation from jobs      |
| `components/features/GarmentImage.tsx`                               | Shared garment image component   |
| `components/features/FavoriteStar.tsx`                               | Shared favorite toggle component |
| `app/(dashboard)/garments/page.tsx`                                  | Garment Catalog page             |
| `app/(dashboard)/garments/_components/GarmentCatalogToolbar.tsx`     | Toolbar with filters             |
| `app/(dashboard)/garments/_components/GarmentCard.tsx`               | Grid card component              |
| `app/(dashboard)/garments/_components/GarmentTableRow.tsx`           | Table row component              |
| `app/(dashboard)/garments/_components/GarmentDetailDrawer.tsx`       | Detail drawer                    |
| `app/(dashboard)/customers/[id]/_components/CustomerScreensTab.tsx`  | Screens tab                      |
| `app/(dashboard)/customers/[id]/_components/ScreenRecordRow.tsx`     | Screen record row                |
| `app/(dashboard)/customers/[id]/_components/ReclaimScreenDialog.tsx` | Reclaim dialog                   |
| `lib/schemas/__tests__/customer-screen.test.ts`                      | Schema tests                     |
| `lib/helpers/__tests__/garment-helpers.test.ts`                      | Helper tests                     |
| `lib/helpers/__tests__/screen-helpers.test.ts`                       | Helper tests                     |

## Files Modified

| File                                                          | Change                                              |
| ------------------------------------------------------------- | --------------------------------------------------- |
| `lib/schemas/garment.ts`                                      | Added `isEnabled`, `isFavorite` fields              |
| `lib/schemas/customer.ts`                                     | Added `favoriteGarments`, `favoriteColors` fields   |
| `lib/mock-data.ts`                                            | Expanded 5 to 17 garments, added customer favorites |
| `components/features/ColorSwatchPicker.tsx`                   | Added compact mode                                  |
| `app/(dashboard)/jobs/_components/JobDetailsSection.tsx`      | Resolved raw IDs to names                           |
| `app/(dashboard)/customers/[id]/_components/CustomerTabs.tsx` | Added Screens tab                                   |
| `app/(dashboard)/quotes/_components/QuoteForm.tsx`            | Added new schema fields                             |
| `lib/schemas/__tests__/garment.test.ts`                       | Added isEnabled/isFavorite tests                    |
| `lib/schemas/__tests__/customer.test.ts`                      | Added favorites tests                               |

## Verification

- **434 tests passing** (up from 414 baseline — 20 new tests)
- **TypeScript**: `npx tsc --noEmit` — zero errors
- **Build**: `npm run build` — successful, `/garments` route in output

## Patterns & Decisions

- **URL state for filters**: All filter state (category, search, brand, colorFamily) lives in URL search params via `useSearchParams` + `router.replace`
- **localStorage for preferences**: Price visibility toggle persists across sessions via localStorage with polling sync
- **Conditional drawer rendering**: `{selectedGarment && <GarmentDetailDrawer />}` pattern for automatic state reset on close
- **Safe financial arithmetic**: Size/price matrix in drawer uses `money()` wrapper over `big.js` — never JS floating-point
- **Derived data over stored data**: Customer screens are derived from completed jobs at render time rather than stored separately

## Related Sessions

- [Garment Catalog Breadboard](https://github.com/cmbays/mokumo/blob/main/docs/breadboards/garment-catalog-breadboard.md) — affordance map this build implements
- [Implementation Plan](https://github.com/cmbays/mokumo/blob/main/docs/plans/2026-02-14-garment-catalog-implementation.md) — detailed 18-task plan
