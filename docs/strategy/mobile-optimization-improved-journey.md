---
title: 'Mobile Optimization — Improved Journey Design'
description: "Mokumo's mobile-optimized experience design, patterns, and build order"
category: strategy
status: complete
phase: 1
created: 2026-02-14
last-verified: 2026-02-14
---

# Mobile Optimization — Improved Journey Design

**Purpose**: Design Mokumo's mobile experience that addresses every friction point found in competitive analysis, using industry best practices from B2B mobile leaders.
**Input**: Competitive analysis, journey map, UX best practices research
**Status**: Complete

---

## Design Principles (from Discovery)

1. **Speed over completeness**: Mobile users want quick answers, not full workflows. Optimize for < 5 second status checks.
2. **Thumb-first layout**: Primary actions in bottom 40% of screen. Navigation at bottom, not top.
3. **Cards over tables**: Every list view converts to card layout on mobile. Cards are scannable, tappable, and finger-friendly.
4. **Progressive disclosure**: Show summary first, expand for detail. Don't dump everything on a mobile screen.
5. **Desktop preserved**: Mobile changes use responsive breakpoints only. Desktop experience is untouched.
6. **One codebase**: No separate mobile app. Same Next.js app, responsive CSS, shared components.

---

## Mobile Navigation Architecture

### Current (Desktop-Only)

```
┌─────────────────────────────────────────────┐
│ [Sidebar]  │        Page Content            │
│ Dashboard  │                                │
│ Quotes     │                                │
│ Invoices   │                                │
│ Jobs       │                                │
│ Screen Room│                                │
│ Customers  │                                │
│ Garments   │                                │
│ ─────────  │                                │
│ Pricing    │                                │
└─────────────────────────────────────────────┘
On mobile: Sidebar hidden. No navigation alternative. Dead end.
```

### Redesigned (Mobile)

```
┌──────────────────────────┐
│                          │
│      Page Content        │
│   (full width, padded)   │
│                          │
│                          │
│                          │
│                          │
├──────────────────────────┤
│ 🏠   📋   📝   👥   ⋯  │  ← Bottom Tab Bar (64px)
│Dash  Jobs Quotes Cust More│
└──────────────────────────┘

"More" opens drawer:
┌──────────────────────────┐
│ ← Close                  │
│                          │
│ Invoices                 │
│ Screen Room              │
│ Garments                 │
│ ─────────────            │
│ Pricing Settings         │
│ ─────────────            │
│ Account                  │
└──────────────────────────┘
```

**Tab bar items** (5 max — most used screens):

1. **Dashboard** — Home, morning status check
2. **Jobs** — Job board / list (most accessed)
3. **Quotes** — Quote management
4. **Customers** — Customer lookup
5. **More** — Drawer with remaining nav

**Why this order**: Research shows job status checks and customer lookups are the most common mobile actions. Dashboard is home. Quotes need quick access for customer meetings.

---

## Screen-by-Screen Mobile Design

### Dashboard (Mobile)

```
┌──────────────────────────┐
│ Mokumo    [🔔] │  ← Compact header, notification bell
├──────────────────────────┤
│ ┌──────────────────────┐ │
│ │ 🔴 2 Blocked Jobs    │ │  ← Priority alert card (if any)
│ │ Tap to view →        │ │
│ └──────────────────────┘ │
│                          │
│ Today's Schedule         │
│ ┌──────────────────────┐ │
│ │ Smith Co - 200 tees  │ │  ← Job cards (compact)
│ │ ■ On Press  Due: 2/15│ │
│ ├──────────────────────┤ │
│ │ ABC Corp - 50 hoodies│ │
│ │ ■ Artwork   Due: 2/16│ │
│ ├──────────────────────┤ │
│ │ + 3 more jobs today  │ │
│ └──────────────────────┘ │
│                          │
│ Quick Stats              │
│ ┌─────┐  ┌─────┐        │
│ │  12 │  │  $4K│        │  ← 2-per-row stat cards
│ │ Jobs│  │ Open│        │
│ └─────┘  └─────┘        │
│ ┌─────┐  ┌─────┐        │
│ │   3 │  │   8 │        │
│ │Block│  │Quote│        │
│ └─────┘  └─────┘        │
├──────────────────────────┤
│ 🏠   📋   📝   👥   ⋯  │
└──────────────────────────┘
```

### List View (Quotes Example — Card Layout)

