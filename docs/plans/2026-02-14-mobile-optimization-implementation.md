# Mobile Optimization Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform Mokumo from a desktop-only app into a responsive mobile-first experience at < 768px, following the breadboard at `docs/breadboards/mobile-optimization-breadboard.md`.

**Architecture:** The app currently has zero responsive infrastructure — fixed sidebar, hardcoded grid columns, no viewport hooks, no mobile tokens. We build a responsive shell (bottom tab bar + mobile header + drawer replacing sidebar) in Sprint 1, then high-value screens (Kanban board, dashboard, notes) in Sprint 2, list/form polish in Sprint 3, and detail views + full-screen modals in Sprint 4. All changes use CSS breakpoints (`md:` = 768px) so desktop is preserved.

**Tech Stack:** Next.js 16 (App Router), Tailwind CSS v4 (`@theme inline`), shadcn/ui (Sheet, Tabs, Dialog), Framer Motion (swipe gestures), Lucide React (icons). No new dependencies needed for Sprint 1. Framer Motion (already installed) used for swipe in Sprint 2.

**z-index Scale (mobile layers):**

| z-index | Component                              | Notes                                 |
| ------- | -------------------------------------- | ------------------------------------- |
| `z-40`  | BottomActionBar                        | Above content, below tab bar          |
| `z-40`  | FAB button                             | Same layer as action bar              |
| `z-50`  | BottomTabBar                           | Primary navigation, always on top     |
| `z-50`  | Sheet/Dialog overlays (shadcn default) | Modal layer — backdrop covers tab bar |

The Sheet/Dialog overlays from shadcn/ui use z-50 and include a backdrop that covers the entire viewport, so they naturally layer above the BottomTabBar when open. BottomActionBar uses z-40 to sit below the tab bar but above page content.

**Breadboard Reference:** `docs/breadboards/mobile-optimization-breadboard.md` — 9 Places, ~100 UI affordances, 38 code affordances, 25 build steps.

**Key Research Findings:**

- Zero responsive infrastructure exists — no mobile tokens, no `useIsMobile` hook, no breakpoint classes on layout
- `components/ui/sheet.tsx` exists (reusable for drawer/bottom sheets)
- `components/ui/dialog.tsx` already has `max-w-[calc(100%-2rem)]` mobile consideration
- 3 of 4 list views (Jobs, Invoices, Customers) already have `md:hidden` mobile card views — only Quotes is missing
- Job detail already has responsive grid (`grid-cols-1 lg:grid-cols-3`)
- Kanban board uses `dnd-kit` with `touch-none` on cards — needs mobile-specific interaction
- Dashboard has hardcoded `grid-cols-4` — overflows on mobile
- `CapacitySummaryBar` already exists on the board
- `NotesFeed` component exists but no standalone NoteCapture with side effects
- 21 dialogs/modals across the app need full-screen treatment on mobile

---

## Sprint 1: Foundation (~1 week)

### Task 1: Mobile Design Tokens

**Files:**

- Modify: `app/globals.css:7-88` (inside `@theme inline` block)

**Step 1: Add mobile tokens to globals.css**

Add these tokens inside the existing `@theme inline` block in `app/globals.css`:

```css
/* Mobile-specific tokens */
--mobile-nav-height: 3.5rem; /* 56px — bottom tab bar height */
--mobile-header-height: 3rem; /* 48px — mobile header height */
--mobile-touch-target: 2.75rem; /* 44px — minimum tap target per Apple HIG */
--mobile-bottom-safe-area: env(safe-area-inset-bottom, 0px);
--mobile-card-gap: 0.75rem; /* 12px — gap between mobile cards */
--mobile-sheet-max-height: 85vh; /* Bottom sheet max height */
--mobile-fab-size: 3.5rem; /* 56px — floating action button */
--shadow-brutal-sm: 2px 2px 0px; /* Smaller neobrutalist shadow for mobile */
```

**Step 2: Add mobile-specific utility layer**

Below the `@theme inline` block, add a utility layer for mobile bottom safe area:

```css
/* Mobile safe area padding */
@utility pb-safe {
  padding-bottom: env(safe-area-inset-bottom, 0px);
}

/* Hide scrollbar while keeping scroll functionality */
@utility scrollbar-none {
  -ms-overflow-style: none;
  scrollbar-width: none;
  &::-webkit-scrollbar {
    display: none;
  }
}
```

**Step 3: Add viewport-fit=cover to root layout**

`env(safe-area-inset-bottom)` requires `viewport-fit=cover` in the viewport meta tag. Add this to `app/layout.tsx`:

```tsx
export const metadata: Metadata = {
  title: 'Mokumo',
  description: 'Production management software for screen printing shops',
  other: {
    viewport: 'width=device-width, initial-scale=1, viewport-fit=cover',
  },
}
```

Or in Next.js 16, use the `viewport` export:

```tsx
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}
```

Without this, `env(safe-area-inset-bottom)` will always resolve to `0px`, making the `pb-safe` utility useless on notched devices.

**Step 4: Verify tokens resolve**

Run: `cd ~/Github/mokumo-worktrees/session-0214-mobile-impl-plan && npm run dev -- --port 3005`

Open browser, inspect element, verify `--mobile-nav-height` resolves to `3.5rem` in computed styles.

**Step 5: Commit**

```bash
git add app/globals.css app/layout.tsx
git commit -m "feat(mobile): add mobile design tokens and viewport-fit=cover

Adds --mobile-nav-height, --mobile-touch-target, --mobile-bottom-safe-area,
and other mobile-specific CSS custom properties to the @theme inline block.
Adds viewport-fit=cover for safe area inset support on notched devices."
```

**Acceptance Criteria:**

- [ ] All 8 mobile tokens defined in `@theme inline`
- [ ] `pb-safe` utility available
- [ ] Desktop appearance unchanged
- [ ] `npm run build` passes

---

### Task 2: useIsMobile Hook

**Files:**

- Create: `lib/hooks/use-is-mobile.ts`

**Step 1: Create the hook**

```typescript
'use client'

import { useEffect, useState } from 'react'

const MOBILE_BREAKPOINT = 768

export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = (e: MediaQueryListEvent) => setIsMobile(e.matches)

    setIsMobile(mql.matches)
    mql.addEventListener('change', onChange)
    return () => mql.removeEventListener('change', onChange)
  }, [])

  return isMobile
}
```

**Step 2: Commit**

```bash
git add lib/hooks/use-is-mobile.ts
git commit -m "feat(mobile): add useIsMobile hook

Tracks viewport width via matchMedia. Returns true below 768px.
Used by mobile shell components for conditional rendering."
```

**Acceptance Criteria:**

- [ ] Hook returns `false` on desktop, `true` below 768px
- [ ] No hydration mismatch (defaults to `false` on server)
- [ ] `npm run build` passes

---

### Task 3: BottomTabBar Component (Breadboard P1: U1-U6)

**Files:**

- Create: `components/layout/bottom-tab-bar.tsx`
- Reference: `components/layout/sidebar.tsx:18-26` (nav items)

**Step 0: Extract shared navigation constants**

Create `lib/constants/navigation.ts` with nav items shared between Sidebar, BottomTabBar, and MobileDrawer:

```typescript
import {
  LayoutDashboard,
  Hammer,
  FileSignature,
  Users,
  Receipt,
  Printer,
  Shirt,
  Settings,
  type LucideIcon,
} from 'lucide-react'

export interface NavItem {
  label: string
  href: string
  icon: LucideIcon
}

/** Primary navigation — shown in Sidebar + BottomTabBar */
export const PRIMARY_NAV: NavItem[] = [
  { label: 'Dashboard', href: '/', icon: LayoutDashboard },
  { label: 'Jobs', href: '/jobs/board', icon: Hammer },
  { label: 'Quotes', href: '/quotes', icon: FileSignature },
  { label: 'Customers', href: '/customers', icon: Users },
]

/** Secondary navigation — shown in Sidebar + MobileDrawer */
export const SECONDARY_NAV: NavItem[] = [
  { label: 'Invoices', href: '/invoices', icon: Receipt },
  { label: 'Screen Room', href: '/screens', icon: Printer },
  { label: 'Garments', href: '/garments', icon: Shirt },
  { label: 'Pricing Settings', href: '/settings/pricing', icon: Settings },
]
```

Sidebar, BottomTabBar, and MobileDrawer should all import from this file instead of duplicating nav arrays.

**Step 1: Create BottomTabBar component**

```tsx
'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { MoreHorizontal } from 'lucide-react'
import { cn } from '@/lib/utils'
import { PRIMARY_NAV } from '@/lib/constants/navigation'

const tabs = [...PRIMARY_NAV, { label: 'More', href: '#more', icon: MoreHorizontal }] as const

interface BottomTabBarProps {
  onMorePress: () => void
}

export function BottomTabBar({ onMorePress }: BottomTabBarProps) {
  const pathname = usePathname()

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/'
    if (href === '#more') return false
    return pathname.startsWith(href.split('/').slice(0, 2).join('/'))
  }

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 flex h-(--mobile-nav-height) items-center justify-around border-t border-border bg-sidebar pb-safe md:hidden"
      aria-label="Main navigation"
    >
      {tabs.map((tab) => {
        const active = isActive(tab.href)
        const isMore = tab.href === '#more'

        if (isMore) {
          return (
            <button
              key={tab.label}
              onClick={onMorePress}
              className={cn(
                'flex flex-1 flex-col items-center justify-center gap-0.5 py-1',
                'text-muted-foreground transition-colors',
                'min-h-(--mobile-touch-target)'
              )}
            >
              <tab.icon className="h-5 w-5" />
              <span className="text-[10px] font-medium">{tab.label}</span>
            </button>
          )
        }

        return (
          <Link
            key={tab.label}
            href={tab.href}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'flex flex-1 flex-col items-center justify-center gap-0.5 py-1',
              'transition-colors min-h-(--mobile-touch-target)',
              active ? 'text-action' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <tab.icon className="h-5 w-5" />
            <span className="text-[10px] font-medium">{tab.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
```

