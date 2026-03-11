---
title: Animation Standards
description: Motion design standards for Mokumo — durations, easing, GPU performance, and reduced-motion compliance.
category: reference
status: active
phase: all
last_updated: 2026-03-11
last_verified: 2026-03-11
---

# Animation Standards

Motion in Mokumo is **functional, not decorative**. Every animation communicates state change, provides feedback, or guides attention. If an animation doesn't serve one of these purposes, remove it.

## Tools

| Tool                     | Use for                                                       | Import                              |
| ------------------------ | ------------------------------------------------------------- | ----------------------------------- |
| **Tailwind transitions** | Hover states, focus states, color changes                     | Built-in (`transition-*` utilities) |
| **Tailwind animations**  | Simple keyframe loops (pulse, spin)                           | Built-in (`animate-*` utilities)    |
| **Framer Motion**        | Layout animations, enter/exit, gesture-driven, spring physics | `framer-motion`                     |
| **CSS `@keyframes`**     | Custom one-off animations (skeleton shimmer)                  | In `globals.css`                    |

**Rule**: Use the simplest tool that works. Tailwind transition for a hover effect. Don't reach for Framer Motion unless you need layout animation, spring physics, or enter/exit orchestration.

## Duration Scale

| Category | Duration  | When to use                                           | Tailwind                        |
| -------- | --------- | ----------------------------------------------------- | ------------------------------- |
| Instant  | 0–100ms   | Button press feedback, checkbox toggle                | `duration-75` / `duration-100`  |
| Micro    | 150–200ms | Hover effects, focus rings, tooltip show/hide         | `duration-150` / `duration-200` |
| Standard | 200–300ms | Dropdown open, accordion expand, tab switch           | `duration-200` / `duration-300` |
| Emphasis | 300–500ms | Page transitions, modal enter/exit, toast slide-in    | Framer Motion                   |
| Slow     | 500ms+    | **Rarely used.** Complex orchestrated sequences only. | Framer Motion                   |

**Rule**: If a user can perceive a delay, the animation is too slow. Most UI animations should be 150–300ms.

## Easing

| Easing          | CSS value                                      | Use for                                           |
| --------------- | ---------------------------------------------- | ------------------------------------------------- |
| **Ease out**    | `ease-out` / `cubic-bezier(0.0, 0, 0.2, 1)`    | Elements entering (appearing, sliding in)         |
| **Ease in**     | `ease-in` / `cubic-bezier(0.4, 0, 1, 1)`       | Elements exiting (disappearing, sliding out)      |
| **Ease in-out** | `ease-in-out` / `cubic-bezier(0.4, 0, 0.2, 1)` | Elements morphing (resizing, repositioning)       |
| **Spring**      | Framer Motion `type: "spring"`                 | Layout shifts, drag release, playful interactions |

### Framer Motion Spring Presets

```tsx
// Snappy — buttons, toggles, small elements
const snappy = { type: 'spring', stiffness: 500, damping: 30 }

// Smooth — panels, cards, medium elements
const smooth = { type: 'spring', stiffness: 300, damping: 25 }

// Gentle — page transitions, large layout shifts
const gentle = { type: 'spring', stiffness: 200, damping: 20 }
```

## GPU Performance

### Composited Properties Only

Animations MUST use only these CSS properties for 60fps performance:

| Property                               | Use for                          |
| -------------------------------------- | -------------------------------- |
| `transform` (translate, scale, rotate) | Movement, size changes, rotation |
| `opacity`                              | Fade in/out, show/hide           |

These properties are handled by the GPU compositor and don't trigger layout or paint.

### Never Animate

| Property                         | Why not                                       | Alternative                                            |
| -------------------------------- | --------------------------------------------- | ------------------------------------------------------ |
| `width`, `height`                | Triggers layout recalculation                 | Use `transform: scale()`                               |
| `top`, `left`, `right`, `bottom` | Triggers layout recalculation                 | Use `transform: translate()`                           |
| `margin`, `padding`              | Triggers layout recalculation                 | Use `transform: translate()` or `gap`                  |
| `border-width`                   | Triggers layout + paint                       | Use `box-shadow` or `outline`                          |
| `background-color`               | Triggers paint (acceptable for simple hovers) | OK for hover states, avoid for loops                   |
| `box-shadow`                     | Triggers paint                                | Pre-render both states, animate `opacity` between them |