```
┌──────────────────────────┐
│ Quotes          [🔍] [+] │  ← Search + New Quote
├──────────────────────────┤
│ [All ▼] [Sort: Date ▼]  │  ← Filter/sort dropdowns
├──────────────────────────┤
│ ┌──────────────────────┐ │
│ │ Q-1024  Smith Co     │ │  ← Quote card
│ │ 200 tees, 3-color    │ │
│ │ $2,847   ■ Approved  │ │
│ │ Feb 12              →│ │
│ └──────────────────────┘ │
│ ┌──────────────────────┐ │
│ │ Q-1025  ABC Corp     │ │
│ │ 50 hoodies, 1-color  │ │
│ │ $1,234   ■ Draft     │ │
│ │ Feb 13              →│ │
│ └──────────────────────┘ │
│ ┌──────────────────────┐ │
│ │ Q-1026  Local Gym    │ │
│ │ 100 tanks, 2-color   │ │
│ │ $987     ■ Sent      │ │
│ │ Feb 14              →│ │
│ └──────────────────────┘ │
│                          │
│ Load more...             │
├──────────────────────────┤
│ 🏠   📋   📝   👥   ⋯  │
└──────────────────────────┘
```

### Kanban Board (Mobile — Horizontal Swipe)

```
┌──────────────────────────┐
│ Job Board                │
│ [Design] [Approval] [Press] [Ship] │  ← Horizontal scroll tabs
│     ↑ active (underlined)│
├──────────────────────────┤
│ Design (3 jobs)          │
│ ┌──────────────────────┐ │
│ │ J-2001 Smith Co      │ │
│ │ 200× Bella 3001      │ │
│ │ Due: Feb 15   [!]    │ │
│ │ [Move to Approval →] │ │  ← Quick action button
│ └──────────────────────┘ │
│ ┌──────────────────────┐ │
│ │ J-2002 Local Gym     │ │
│ │ 100× Next Level 6210 │ │
│ │ Due: Feb 18          │ │
│ │ [Move to Approval →] │ │
│ └──────────────────────┘ │
│                          │
│ ← Swipe for Approval →  │
├──────────────────────────┤
│ 🏠   📋   📝   👥   ⋯  │
└──────────────────────────┘
```

### Detail View (Job Detail — Mobile)

```
┌──────────────────────────┐
│ ← Jobs    J-2001   [⋯]  │  ← Back + overflow menu
├──────────────────────────┤
│ Smith Co — 200 Tees      │
│ ■ On Press   Due: Feb 15 │
├──────────────────────────┤
│ [Overview] [Items] [History]│  ← Tab navigation
├──────────────────────────┤
│ Customer: Smith Co       │
│ Contact: John Smith      │
│ Phone: (555) 123-4567    │
│                          │
│ Print Details            │
│ ┌──────────────────────┐ │
│ │ Front: 3-color       │ │
│ │ Back: 1-color        │ │
│ │ Mesh: 156            │ │
│ └──────────────────────┘ │
│                          │
│ Notes                    │
│ "Rush order — customer   │
│  picking up Saturday"    │
│                          │
├──────────────────────────┤
│ [Update Status]  [Edit]  │  ← Sticky bottom action bar
├──────────────────────────┤
│ 🏠   📋   📝   👥   ⋯  │
└──────────────────────────┘
```

---

## Key Differences: Competitors vs Mokumo

| Aspect           | Competitors                   | Mokumo (Mobile)                          |
| ---------------- | ----------------------------- | ---------------------------------------- |
| Navigation       | Hidden sidebar or hamburger   | Bottom tab bar (always visible)          |
| Lists            | Desktop tables, pinch-to-zoom | Card layout, scannable, tappable         |
| Forms            | Multi-column, tiny inputs     | Single-column, large inputs, progressive |
| Job status check | 5-8 taps, 45-90 seconds       | 1-2 taps, 3-5 seconds                    |
| Quick actions    | Walk to desktop               | Tap from phone                           |
| Status updates   | Desktop only                  | Bottom sheet from any view               |
| Notifications    | None                          | Push notifications (Phase 2)             |
| Offline          | None                          | Cached shell + data (Phase 2)            |
| Camera           | None                          | Photo capture workflow (Phase 2)         |

---

## Component Architecture

### New Shared Components (Mobile)

```
components/
  layout/
    bottom-tab-bar.tsx       # Mobile navigation (< md:)
    mobile-drawer.tsx        # "More" menu drawer
    mobile-header.tsx        # Compact page header for mobile
    bottom-action-bar.tsx    # Sticky action buttons on detail views
  ui/
    mobile-card-list.tsx     # Table → card responsive wrapper
    bottom-sheet.tsx         # Mobile-optimized modal replacement
    mobile-search.tsx        # Full-width search with mobile keyboard
```

