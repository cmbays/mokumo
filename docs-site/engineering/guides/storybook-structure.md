---
title: Storybook Structure
description: How Storybook fits into Mokumo's clean architecture, DDD, and vertical-slice frontend structure.
---

# Storybook Structure

Storybook is a development tool and example surface. It is not part of Mokumo's production runtime.

## Placement

Storybook lives at the repo root:

```text
mokumo/
  .storybook/   # config and tooling only
  stories/      # overview, foundations, and shared pattern stories
  src/          # app code, where colocated component stories live
```

Core scripts:

- `npm run storybook`
- `npm run build-storybook`
- `npm run test:storybook`

Runtime:

- use Node 24 for Storybook work
- the repo advertises this via `.nvmrc` and `.node-version`

This keeps Storybook outside the runtime architecture while still allowing it to consume UI code from `src/`.

## How It Fits The Architecture

Mokumo's runtime layers remain unchanged:

- `src/domain/` stays pure and Storybook-free
- `src/infrastructure/` stays implementation-only and Storybook-free
- `src/app/` stays a thin routing shell
- `src/shared/ui/` and `src/features/*/components/` are the main Storybook consumers

Storybook reads from the UI layer. The UI layer does not depend on Storybook.

## Colocation Rules

Colocate stories only with UI code:

- `src/shared/ui/primitives/*.stories.tsx`
- `src/shared/ui/organisms/*.stories.tsx`
- `src/features/*/components/*.stories.tsx`

Do not colocate stories in:

- `src/domain/`
- `src/infrastructure/`
- `src/app/`

## What Goes In `stories/`

Use the root `stories/` directory for docs-like and system-level surfaces:

- design system overview pages
- foundations demos
- shared pattern demos
- cross-component compositions

This is the right place for things that do not belong to one specific component file.

## What Goes In Colocated Stories

Use colocated stories for:

- component states
- component variants
- accessibility-sensitive examples
- edge cases close to the source component

Colocation keeps examples discoverable and reduces drift during refactors.

## Personality System in Stories

Foundation and pattern stories should demonstrate all personality x mode combinations where relevant:

- **Niji Dark** (default) — the base visual treatment
- **Niji Light** — light mode with the same neobrutalist character
- **Liquid Metal Dark** — luxury chrome with gradient rings and grain
- **Liquid Metal Light** — warm cream background with onyx accents

Stories achieve this by applying CSS classes on the story wrapper:

- No classes = Niji Dark (default)
- `.light` = Niji Light
- `.personality-liquid` = Liquid Metal Dark
- `.personality-liquid.light` = Liquid Metal Light

The personality registry (`src/shared/lib/personality/`) provides `getPersonalityClasses()` for programmatic class generation.

## Current Story Surface

Foundation stories (root `stories/`):

- Design system overview
- Color tokens (status + categorical palettes, surface tiers, personality semantics)
- Entity palette (domain entities with color assignments and encoding rules)
- Personality tokens (all 4 personality x mode combos side-by-side)
- Visual language

Pattern stories (root `stories/`):

- Form section (quote intake example)
- Sidebar personality prototype (interactive Niji vs Liquid Metal exploration)

Colocated primitive stories (`src/shared/ui/primitives/`):

- Button, Input, Badge, Dialog, Select

Remaining primitives will be added incrementally as verticals are built.
