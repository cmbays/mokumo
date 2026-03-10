---
title: Design System
description: Mokumo design system overview — token architecture, personalities, and visual foundations.
category: reference
status: active
phase: all
last_updated: 2026-03-10
last_verified: 2026-03-10
---

# Design System

Mokumo's visual system: **"Linear Calm + Raycast Polish + Neobrutalist Delight"**

## Token Architecture (4 Layers)

| Layer | Name                  | Scope                              | Changes Per...      |
| ----- | --------------------- | ---------------------------------- | ------------------- |
| 4     | Personality Overrides | CSS classes on root                | Product personality |
| 3     | Semantic `ds-` Tokens | Extends foundation                 | Personality + mode  |
| 2     | Categorical Palette   | Entity/service identity            | Mode (dark/light)   |
| 1     | Foundation            | Surfaces, status, borders, spacing | Mode (dark/light)   |

All tokens defined as CSS custom properties in `globals.css`, exposed via Tailwind's `@theme inline` bridge.

## Personalities

Two visual personalities, each with dark + light mode:

- **Niji** (default) — Neobrutalist: flat surfaces, offset shadows, high-contrast accents
- **Liquid Metal** — Luxury chrome: metallic gradient rings, grain texture, gold/silver/onyx

CSS-only implementation — `.personality-liquid` and `.light` classes on root element. No JS runtime required.

Adding a personality: one CSS override block + one registry entry in `src/shared/lib/personality/`.

## Color System

### Two Isolated Pools

**Status** (state/urgency): action, success, error, warning, muted — used in filled badges, text indicators, dot colors.

**Categorical** (entity identity): purple (Jobs), magenta (Quotes), emerald (Invoices), amber (Customers), graphite (Garments), cyan (Dashboard), teal (Screen Print), lime (Embroidery), brown (DTF), yellow (Communication) — used in outline badges, left borders, nav icons.

**Rule**: A status color never identifies an entity. A categorical color never represents a state.

## Live Reference

**Storybook** (`npm run storybook`) is the canonical visual reference:

- `stories/foundations/` — Color tokens, entity palette, personality comparison
- `stories/patterns/` — Sidebar prototype, form patterns
- `src/shared/ui/primitives/*.stories.tsx` — Component states and variants

## Implementation

| Concern                      | Location                                      |
| ---------------------------- | --------------------------------------------- |
| Token definitions            | `src/app/globals.css`                         |
| Personality types + registry | `src/shared/lib/personality/`                 |
| Badge/dot utilities          | `src/domain/lib/design-system.ts`             |
| Storybook config             | `.storybook/main.ts`, `.storybook/preview.ts` |

## Related

- [Storybook Structure](../guides/storybook-structure.md) — placement rules, colocation, scope
- [Coding Standards](./coding-standards.md) — `cn()` for classNames, Lucide icons only, Tailwind only