**Step 2: Verify in isolation**

Add `<BottomTabBar onMorePress={() => {}} />` temporarily to `app/(dashboard)/layout.tsx` inside the `<main>` tag. Shrink browser below 768px — tab bar should appear at bottom. Widen past 768px — should disappear (`md:hidden`).

**Step 3: Remove temporary usage, commit**

```bash
git add components/layout/bottom-tab-bar.tsx lib/constants/navigation.ts
git commit -m "feat(mobile): add BottomTabBar component and shared nav constants

5-tab bottom navigation bar (Dashboard, Jobs, Quotes, Customers, More).
Fixed to bottom, hidden above md breakpoint. Uses mobile design tokens
for height and touch targets. Breadboard P1: U1-U6."
```

**Acceptance Criteria:**

- [ ] 5 tabs render with correct icons and labels
- [ ] Active tab highlighted with `text-action`
- [ ] Hidden above 768px (`md:hidden`)
- [ ] Touch targets meet 44px minimum
- [ ] Safe area padding for notched devices
- [ ] "More" tab calls `onMorePress` callback

---

### Task 4: MobileDrawer Component (Breadboard P2: U10-U14)

**Files:**

- Create: `components/layout/mobile-drawer.tsx`
- Reference: `components/ui/sheet.tsx` (reuse Sheet as container)
- Reference: `components/layout/sidebar.tsx:28-30` (settings items)

**Step 1: Create MobileDrawer component**

```tsx
'use client'

import Link from 'next/link'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Layers } from 'lucide-react'
import { SECONDARY_NAV } from '@/lib/constants/navigation'

interface MobileDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function MobileDrawer({ open, onOpenChange }: MobileDrawerProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-72 bg-sidebar p-0">
        <SheetHeader className="border-b border-sidebar-border px-4 py-3">
          <SheetTitle className="flex items-center gap-2 text-sidebar-foreground">
            <Layers className="h-5 w-5 text-action" />
            Mokumo
          </SheetTitle>
        </SheetHeader>
        <nav className="flex flex-col gap-1 p-2" aria-label="Additional navigation">
          {SECONDARY_NAV.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => onOpenChange(false)}
              className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm text-sidebar-foreground transition-colors hover:bg-sidebar-accent min-h-(--mobile-touch-target)"
            >
              <link.icon className="h-5 w-5 text-muted-foreground" />
              {link.label}
            </Link>
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  )
}
```

**Step 2: Commit**

```bash
git add components/layout/mobile-drawer.tsx
git commit -m "feat(mobile): add MobileDrawer component

Left-side Sheet overlay with secondary nav items (Invoices, Screen Room,
Garments, Pricing Settings). Opens from BottomTabBar 'More' tab.
Breadboard P2: U10-U14."
```

**Acceptance Criteria:**

- [ ] Opens as left-side sheet
- [ ] Shows 4 secondary nav links with icons
- [ ] Clicking a link navigates and closes the drawer
- [ ] Backdrop click closes drawer
- [ ] Brand header at top

---

### Task 5: MobileHeader Component (Breadboard P1: U7-U8)

**Files:**

- Create: `components/layout/mobile-header.tsx`

**Step 1: Create MobileHeader component**

```tsx
'use client'

import { usePathname } from 'next/navigation'
import { Bell } from 'lucide-react'

const pageTitles: Record<string, string> = {
  '/': 'Dashboard',
  '/quotes': 'Quotes',
  '/quotes/new': 'New Quote',
  '/invoices': 'Invoices',
  '/invoices/new': 'New Invoice',
  '/jobs': 'Jobs',
  '/jobs/board': 'Production Board',
  '/screens': 'Screen Room',
  '/customers': 'Customers',
  '/garments': 'Garments',
  '/settings/pricing': 'Pricing Settings',
}

function getPageTitle(pathname: string): string {
  // Exact match first
  if (pageTitles[pathname]) return pageTitles[pathname]
  // Detail pages: /jobs/[id], /quotes/[id], etc.
  const segments = pathname.split('/').filter(Boolean)
  if (segments.length >= 2) {
    const base = `/${segments[0]}`
    if (pageTitles[base]) return pageTitles[base]
  }
  return 'Mokumo'
}

export function MobileHeader() {
  const pathname = usePathname()
  const title = getPageTitle(pathname)

  return (
    <header className="flex h-(--mobile-header-height) items-center justify-between border-b border-border bg-sidebar px-4 md:hidden">
      <h1 className="text-sm font-semibold text-foreground truncate">{title}</h1>
      <button
        className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-foreground"
        aria-label="Notifications (coming soon)"
        disabled
      >
        <Bell className="h-5 w-5" />
      </button>
    </header>
  )
}
```

**Step 2: Commit**

```bash
git add components/layout/mobile-header.tsx
git commit -m "feat(mobile): add MobileHeader component

Shows page title + notification bell (disabled, Phase 2).
Hidden above md breakpoint. Uses pathname matching for titles.
Breadboard P1: U7-U8."
```

**Acceptance Criteria:**

- [ ] Shows correct page title for all routes
- [ ] Hidden above 768px
- [ ] Notification bell present but disabled
- [ ] Height uses `--mobile-header-height` token

---

### Task 6: Integrate Mobile Shell into Dashboard Layout (Breadboard P1 Integration)

**Files:**

- Create: `components/layout/mobile-shell.tsx`
- Modify: `app/(dashboard)/layout.tsx`

This is the critical integration step — hide sidebar on mobile, show BottomTabBar + MobileHeader, add bottom padding for tab bar. **The dashboard layout MUST remain a server component** to preserve server-side data fetching and metadata capabilities for Phase 2/3. Extract all client state into a `<MobileShell>` wrapper.

**Step 1: Create MobileShell client wrapper**

```tsx
// components/layout/mobile-shell.tsx
'use client'

import { useState } from 'react'
import { BottomTabBar } from '@/components/layout/bottom-tab-bar'
import { MobileDrawer } from '@/components/layout/mobile-drawer'
import { MobileHeader } from '@/components/layout/mobile-header'

interface MobileShellProps {
  children: React.ReactNode
}

export function MobileShell({ children }: MobileShellProps) {
  const [drawerOpen, setDrawerOpen] = useState(false)

  return (
    <>
      {/* Mobile header — hidden on desktop */}
      <MobileHeader />

      {/* Page content with bottom padding for tab bar on mobile */}
      <main className="flex-1 overflow-y-auto p-4 pb-20 md:p-6 md:pb-6">{children}</main>

      {/* Mobile navigation — hidden on desktop */}
      <BottomTabBar onMorePress={() => setDrawerOpen(true)} />
      <MobileDrawer open={drawerOpen} onOpenChange={setDrawerOpen} />
    </>
  )
}
```

**Step 2: Update layout.tsx (stays server component)**

```tsx
// app/(dashboard)/layout.tsx — NO "use client" directive
import { Sidebar } from '@/components/layout/sidebar'
import { MobileShell } from '@/components/layout/mobile-shell'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen">
      {/* Desktop sidebar — hidden on mobile */}
      <div className="hidden md:flex">
        <Sidebar />
      </div>

      {/* Mobile shell manages all client state (drawer, header, tab bar) */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <MobileShell>{children}</MobileShell>
      </div>
    </div>
  )
}
```

**Key changes from current layout:**

- Layout remains a **server component** (no `"use client"`)
- All client state (drawer open/close) extracted to `<MobileShell>` wrapper
- Wrap `<Sidebar />` in `<div className="hidden md:flex">`
- `<MobileShell>` renders MobileHeader, main content area, BottomTabBar, and MobileDrawer
- Main padding: `p-4 pb-20 md:p-6 md:pb-6` (extra bottom padding for tab bar on mobile)

> **Pattern: Extract Client Wrapper** — When a server component needs client interactivity, extract a `"use client"` wrapper component that receives `children` as a prop. The parent stays a server component, preserving SSR benefits.

**Step 2: Verify mobile navigation works**

Run dev server, resize to mobile width (< 768px):

- [ ] Sidebar disappears
- [ ] Mobile header appears with page title
- [ ] Bottom tab bar appears
- [ ] Tapping tabs navigates between pages
- [ ] "More" opens the drawer
- [ ] Drawer links navigate and close drawer
- [ ] Content scrolls without overlapping tab bar

Resize to desktop width (>= 768px):

- [ ] Sidebar reappears
- [ ] Mobile header disappears
- [ ] Bottom tab bar disappears
- [ ] Layout identical to before this change

**Step 3: Commit**

```bash
git add app/(dashboard)/layout.tsx
git commit -m "feat(mobile): integrate mobile shell into dashboard layout

Hide sidebar on mobile, show BottomTabBar + MobileHeader + MobileDrawer.
Content has extra bottom padding on mobile for tab bar clearance.
Desktop layout completely unchanged. Breadboard P1 integration."
```

