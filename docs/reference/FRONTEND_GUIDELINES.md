---
title: 'FRONTEND_GUIDELINES'
description: 'Design tokens, component patterns, animation, accessibility, and layout standards. Tailwind v4 + shadcn/ui implementation.'
category: reference
status: active
phase: all
last_updated: 2026-03-02
last_verified: 2026-03-02
depends_on:
  - docs/TECH_STACK.md
---

# Frontend Guidelines

---

## Design Philosophy

### The Standard: "Linear Calm + Raycast Polish + Neobrutalist Delight"

Our aesthetic combines three influences into a cohesive system:

| Layer         | Influence    | Treatment                                               |
| ------------- | ------------ | ------------------------------------------------------- |
| **Base**      | Linear       | Monochrome, opacity hierarchy, extreme restraint        |
| **Polish**    | Raycast      | OS-native feel, subtle glass, responsive transitions    |
| **Attention** | Neobrutalist | Bold borders, vibrant status colors, springy animations |

**Core Insight**: The contrast between calm base and bold accents makes attention elements pop harder.

### Design Principles

1. **Calm by Default**: Most UI should be monochrome and restrained. No color unless it serves a purpose.
2. **Delightful When It Matters**: Primary CTAs, success moments, and interactive states get the bold treatment.
3. **Opacity Over Color**: Use opacity levels (87%, 60%, 38%) for text hierarchy instead of different colors.
4. **Status-Driven Color**: Color communicates meaning (action, success, error, warning), not decoration.
5. **Remove Until It Breaks**: Apply the Jobs filter — if an element can be removed without losing meaning, remove it.

### Anti-Patterns (Avoid)

- Multiple accent colors competing for attention
- Gradients and decorative elements that don't serve function
- Dense layouts with insufficient whitespace
- Color used for decoration rather than communication
- Inconsistent component styling across pages

### The Jobs Filter

Ask these questions of every UI element:

- "Would a user need to be told this exists?" -> If yes, redesign it until obvious
- "Can this be removed without losing meaning?" -> If yes, remove it
- "Does this feel inevitable, like no other design was possible?" -> If no, it's not done

---

## Architecture

### Tailwind v4 + shadcn/ui

All styling uses Tailwind utilities. No separate CSS files, no CSS modules, no styled-components.

```
app/
  globals.css               # @theme inline (design tokens) + Tailwind directives
  layout.tsx                # Root layout (fonts via next/font)
components/
  ui/                       # shadcn/ui primitives (button, card, dialog, etc.)
  features/                 # Domain components (StatusBadge, KanbanBoard)
  layout/                   # Shell components (Sidebar, Topbar)
```

### How Styling Works

1. **Design tokens** live in `globals.css` via Tailwind v4's `@theme inline` block
2. **Component variants** use `class-variance-authority` (CVA) via shadcn/ui
3. **Conditional classes** use `cn()` from `lib/utils.ts` (clsx + tailwind-merge)
4. **Never** concatenate className strings — always use `cn()`

```tsx
// Correct
<div className={cn("rounded-md border", isActive && "border-action")} />

// Wrong
<div className={"rounded-md border " + (isActive ? "border-action" : "")} />
```

### Fonts

Loaded via `next/font` in `app/layout.tsx`. No Google Fonts `<link>` tags.

```tsx
import { Inter, JetBrains_Mono } from 'next/font/google'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-jetbrains-mono' })
```

- **Inter**: All UI text (headings, body, labels, buttons)
- **JetBrains Mono**: Code blocks and technical values only (job numbers, SKUs)

---

## Color System

### Two-Pool Architecture

Colors are divided into two isolated pools to prevent semantic collision.

**Status Palette** — state, urgency, feedback (filled badges, text indicators):

| Token   | Hex       | Tailwind       | Semantic Use                   |
| ------- | --------- | -------------- | ------------------------------ |
| action  | `#2ab9ff` | `text-action`  | Primary CTAs, in-progress      |
| success | `#54ca74` | `text-success` | Completions, approved, healthy |
| error   | `#d23e08` | `text-error`   | Failures, rejected             |
| warning | `#ffc663` | `text-warning` | Cautions, pending              |

**Categorical Palette** — entity/service identity (outline badges, left borders):