### Tailwind GPU Hint

```tsx
// Force GPU layer for smooth animation
<div className="will-change-transform transition-transform duration-200">
```

Use `will-change-transform` sparingly — only on elements that will actually animate. Overuse wastes GPU memory.

## Animation Categories

### 1. State Feedback (Instant — Micro)

User does something, UI acknowledges immediately.

```tsx
// Button press
<Button className="transition-transform duration-75 active:scale-95">

// Toggle switch
<Switch className="transition-colors duration-150" />

// Hover highlight
<TableRow className="transition-colors duration-150 hover:bg-muted/50">
```

### 2. Reveal / Dismiss (Micro — Standard)

Content appears or disappears.

```tsx
// Dropdown menu (Radix handles via shadcn)
// Tooltip show/hide (Radix handles via shadcn)

// Accordion content
<AccordionContent className="overflow-hidden transition-all duration-200
  data-[state=closed]:animate-accordion-up
  data-[state=open]:animate-accordion-down">
```

### 3. Layout Transitions (Standard — Emphasis)

Elements move to new positions or resize.

```tsx
// Framer Motion layout animation (e.g., Kanban card drag)
<motion.div layout transition={smooth}>
  {children}
</motion.div>

// List reorder
<motion.div layout="position" transition={snappy}>
  {item.name}
</motion.div>
```

### 4. Page / Route Transitions (Emphasis)

Full page or section transitions. Use sparingly.

```tsx
// Enter animation for page content
<motion.div
  initial={{ opacity: 0, y: 8 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.3, ease: 'easeOut' }}
>
  {pageContent}
</motion.div>
```

### 5. Loading Indicators (Continuous)

Skeleton shimmer, spinners, progress bars.

```tsx
// Skeleton shimmer (defined in globals.css)
@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

// Spinner (Tailwind built-in)
<Loader2 className="h-4 w-4 animate-spin" />
```

## Reduced Motion

**Non-negotiable.** All animations must respect `prefers-reduced-motion`.

### Tailwind Approach

```tsx
// Only animate when user hasn't requested reduced motion
<div className="motion-safe:transition-transform motion-safe:duration-200 motion-safe:hover:scale-105">

// Alternative: reduce (not remove) motion
<div className="transition-opacity duration-200 motion-safe:transition-all motion-safe:duration-300">
```

### Framer Motion Approach

```tsx
import { useReducedMotion } from 'framer-motion'

function AnimatedCard({ children }: { children: React.ReactNode }) {
  const prefersReducedMotion = useReducedMotion()

  return (
    <motion.div
      initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.3 }}
    >
      {children}
    </motion.div>
  )
}
```

### What "Reduced Motion" Means

- **Remove**: Sliding, bouncing, parallax, auto-playing animations
- **Keep**: Opacity fades (short duration), color transitions, focus indicators
- **Replace**: Complex transitions become simple opacity crossfades

## Anti-Patterns

| Don't                               | Why                                               | Do Instead                                                     |
| ----------------------------------- | ------------------------------------------------- | -------------------------------------------------------------- |
| Animate on page load for decoration | Slows perceived performance                       | Animate only meaningful state changes                          |
| Use `transition-all`                | Animates unintended properties, hurts performance | Be explicit: `transition-transform`, `transition-opacity`      |
| Animation duration > 500ms          | Feels sluggish                                    | Keep under 300ms for most interactions                         |
| Bouncy springs on data-dense UI     | Distracting in productivity software              | Reserve springs for playful moments (empty states, onboarding) |
| Animate layout properties           | Layout thrash, dropped frames                     | Use `transform` and `opacity` only                             |
| Skip `prefers-reduced-motion`       | Accessibility violation, motion sensitivity       | Always provide reduced-motion alternative                      |

## Related

- [Design System](./design-system.md) — Token architecture, personalities, color system
- [Screen Audit Protocol](./screen-audit.md) — Point #8: Motion & Transitions
- [Coding Standards](./coding-standards.md) — Framer Motion as approved dependency