**Acceptance Criteria:**

- [ ] `app/(dashboard)/layout.tsx` has NO `"use client"` directive (remains server component)
- [ ] `components/layout/mobile-shell.tsx` is the only new client component
- [ ] Desktop: identical to before (sidebar visible, no tab bar, no mobile header)
- [ ] Mobile: sidebar hidden, tab bar + header visible, drawer accessible via "More"
- [ ] All navigation paths work on both viewports
- [ ] Server component children render correctly inside the client MobileShell wrapper
- [ ] No hydration errors
- [ ] `npm run build` passes

---

### Task 7: Touch Target Audit (Breadboard C4)

**Files:**

- Audit: all new mobile components created in Tasks 3-6
- Modify: `components/ui/button.tsx` (if needed)

**Approach:** Do NOT add a global CSS rule targeting all buttons/links — this causes unintended side effects on desktop-only components rendered at < 768px (e.g., collapsed sidebars, hidden elements). Instead, the per-component approach already used throughout this plan (`min-h-(--mobile-touch-target)` on specific elements) is the correct pattern.

**Step 1: Audit key interactive elements**

Check and fix these components for `min-h-(--mobile-touch-target)` (44px) on interactive elements:

- `components/layout/bottom-tab-bar.tsx` — tab buttons (already has `min-h-(--mobile-touch-target)`)
- `components/layout/mobile-drawer.tsx` — nav links (already has `min-h-(--mobile-touch-target)`)
- `components/ui/button.tsx` — verify `size="default"` meets 44px on mobile; if not, add `min-h-11` to the default variant
- `components/features/ColumnHeaderMenu.tsx` — column header buttons (desktop-only, skip)
- Any new icon-only buttons — ensure they have explicit `h-11 w-11` sizing

**Step 2: Commit**

```bash
git add components/
git commit -m "feat(mobile): touch target audit — verify all mobile elements ≥ 44px

Per-component min-h-(--mobile-touch-target) on all interactive mobile
elements. No global CSS rule — avoids side effects on desktop components.
Breadboard C4."
```

**Acceptance Criteria:**

- [ ] All mobile-visible interactive elements ≥ 44px tall
- [ ] Touch target enforcement is per-component, not global CSS
- [ ] Desktop interactive elements unchanged
- [ ] No visual regressions

---

### Task 8: BottomSheet Component (Breadboard shared container)

**Files:**

- Create: `components/ui/bottom-sheet.tsx`
- Reference: `components/ui/sheet.tsx` (extends Sheet)

The breadboard has 5 different bottom sheets (P4.1, P4.2, P5.1, P5.2, P6.1). We need a reusable bottom sheet that slides up from the bottom on mobile.

**Step 1: Create BottomSheet component**

```tsx
'use client'

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { cn } from '@/lib/utils'

interface BottomSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  children: React.ReactNode
  className?: string
}

export function BottomSheet({
  open,
  onOpenChange,
  title,
  description,
  children,
  className,
}: BottomSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className={cn('max-h-(--mobile-sheet-max-height) rounded-t-xl', className)}
      >
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-border" />
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
          {description && <SheetDescription>{description}</SheetDescription>}
        </SheetHeader>
        <div className="overflow-y-auto pb-safe">{children}</div>
      </SheetContent>
    </Sheet>
  )
}
```

**Step 2: Commit**

```bash
git add components/ui/bottom-sheet.tsx
git commit -m "feat(mobile): add BottomSheet component

Reusable bottom sheet container built on shadcn Sheet (side=bottom).
Rounded top corners, drag handle indicator, max height 85vh, safe area
padding. Used by all 5 bottom sheet places in breadboard."
```

**Acceptance Criteria:**

- [ ] Slides up from bottom
- [ ] Drag handle indicator at top
- [ ] Max height 85vh with internal scroll
- [ ] Safe area padding at bottom
- [ ] Backdrop closes sheet
- [ ] Accepts title, description, children

---

### Task 9: MobileCardList Shared Component (Breadboard P6: U113-U119)

**Files:**

- Create: `components/ui/mobile-card-list.tsx`

Research found that Jobs, Invoices, and Customers lists already have inline mobile card views. This task extracts the shared pattern and creates the missing Quotes mobile cards.

**Step 1: Create MobileCardList container component**

```tsx
import { cn } from '@/lib/utils'

interface MobileCardListProps<T> {
  items: T[]
  renderCard: (item: T, index: number) => React.ReactNode
  emptyMessage?: string
  className?: string
}

export function MobileCardList<T>({
  items,
  renderCard,
  emptyMessage = 'No items found',
  className,
}: MobileCardListProps<T>) {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <p className="text-sm">{emptyMessage}</p>
      </div>
    )
  }

  return (
    <div className={cn('flex flex-col gap-(--mobile-card-gap) md:hidden', className)}>
      {items.map((item, index) => renderCard(item, index))}
    </div>
  )
}
```

**Step 2: Commit**

```bash
git add components/ui/mobile-card-list.tsx
git commit -m "feat(mobile): add MobileCardList shared component

Generic container for mobile card lists. Hidden above md breakpoint.
Accepts renderCard prop for flexible card rendering per entity type.
Breadboard P6: U113-U119."
```

**Note:** The existing inline mobile card views in Jobs/Invoices/Customers DataTables can be migrated to use this component later, or left as-is since they already work. The primary value is for new mobile card views (Quotes) and consistency going forward.

**Acceptance Criteria:**

- [ ] Generic component accepts any item type
- [ ] Hidden above md breakpoint
- [ ] Empty state rendered when no items
- [ ] Gap uses `--mobile-card-gap` token

---

**Sprint 1 Complete Checkpoint:**

After all 9 tasks, verify:

- [ ] `npm run build` passes
- [ ] Desktop: app looks and works identically to before
- [ ] Mobile (< 768px): bottom tab bar, mobile header, drawer navigation all functional
- [ ] All 5 primary tabs navigate correctly
- [ ] Drawer opens from "More" tab with 4 secondary links
- [ ] Touch targets ≥ 44px on mobile
- [ ] BottomSheet and MobileCardList components available for Sprint 2

---

## Sprint 2: High-Value Screens (~1 week)

> **Recommended build order:** Task 10 (Board) → Task 13 (Dashboard) → Task 11 (CapacitySummary) → Task 12 (NoteCapture) → Task 14 (LaneSelector). Dashboard before NoteCapture because the dashboard is simpler and provides immediate visual value, while NoteCapture is a complex component that benefits from having the board and dashboard in place for integration testing.

### Task 10: MobileKanbanBoard — Lane Tab Bar (Breadboard P4: U30-U32)

**Files:**

- Create: `app/(dashboard)/jobs/board/_components/MobileKanbanBoard.tsx`
- Create: `app/(dashboard)/jobs/board/_components/MobileLaneTabBar.tsx`
- Modify: `app/(dashboard)/jobs/board/page.tsx` (conditionally render mobile vs desktop board)

The mobile Kanban replaces the horizontal multi-lane scroll with a single-column card list + swipeable lane tabs at the top. This is the highest-complexity task.

**Step 1: Create MobileLaneTabBar**

Horizontal scrollable tab bar showing lane names with card counts:

```tsx
'use client'

import { cn } from '@/lib/utils'
import type { Lane } from '@/lib/schemas/job'

const laneLabels: Record<string, string> = {
  ready: 'Ready',
  in_progress: 'In Progress',
  review: 'Review',
  blocked: 'Blocked',
  done: 'Done',
}

interface MobileLaneTabBarProps {
  lanes: string[]
  activeLane: string
  onLaneChange: (lane: string) => void
  cardCounts: Record<string, number>
}

export function MobileLaneTabBar({
  lanes,
  activeLane,
  onLaneChange,
  cardCounts,
}: MobileLaneTabBarProps) {
  return (
    <div className="flex gap-1 overflow-x-auto border-b border-border px-1 pb-px scrollbar-none">
      {lanes.map((lane) => (
        <button
          key={lane}
          onClick={() => onLaneChange(lane)}
          className={cn(
            'flex shrink-0 items-center gap-1.5 px-3 py-2 text-sm font-medium transition-colors',
            'border-b-2 min-h-(--mobile-touch-target)',
            activeLane === lane
              ? 'border-action text-action'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          )}
        >
          {laneLabels[lane] ?? lane}
          <span
            className={cn(
              'rounded-full px-1.5 py-0.5 text-xs',
              activeLane === lane ? 'bg-action/20 text-action' : 'bg-surface text-muted-foreground'
            )}
          >
            {cardCounts[lane] ?? 0}
          </span>
        </button>
      ))}
    </div>
  )
}
```

**Step 2: Create MobileKanbanBoard shell**

