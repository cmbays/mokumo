---
title: 'Jobs Polish — Phase 2 Backend Readiness'
subtitle: 'Extracted pure functions for testability, added 26 new tests, accessibility improvements, CodeRabbit review fixes, filter UX refinements, and CI fix'
date: 2026-02-13
phase: 1
pipelineName: jobs
pipelineType: polish
products: [jobs]
tools: []
stage: review
tags: [feature, build, learning]
sessionId: '734e42c5-f952-429d-84d9-0c4e52a57ffc'
branch: 'session/0212-jobs-wave4'
status: complete
---

## At a Glance

| Stat          | Value          |
| ------------- | -------------- |
| Files Changed | 20             |
| Lines Added   | 659            |
| Lines Removed | 255            |
| New Files     | 3              |
| New Tests     | 26 (414 total) |

A comprehensive polish pass preparing the Jobs vertical for Phase 2 backend integration. Pure function extraction makes projection and DnD logic unit-testable and reusable when API responses replace mock data.

## Pure Function Extraction

Extracted ~150 lines of inline logic from the 667-line `board/page.tsx` into standalone modules:

**`lib/helpers/board-projections.ts`** (new)

- `projectJobToCard(job)` -- maps Job domain entity to JobCard view model
- `projectScratchNoteToCard(note)` -- maps ScratchNote to ScratchNoteCard view model
- Phase 2 impact: These become the transform layer between API responses and board UI

**`lib/helpers/board-dnd.ts`** (new)

- `parseDragId(id)` -- extracts card type + ID from drag identifier
- `parseDroppableId(id)` -- extracts lane + section from drop target
- `cardTypeToSection(type)`, `getCardLabel(card)`, `getCardSortDate(card)`

**`lib/helpers/format.ts`** (shared)

- `formatRelativeTime(dateStr)` -- canonical compact formatter ("5m ago", "3h ago", "2d ago")
- Replaced duplicate implementations in ScratchNoteCard and PricingTemplateCard

## Test Coverage (+26 tests)

**`lib/helpers/__tests__/job-utils.test.ts`** -- 20 tests covering all 4 pure functions:

- `computeCapacitySummary`: empty, rush quantity summing, mixed card types, lane tallying
- `computeRiskLevel`: all 5 branches with `vi.useFakeTimers()`
- `computeTaskProgress`: empty, partial, complete, percentage rounding
- `computeFilteredCards`: each filter independently, combined, scratch_note passthrough

**`lib/schemas/__tests__/board-card.test.ts`** -- 6 tests for schema defaults and constraints

## Code Quality

| Change        | Before                            | After                             |
| ------------- | --------------------------------- | --------------------------------- |
| Drag overlay  | 3 repeated divs                   | `DragOverlayWrapper` component    |
| Deep clone    | `JSON.parse(JSON.stringify(job))` | `structuredClone(job)`            |
| Spring timing | Hardcoded cubic-bezier            | `var(--transition-timing-spring)` |
| Dead code     | `SERVICE_TYPE_ICONS` (unused)     | Removed                           |
| Overlay width | `w-[200px]` (arbitrary)           | `w-50` (Tailwind scale)           |

## Accessibility

- `aria-roledescription="draggable card"` + `aria-describedby="dnd-instructions"` on all draggable cards
- `aria-live="polite"` region announces drop results ("Moved Job #1024 to In Progress")
- `useReducedMotion` from Framer Motion disables spring animations when OS prefers
- `role="group" aria-label="Board filters"` on filter bar
- Keyboard support on ScratchNoteCard (tabIndex, Enter/Space to edit, focus-visible ring)

## CodeRabbit Review Fixes

| Fix                                                     | File                  |
| ------------------------------------------------------- | --------------------- |
| Stable React keys (`garmentId:colorId`, `loc.position`) | JobDetailsSection     |
| Wire risk filter to ColumnHeaderMenu                    | JobsDataTable         |
| Currency formatting (`maximumFractionDigits: 2`)        | LinkedEntitiesSection |
| `text-[10px]` to `text-xs` for invoice badge            | LinkedEntitiesSection |
| Button outside `<Link>` (invalid nesting)               | QuoteBoardCard        |
| Restore previous lane on unblock (match detail page)    | jobs/page.tsx         |

## Filter UX Refinements

- Removed lane filter from board (redundant with visible lane columns)
- Renamed labels: "All Service Types", "All Due Dates", "Due This/Next Week"
- Rush quantity shows piece count ("75 pcs rush") instead of job count

## CI Fix

Added `"knowledge-base"` to `tsconfig.json` `exclude` array. The root tsconfig's `**/*.ts` include pattern was catching Astro-specific module imports in `knowledge-base/src/content.config.ts`.

## Lessons Learned

**tsconfig exclude for nested projects**: When a monorepo has a nested Astro project, the root Next.js tsconfig catches its `.ts` files. Always add nested project directories to the root `exclude` array.

**MoveLaneDialog false positive**: Static analysis (grep for imports) is essential before deleting "dead code." The plan flagged MoveLaneDialog as dead, but it's actively imported in 2 files.

**Zod-for-props boundary**: CodeRabbit suggested deriving React component props from Zod schemas. Correctly rejected -- Zod-first is for domain schemas, not component props with callbacks and React concerns. Tracked as [issue #70](https://github.com/cmbays/mokumo/issues/70).

## GitHub Issues Created

| Issue                                                 | Title                                               |
| ----------------------------------------------------- | --------------------------------------------------- |
| [#70](https://github.com/cmbays/mokumo/issues/70) | Refactor: Derive JobBoardCard props from Zod schema |
