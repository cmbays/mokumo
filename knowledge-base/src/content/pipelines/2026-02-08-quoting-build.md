---
title: 'Quoting Vertical Build'
subtitle: 'Complete implementation of the Quoting vertical — 3 pages, 15+ components, artwork system, flat pricing model, collapsible form sections. Built with parallel agents, polished via CodeRabbit review.'
date: 2026-02-08
phase: 1
pipelineName: quoting
pipelineType: vertical
products: [quotes, customers]
tools: []
stage: build
tags: [feature, build]
sessionId: '13546e08-2ee1-4de3-94a7-c2a596a15e1a'
pr: '#13,#14,#20'
status: complete
---

| Metric | Value         |
| ------ | ------------- |
| 172    | Tests Passing |
| 0      | Lint Warnings |
| 15+    | Components    |
| 3      | Pages         |

## Verification

- TypeScript — 0 errors
- ESLint — 0 errors, 0 warnings
- Tests — 172/172 pass
- Build — production success

## Pull Requests

### [PR #13](https://github.com/cmbays/mokumo/pull/13) — feat: Build complete Quoting vertical

Initial build: 3 pages, 4 reusable components, expanded data layer. 31 files, 3,874 insertions. **Merged.**

### [PR #14](https://github.com/cmbays/mokumo/pull/14) — feat: Quoting patch v2 — pricing, artwork, form UX

20 feedback items: artwork system, customer tags, service types, discount model, flat setup fees, collapsible sections, sticky top bar, CodeRabbit review fixes. **Merged.**

### [PR #20](https://github.com/cmbays/mokumo/pull/20) — feat: Quoting patch v3 — sticky bar, pricing, tooltips

Sticky bar redesign (single-row service type layout with inline color swatches), pricing formula with info tooltip in review view, artwork-derived color counts, tooltip dark mode + hover fixes, removed Edit Quote from review slide-out. CodeRabbit fixes (icon sizes). **Merged.**

## Pages Built

### /quotes — Quotes List

DataTable with status tab filters (All/Draft/Sent/Accepted/Declined/Revised), debounced search, column sorting, customer tag badges, row action dropdown (View/Edit/Copy as New/Send), empty state with CTA.

### /quotes/new — New Quote Form

Single-page form with 5 collapsible sections: Customer (combobox with tag badges) → Artwork (customer-tag-aware library) → Garments & Print (service type per item, per-location details with artwork assignment) → Pricing (discounts, shipping, tax, savings banner) → Notes. Sticky top bar with customer, artwork thumbnails, and grand total. "Review & Send" opens full-screen sheet.

### /quotes/[id] — Quote Detail

Read-only view with inline action header bar (Edit/Copy as New/Send/Email Preview). Service type badges, per-location color counts with artwork thumbnails, full pricing breakdown with discount visibility, artwork previews on garment swatches.

## Key Features

### Artwork System

Two-tier library: customer artwork library + per-quote curated set. Customer-tag-aware: new customers see upload dropzone, repeat see recently-used first, contract see full grid with search + tag filters. Per-location artwork assignment with inline picker. Artwork preview on garment color swatches.

### Flat Setup Fee Pricing

Screen-print: $40 flat per quote. Embroidery: $20 per line item. DTF: no setup fee. Full breakdown: garment cost + decoration cost + setup fees + discounts + shipping + tax = grand total. Contract customers get auto-applied 7% discount + free shipping. Savings banner with crossed-out original prices.

### Service Types & Customer Tags

3 service types per line item: screen-print, DTF, embroidery. 3 customer tags: new, repeat, contract. Tags drive smart defaults: auto-discounts, artwork library mode, shipping behavior. Per-location print details with color count and artwork assignment.

### Discount Model

Replaces flat price override. Discount types: manual, contract, volume. Each has label + amount. Add/remove in form. "You save $X!" banner when discounts exist. Contract pricing auto-applied when contract customer selected.

## Components (15+)

| Component                   | Description                                                                                                                    |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| **ColorSwatchPicker**       | S&S Activewear-style dense swatch grid. 42 colors, search, favorites, keyboard nav, ARIA.                                      |
| **CustomerCombobox**        | Type-ahead search with tag badges, phone display, info card. "Add New Customer" modal.                                         |
| **ArtworkLibrary**          | Customer-tag-aware grid. Search + tag filters for contract, recently-used for repeat, upload dropzone for new.                 |
| **ArtworkUploadModal**      | Mock upload with name, color count, tag multi-select, save-to-library toggle.                                                  |
| **ArtworkAssignmentPicker** | Per-location inline dropdown from quote's curated artwork set. Mini thumbnails.                                                |
| **ArtworkPreview**          | Garment color swatch rectangle with artwork thumbnail overlay.                                                                 |
| **CollapsibleSection**      | Accordion wrapper with title, icon, summary when collapsed, completion checkmark. Controlled mode for programmatic open/close. |
| **PricingSummary**          | Full breakdown: subtotal, setup fees, discounts (add/remove), shipping (FREE badge), tax, grand total, savings banner.         |
| **DiscountRow**             | Editable row with label, amount, type badge, delete button. Reused in form and detail views.                                   |
| **QuoteDetailView**         | Reusable for detail page and review sheet. Service type badges, per-location details, artwork previews.                        |
| **QuoteReviewSheet**        | Full-screen Sheet (slides from right). Shows quote preview before sending. Keeps form state intact.                            |
| **EmailPreviewModal**       | Email preview with pricing breakdown. Mock send with toast confirmation.                                                       |
| **StatusBadge**             | Semantic color mapping: Draft=muted, Sent=action, Accepted=success, Declined=error, Revised=warning.                           |

