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

## Initial Scope

Because the design system is still being refined, start shallow:

1. root-level overview and structure
2. stable shared primitives
3. a few shared patterns

Defer deeper feature stories until the design system stabilizes enough that the story surface will not churn heavily.

## Initial Story Targets

- `Button`
- `Input`
- `Badge`
- one root-level design system overview story

These are stable enough to create value now without overcommitting to a still-moving visual system.

Current seed stories:

- root overview story
- one foundations story
- one shared pattern story
- primitive stories for `Button`, `Input`, `Badge`, `Select`, and `Dialog`