### Responsive Strategy

Every component uses Tailwind responsive prefixes:

```tsx
// Example: List view that switches between table and cards
<div className="hidden md:block">
  <DataTable ... />           {/* Desktop: full table */}
</div>
<div className="md:hidden">
  <MobileCardList ... />       {/* Mobile: card layout */}
</div>
```

Navigation toggle:

```tsx
// Desktop: sidebar (existing)
<Sidebar className="hidden md:flex" />

// Mobile: bottom tab bar (new)
<BottomTabBar className="md:hidden" />
```

---

## Build Order (Detailed)

### Sprint 1: Navigation Foundation (Steps 1-3)

| Step | Component                            | Estimated Effort | Dependencies |
| ---- | ------------------------------------ | ---------------- | ------------ |
| 1    | `<BottomTabBar>` component           | 2-3 hours        | None         |
| 2    | `<MobileDrawer>` component           | 1-2 hours        | Step 1       |
| 3    | Design tokens in `globals.css`       | 30 min           | None         |
| 4    | Hide sidebar on mobile, show tab bar | 1 hour           | Steps 1-2    |
| 5    | Global touch target audit + fixes    | 2-3 hours        | Step 3       |

### Sprint 2: List Views (Steps 4-8)

| Step | Component                           | Estimated Effort | Dependencies |
| ---- | ----------------------------------- | ---------------- | ------------ |
| 6    | `<MobileCardList>` shared component | 2-3 hours        | Step 3       |
| 7    | Quotes list → mobile cards          | 1-2 hours        | Step 6       |
| 8    | Jobs list → mobile cards            | 1-2 hours        | Step 6       |
| 9    | Invoices list → mobile cards        | 1-2 hours        | Step 6       |
| 10   | Customers list → mobile cards       | 1-2 hours        | Step 6       |

### Sprint 3: Dashboard + Forms (Steps 9-11)

| Step | Component                       | Estimated Effort | Dependencies |
| ---- | ------------------------------- | ---------------- | ------------ |
| 11   | Dashboard mobile layout         | 2-3 hours        | Steps 1-5    |
| 12   | Form mobile layouts (all forms) | 3-4 hours        | Step 5       |
| 13   | `<BottomSheet>` component       | 1-2 hours        | None         |

### Sprint 4: Complex Views + Polish (Steps 12-14)

| Step | Component                            | Estimated Effort | Dependencies |
| ---- | ------------------------------------ | ---------------- | ------------ |
| 14   | Kanban board mobile (swipe columns)  | 3-4 hours        | Step 13      |
| 15   | Detail view layouts (all 4)          | 3-4 hours        | Step 13      |
| 16   | `<BottomActionBar>` for detail views | 1-2 hours        | Step 15      |
| 17   | Dialog/modal → full-screen on mobile | 1-2 hours        | Step 13      |
| 18   | Desktop regression testing           | 2-3 hours        | All above    |

**Total estimated: ~30-40 hours of focused development across 4 sprints.**

---

## Friction Point Resolution Summary

| #   | Friction                  | Our Fix                       | Status             |
| --- | ------------------------- | ----------------------------- | ------------------ |
| 1   | No mobile navigation      | Bottom tab bar + drawer       | Phase 1, Step 1-4  |
| 2   | Tables unreadable         | Card-based mobile layouts     | Phase 1, Step 6-10 |
| 3   | Touch targets too small   | Global audit + fix            | Phase 1, Step 5    |
| 4   | Forms broken on mobile    | Single-column mobile forms    | Phase 1, Step 12   |
| 5   | Frequent re-login         | Long-lived auth tokens        | Phase 1, Step 1    |
| 6   | No "today's view"         | Dashboard priority cards      | Phase 1, Step 11   |
| 7   | Kanban unusable on mobile | Swipe columns + quick actions | Phase 1, Step 14   |
| 8   | Dialogs too small         | Full-screen mobile modals     | Phase 1, Step 17   |
| 9   | No push notifications     | PWA push notifications        | Phase 2            |
| 10  | No offline access         | Service worker caching        | Phase 2            |
| 11  | No camera integration     | Photo capture workflow        | Phase 2            |
| 12  | No quick quote tool       | Mobile-optimized calculator   | Phase 2            |
