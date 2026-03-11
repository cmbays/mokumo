# Mobile-First Design Standards

Authoritative reference for Mokumo's mobile-first responsive design. All screens must be designed and built mobile-first.

## Principle

**Mobile is the primary design target.** Desktop is a progressive enhancement.

Design for 375px first. Add complexity at wider breakpoints. If a screen doesn't work on a phone, it isn't done — regardless of how good the desktop version looks.

## Breakpoints

Mokumo uses Tailwind v4 default breakpoints. No custom overrides.

| Tailwind prefix | Width   | Device class       | Design role                                                 |
| --------------- | ------- | ------------------ | ----------------------------------------------------------- |
| _(none)_        | 0–639px | Phones             | **Primary layout** — single column, stacked, thumb-friendly |
| `sm:`           | 640px+  | Large phones       | Minor tweaks — wider padding, 2-col where helpful           |
| `md:`           | 768px+  | Tablets            | Side-by-side panels, expanded navigation                    |
| `lg:`           | 1024px+ | Laptops / desktops | Full sidebar, multi-column grids, data tables               |
| `xl:`           | 1280px+ | Large desktops     | Wider content area, more columns                            |
| `2xl:`          | 1536px+ | Ultra-wide         | Max-width container, prevent extreme stretching             |

### Writing Order

Always write base (mobile) styles first, then layer on larger breakpoints:

```
className="flex flex-col gap-4 md:flex-row md:gap-6 lg:gap-8"
```

Never use `max-*:` prefixes. That's desktop-first thinking.

## Touch Targets

### Minimum Sizes

| Element               | Minimum size       | Rationale                                                 |
| --------------------- | ------------------ | --------------------------------------------------------- |
| Buttons, links, icons | 44 x 44px          | Apple HIG recommendation                                  |
| Form inputs           | 44px height        | Prevents mis-taps, avoids iOS zoom                        |
| Checkbox/radio        | 44 x 44px hit area | Visual element can be smaller if padding expands hit area |
| Close/dismiss buttons | 44 x 44px          | Critical for accessibility                                |

### Spacing Between Targets

Minimum **8px** between adjacent interactive elements. This prevents accidental taps on the wrong target.

```tsx
// CORRECT: gap provides spacing between targets
<div className="flex gap-3">
  <Button>Save</Button>
  <Button variant="outline">Cancel</Button>
</div>

// WRONG: targets touching or overlapping
<div className="flex">
  <Button className="mr-1">Save</Button>
  <Button variant="outline">Cancel</Button>
</div>
```

### Thumb Zone Placement

On mobile, the screen divides into reach zones based on one-handed thumb use:

| Zone            | Screen area | Use for                                                          |
| --------------- | ----------- | ---------------------------------------------------------------- |
| **Easy reach**  | Bottom 40%  | Primary actions, navigation, frequent controls                   |
| **Comfortable** | Middle 30%  | Content, secondary actions                                       |
| **Stretch**     | Top 30%     | Page title, breadcrumbs, infrequent actions, destructive actions |

**Rule**: Primary CTAs (Save, Submit, Add) go at the bottom of the screen on mobile. Destructive actions (Delete, Archive) go at the top or behind a confirmation.

## Navigation Patterns

### Primary Navigation

| Viewport         | Pattern                          | Implementation                      |
| ---------------- | -------------------------------- | ----------------------------------- |
| Mobile (< `lg:`) | Hamburger menu or bottom tab bar | Sheet component or fixed bottom nav |
| Desktop (`lg:`+) | Sidebar                          | Persistent left sidebar             |

**Bottom tab bar** (if used): Maximum 5 items. Icons + labels. Active state clearly indicated.

### Contextual Navigation

| Pattern        | When to use                        | Mobile behavior                               |
| -------------- | ---------------------------------- | --------------------------------------------- |
| Bottom sheet   | Contextual menus, filters, options | Slides up from bottom, swipe to dismiss       |
| Modal / dialog | Confirmations, focused tasks       | Full-screen on mobile (`md:` centered dialog) |
| Action menu    | Row actions, overflow menus        | Full-width bottom sheet (not tiny dropdown)   |
| Breadcrumbs    | Hierarchy navigation               | Truncate middle segments, keep first + last   |

### Swipe & Gesture

- Swipe actions (archive, delete) must have **visible button alternatives** — never gesture-only
- Pull-to-refresh: use for list pages if data is live (Phase 2+)
- Back swipe: don't override native browser/OS back gesture

## Typography

### Size Scale

| Role             | Mobile | Desktop (`lg:`+) | Tailwind                    |
| ---------------- | ------ | ---------------- | --------------------------- |
| Page title       | 24px   | 30px             | `text-2xl lg:text-3xl`      |
| Section heading  | 20px   | 24px             | `text-xl lg:text-2xl`       |
| Card title       | 16px   | 18px             | `text-base lg:text-lg`      |
| Body text        | 16px   | 16px             | `text-base` (never smaller) |
| Caption / helper | 14px   | 14px             | `text-sm`                   |
| Tiny label       | 12px   | 12px             | `text-xs` (use sparingly)   |

### Rules

