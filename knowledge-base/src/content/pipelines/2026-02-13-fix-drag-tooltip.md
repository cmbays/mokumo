---
title: 'Fix: Board Drag-and-Drop Crash'
subtitle: 'DragOverlay outside TooltipProvider caused fatal runtime error on card drag'
date: 2026-02-13
phase: 1
pipelineName: jobs
pipelineType: bug-fix
products: [jobs]
tools: []
stage: build
tags: [feature, learning]
sessionId: 'fix: kanban card dragging'
branch: 'session/0213-fix-drag-tooltip'
pr: 'https://github.com/cmbays/mokumo/pull/79'
status: complete
---

## Problem

Dragging any card on the Production Board (`/jobs/board`) crashed the entire page with:

```
Error: `Tooltip` must be used within `TooltipProvider`
  at renderDragOverlay — app/(dashboard)/jobs/board/page.tsx:395
```

The app showed the Next.js error overlay and became unresponsive.

## Root Cause

The `<DragOverlay>` component was a **sibling** of `<TooltipProvider>`, not a child:

```tsx
<DndContext>
  <TooltipProvider>{/* board lanes with cards */}</TooltipProvider> {/* closed here */}
  <DragOverlay>
    {' '}
    {/* outside provider */}
    <JobBoardCard /> {/* contains <Tooltip> -> crash */}
  </DragOverlay>
</DndContext>
```

When a drag started, dnd-kit's `DragOverlay` rendered a clone of the dragged card (`JobBoardCard` or `QuoteBoardCard`). Both card components conditionally render Radix `<Tooltip>` for task progress and block reason details. Since the overlay sat outside `<TooltipProvider>` in the React tree, Radix threw a context error that React 19 escalated to a fatal crash.

## Fix

Moved `</TooltipProvider>` closing tag to wrap both board sections AND the `DragOverlay`:

```tsx
<DndContext>
  <TooltipProvider>
    {/* board lanes with cards */}
    <DragOverlay>
      {' '}
      {/* now inside provider */}
      {renderDragOverlay()}
    </DragOverlay>
  </TooltipProvider>
</DndContext>
```

**4 lines changed, zero logic changes.** PR #79.

## How It Was Found

Systematic debugging with Playwright browser automation:

1. **Read the drag-and-drop code** — `handleDragEnd`, `DraggableCard`, `BoardLane`, `board-dnd.ts` helpers all looked correct
2. **Navigated to the board** via Playwright — spotted a console error about `TooltipProvider` on page load
3. **Simulated a drag operation** with pointer events — the error escalated to a full page crash, confirmed by the Next.js Runtime Error overlay pointing to `renderDragOverlay` line 395
4. **Traced the component tree** — `DragOverlay` was a sibling of `TooltipProvider`, not a child
5. **Applied fix** — moved closing tag, re-tested with Playwright: Ready 6->5, In Progress 6->7, zero errors

## Lesson Learned

**dnd-kit `DragOverlay` renders clones of your cards.** Any React context those cards depend on (tooltips, themes, i18n providers) must also wrap the overlay — not just the board sections. This is easy to miss during refactors that reorganize the component tree.

This regression was introduced in commit `851a1aa` (board polish refactor) which extracted `DragOverlayWrapper` and reorganized the JSX structure, inadvertently placing the overlay outside the tooltip provider boundary.