| Token   | Hex       | Tailwind       | Assigned To  |
| ------- | --------- | -------------- | ------------ |
| purple  | `#a855f7` | `text-purple`  | Jobs         |
| magenta | `#ff50da` | `text-magenta` | Quotes       |
| teal    | `#2dd4bf` | `text-teal`    | Screen Print |
| emerald | `#10b981` | `text-emerald` | Invoices     |
| lime    | `#84cc16` | `text-lime`    | Embroidery   |
| brown   | `#c47a3a` | `text-brown`   | DTF          |

Each color has `-hover` and `-bold` variants.

### Encoding Channel Rules

| Dimension            | Color Pool  | Badge Shape | Example                      |
| -------------------- | ----------- | ----------- | ---------------------------- |
| Status (quote, lane) | Status      | Filled      | Draft=muted, Sent=action     |
| Entity identity      | Categorical | Left border | Job=purple, Invoice=emerald  |
| Service type         | Categorical | Outline     | Screen Print=teal, DTF=brown |
| Lifecycle/health     | Status      | Dot + text  | Repeat=success dot           |
| Customer type tag    | None (mono) | Muted pill  | Retail, Corporate            |

### Badge Pattern — Three Variants

```tsx
import { cn } from '@shared/lib/cn'
import { statusBadge, categoryBadge, dotColor, MUTED_BADGE } from '@shared/lib/design-system'

// 1. Filled badge (STATUS) — bg/10 + text + border/20
<Badge className={statusBadge('success')}>Paid</Badge>
<Badge className={MUTED_BADGE}>Draft</Badge>

// 2. Outline badge (CATEGORY) — border + text, no fill
<Badge className={categoryBadge('teal')}>Screen Print</Badge>

// 3. Dot indicator (LIFECYCLE/HEALTH)
<span className="inline-flex items-center gap-1.5">
  <span className={cn('h-2 w-2 rounded-full', dotColor('success'))} />
  <span className="text-sm text-foreground">Repeat</span>
</span>
```

### Opacity Pattern

Filled badges follow a consistent opacity convention:

- **Fill**: `bg-{color}/10` (10% opacity background)
- **Border**: `border-{color}/20` (20% opacity border)
- **Text**: `text-{color}` (full color text)

### Hover State Tokens

Every categorical and status color has a `-hover` variant for interactive states:

- `text-action` → `text-action-hover` on hover
- `text-teal` → `text-teal-hover` on hover

### Canvas/SVG Tokens

For technical diagrams (gang sheet viewer, screen room layout), use `--canvas-*` CSS custom properties defined in globals.css. These provide opacity-calibrated colors for labels, borders, zones, and spacing indicators.

### Color Usage