- **16px minimum for body text** — iOS auto-zooms on focus for inputs with font-size < 16px
- **Line height**: 1.5 for body text (`leading-normal`), 1.25 for headings (`leading-tight`)
- **Max line length**: ~75 characters. Use `max-w-prose` or constrain container width.
- **Max 3 font weights** per screen: `font-normal`, `font-medium`, `font-semibold`
- Headings scale down on mobile — don't use the same size at every breakpoint

## Responsive Layout Patterns

### Single Column → Multi-Column

The most common pattern. Stack on mobile, columns on desktop.

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
  {items.map((item) => (
    <Card key={item.id}>...</Card>
  ))}
</div>
```

### Content + Sidebar

Main content fills mobile. Sidebar appears at `lg:`.

```tsx
<div className="flex flex-col lg:flex-row gap-6">
  <main className="flex-1 min-w-0">{/* primary content */}</main>
  <aside className="lg:w-80 lg:shrink-0">{/* sidebar */}</aside>
</div>
```

### Data Table → Card List

Tables are unreadable on narrow screens. Convert to stacked cards on mobile.

```tsx
{
  /* Table for md+ */
}
;<div className="hidden md:block">
  <DataTable columns={columns} data={data} />
</div>

{
  /* Card list for mobile */
}
;<div className="md:hidden space-y-3">
  {data.map((row) => (
    <Card key={row.id} className="p-4">
      <div className="flex items-center justify-between">
        <span className="font-medium">{row.name}</span>
        <StatusBadge status={row.status} />
      </div>
      <div className="mt-2 text-sm text-muted-foreground">{row.description}</div>
    </Card>
  ))}
</div>
```

### Form Layout

Always single-column on mobile. Two-column at `md:` only for short, related fields.

```tsx
<div className="space-y-4">
  {/* Always full-width */}
  <FormField name="name" label="Customer Name" />

  {/* Side-by-side only at md+ */}
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    <FormField name="city" label="City" />
    <FormField name="state" label="State" />
  </div>

  {/* Full-width with bottom-anchored submit on mobile */}
  <FormField name="notes" label="Notes" />
</div>
```

### Bottom-Anchored Actions

Primary form/page actions anchor to the viewport bottom on mobile for thumb reach:

```tsx
<div className="fixed bottom-0 inset-x-0 p-4 bg-background border-t md:static md:border-t-0 md:p-0 md:flex md:justify-end md:gap-4">
  <Button variant="outline" className="w-full md:w-auto">
    Cancel
  </Button>
  <Button className="w-full md:w-auto mt-2 md:mt-0">Save</Button>
</div>
```

**Important**: When using fixed bottom actions, add `pb-24` (or equivalent) to the scrollable content area to prevent content from being hidden behind the fixed bar.

### Safe Areas (Notched Devices)

For full-bleed layouts on notched devices (iPhone, etc.):

```tsx
// In layout.tsx — already set via viewport export:
// export const viewport: Viewport = { viewportFit: 'cover' }

// In fixed bottom elements:
<div className="fixed bottom-0 inset-x-0 pb-[env(safe-area-inset-bottom)]">
```

## Performance

### Animation

- Use `transform` and `opacity` only — these are GPU-composited, 60fps
- Duration: 150–300ms for micro-interactions, 300–500ms for page transitions
- Easing: `ease-out` for entrances, `ease-in` for exits, `ease-in-out` for morphs
- Always respect `prefers-reduced-motion` — use Tailwind's `motion-safe:` prefix

### Images

- Always responsive: `w-full` with appropriate `max-w-*`
- Use `aspect-ratio` to prevent layout shift
- Lazy load below-the-fold images (`loading="lazy"`)

### Layout Stability

- Reserve space for dynamic content with skeletons
- Set explicit `width`/`height` or `aspect-ratio` on media elements
- Avoid layout shift from late-loading fonts (already handled by Next.js font optimization)

## Accessibility on Mobile

### Touch Accessibility

- Don't rely on hover states for information — touch devices don't have hover
- Long-press actions must have visible alternatives
- Double-tap-to-zoom: prevented by 16px minimum font size and proper viewport meta

### Screen Readers (VoiceOver / TalkBack)

- Logical reading order matches visual order (no CSS reordering that breaks flow)
- Interactive elements have clear labels (especially icon-only buttons)
- Focus order follows visual layout
- Skip-to-content link for keyboard/screen reader users

### Reduced Motion

```tsx
// Tailwind v4: motion-safe prefix
<div className="motion-safe:animate-fade-in">

// Framer Motion: check for reduced motion
const prefersReducedMotion = useReducedMotion()
<motion.div
  animate={{ opacity: 1 }}
  transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.3 }}
/>
```

## Testing Checklist

Before marking any screen as complete:

| Check                              | How to verify                               |
| ---------------------------------- | ------------------------------------------- |
| No overflow at 320px               | Browser DevTools responsive mode            |
| Touch targets >= 44px              | DevTools element inspector on buttons/links |
| Body text >= 16px                  | DevTools computed styles                    |
| No hover-only interactions         | Test with DevTools touch simulation         |
| Breakpoints transition cleanly     | Slowly resize from 320px to 1440px          |
| Bottom actions in thumb zone       | Visual check on mobile viewport             |
| Tables have mobile alternative     | Check below `md:` breakpoint                |
| Forms single-column on mobile      | Check below `md:` breakpoint                |
| Images don't overflow              | Check at every breakpoint                   |
| `prefers-reduced-motion` respected | Toggle in DevTools rendering settings       |
