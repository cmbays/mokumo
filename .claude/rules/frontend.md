---
paths:
  - 'src/features/**'
  - 'src/shared/components/**'
  - 'src/app/(dashboard)/**'
---

# Frontend

When working with UI components, features, or dashboard pages:

1. **Server components default** — `"use client"` only when required (event handlers, hooks, browser APIs).
2. **Tailwind only** — no separate CSS files. Use `cn()` from `@shared/lib/cn` for conditional classes, never string concatenation.
3. **shadcn/ui (Radix)** — use existing components. Lucide icons only, no emoji icons.
4. **Design tokens** — no colors outside the design token palette. No decorative gradients — color = meaning.
5. **State management** — URL query params for navigational state (filters, search, pagination). Zustand for ephemeral client UI state (sidebar, selections, drafts). No Redux, Jotai, Recoil, or deep Context chains.
6. **Breadcrumbs** — use `buildBreadcrumbs()`, never include `"Dashboard"` label.
7. **TooltipProvider** — one global in `app/(dashboard)/layout.tsx`. Never per-component.
8. **Design system reference** — read `ops/standards/design-system/` for token contracts, component patterns, and accessibility requirements when building new components.
