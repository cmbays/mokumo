# mobile-first-design

Ensure every screen is designed and built mobile-first. Mobile is the primary design target — desktop layouts are progressive enhancements.

## Trigger

Use when building any screen, component, or layout. This skill complements `screen-builder` — run both.

## Workflow

### 1. Read Mobile Standards

Read `.claude/skills/mobile-first-design/reference/mobile-standards.md` — the authoritative reference for breakpoints, touch targets, navigation patterns, typography, and responsive patterns.

### 2. Design Mobile First

Before writing any markup:

1. **Sketch the mobile layout** — single column, stacked sections, bottom-anchored actions
2. **Define content priority** — what matters most on a 375px screen? Show that first.
3. **Plan progressive enhancement** — what gets added at `md:` and `lg:`?

Do NOT design desktop first and then "make it responsive." The mobile layout IS the layout. Desktop adds columns, sidebar, and density.

### 3. Build Mobile First

Write markup in this order:

1. **Base styles** (no breakpoint prefix) = mobile layout
2. **`sm:` (640px)** = minor adjustments (wider padding, 2-column where helpful)
3. **`md:` (768px)** = tablet layout (side-by-side panels, expanded nav)
4. **`lg:` (1024px)** = desktop layout (full sidebar, multi-column grids, data tables)
5. **`xl:` (1280px)** = large desktop (wider content, more columns)

```tsx
// CORRECT: mobile-first
<div className="flex flex-col gap-4 md:flex-row md:gap-6">
  <main className="w-full lg:w-2/3">...</main>
  <aside className="w-full lg:w-1/3">...</aside>
</div>

// WRONG: desktop-first with mobile overrides
<div className="flex flex-row gap-6 max-md:flex-col max-md:gap-4">
```

### 4. Verify Mobile

Run this checklist on every screen:

#### Touch & Interaction

- [ ] All tap targets >= 44x44px (buttons, links, icons, form controls)
- [ ] Minimum 8px spacing between adjacent tap targets
- [ ] Primary actions within thumb reach zone (bottom 40% of viewport)
- [ ] Destructive actions NOT in easy-reach zone (require deliberate reach)
- [ ] No hover-only interactions — everything works with tap
- [ ] Swipe gestures have visible affordances (don't rely on discovery)

#### Layout & Content

- [ ] Single column by default — multi-column only at `md:` or `lg:`
- [ ] No horizontal scroll at any viewport width (320px minimum)
- [ ] Content priority matches mobile hierarchy (most important first)
- [ ] Cards stack vertically on mobile, grid at `md:`+
- [ ] Tables convert to card/list view on mobile (or horizontal scroll with visual cue)
- [ ] Forms are single-column on mobile

#### Typography

- [ ] Body text >= 16px (prevents iOS auto-zoom on input focus)
- [ ] Line height 1.4-1.6 for body text
- [ ] Headings scale down proportionally on mobile (not same size as desktop)
- [ ] Max line length ~75 characters (readable on any width)

#### Navigation

- [ ] Primary nav accessible from any screen (sidebar collapses to hamburger/bottom nav)
- [ ] Breadcrumbs don't overflow on narrow screens (truncate or hide middle segments)
- [ ] Back navigation is always available
- [ ] Modals/sheets are full-screen or bottom-sheet on mobile (not centered floating)

#### Performance

- [ ] No layout shift when content loads (reserve space with skeletons)
- [ ] Images are responsive (`w-full`, `max-w-*`, or `object-cover`)
- [ ] Animations use `transform`/`opacity` only (GPU-accelerated)
- [ ] Respects `prefers-reduced-motion`

### 5. Test Viewports

Verify at these widths (browser DevTools or responsive mode):

| Width   | Device class                    | What to check                        |
| ------- | ------------------------------- | ------------------------------------ |
| 320px   | Small phone (iPhone SE)         | Nothing overflows, text readable     |
| 375px   | Standard phone (iPhone)         | Primary layout target                |
| 428px   | Large phone (iPhone Pro Max)    | Layout doesn't stretch awkwardly     |
| 768px   | Tablet portrait                 | `md:` breakpoint activates correctly |
| 1024px  | Tablet landscape / small laptop | `lg:` breakpoint activates correctly |
| 1280px  | Desktop                         | `xl:` breakpoint, full layout        |
| 1440px+ | Large desktop                   | Content doesn't stretch to edges     |

## Common Patterns

### Bottom-Anchored Actions (Mobile)

Primary form actions anchor to viewport bottom on mobile:

```tsx
<div className="fixed bottom-0 inset-x-0 border-t bg-background p-4 pb-[env(safe-area-inset-bottom)] md:static md:border-0 md:p-0 md:pb-0 md:flex md:justify-end md:gap-4">
  <Button variant="outline" className="w-full md:w-auto">
    Cancel
  </Button>
  <Button className="w-full md:w-auto mt-2 md:mt-0">Save</Button>
</div>
```

### Responsive Data Tables

Tables become card lists on mobile:

```tsx
{
  /* Desktop: table */
}
;<div className="hidden md:block">
  <Table>...</Table>
</div>

{
  /* Mobile: card list */
}
;<div className="md:hidden space-y-3">
  {items.map((item) => (
    <Card key={item.id}>...</Card>
  ))}
</div>
```

### Collapsible Sidebar

Sidebar hidden on mobile, revealed at `lg:`:

```tsx
;<div className="flex min-h-screen">
  <aside className="hidden lg:flex lg:w-64 lg:flex-col">{/* Full sidebar */}</aside>
  <main className="flex-1">{children}</main>
</div>
{
  /* Mobile: hamburger menu or bottom nav */
}
```

## Rules

- Mobile layout is the base — no breakpoint prefix = mobile
- Never use `max-*:` breakpoint prefixes (desktop-first thinking)
- Touch targets are non-negotiable — 44px minimum, always
- 16px minimum body text — no exceptions
- Test at 320px minimum — if it works there, it works everywhere
- Forms single-column on mobile — always
- Primary actions at bottom on mobile — thumb reach zone