| Use Case        | Tailwind Class            | Notes                 |
| --------------- | ------------------------- | --------------------- |
| Page background | `bg-background`           | Niji dark (#141515)   |
| Card/panel      | `bg-card` / `bg-elevated` | Elevated (#1c1d1e)    |
| Surface         | `bg-surface`              | Interactive (#232425) |
| Body text       | `text-foreground`         | 87% opacity white     |
| Secondary text  | `text-muted-foreground`   | 60% opacity white     |

### When to Use Color

**Use monochrome for:**

- All non-interactive text, borders, backgrounds, secondary buttons, classification tags (customer type)

**Use status colors for:**

- State badges (quote status, invoice status, lane status)
- Production state indicators, risk indicators
- Primary action buttons (Niji blue)

**Use categorical colors for:**

- Entity identity (left borders, nav icons)
- Service type indicators (outline badges, border accents)

---

## Typography

### Type Scale

Use Tailwind's built-in text utilities. Max 3-4 distinct sizes per screen.

| Tailwind Class | Size | Use                                  |
| -------------- | ---- | ------------------------------------ |
| `text-xs`      | 12px | Captions, badge labels               |
| `text-sm`      | 14px | Secondary text, table cells, buttons |
| `text-base`    | 16px | Body text                            |
| `text-lg`      | 18px | Emphasis, card titles                |
| `text-xl`      | 20px | Section headings (H3)                |
| `text-2xl`     | 24px | Page headings (H2)                   |

### Font Weights

Max 3 weights per screen:

| Weight | Tailwind Class  | Use                        |
| ------ | --------------- | -------------------------- |
| 400    | `font-normal`   | Body text, descriptions    |
| 500    | `font-medium`   | Labels, nav items, buttons |
| 600    | `font-semibold` | Headings, emphasis         |

### Heading Pattern

```tsx
// Page header
<h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
<p className="text-sm text-muted-foreground">Production overview for 4Ink</p>

// Section header
<h2 className="text-lg font-semibold">In Progress</h2>

// Card title
<h3 className="text-sm font-medium text-muted-foreground">Blocked</h3>
```

---

## Spacing

### Spacing Scale (8px base)

Use Tailwind spacing utilities exclusively. No hardcoded pixel values.

| Tailwind        | Value | Use                             |
| --------------- | ----- | ------------------------------- |
| `p-1` / `gap-1` | 4px   | Tight spacing (badge padding)   |
| `p-2` / `gap-2` | 8px   | Related elements (icon + label) |
| `p-3` / `gap-3` | 12px  | Component padding               |
| `p-4` / `gap-4` | 16px  | Standard gap between elements   |
| `p-6` / `gap-6` | 24px  | Section padding, card padding   |
| `p-8` / `gap-8` | 32px  | Large section gaps              |

### Spacing Philosophy

**Japanese Minimalism (Ma)**: Use generous spacing. When in doubt, add more space.

```tsx
// Too dense - avoid
<div className="space-y-2">

// Better - let content breathe
<div className="space-y-4">
```

---

## Components

### Using shadcn/ui

Always check `components/ui/` before creating custom components. shadcn/ui provides accessible, styled primitives.

**Adding a component**: `npx shadcn@latest add <component>`

**Installed**: button, card, dialog, input, table, badge, dropdown-menu, tabs, separator, tooltip, label, select, textarea, sheet, breadcrumb, avatar, form

### Component Styling Patterns

#### Primary Button (Neobrutalist)

The primary CTA gets the neobrutalist treatment: bold shadow, spring hover, dark text on Niji blue.

```tsx
<Button className="bg-action text-black font-semibold border-2 border-current shadow-brutal shadow-action hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-brutal-lg active:translate-x-0 active:translate-y-0 active:shadow-brutal-sm transition-all">
  New Quote
</Button>
```

#### Cards

Three card treatments matching design layers:

```tsx
// Base card (default shadcn/ui) — calm, monochrome
<Card>
  <CardHeader>
    <CardTitle>In Progress</CardTitle>
  </CardHeader>
  <CardContent>...</CardContent>
</Card>

// Glass card — Raycast polish
<div className="rounded-lg border border-white/10 bg-white/5 backdrop-blur-xl p-6">
  ...
</div>

// Interactive card — Neobrutalist hover
<div className="rounded-lg border-2 border-border bg-card p-6 cursor-pointer transition-all hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-brutal hover:shadow-action hover:border-action">
  ...
</div>
```

#### Status Badges

Use `statusBadge()` and `MUTED_BADGE` from `@shared/lib/design-system` for all status indicators. The badge recipe utilities ensure consistent opacity patterns and Tailwind JIT compatibility.

```tsx
import { statusBadge, MUTED_BADGE } from '@shared/lib/design-system'

// Filled status badge
<Badge className={statusBadge('success')}>Paid</Badge>

// Muted/draft badge
<Badge className={MUTED_BADGE}>Draft</Badge>

// Production state text (not badge — uses text-only color)
<span className={PRODUCTION_STATE_COLORS[job.status]}>
  {PRODUCTION_STATE_LABELS[job.status]}
</span>
```

See `.claude/skills/design-system/skill.md` for the complete encoding channel rules.

---

## Animations & Motion

### Motion Philosophy

- **Subtle by default**: Tailwind `transition-*` utilities for hover/focus
- **Springy for delight**: Framer Motion springs for layout changes and celebrations
- **Respect preferences**: Always check `prefers-reduced-motion`

### Tailwind Transitions (most interactions)

```tsx
// Hover effects — use Tailwind, not Framer Motion
<button className="transition-colors hover:bg-accent">
<div className="transition-all hover:translate-y-[-2px]">
```

### Framer Motion (layout changes)

```tsx
// Page transitions, card enter/exit, Kanban column moves
import { motion, AnimatePresence } from 'framer-motion'
;<AnimatePresence>
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -10 }}
    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
  >
    {children}
  </motion.div>
</AnimatePresence>
```

### Reduced Motion

```tsx
// Framer Motion respects this automatically via useReducedMotion()
// For custom animations, wrap in media query:
<motion.div
  animate={{ y: 0 }}
  transition={{
    type: prefersReducedMotion ? 'tween' : 'spring',
    duration: prefersReducedMotion ? 0 : undefined,
  }}
/>
```

---

## UI States

Every page must handle these states explicitly.

### Empty State

```tsx
import { Package } from 'lucide-react'
;<div className="flex flex-col items-center justify-center py-12 text-center">
  <Package className="h-12 w-12 text-muted-foreground/50 mb-4" />
  <h3 className="text-lg font-semibold text-muted-foreground">No jobs yet</h3>
  <p className="text-sm text-muted-foreground/60 mt-1 max-w-xs">
    Jobs will appear here once they're created.
  </p>
</div>
```

### Loading State (Phase 2+)

```tsx
// Skeleton pattern for future API integration
<div className="animate-pulse space-y-3">
  <div className="h-4 w-3/4 rounded bg-muted" />
  <div className="h-4 w-1/2 rounded bg-muted" />
</div>
```

### Error State

```tsx
<div className="rounded-md border border-error/30 bg-error/10 p-4" role="alert">
  <p className="text-sm font-medium text-error">Job not found</p>
  <p className="text-sm text-muted-foreground mt-1">
    This job may have been removed.{' '}
    <Link href="/jobs" className="text-action underline">
      Back to Jobs
    </Link>
  </p>
</div>
```

---

## Accessibility (WCAG AA)

### Focus Indicators

All interactive elements must have visible `:focus-visible` states. shadcn/ui handles this by default.

```tsx
// Custom focus when needed
<button className="focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action">
```

### Color Contrast

| Combination                    | Ratio | Status |
| ------------------------------ | ----- | ------ |
| White (87%) on #141515         | 15:1  | AAA    |
| White (60%) on #141515         | 10:1  | AAA    |
| White (38%) on #141515         | 6.5:1 | AAA    |
| Niji blue (#2ab9ff) on #141515 | 9:1   | AAA    |

### Keyboard Navigation

| Key        | Action                                 |
| ---------- | -------------------------------------- |
| Tab        | Move to next focusable element         |
| Shift+Tab  | Move to previous element               |
| Enter      | Activate button, submit form           |
| Escape     | Close modal/dialog                     |
| Arrow keys | Navigate within tabs, menus, dropdowns |

### ARIA Requirements

shadcn/ui components handle ARIA automatically (built on Radix primitives). For custom components:

```tsx
// Dynamic status messages
<div role="status" aria-live="polite">Quote saved</div>
<div role="alert" aria-live="assertive">Validation error</div>

// Icon-only buttons
<Button variant="ghost" size="icon" aria-label="Close dialog">
  <X className="h-4 w-4" />
</Button>
```

---

## Responsive Design

### Desktop-First

Screen Print Pro is designed for shop office desktop use. Optimize for cursor interaction and comfortable reading at typical desktop widths.

**Design Priority**: Desktop (primary) -> Tablet (Phase 2) -> Mobile (Phase 2+)

### Breakpoints

| Width   | Target            |
| ------- | ----------------- |
| 1280px  | Most laptops      |
| 1440px  | External monitors |
| 1920px+ | Large displays    |

### Layout Patterns

```tsx
// Sidebar + main content (dashboard layout)
<div className="flex h-screen">
  <Sidebar />  {/* w-60, fixed */}
  <main className="flex-1 overflow-y-auto p-6">{children}</main>
</div>

// Summary cards grid
<div className="grid grid-cols-4 gap-4">

// Two-column detail layout (job detail)
<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
  <div className="lg:col-span-2">...</div>  {/* Main content */}
  <div>...</div>                              {/* Sidebar info */}
</div>
```

---

## Dark Mode

Dark mode is the default. Applied via `className="dark"` on `<html>` in `app/layout.tsx`.

shadcn/ui handles dark mode token mapping automatically. Custom elements should use Tailwind's semantic color classes (`bg-background`, `text-foreground`, `border-border`) rather than hardcoded hex values.

---

## Related Documents

- [CLAUDE.md](../../CLAUDE.md) — Design system summary, quality checklist
- [TECH_STACK.md](../TECH_STACK.md) — Tool choices including styling stack
- [SCREEN_AUDIT_PROTOCOL.md](./SCREEN_AUDIT_PROTOCOL.md) — 15-point quality audit
- [UX_HEURISTICS.md](./UX_HEURISTICS.md) — 10-point UX quality checklist

---

## Version History

| Date       | Change                                                                                                     |
| ---------- | ---------------------------------------------------------------------------------------------------------- |
| 2026-02-04 | Initial guidelines (dbt-playground context)                                                                |
| 2026-02-07 | Adapted for Screen Print Pro: Tailwind v4 + shadcn/ui + next/font                                          |
| 2026-03-02 | Two-pool color architecture, badge variants, encoding channel rules, categorical palette (+teal, +emerald) |
