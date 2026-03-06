---
title: 'Mobile Optimization — Scope Definition'
description: 'CORE, PERIPHERAL, and INTERCONNECTION features for the mobile optimization vertical'
category: strategy
status: complete
phase: 1
created: 2026-02-14
last-verified: 2026-02-14
---

# Mobile Optimization — Scope Definition

**Purpose**: Define what "mobile optimization" means for Mokumo, prioritize features, and establish acceptance criteria.
**Context**: No competitor in the screen print management space has a good mobile experience. This is our opportunity to differentiate.

---

## Terminology

| Term                  | Definition                                                                                                                  |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| **Mobile Viewport**   | < 768px width (Tailwind `md:` breakpoint). Primary targets: 375px (iPhone SE), 390px (iPhone 14), 428px (iPhone 14 Pro Max) |
| **Touch Target**      | Interactive element minimum size: 44x44px (WCAG) / 48x48dp (Material Design)                                                |
| **Mobile Navigation** | Bottom tab bar + drawer for secondary nav. Replaces sidebar on mobile.                                                      |
| **Card Layout**       | Stacked card view replacing tables on mobile. Shows key info, tap to expand.                                                |
| **PWA**               | Progressive Web App. Phase 2 enhancement adding offline, notifications, install.                                            |

---

## CORE Features (Phase 1 — Must Have)

### C1: Mobile Navigation Shell

**What**: Replace desktop sidebar with mobile-optimized navigation on < 768px viewports.
**Pattern**: Bottom tab bar (5 items max) + hamburger/drawer for secondary items.
**Tabs**: Dashboard, Jobs, Quotes, Customers, More (→ drawer with Invoices, Settings, etc.)
**Acceptance Criteria**:

- [ ] Bottom tab bar visible on all pages at mobile viewport
- [ ] Active tab highlighted with design system action color
- [ ] Drawer opens from "More" tab with remaining nav items
- [ ] Sidebar completely hidden on mobile (no hamburger toggle for sidebar)
- [ ] Smooth transitions between tab bar and drawer
- [ ] Tab bar does not overlap page content (proper bottom padding)

### C2: Responsive Dashboard

**What**: Dashboard adapts to mobile with priority-ordered content blocks.
**Pattern**: Stack cards vertically, most important first (blocked items → recent activity → in progress).
**Acceptance Criteria**:

- [ ] All dashboard widgets stack vertically on mobile
- [ ] Widget order reflects priority: blocked → recent → in progress
- [ ] Stat cards show 2-per-row on mobile (not 4)
- [ ] Charts/graphs are touch-friendly with adequate label sizing
- [ ] No horizontal overflow at 375px viewport

### C3: Table → Card Conversion for List Views

**What**: Convert all data tables to card-based layouts on mobile viewports.
**Applies to**: Quotes list, Invoices list, Jobs list, Customers list
**Pattern**: Each row becomes a card with key fields visible + tap to view detail.
**Acceptance Criteria**:

- [ ] Tables hidden on mobile, card view shown instead (`hidden md:table` / `md:hidden`)
- [ ] Each card shows: primary identifier, status badge, key metric, date
- [ ] Cards are tappable (full card is touch target, not just text)
- [ ] Sort/filter controls accessible on mobile (dropdown or bottom sheet)
- [ ] Search input is prominent and full-width on mobile
- [ ] Pagination or infinite scroll works on mobile

### C4: Touch-Friendly Interactive Elements

**What**: Ensure all interactive elements meet minimum touch target sizes.
**Acceptance Criteria**:

- [ ] All buttons ≥ 44px height with adequate padding
- [ ] All links in lists have ≥ 44px touch target (padding, not just text)
- [ ] Icon-only buttons have ≥ 44x44px clickable area
- [ ] Adequate spacing between adjacent interactive elements (≥ 8px)
- [ ] No hover-only interactions (all hover states have tap equivalents)
- [ ] Dropdown menus and popover menus are touch-friendly

### C5: Mobile-Optimized Forms

**What**: All forms (New Quote, New Invoice, Customer creation) adapt to single-column layout on mobile.
**Acceptance Criteria**:

- [ ] All form fields stack to single column on mobile
- [ ] Input fields ≥ 44px height
- [ ] Labels above inputs (not beside) on mobile
- [ ] Date pickers use native mobile controls where possible
- [ ] Multi-step forms show clear progress indication
- [ ] Form actions (Save, Cancel) sticky at bottom on mobile
- [ ] Keyboard doesn't obscure active input field