```tsx
'use client'

import { useState, useCallback } from 'react'
import { MobileLaneTabBar } from './MobileLaneTabBar'
import type { JobCard, QuoteCard, ScratchNoteCard, BoardCard } from '@/lib/schemas/board-card'
import type { Lane } from '@/lib/schemas/job'

const LANES: Lane[] = ['ready', 'in_progress', 'review', 'blocked', 'done']

interface MobileKanbanBoardProps {
  jobCards: JobCard[]
  quoteCards: QuoteCard[]
  scratchNotes: ScratchNoteCard[]
  onMoveCard: (card: BoardCard, targetLane: Lane, blockReason?: string) => void
}

export function MobileKanbanBoard({
  jobCards,
  quoteCards,
  scratchNotes,
  onMoveCard,
}: MobileKanbanBoardProps) {
  const [activeLane, setActiveLane] = useState<Lane>('in_progress')

  const jobsInLane = jobCards.filter((j) => j.lane === activeLane)
  const cardCounts = LANES.reduce(
    (acc, lane) => ({
      ...acc,
      [lane]: jobCards.filter((j) => j.lane === lane).length,
    }),
    {} as Record<string, number>
  )

  // Quote cards in current lane
  const quotesInLane = quoteCards.filter((q) => q.lane === activeLane)
  // Scratch notes only appear in "ready" lane
  const notesInLane = activeLane === 'ready' ? scratchNotes.filter((n) => !n.isArchived) : []
  const hasCards = jobsInLane.length > 0 || quotesInLane.length > 0 || notesInLane.length > 0

  return (
    <div className="flex flex-col gap-0 md:hidden">
      {/* Section toggle: Jobs / Quotes / All (U41) + View toggle Board/List (U44) */}
      <div className="flex items-center justify-between border-b border-border px-4 py-2">
        <div className="flex gap-1">
          {/* Section filter chips — implementation detail for builder */}
          {/* Options: "All", "Jobs", "Quotes" — filters which card types show */}
        </div>
        {/* View toggle icon button (Board vs List view) */}
      </div>

      <MobileLaneTabBar
        lanes={LANES}
        activeLane={activeLane}
        onLaneChange={setActiveLane}
        cardCounts={cardCounts}
      />
      <div className="relative flex flex-col gap-(--mobile-card-gap) p-4">
        {!hasCards ? (
          <p className="py-12 text-center text-sm text-muted-foreground">No cards in this lane</p>
        ) : (
          <>
            {/* Scratch notes in Ready lane (U43) */}
            {notesInLane.map((note) => (
              <div
                key={note.id}
                className="rounded-lg border border-dashed border-border bg-surface p-3 text-sm text-muted-foreground"
              >
                {note.content}
              </div>
            ))}

            {/* Quote cards (U42) */}
            {quotesInLane.map((quote) => (
              <MobileQuoteCard key={quote.quoteId} quote={quote} />
            ))}

            {/* Job cards */}
            {jobsInLane.map((job) => (
              <MobileJobCard
                key={job.id}
                job={job}
                activeLane={activeLane}
                onMoveToNext={() => {
                  const currentIndex = LANES.indexOf(activeLane)
                  const nextLane = LANES[currentIndex + 1]
                  if (nextLane && nextLane !== 'blocked') {
                    onMoveCard(job, nextLane)
                  }
                }}
                onBlock={(reason) => onMoveCard(job, 'blocked', reason)}
              />
            ))}
          </>
        )}

        {/* FAB "+" button for adding scratch notes (U39) */}
        <button
          className="fixed bottom-[calc(var(--mobile-nav-height)+env(safe-area-inset-bottom,0px)+1rem)] right-4 z-40 flex h-(--mobile-fab-size) w-(--mobile-fab-size) items-center justify-center rounded-full bg-action text-action-foreground shadow-lg md:hidden"
          aria-label="Add scratch note"
        >
          <Plus className="h-6 w-6" />
        </button>
      </div>
    </div>
  )
}
```

**Step 3: Create MobileJobCard with quick actions (U33-U38)**

The mobile card shows job info + a "Move to [Next Lane] →" button for the two-speed workflow:

```tsx
import Link from 'next/link'
import { ArrowRight, AlertTriangle, Plus } from 'lucide-react'
import { ServiceTypeBadge } from '@/components/features/ServiceTypeBadge'
import { RiskIndicator } from '@/components/features/RiskIndicator'
import { TaskProgressBar } from '@/components/features/TaskProgressBar'
import { Button } from '@/components/ui/button'
import type { JobCard, QuoteCard } from '@/lib/schemas/board-card'

// MobileJobCard — uses JobCard (view model), NOT the raw Job schema
function MobileJobCard({
  job,
  activeLane,
  onMoveToNext,
  onBlock,
}: {
  job: JobCard
  activeLane: string
  onMoveToNext: () => void
  onBlock: (reason: string) => void
}) {
  // taskProgress is pre-computed on the board card — no need to call computeTaskProgress()
  const { taskProgress } = job
  const nextLaneLabel: Record<string, string> = {
    ready: 'In Progress',
    in_progress: 'Review',
    review: 'Done',
    blocked: 'Ready',
  }

  return (
    <div className="rounded-lg border border-border bg-elevated p-4">
      <Link href={`/jobs/${job.id}`} className="block">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-xs text-muted-foreground">{job.jobNumber}</p>
            <p className="truncate text-sm font-medium text-foreground">
              {job.customerName} — {job.title}
            </p>
          </div>
          <RiskIndicator level={job.riskLevel} />
        </div>

        <div className="mt-2 flex items-center gap-2">
          <ServiceTypeBadge type={job.serviceType} />
          <span className="text-xs text-muted-foreground">{job.quantity} pcs</span>
          {job.dueDate && (
            <span className="text-xs text-muted-foreground">
              Due {new Date(job.dueDate).toLocaleDateString()}
            </span>
          )}
        </div>

        <div className="mt-2">
          <TaskProgressBar completed={taskProgress.completed} total={taskProgress.total} />
        </div>
      </Link>

      {/* Quick actions — two-speed workflow */}
      {activeLane !== 'done' && (
        <div className="mt-3 flex gap-2 border-t border-border pt-3">
          {nextLaneLabel[activeLane] && (
            <Button
              variant="outline"
              size="sm"
              className="flex-1 min-h-(--mobile-touch-target)"
              onClick={(e) => {
                e.preventDefault()
                onMoveToNext()
              }}
            >
              Move to {nextLaneLabel[activeLane]}
              <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          )}
          {activeLane !== 'blocked' && (
            <Button
              variant="outline"
              size="sm"
              className="min-h-(--mobile-touch-target) text-warning"
              onClick={(e) => {
                e.preventDefault()
                onBlock('') // Opens BlockReasonSheet (Task 10b)
              }}
            >
              <AlertTriangle className="h-4 w-4" />
            </Button>
          )}
        </div>
      )}

      {/* Block reason display */}
      {job.lane === 'blocked' && job.blockReason && (
        <div className="mt-2 rounded bg-warning/10 px-3 py-2 text-xs text-warning">
          {job.blockReason}
        </div>
      )}
    </div>
  )
}

// MobileQuoteCard — renders quote cards on the board (U42)
function MobileQuoteCard({ quote }: { quote: QuoteCard }) {
  return (
    <div className="rounded-lg border border-purple/30 bg-elevated p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-xs text-purple">Quote</p>
          <p className="truncate text-sm font-medium text-foreground">
            {quote.customerName} — {quote.description}
          </p>
        </div>
        {quote.isNew && (
          <span className="rounded-full bg-action/20 px-2 py-0.5 text-xs text-action">New</span>
        )}
      </div>
      {quote.total != null && (
        <p className="mt-1 text-xs text-muted-foreground">${quote.total.toLocaleString()}</p>
      )}
    </div>
  )
}
```

**Step 4: Integrate into board page**

Modify `app/(dashboard)/jobs/board/page.tsx` to conditionally render:

In the `ProductionBoardInner` component, add after the desktop board rendering:

```tsx
{
  /* Desktop board */
}
;<div className="hidden md:block">{/* ... existing DndContext board code ... */}</div>

{
  /* Mobile board — uses same moveCard function as desktop DnD */
}
;<MobileKanbanBoard
  jobCards={jobCards}
  quoteCards={quoteCardState}
  scratchNotes={scratchNoteCards}
  onMoveCard={moveCard}
/>
```

**Step 5: Commit**

```bash
git add app/(dashboard)/jobs/board/_components/MobileLaneTabBar.tsx
git add app/(dashboard)/jobs/board/_components/MobileKanbanBoard.tsx
git add app/(dashboard)/jobs/board/page.tsx
git commit -m "feat(mobile): add MobileKanbanBoard with lane tabs and quick actions

Single-column card list with horizontal lane tab bar replacing the
desktop multi-lane drag-and-drop board. Quick 'Move to Next Lane'
button on each card for the two-speed workflow pattern.
Breadboard P4: U30-U44."
```

**Acceptance Criteria:**

- [ ] Mobile: lane tabs scroll horizontally, active lane highlighted
- [ ] Mobile: card count badges update when cards move
- [ ] Mobile: tapping a card navigates to job detail
- [ ] Mobile: "Move to Next Lane" button advances card
- [ ] Mobile: blocked cards show block reason
- [ ] Mobile: FAB "+" button visible for scratch notes (U39)
- [ ] Mobile: section toggle chips (All/Jobs/Quotes) visible (U41)
- [ ] Mobile: quote cards render with purple accent (U42)
- [ ] Mobile: scratch notes render in Ready lane (U43)
- [ ] Desktop: existing drag-and-drop board unchanged
- [ ] `npm run build` passes

---

### Task 10b: BlockReasonSheet — Bottom Sheet for Block Reason Input (Breadboard P4.1: U50-U52)

**Files:**

- Create: `components/features/BlockReasonSheet.tsx` (or inline in MobileKanbanBoard)
- Reference: `components/ui/bottom-sheet.tsx`