## Data Layer

| Schema               | Details                                                                                                                                                       |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **artwork.ts** (new) | Artwork with customerId, name, fileName, thumbnailUrl, colorCount, tags[], createdAt, lastUsedAt.                                                             |
| **color.ts** (new)   | 42 mock colors with hex, swatchTextColor, family, isFavorite. Mirrors S&S Activewear API shapes.                                                              |
| **quote.ts**         | Service types, per-location printLocationDetails (location, colorCount, setupFee, artworkId), discounts[] (label, amount, type), shipping, tax, artworkIds[]. |
| **customer.ts**      | Added customerTagEnum ("new" \| "repeat" \| "contract") with behavior differentiation.                                                                        |
| **garment.ts**       | Catalog with brand, SKU, name, basePrice, availableColors, availableSizes.                                                                                    |
| **mock-data.ts**     | 5 customers (with tags), 42 colors, 5 garments, 6 quotes (all statuses, discount examples), 8 artworks, 8 SVG placeholders.                                   |

## Build Approach

### PR #13 — Initial Build (6 parallel agents)

Used git worktree for isolation and TeamCreate for parallel agent orchestration:

- **Phase A** (4 agents): schema-agent (schemas + mock data + 116 tests), swatch-agent (ColorSwatchPicker), combobox-agent (CustomerCombobox + AddCustomerModal), list-agent (QuotesDataTable + StatusBadge)
- **Phase B** (2 agents): form-agent (QuoteForm + LineItemRow + PricingSummary), detail-agent (quote detail + QuoteActions + EmailPreviewModal)

### PR #14 — Patch v2 (20 feedback items)

Addressed first-round feedback from 4Ink. Phased build (A through F) with targeted fixes:

- **Phase A**: New artwork schema, customer tags, service types, per-location details, discount model, shipping/tax, mock data overhaul, 2 bug fixes (duplicate + search)
- **Phase B**: PricingSummary redesign, DiscountRow, LineItemRow rewrite, CustomerCombobox tags
- **Phase C**: ArtworkLibrary, ArtworkUploadModal, ArtworkAssignmentPicker
- **Phase D**: CollapsibleSection, form restructure, customer-aware defaults
- **Phase E**: QuoteDetailView extraction, QuoteReviewSheet, detail page update
- **Phase F**: ArtworkPreview, discount visibility polish, sticky top bar, flat setup fee model, CodeRabbit review fixes (17 items: icon sizes, a11y, design tokens, lint)

### PR #20 — Patch v3 (sticky bar, pricing, tooltips)

Iterative polish session focused on sticky bar UX, tooltip behavior, and pricing clarity:

- **Sticky bar redesign**: Collapsed multi-row service type layout into single inline row with color swatches + qty labels separated by pipe (`[swatch][swatch] 455 Screen Print | [swatch] 700 DTF`). Added artwork thumbnail icons, discount badge, notes icon with tooltips.
- **Tooltip system**: Fixed dark mode styling (bg-elevated), hover/flickering bugs (shared TooltipProvider, sideOffset gap, pointer-events-none on closing state), swatch tooltips with garment + sizes + print locations, artwork tooltips with large preview images.
- **Pricing formula**: Review view line items now show `($13.50 x 562 qty) + $40 setup = $7,627.00` with info icon tooltip explaining per-unit cost breakdown and setup fee rates per service type.
- **Color count from artwork**: Removed manual color count input. Color count auto-derived from assigned artwork. Resets when artwork removed or customer changed.
- **Review slide-out**: Added grand total to sticky header. Removed Edit Quote button (close via X or click-away).
- **CodeRabbit fixes**: Icon sizes (size-12 → size-6) in empty state placeholders.

## Deferred Tech Debt

Tracked as GitHub issues for future sessions:

- [#15](https://github.com/cmbays/mokumo/issues/15) — Migrate forms to React Hook Form + Zod (QuoteForm, ArtworkUploadModal, AddCustomerModal)
- [#16](https://github.com/cmbays/mokumo/issues/16) — Replace local LineItemRow interfaces with schema-derived types
- [#17](https://github.com/cmbays/mokumo/issues/17) — Sync garment category filter with URL query params
- [#18](https://github.com/cmbays/mokumo/issues/18) — Extract shared formatCurrency/formatDate to lib/utils

## Next Steps

1. Run quality-gate audit on all 3 screens
2. Demo to 4Ink owner, collect feedback
3. Iterate on feedback (target: 8+ rating on Clarity, Speed, Polish, Value)
4. Address deferred tech debt (#15-#18) as needed
5. Move to Invoicing vertical