### C6: Kanban Board Mobile Adaptation

**What**: Jobs Kanban board works on mobile with touch-optimized interactions.
**Pattern**: Single-column view with horizontal swipe between status columns, or collapsible accordion per status.
**Acceptance Criteria**:

- [ ] Board scrollable horizontally or shows one column at a time on mobile
- [ ] Job cards are readable at mobile width (no truncation of critical info)
- [ ] Drag-and-drop works with touch (or alternative: tap → select new status)
- [ ] Column headers sticky during scroll
- [ ] Quick-action buttons accessible without hover

### C7: Detail View Mobile Layouts

**What**: All detail views (Quote detail, Invoice detail, Job detail, Customer detail) adapt to mobile.
**Acceptance Criteria**:

- [ ] Multi-column layouts stack to single column on mobile
- [ ] Tab navigation within detail views works on mobile
- [ ] Action buttons (Edit, Delete, Duplicate, etc.) accessible via bottom action bar or menu
- [ ] Long content sections are collapsible on mobile
- [ ] Print/PDF actions work from mobile browser

### C8: Dialog/Modal Mobile Sizing

**What**: All dialogs and modals are full-screen or near-full-screen on mobile.
**Acceptance Criteria**:

- [ ] Modals expand to full-screen on mobile (bottom sheet or full overlay)
- [ ] Close button is accessible (top-right or bottom action)
- [ ] Content within modals scrolls correctly
- [ ] No modals overflow viewport on mobile

---

## PERIPHERAL Features (Phase 2 — PWA + Enhancement)

### P1: PWA Install & Offline Shell

**What**: Add service worker, manifest, and install prompt for PWA behavior.
**Acceptance Criteria**:

- [ ] Web app manifest with icons, theme color, display: standalone
- [ ] Service worker caches app shell for offline loading
- [ ] Install prompt appears on supported browsers
- [ ] Offline page shows cached data with "last updated" timestamp
- [ ] Background sync queues actions taken offline

### P2: Push Notifications

**What**: Push notifications for key events (job status changes, artwork approvals, payments).
**Acceptance Criteria**:

- [ ] Notification permission request with clear value proposition
- [ ] Notifications for: job moved to new status, artwork approved/rejected, payment received
- [ ] Notification tapping navigates to relevant detail view
- [ ] Notification preferences per-user (toggle notification types)
- [ ] Works on iOS Safari (web push, supported since iOS 16.4+)

### P3: Photo Capture Workflow

**What**: Camera integration for garment photos, screen photos, proof photos from mobile.
**Acceptance Criteria**:

- [ ] Camera input on job detail and customer views
- [ ] Photos attach to job/order record
- [ ] Image compression before upload (mobile network optimization)
- [ ] Gallery view of all photos for a job

### P4: Mobile-Optimized Quoting Calculator

**What**: Quick quote calculator optimized for phone use (at customer meetings, on calls).
**Pattern**: Simplified form with large touch targets, quick quantity/color selectors.
**Acceptance Criteria**:

- [ ] Accessible from bottom tab bar or quick action
- [ ] Large number inputs for quantity
- [ ] Quick color count selector (1-6+)
- [ ] Instant price calculation (no page reload)
- [ ] One-tap share via text/email

### P5: Swipe Gestures

**What**: Swipe-to-reveal actions on list items (e.g., swipe left to archive, swipe right to edit).
**Acceptance Criteria**:

- [ ] Swipe actions on job cards, quote cards, invoice cards
- [ ] Visual hint for swipeable items
- [ ] Configurable actions per list type
- [ ] Haptic feedback on supported devices

---

## INTERCONNECTIONS

### I1: Desktop Experience Preserved

**What**: Mobile optimizations must NOT degrade the desktop experience.
**Rule**: Use Tailwind responsive prefixes (`md:`, `lg:`) to conditionally apply mobile layouts. Desktop keeps current design.
**Acceptance Criteria**:

- [ ] All desktop layouts unchanged at ≥ 768px
- [ ] No visual regressions on desktop after mobile changes
- [ ] Desktop-specific features (sidebar, multi-column, hover states) preserved

### I2: URL State Consistency

**What**: Mobile and desktop share the same URL state (filters, search, pagination).
**Rule**: A URL opened on desktop and mobile should show the same data, just different layout.
**Acceptance Criteria**:

