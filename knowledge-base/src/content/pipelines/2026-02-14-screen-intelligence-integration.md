---
title: 'Screen Intelligence Integration'
subtitle: 'Smart screen reuse in quoting (setup fee waiver), linked screens in job detail, and helper functions for screen lookups.'
date: 2026-02-14
phase: 1
pipelineName: screen-room
pipelineType: vertical
products: [quotes, jobs]
domains: [screens]
tools: []
stage: build
tags: [feature, build]
sessionId: '3c426af7-3332-4681-bc90-9c5c4d58d74e'
branch: 'session/0214-screen-integration'
status: complete
---

## What Was Built

Three focused integration features that surface screen data where it matters in the workflow, rather than only on the standalone `/screens` page.

### 1. Helper Foundation

- `getScreensByJobId(jobId)` — filters mock screens by job ID
- `getActiveCustomerScreens(customerId)` — wraps `deriveScreensFromJobs` for future reclaim-aware filtering
- 6 new tests covering known jobs, unknown IDs, and screen states

### 2. Quote Screen Reuse (QuoteForm + PricingSummary)

- When a customer with completed jobs is selected, a green banner shows the count of reusable screens
- Banner only appears when at least one line item uses `screen-print` service type
- Toggle enables "screen reuse" mode which waives the $40 setup fee
- PricingSummary displays the discount line with a `screens` badge
- Discount is included in the savings banner total
- State resets when customer changes

### 3. Job Detail Screens (JobDetailsSection)

- Screens linked to the current job display between Print Locations and Complexity sections
- Each screen shows mesh count, emulsion type, and a color-coded burn status badge
- Uses existing `BURN_STATUS_LABELS` constants and design system badge patterns

## Files Changed

| File                                                                                                                                                                | Change                                                    |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| [`lib/helpers/screen-helpers.ts`](https://github.com/cmbays/mokumo/blob/main/lib/helpers/screen-helpers.ts)                                                     | Added `getScreensByJobId()`, `getActiveCustomerScreens()` |
| [`lib/helpers/__tests__/screen-helpers.test.ts`](https://github.com/cmbays/mokumo/blob/main/lib/helpers/__tests__/screen-helpers.test.ts)                       | Added 6 tests for new helpers                             |
| [`app/(dashboard)/quotes/_components/QuoteForm.tsx`](<https://github.com/cmbays/mokumo/blob/main/app/(dashboard)/quotes/_components/QuoteForm.tsx>)             | Screen reuse state, banner, pricing wire                  |
| [`app/(dashboard)/quotes/_components/PricingSummary.tsx`](<https://github.com/cmbays/mokumo/blob/main/app/(dashboard)/quotes/_components/PricingSummary.tsx>)   | Screen reuse discount display                             |
| [`app/(dashboard)/jobs/_components/JobDetailsSection.tsx`](<https://github.com/cmbays/mokumo/blob/main/app/(dashboard)/jobs/_components/JobDetailsSection.tsx>) | Linked screens with burn status                           |

## Verification

- 440 tests pass (434 baseline + 6 new)
- Zero TypeScript errors
- Production build succeeds
