---
title: 'Customer Management Feedback'
subtitle: '8 feedback items from 4Ink owner review. Layout consistency, inline column filters, timeline interactivity, workflow improvements, and code quality refinements.'
date: 2026-02-10
phase: 1
pipelineName: customer-management
pipelineType: vertical
products: [customers, quotes, jobs]
tools: []
stage: review
tags: [feature, build]
sessionId: '0ba68ef8-1b02-40be-a039-2c63d6d15cd1'
branch: 'session/0210-customer-feedback'
status: complete
---

## Summary

| Stat           | Value |
| -------------- | ----- |
| Feedback Items | 8     |
| Files Changed  | 10    |
| PRs Merged     | 3     |

The 4Ink owner reviewed both the Customer List and Customer Detail pages. Feedback centered on layout consistency between Quotes and Customers pages, too much visual noise from filter chips, missing column interactivity, and workflow gaps in customer creation and timeline navigation.

## Feedback Items

| #   | Feedback                                                      | Solution                                                                      |
| --- | ------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| 1   | Quotes search bar misaligned with Customers layout            | Moved search left, added clear X button, matches Customers pattern            |
| 2   | Filter chips too noisy — want filtering inside column headers | Created `ColumnHeaderMenu` component with sort + inline filter dropdown       |
| 3   | Type, Lifecycle, Health columns should be sortable            | Added sort by Type (first tag alphabetical), Lifecycle/Health (ordinal)       |
| 4   | Health column needs its own filter                            | Added `?health=` URL param with inline filter dropdown                        |
| 5   | "Add Customer" should have a "Save & View Details" option     | New button in AddCustomerModal, navigates to detail page using generated UUID |
| 6   | Activity timeline items should be clickable                   | Quote icons link to `/quotes/:id`, note icons switch to Notes tab             |
| 7   | Customer Quotes table — Date should come before Status        | Reordered: `Quote # \| Date \| Status \| Total`                               |
| 8   | Contact "Other" role needs custom description field           | Text input appears when role === "other"                                      |

## New Component: ColumnHeaderMenu

### Reusable Column Header with Sort + Filter

Click the header label to toggle sort direction. A small filter icon opens a Radix DropdownMenu with Sort Ascending/Descending items and optional checkbox filters. Active filters turn the icon cyan. Used across both Customers (7 columns, 3 with filters) and Quotes (6 columns, sort-only). Mobile-friendly: icon always visible, no hover dependency.

## Code Quality Improvements

- **CodeRabbit fixes** — Added `focus-visible:ring-2` to 3 interactive timeline elements, changed sort menu items to pass explicit `"asc"`/`"desc"` direction
- **Zod enum refactor** — Replaced manual `type SortKey = "company" | ...` with `z.enum()` schemas and `z.infer` derived types. URL params now safely parsed with `.catch()` fallback.
- **Generated customer ID** — `AddCustomerModal` now generates a UUID via `crypto.randomUUID()` and passes it through `onSaveAndView`. Navigation uses the real ID instead of `customers[0].id`.

## Pull Requests

- [PR #33](https://github.com/cmbays/mokumo/pull/33) — Quality gate fixes (prerequisite, merged first)
- [PR #35](https://github.com/cmbays/mokumo/pull/35) — All 8 feedback items + CodeRabbit fixes + Zod enums + generated ID

---

## Customer Management Vertical — Complete Chain

The Customer Management vertical is now fully built, audited, and feedback-incorporated:

1. **Data Foundation** (PR #24) — Schemas, mock data, badge components, 264 tests
2. **Breadboard** — 9 places, 102 UI affordances, 33 code affordances, 4-phase build order
3. **Customer List Page** (PR #29) — SmartViewTabs, DataTable, StatsBar, mobile cards
4. **Customer Detail Page** (PR #31) — Header, 7 tabs (Activity, Quotes, Jobs, Artwork, Contacts, Details, Notes)
5. **Quoting Interconnection** (PR #28) — CustomerCombobox lifecycle badges, enriched context card
6. **Quality Gate** (PR #33) — 5-subagent audit, 10 fixes across 11 files
7. **User Feedback** (PR #35) — 8 items addressed, ColumnHeaderMenu, timeline interactivity

## What's Next

- **Demo both verticals** (Quoting + Customer Management) to 4Ink owner
- **Collect final feedback** — target 8+ rating on Clarity, Speed, Polish, Value
- **Address deferred tech debt** (#15-#18) as needed
- **Move to Invoicing vertical**