- [ ] URL query params work identically on mobile and desktop
- [ ] Sharing a URL from mobile opens correctly on desktop (and vice versa)

### I3: Design System Token Extensions

**What**: Add mobile-specific design tokens to the existing design system.
**Tokens needed**:

- `--mobile-nav-height: 64px` (bottom tab bar height)
- `--mobile-touch-target: 44px` (minimum interactive element size)
- `--mobile-bottom-safe-area: env(safe-area-inset-bottom)` (iPhone notch/home indicator)
  **Acceptance Criteria**:
- [ ] Tokens defined in `globals.css` under `@theme inline`
- [ ] All mobile components use tokens (not hardcoded values)
- [ ] Safe area insets respected on notched devices

### I4: Shared Components

**What**: Mobile card views and bottom navigation become shared components usable across all verticals.
**Components**:

- `<MobileCardList>` — renders list data as cards on mobile, table on desktop
- `<BottomTabBar>` — mobile navigation component
- `<BottomSheet>` — mobile-optimized modal/dialog replacement
- `<MobileActionBar>` — sticky action buttons for detail views
  **Acceptance Criteria**:
- [ ] Components in `@/components/ui/` or `@/components/layout/`
- [ ] Used consistently across all list views and detail views
- [ ] Documented with props interface

---

## Build Order

### Phase 1: Responsive Foundation (Priority Order)

1. **Mobile Navigation Shell** (C1) — Unlocks all other mobile work. Build first.
2. **Touch-Friendly Elements** (C4) — Global fix, affects every page. Do early.
3. **Design System Token Extensions** (I3) — Foundation for all mobile components.
4. **Shared Card Component** (I4 partial) — `<MobileCardList>` reused by all list views.
5. **Table → Card: Quotes List** (C3) — First list view conversion. Template for others.
6. **Table → Card: Jobs List** (C3) — Second conversion.
7. **Table → Card: Invoices List** (C3) — Third conversion.
8. **Table → Card: Customers List** (C3) — Fourth conversion.
9. **Dashboard Mobile Layout** (C2) — Stack and prioritize dashboard widgets.
10. **Form Mobile Layouts** (C5) — New Quote, New Invoice, Customer forms.
11. **Kanban Board Mobile** (C6) — Complex interaction, do after simpler screens.
12. **Detail View Layouts** (C7) — Quote/Invoice/Job/Customer detail pages.
13. **Dialog/Modal Sizing** (C8) — Global fix for all modals.
14. **Desktop Regression Check** (I1) — Final verification pass.

### Phase 2: PWA & Enhancement (After Phase 1 Complete)

15. PWA Manifest + Service Worker (P1)
16. Push Notifications (P2)
17. Photo Capture (P3)
18. Mobile Quoting Calculator (P4)
19. Swipe Gestures (P5)

---

## Success Criteria

| Metric                                       | Current               | Target (Phase 1) | Target (Phase 2) |
| -------------------------------------------- | --------------------- | ---------------- | ---------------- |
| Mobile usability score (Lighthouse)          | Unknown (likely < 60) | ≥ 90             | ≥ 95             |
| Touch target compliance                      | ~20%                  | 100%             | 100%             |
| Mobile navigation (time to reach any screen) | N/A (sidebar hidden)  | ≤ 3 taps         | ≤ 2 taps         |
| Job status check from mobile                 | Broken/slow           | < 5 seconds      | < 3 seconds      |
| Mobile Lighthouse Performance                | Unknown               | ≥ 80             | ≥ 90             |
| PWA installable                              | No                    | No               | Yes              |
| Push notifications                           | No                    | No               | Yes              |

---

## Interview Questions for Gary (Pending)

These questions should be asked during the user interview phase:

1. **What do you actually do on your phone right now for shop management?** (Check orders? Text customers? Look up pricing?)
2. **When are you away from your desk but still need shop info?** (On the floor? Driving? Customer meetings? Weekends?)
3. **What's the #1 thing you wish you could check from your phone?**
4. **Do you show customers anything on your phone?** (Mockups? Pricing? Job status?)
5. **Would you use a "quick quote" feature at customer meetings?**
6. **How important are notifications?** (Job status changes? Payment received? Artwork approved?)
7. **Do you take photos of garments/screens/proofs? Where do those photos go today?**
8. **Would you install an app or prefer to use the website on your phone?**
9. **iPhone or Android?**
10. **What other business apps do you use on your phone?** (QuickBooks? Square? Venmo? Calendar?)