When a user taps the block button on a MobileJobCard, a bottom sheet slides up for entering the block reason before the card moves to the Blocked lane.

**Step 1: Create BlockReasonSheet**

```tsx
'use client'

import { useState } from 'react'
import { BottomSheet } from '@/components/ui/bottom-sheet'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ShieldAlert } from 'lucide-react'

interface BlockReasonSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  jobTitle: string
  onConfirm: (reason: string) => void
}

export function BlockReasonSheet({
  open,
  onOpenChange,
  jobTitle,
  onConfirm,
}: BlockReasonSheetProps) {
  const [reason, setReason] = useState('')

  return (
    <BottomSheet open={open} onOpenChange={onOpenChange} title="Block Job">
      <div className="flex flex-col gap-4 p-4">
        <div className="flex items-center gap-2 text-warning">
          <ShieldAlert className="h-5 w-5" />
          <span className="text-sm font-medium">{jobTitle}</span>
        </div>
        <Textarea
          placeholder="Why is this job blocked?"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="min-h-20"
          autoFocus
        />
        <Button
          onClick={() => {
            onConfirm(reason.trim() || 'Blocked (no reason given)')
            onOpenChange(false)
          }}
          className="min-h-(--mobile-touch-target) bg-warning text-warning-foreground hover:bg-warning-hover"
        >
          Block Job
        </Button>
      </div>
    </BottomSheet>
  )
}
```

**Important:** Use conditional rendering: `{blockSheetOpen && <BlockReasonSheet ... />}` for automatic state reset.

**Step 2: Wire into MobileKanbanBoard**

Add state in MobileKanbanBoard to track which card is being blocked, and render BlockReasonSheet. The `onBlock` callback from MobileJobCard opens this sheet.

**Step 3: Commit**

```bash
git add components/features/BlockReasonSheet.tsx
git commit -m "feat(mobile): add BlockReasonSheet for mobile board block workflow

Bottom sheet input for block reason. Opens when user taps block button
on a mobile job card. Breadboard P4.1: U50-U52."
```

**Acceptance Criteria:**

- [ ] Bottom sheet opens when block button tapped
- [ ] Text input for block reason with auto-focus
- [ ] Confirm moves card to Blocked lane with reason
- [ ] State resets on close (conditional rendering)

---

### Task 11: CapacitySummary Mobile Component (Breadboard U27, U40)

**Files:**

- Create: `components/features/CapacitySummary.tsx`
- Reference: `app/(dashboard)/jobs/board/_components/CapacitySummaryBar.tsx`

The existing `CapacitySummaryBar` is board-specific. We need a shared `CapacitySummary` used by both the mobile board and mobile dashboard.

**Step 1: Create shared CapacitySummary component**

```tsx
import { Zap, Package, AlertTriangle } from 'lucide-react'
import type { CapacitySummary as CapacitySummaryType } from '@/lib/helpers/job-utils'

interface CapacitySummaryProps {
  summary: CapacitySummaryType
  variant?: 'compact' | 'full'
}

export function CapacitySummary({ summary, variant = 'compact' }: CapacitySummaryProps) {
  return (
    <div className="flex items-center gap-4 rounded-lg border border-border bg-surface px-3 py-2 text-xs">
      <div className="flex items-center gap-1.5">
        <Package className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-muted-foreground">{summary.totalQuantity.toLocaleString()} pcs</span>
      </div>
      {summary.rushQuantity > 0 && (
        <div className="flex items-center gap-1.5">
          <Zap className="h-3.5 w-3.5 text-warning" />
          <span className="text-warning">{summary.rushQuantity.toLocaleString()} rush</span>
        </div>
      )}
      {variant === 'full' && (
        <div className="flex items-center gap-1.5">
          <AlertTriangle className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-muted-foreground">{summary.cardsByLane.blocked ?? 0} blocked</span>
        </div>
      )}
    </div>
  )
}
```

**Step 2: Commit**

```bash
git add components/features/CapacitySummary.tsx
git commit -m "feat(mobile): add shared CapacitySummary component

Compact capacity display showing total pieces, rush count, and optionally
blocked count. Reused by mobile dashboard and mobile board.
Breadboard U27, U40."
```

---

### Task 12: NoteCapture with Side Effects (Breadboard P4.2, P5.1: U55-U62, U90-U97)

**Files:**

- Create: `components/features/NoteCapture.tsx`
- Reference: `components/ui/bottom-sheet.tsx` (container)
- Reference: `lib/schemas/note.ts` (noteChannelEnum)
- Reference: `lib/schemas/job.ts` (jobNoteSchema)

This is the "notes with side effects" pattern from the interview — logging a note can optionally block/unblock a job.

**Step 1: Create NoteCapture component**

```tsx
'use client'

import { useState } from 'react'
import { BottomSheet } from '@/components/ui/bottom-sheet'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Send, ShieldAlert, ShieldCheck } from 'lucide-react'

const channels = [
  { value: 'phone', label: 'Phone' },
  { value: 'email', label: 'Email' },
  { value: 'text', label: 'Text' },
  { value: 'social', label: 'Social' },
  { value: 'in-person', label: 'In Person' },
]

const noteTypes = [
  { value: 'internal', label: 'Internal' },
  { value: 'customer', label: 'Customer' },
]

interface NoteCaptureProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** The job this note will be attached to */
  jobId: string
  jobTitle: string
  /** Current lane of the job — determines if block/unblock toggle is shown */
  currentLane: string
  onSave: (data: {
    content: string
    type: 'internal' | 'customer'
    channel: string
    blockJob?: boolean
    blockReason?: string
    unblockJob?: boolean
  }) => void
}

export function NoteCapture({
  open,
  onOpenChange,
  jobId,
  jobTitle,
  currentLane,
  onSave,
}: NoteCaptureProps) {
  const [content, setContent] = useState('')
  const [noteType, setNoteType] = useState<'internal' | 'customer'>('internal')
  const [channel, setChannel] = useState('phone')
  const [blockToggle, setBlockToggle] = useState(false)
  const [unblockToggle, setUnblockToggle] = useState(false)
  const [blockReason, setBlockReason] = useState('')

  const isBlocked = currentLane === 'blocked'
  const canSave = content.trim().length > 0

  const handleSave = () => {
    if (!canSave) return
    onSave({
      content: content.trim(),
      type: noteType,
      channel,
      blockJob: !isBlocked && blockToggle ? true : undefined,
      blockReason: !isBlocked && blockToggle ? blockReason || content.trim() : undefined,
      unblockJob: isBlocked && unblockToggle ? true : undefined,
    })
    // Close the sheet — state reset happens automatically via conditional
    // rendering: parent renders {open && <NoteCapture />} so React
    // unmounts/remounts the component, resetting all useState hooks.
    // See: CLAUDE.md "React 19 ESLint — no setState in effects" lesson.
    onOpenChange(false)
  }

  return (
    <BottomSheet open={open} onOpenChange={onOpenChange} title="Add Note" description={jobTitle}>
      <div className="flex flex-col gap-4 p-4">
        {/* Note content */}
        <Textarea
          placeholder="Type your note..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="min-h-24 resize-none"
          autoFocus
        />

        {/* Type + Channel row */}
        <div className="flex gap-2">
          <Select value={noteType} onValueChange={(v) => setNoteType(v as 'internal' | 'customer')}>
            <SelectTrigger className="flex-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {noteTypes.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={channel} onValueChange={setChannel}>
            <SelectTrigger className="flex-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {channels.map((c) => (
                <SelectItem key={c.value} value={c.value}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Side effects — block/unblock toggles */}
        {!isBlocked && (
          <div className="flex items-center gap-3 rounded-lg border border-border p-3">
            <ShieldAlert className="h-5 w-5 shrink-0 text-warning" />
            <div className="flex-1">
              <Label htmlFor="block-toggle" className="text-sm font-medium">
                Block this job
              </Label>
              <p className="text-xs text-muted-foreground">Note becomes the block reason</p>
            </div>
            <Switch id="block-toggle" checked={blockToggle} onCheckedChange={setBlockToggle} />
          </div>
        )}

        {isBlocked && (
          <div className="flex items-center gap-3 rounded-lg border border-success/30 p-3">
            <ShieldCheck className="h-5 w-5 shrink-0 text-success" />
            <div className="flex-1">
              <Label htmlFor="unblock-toggle" className="text-sm font-medium">
                Unblock this job
              </Label>
              <p className="text-xs text-muted-foreground">Move back to previous lane</p>
            </div>
            <Switch
              id="unblock-toggle"
              checked={unblockToggle}
              onCheckedChange={setUnblockToggle}
            />
          </div>
        )}

        {/* Save button */}
        <Button onClick={handleSave} disabled={!canSave} className="min-h-(--mobile-touch-target)">
          <Send className="mr-2 h-4 w-4" />
          {blockToggle
            ? 'Save Note & Block Job'
            : unblockToggle
              ? 'Save Note & Unblock'
              : 'Save Note'}
        </Button>
      </div>
    </BottomSheet>
  )
}
```

**Step 2: Commit**

```bash
git add components/features/NoteCapture.tsx
git commit -m "feat(mobile): add NoteCapture with side effects

Bottom sheet note input with type selector, channel selector, and
optional block/unblock toggle. When block is enabled, the note
content becomes the block reason and the job lane changes.
Interview-discovered pattern. Breadboard P4.2, P5.1: U55-U62, U90-U97."
```

**Important:** Parent components MUST render NoteCapture with conditional rendering for automatic state reset:

```tsx
{noteCaptureOpen && (
  <NoteCapture open={noteCaptureOpen} onOpenChange={setNoteCaptureOpen} ... />
)}
```

This ensures React unmounts/remounts the component when closed, resetting all `useState` hooks without manual reset logic.

**Acceptance Criteria:**

- [ ] Opens as bottom sheet
- [ ] Text input auto-focuses
- [ ] Note type (internal/customer) and channel selectors work
- [ ] "Block this job" toggle shown when job is NOT blocked
- [ ] "Unblock this job" toggle shown when job IS blocked
- [ ] Save button label changes based on toggle state
- [ ] onSave callback provides all form data including side effects
- [ ] Form resets after close+reopen (via conditional rendering)

---

### Task 13: MobileDashboard Layout (Breadboard P3: U20-U28)

**Files:**

- Modify: `app/(dashboard)/page.tsx`

The dashboard has hardcoded `grid-cols-4` and no mobile layout. We need:

- 2-column stat cards on mobile
- "Coming Up" filter toggle
- Blocked alert card
- Capacity summary

**Step 1: Make stat cards responsive**

In `app/(dashboard)/page.tsx`, change the stat cards grid from:

```tsx
<div className="grid grid-cols-4 gap-4">
```

to:

```tsx
<div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
```

**Step 2: Add "Coming Up" filter section for mobile**

Add a "Coming Up This Week" section between stat cards and the existing sections, visible only on mobile:

```tsx
{
  /* Coming Up — mobile only */
}
;<div className="md:hidden">
  <MobileComingUpSection jobs={jobs} />
</div>
```

Create `MobileComingUpSection` as an inline component or in a separate file that filters jobs due within the next 7 days and renders them as compact cards.

**Step 3: Add capacity summary to mobile dashboard**

Import and render `<CapacitySummary>` between the stat cards and the coming-up section on mobile.

**Step 4: Make existing sections (Blocked, In Progress) mobile-friendly**

Ensure the blocked jobs and in-progress sections use responsive classes:

- Job rows in these sections should stack vertically on mobile
- Block reason text should wrap properly

**Step 5: Commit**

```bash
git add app/(dashboard)/page.tsx
git commit -m "feat(mobile): make dashboard responsive with coming-up filter

Stat cards now 2-col on mobile, 4-col on desktop. Added 'Coming Up This
Week' section for mobile (filtered job list for evening check-in).
Capacity summary visible on mobile dashboard.
Breadboard P3: U20-U28."
```

**Acceptance Criteria:**

- [ ] Stat cards: 2 columns on mobile, 4 on desktop
- [ ] "Coming Up" section shows jobs due this week (mobile only)
- [ ] Capacity summary visible on mobile
- [ ] Blocked alert card clickable → navigates to filtered jobs list
- [ ] Desktop layout unchanged

---

### Task 14: LaneSelector Component (Breadboard P5.2: U100-U104)

**Files:**

- Create: `components/features/LaneSelector.tsx`
- Reference: `components/ui/bottom-sheet.tsx` (container)

**Step 1: Create LaneSelector component**

```tsx
'use client'

import { useState } from 'react'
import { BottomSheet } from '@/components/ui/bottom-sheet'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

const lanes = [
  { value: 'ready', label: 'Ready', color: 'text-foreground' },
  { value: 'in_progress', label: 'In Progress', color: 'text-action' },
  { value: 'review', label: 'Review', color: 'text-purple' },
  { value: 'blocked', label: 'Blocked', color: 'text-warning' },
  { value: 'done', label: 'Done', color: 'text-success' },
]

interface LaneSelectorProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentLane: string
  onConfirm: (lane: string, blockReason?: string) => void
}

export function LaneSelector({ open, onOpenChange, currentLane, onConfirm }: LaneSelectorProps) {
  const [selectedLane, setSelectedLane] = useState(currentLane)
  const [blockReason, setBlockReason] = useState('')

  const handleConfirm = () => {
    onConfirm(selectedLane, selectedLane === 'blocked' ? blockReason : undefined)
    // State reset via conditional rendering — parent renders {open && <LaneSelector />}
    onOpenChange(false)
  }

  return (
    <BottomSheet open={open} onOpenChange={onOpenChange} title="Move Lane">
      <div className="flex flex-col gap-2 p-4">
        {lanes.map((lane) => (
          <button
            key={lane.value}
            onClick={() => setSelectedLane(lane.value)}
            className={cn(
              'flex items-center justify-between rounded-lg border px-4 py-3 text-left transition-colors',
              'min-h-(--mobile-touch-target)',
              selectedLane === lane.value
                ? 'border-action bg-action/10'
                : 'border-border hover:bg-surface',
              lane.value === currentLane && 'opacity-50'
            )}
            disabled={lane.value === currentLane}
          >
            <span className={cn('text-sm font-medium', lane.color)}>{lane.label}</span>
            {lane.value === currentLane && (
              <span className="text-xs text-muted-foreground">Current</span>
            )}
            {selectedLane === lane.value && lane.value !== currentLane && (
              <Check className="h-4 w-4 text-action" />
            )}
          </button>
        ))}

        {/* Block reason input — shown when Blocked is selected */}
        {selectedLane === 'blocked' && selectedLane !== currentLane && (
          <Textarea
            placeholder="Block reason..."
            value={blockReason}
            onChange={(e) => setBlockReason(e.target.value)}
            className="mt-2 min-h-20"
          />
        )}

        <Button
          onClick={handleConfirm}
          disabled={selectedLane === currentLane}
          className="mt-2 min-h-(--mobile-touch-target)"
        >
          Confirm Move
        </Button>
      </div>
    </BottomSheet>
  )
}
```

**Step 2: Commit**

```bash
git add components/features/LaneSelector.tsx
git commit -m "feat(mobile): add LaneSelector bottom sheet component

Lane picker in bottom sheet for mobile job lane changes. Shows all 5
lanes with current lane indicated. Blocked lane selection shows block
reason input. Breadboard P5.2: U100-U104."
```

**Acceptance Criteria:**

- [ ] All 5 lanes shown as tappable options
- [ ] Current lane disabled and marked
- [ ] Selecting "Blocked" reveals block reason input
- [ ] Confirm button calls onConfirm with lane + optional reason
- [ ] Touch targets ≥ 44px

---

**Sprint 2 Complete Checkpoint:**

After Tasks 10-14, verify:

- [ ] `npm run build` passes
- [ ] Mobile board: lane tabs work, cards show, quick actions move cards
- [ ] Mobile dashboard: 2-col stats, coming up section, capacity summary
- [ ] NoteCapture: opens as bottom sheet, block/unblock toggles work
- [ ] LaneSelector: opens as bottom sheet, lane change works
- [ ] Desktop: all existing pages unchanged

---

## Sprint 3: List Views + Forms (~1 week)

### Task 15: Quotes List Mobile Cards (Breadboard P6)

**Files:**

- Modify: `app/(dashboard)/quotes/_components/QuotesDataTable.tsx`
- Reference: Jobs DataTable mobile card pattern (lines 627-681)

The Quotes list is the only list WITHOUT mobile cards. Add the same `hidden md:block` / `md:hidden` pattern used by Jobs, Invoices, and Customers.

**Step 1: Add mobile card view to QuotesDataTable**

After the desktop table `<div className="hidden md:block">`, add:

```tsx
{
  /* Mobile card list */
}
;<div className="flex flex-col gap-(--mobile-card-gap) md:hidden">
  {sortedQuotes.map((quote) => (
    <button
      key={quote.id}
      onClick={() => router.push(`/quotes/${quote.id}`)}
      className="flex flex-col gap-2 rounded-lg border border-border bg-elevated p-4 text-left transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action/50"
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-foreground">{quote.quoteNumber}</span>
        <StatusBadge status={quote.status} />
      </div>
      <p className="text-sm text-muted-foreground truncate">{quote.customerName}</p>
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{quote.lineItems?.length ?? 0} items</span>
        <span className="font-medium text-foreground">${quote.total?.toLocaleString()}</span>
      </div>
    </button>
  ))}
</div>
```

Also wrap the existing desktop table in `<div className="hidden md:block">`.

**Step 2: Commit**

```bash
git add app/(dashboard)/quotes/_components/QuotesDataTable.tsx
git commit -m "feat(mobile): add mobile card view to Quotes list

Adds responsive card layout matching Jobs/Invoices/Customers pattern.
Desktop table hidden below md, cards shown instead.
Breadboard P6 — completes all 4 list view mobile cards."
```

**Acceptance Criteria:**

- [ ] Quotes list shows cards on mobile with quote #, customer, status, item count, total
- [ ] Desktop table unchanged
- [ ] Cards are tappable → navigate to quote detail
- [ ] Matches visual pattern of other list mobile cards

---

### Task 16: Polish Existing Mobile Cards (Jobs, Invoices, Customers)

**Files:**

- Modify: `app/(dashboard)/jobs/_components/JobsDataTable.tsx`
- Modify: `app/(dashboard)/invoices/_components/InvoicesDataTable.tsx`
- Modify: `app/(dashboard)/customers/_components/CustomersDataTable.tsx`

The existing mobile cards work but should be polished:

- Use `--mobile-card-gap` token for consistent spacing
- Ensure touch targets meet 44px
- Verify card content hierarchy matches breadboard

**Step 1: Update gap classes**

In each DataTable, change `gap-3` to `gap-(--mobile-card-gap)` on the mobile card container.

**Step 2: Verify touch targets**

Ensure each card button has `min-h-(--mobile-touch-target)` or is naturally tall enough.

**Step 3: Commit**

```bash
git add app/(dashboard)/jobs/_components/JobsDataTable.tsx
git add app/(dashboard)/invoices/_components/InvoicesDataTable.tsx
git add app/(dashboard)/customers/_components/CustomersDataTable.tsx
git commit -m "feat(mobile): polish existing mobile card views

Standardize gap spacing to --mobile-card-gap token, verify touch
targets. No visual changes — consistency improvements."
```

---

### Task 17: MobileFilterSheet Component (Breadboard P6.1: U120-U125)

**Files:**

- Create: `components/features/MobileFilterSheet.tsx`
- Reference: `components/ui/bottom-sheet.tsx` (container)

Unified filter/sort bottom sheet for all mobile list views.

**Step 1: Create MobileFilterSheet**

```tsx
'use client'

import { useState } from 'react'
import { BottomSheet } from '@/components/ui/bottom-sheet'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface FilterOption {
  value: string
  label: string
}

interface MobileFilterSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title?: string
  sortOptions: FilterOption[]
  currentSort: string
  onSortChange: (value: string) => void
  filterGroups?: {
    label: string
    options: FilterOption[]
    selected: string[]
    onToggle: (value: string) => void
  }[]
  onApply: () => void
  onReset: () => void
}

export function MobileFilterSheet({
  open,
  onOpenChange,
  title = 'Sort & Filter',
  sortOptions,
  currentSort,
  onSortChange,
  filterGroups = [],
  onApply,
  onReset,
}: MobileFilterSheetProps) {
  return (
    <BottomSheet open={open} onOpenChange={onOpenChange} title={title}>
      <div className="flex flex-col gap-6 p-4">
        {/* Sort */}
        <div>
          <h3 className="mb-2 text-sm font-medium text-muted-foreground">Sort by</h3>
          <div className="flex flex-wrap gap-2">
            {sortOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => onSortChange(opt.value)}
                className={cn(
                  'rounded-full border px-3 py-1.5 text-sm transition-colors',
                  'min-h-(--mobile-touch-target)',
                  currentSort === opt.value
                    ? 'border-action bg-action/10 text-action'
                    : 'border-border text-muted-foreground hover:bg-surface'
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Filter groups */}
        {filterGroups.map((group) => (
          <div key={group.label}>
            <h3 className="mb-2 text-sm font-medium text-muted-foreground">{group.label}</h3>
            <div className="flex flex-wrap gap-2">
              {group.options.map((opt) => {
                const isSelected = group.selected.includes(opt.value)
                return (
                  <button
                    key={opt.value}
                    onClick={() => group.onToggle(opt.value)}
                    className={cn(
                      'rounded-full border px-3 py-1.5 text-sm transition-colors',
                      'min-h-(--mobile-touch-target)',
                      isSelected
                        ? 'border-action bg-action/10 text-action'
                        : 'border-border text-muted-foreground hover:bg-surface'
                    )}
                  >
                    {opt.label}
                  </button>
                )
              })}
            </div>
          </div>
        ))}

        {/* Actions */}
        <div className="flex gap-2 border-t border-border pt-4">
          <Button
            variant="outline"
            onClick={onReset}
            className="flex-1 min-h-(--mobile-touch-target)"
          >
            Reset
          </Button>
          <Button
            onClick={() => {
              onApply()
              onOpenChange(false)
            }}
            className="flex-1 min-h-(--mobile-touch-target)"
          >
            Apply
          </Button>
        </div>
      </div>
    </BottomSheet>
  )
}
```

**Step 2: Commit**

```bash
git add components/features/MobileFilterSheet.tsx
git commit -m "feat(mobile): add MobileFilterSheet component

Configurable sort/filter bottom sheet with chip-style toggles.
Reused by all 4 mobile list views with different sort/filter options.
Breadboard P6.1: U120-U125."
```

**Acceptance Criteria:**

- [ ] Sort options render as toggleable chips
- [ ] Filter groups render with multi-select chips
- [ ] Apply button closes sheet
- [ ] Reset button clears all selections
- [ ] Touch targets ≥ 44px

---

### Task 18: Form Mobile Layouts (Breadboard P8: U140-U146)

**Files:**

- Modify: `app/(dashboard)/quotes/_components/QuoteForm.tsx`
- Modify: `app/(dashboard)/invoices/_components/InvoiceForm.tsx`

Both forms need:

- Single-column layout on mobile (they may already be, verify)
- Sticky save/cancel buttons at bottom
- Touch-friendly input sizes

**Step 1: Audit current form layouts**

Check if forms are already single-column. The research indicates they use `CollapsibleSection` patterns. They likely just need:

- Sticky bottom action bar on mobile
- Input heights meeting 44px touch target

**Step 2: Add sticky bottom actions to forms**

Wrap the save/cancel buttons in a sticky bottom container on mobile:

```tsx
<div className="sticky bottom-0 z-10 -mx-4 border-t border-border bg-background/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:static md:mx-0 md:border-0 md:bg-transparent md:px-0 md:py-0 md:backdrop-blur-none">
  {/* existing save/cancel buttons */}
</div>
```

**Step 3: Commit**

```bash
git add app/(dashboard)/quotes/_components/QuoteForm.tsx
git add app/(dashboard)/invoices/_components/InvoiceForm.tsx
git commit -m "feat(mobile): make forms mobile-friendly with sticky actions

Quote and Invoice forms get sticky bottom save/cancel bar on mobile.
Input heights verified for touch targets. Desktop layout unchanged.
Breadboard P8: U140-U146."
```

**Acceptance Criteria:**

- [ ] Forms single-column on mobile
- [ ] Save/Cancel buttons sticky at bottom on mobile
- [ ] All inputs meet 44px touch target
- [ ] Desktop form layout unchanged

---

**Sprint 3 Complete Checkpoint:**

After Tasks 15-18, verify:

- [ ] All 4 list views have mobile card views
- [ ] Cards are tappable, navigate to detail
- [ ] MobileFilterSheet works with sort + filter chips
- [ ] Quote and Invoice forms usable on mobile with sticky actions
- [ ] Desktop: all pages unchanged

---

## Sprint 4: Detail Views + Polish (~1 week)

### Task 19: BottomActionBar Component (Breadboard P5, P7: U85-U87, U134-U136)

**Files:**

- Create: `components/layout/bottom-action-bar.tsx`

Sticky bottom bar for detail view actions on mobile.

**Step 1: Create BottomActionBar**

```tsx
'use client'

import { cn } from '@/lib/utils'

interface BottomActionBarProps {
  children: React.ReactNode
  className?: string
}

export function BottomActionBar({ children, className }: BottomActionBarProps) {
  return (
    <div
      className={cn(
        'fixed bottom-[calc(var(--mobile-nav-height)+env(safe-area-inset-bottom,0px))] left-0 right-0 z-40',
        'flex items-center gap-2 border-t border-border bg-background/95 px-4 py-2 backdrop-blur supports-[backdrop-filter]:bg-background/60',
        'md:hidden',
        className
      )}
    >
      {children}
    </div>
  )
}
```

**Step 2: Commit**

```bash
git add components/layout/bottom-action-bar.tsx
git commit -m "feat(mobile): add BottomActionBar component

Sticky bottom bar positioned above the tab bar for detail view quick
actions. Hidden on desktop. Uses backdrop blur for visual depth.
Breadboard P5, P7: U85-U87, U134-U136."
```

---

### Task 20: Job Detail Mobile Layout (Breadboard P5: U70-U82)

**Files:**

- Modify: `app/(dashboard)/jobs/[id]/page.tsx`
- Modify: `app/(dashboard)/jobs/_components/QuickActionsBar.tsx`

Job detail already has `grid-cols-1 lg:grid-cols-3` responsive grid. Needs:

- Mobile-specific tab navigation (Overview / Tasks / Notes) instead of showing all sections
- BottomActionBar with Move Lane + Add Note + Block buttons
- Back button at top

**Step 1: Add mobile tab view**

On mobile, replace the stacked grid with tabs that show one section at a time:

```tsx
{
  /* Mobile: tabbed layout */
}
;<div className="md:hidden">
  <MobileJobTabs
    job={job}
    onAddNote={() => setNoteCaptureOpen(true)}
    onMoveLane={() => setLaneSelectorOpen(true)}
  />
</div>

{
  /* Desktop: existing grid layout */
}
;<div className="hidden md:grid md:grid-cols-1 md:gap-4 lg:grid-cols-3">
  {/* ... existing content ... */}
</div>
```

**Step 2: Add BottomActionBar to job detail**

```tsx
<BottomActionBar>
  <Button
    variant="outline"
    className="flex-1 min-h-(--mobile-touch-target)"
    onClick={() => setLaneSelectorOpen(true)}
  >
    Move Lane →
  </Button>
  <Button
    variant="outline"
    className="flex-1 min-h-(--mobile-touch-target)"
    onClick={() => setNoteCaptureOpen(true)}
  >
    Add Note
  </Button>
</BottomActionBar>
```

**Step 3: Wire NoteCapture and LaneSelector**

Add state + render `<NoteCapture>` and `<LaneSelector>` bottom sheets, wired to the job's data.

**Step 4: Commit**

```bash
git add app/(dashboard)/jobs/[id]/page.tsx
git add app/(dashboard)/jobs/_components/QuickActionsBar.tsx
git commit -m "feat(mobile): add mobile layout to Job Detail page

Tabbed mobile layout (Overview/Tasks/Notes), BottomActionBar with
Move Lane + Add Note actions, NoteCapture and LaneSelector bottom sheets.
Desktop grid layout preserved. Breadboard P5: U70-U82."
```

**Acceptance Criteria:**

- [ ] Mobile: tabbed view with Overview, Tasks, Notes
- [ ] Mobile: BottomActionBar with Move Lane + Add Note
- [ ] Mobile: NoteCapture opens with block/unblock toggles
- [ ] Mobile: LaneSelector opens with lane picker
- [ ] Mobile: back button navigates to board
- [ ] Desktop: existing grid layout unchanged

---

### Task 21: Quote Detail Mobile Layout

**Files:**

- Modify: `app/(dashboard)/quotes/_components/QuoteDetailView.tsx`

**Step 1: Make sections stack properly on mobile**

QuoteDetailView uses `mx-auto max-w-4xl space-y-6` which already works on mobile. Main changes:

- Ensure action buttons are accessible (BottomActionBar or inline)
- Collapsible sections work on mobile
- Line item cards are readable at small widths

**Step 2: Add BottomActionBar for quote actions**

```tsx
<BottomActionBar>
  <Button variant="outline" className="flex-1 min-h-(--mobile-touch-target)">
    Create Job
  </Button>
  <Button variant="outline" className="flex-1 min-h-(--mobile-touch-target)">
    Create Invoice
  </Button>
</BottomActionBar>
```

**Step 3: Commit**

```bash
git add app/(dashboard)/quotes/_components/QuoteDetailView.tsx
git commit -m "feat(mobile): mobile layout for Quote Detail

BottomActionBar with Create Job + Create Invoice actions.
Section layout verified for mobile readability."
```

---

### Task 22: Invoice Detail Mobile Layout

**Files:**

- Modify: `app/(dashboard)/invoices/_components/InvoiceDetailView.tsx`

Same pattern as Quote Detail:

- BottomActionBar with context-aware actions (Record Payment, Send Reminder)
- Verify section stacking
- Balance Due prominently visible

**Step 1: Add BottomActionBar**

**Step 2: Commit**

```bash
git add app/(dashboard)/invoices/_components/InvoiceDetailView.tsx
git commit -m "feat(mobile): mobile layout for Invoice Detail

BottomActionBar with status-aware actions (Record Payment, Send Reminder).
Balance Due section prominent on mobile."
```

---

### Task 23: Customer Detail Mobile Layout

**Files:**

- Modify: `app/(dashboard)/customers/[id]/_components/CustomerTabs.tsx`
- Modify: `app/(dashboard)/customers/[id]/_components/CustomerDetailHeader.tsx`

Customer detail uses tabs which already work reasonably well on mobile. Main changes:

- Tab bar scrollable on mobile
- Quick stats responsive (2-col on mobile)
- Contact info easy to tap-to-copy

**Step 1: Make tab bar horizontally scrollable**

```tsx
<div className="overflow-x-auto scrollbar-none">
  <TabsList>{/* ... existing tabs ... */}</TabsList>
</div>
```

**Step 2: Commit**

```bash
git add app/(dashboard)/customers/[id]/_components/CustomerTabs.tsx
git add app/(dashboard)/customers/[id]/_components/CustomerDetailHeader.tsx
git commit -m "feat(mobile): mobile layout for Customer Detail

Scrollable tab bar, responsive quick stats, touch-friendly contact
actions."
```

---

### Task 24: FullScreenModal Component (Breadboard P9: U150-U152)

**Files:**

- Create: `components/ui/full-screen-modal.tsx`
- Modify: `components/ui/dialog.tsx` (add mobile full-screen variant)

On mobile, dialogs should become full-screen overlays instead of centered modals.

**Step 1: Create FullScreenModal wrapper**

```tsx
'use client'

import { useIsMobile } from '@/lib/hooks/use-is-mobile'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FullScreenModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  children: React.ReactNode
  footer?: React.ReactNode
}

export function FullScreenModal({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
}: FullScreenModalProps) {
  const isMobile = useIsMobile()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(isMobile && 'h-full max-h-full w-full max-w-full rounded-none border-0 p-0')}
        showCloseButton={!isMobile}
      >
        {isMobile ? (
          <div className="flex h-full flex-col">
            {/* Mobile header */}
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <div>
                <h2 className="text-sm font-semibold">{title}</h2>
                {description && <p className="text-xs text-muted-foreground">{description}</p>}
              </div>
              <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto p-4">{children}</div>
            {/* Sticky footer */}
            {footer && <div className="border-t border-border p-4 pb-safe">{footer}</div>}
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>{title}</DialogTitle>
              {description && <DialogDescription>{description}</DialogDescription>}
            </DialogHeader>
            {children}
            {footer}
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
```

**Step 2: Commit**

```bash
git add components/ui/full-screen-modal.tsx
git commit -m "feat(mobile): add FullScreenModal component

Dialog wrapper that renders full-screen on mobile with sticky header
and optional sticky footer. Uses useIsMobile hook. Standard dialog
on desktop. Breadboard P9: U150-U152."
```

**Acceptance Criteria:**

- [ ] Mobile: dialog becomes full-screen with close button, scrollable content, sticky footer
- [ ] Desktop: renders as standard centered dialog
- [ ] Smooth transition between viewport sizes

---

### Task 25: Desktop Regression Testing (Breadboard I1)

**Files:** None — testing only

**Step 1: Visual regression check**

Open dev server at desktop width (>= 1024px) and verify each page:

| Page                                | Check                                                           |
| ----------------------------------- | --------------------------------------------------------------- |
| Dashboard (`/`)                     | Stat cards 4-col, blocked/in-progress sections, sidebar visible |
| Jobs Board (`/jobs/board`)          | Drag-and-drop works, lanes visible, capacity bar                |
| Jobs List (`/jobs`)                 | Table visible, sorting, filtering, search                       |
| Job Detail (`/jobs/[id]`)           | Two-column grid, tasks, notes, quick actions                    |
| Quotes List (`/quotes`)             | Table visible with all columns                                  |
| Quote Detail (`/quotes/[id]`)       | Line items, pricing, actions                                    |
| New Quote (`/quotes/new`)           | Form sections, line item management                             |
| Invoices List (`/invoices`)         | Stats bar, smart views, table                                   |
| Invoice Detail (`/invoices/[id]`)   | All sections, payment ledger                                    |
| New Invoice (`/invoices/new`)       | Form sections, pricing                                          |
| Customers List (`/customers`)       | Table, smart views, stats                                       |
| Customer Detail (`/customers/[id]`) | Tabs, linked entities                                           |
| Screen Room (`/screens`)            | Table with burn status                                          |
| Garments (`/garments`)              | Grouped display                                                 |
| Settings (`/settings/pricing`)      | Pricing matrix                                                  |

**Step 2: Run build verification**

```bash
npm run build
npm run lint
npx tsc --noEmit
npm test
```

**Step 3: Commit any fixes**

```bash
git add -A
git commit -m "fix(mobile): desktop regression fixes

Fixes any visual regressions found during desktop testing pass."
```

**Acceptance Criteria:**

- [ ] All 15 pages render correctly at desktop width
- [ ] No visual regressions from mobile changes
- [ ] Sidebar navigation works on all pages
- [ ] Drag-and-drop on board works
- [ ] All dialogs/modals open correctly
- [ ] `npm run build` passes
- [ ] `npm run lint` passes
- [ ] `npx tsc --noEmit` passes
- [ ] `npm test` passes

---

## Summary

| Sprint   | Tasks | Key Deliverables                                                                                                                        |
| -------- | ----- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Sprint 1 | 1-9   | Design tokens, useIsMobile hook, BottomTabBar, MobileDrawer, MobileHeader, layout integration, touch audit, BottomSheet, MobileCardList |
| Sprint 2 | 10-14 | MobileKanbanBoard with lane tabs, CapacitySummary, NoteCapture with side effects, MobileDashboard, LaneSelector                         |
| Sprint 3 | 15-18 | Quotes mobile cards, polish existing cards, MobileFilterSheet, form mobile layouts                                                      |
| Sprint 4 | 19-25 | BottomActionBar, Job/Quote/Invoice/Customer detail mobile layouts, FullScreenModal, desktop regression                                  |

**Total new files:** ~15 (12 components + MobileShell wrapper + BlockReasonSheet + shared nav constants)
**Total modified files:** ~15 existing files (including Sidebar refactor to use shared constants)
**New dependencies:** None (all using existing shadcn/ui + Framer Motion)

**Risk areas:**

- Mobile Kanban swipe (Task 10) is highest complexity — may need a spike for touch gesture handling with Framer Motion
- iOS Safari bottom sheet scroll locking — BottomSheet may need `overscroll-behavior: contain` or body scroll lock to prevent background scroll
- Mobile keyboard handling — NoteCapture/BlockReasonSheet textarea may push content above keyboard on iOS; test with virtual keyboard open
- BottomActionBar positioning (Task 19) uses z-40 to layer below BottomTabBar (z-50) — verify no overlap at different device sizes
