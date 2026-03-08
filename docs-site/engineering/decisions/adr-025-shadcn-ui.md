---
title: 'ADR-025: shadcn/ui — Component Library (Radix Primitives)'
description: 'shadcn/ui copy-paste components give full ownership of accessible UI primitives without a package dependency on the library.'
category: decision
status: active
adr_status: accepted
adr_number: 025
date: 2026-03-08
supersedes: null
superseded_by: null
depends_on: []
---

# ADR-025: shadcn/ui — Component Library (Radix Primitives)

## Status
Accepted

## Context
Need an accessible, composable component library. Options: install a package dependency (Material UI, Chakra, Ant Design) or own the component source (shadcn/ui copy-paste model).

## Decision
shadcn/ui — copy-paste Radix primitive components into `src/shared/ui/primitives/`. Own the code; no package dependency on the component library itself. Adding new components requires running `shadcn add <component>`, not `npm install`.

## Options Considered
- **Material UI** — heavy, opinionated styling, hard to customize
- **Chakra UI** — runtime CSS-in-JS, performance overhead
- **Ant Design** — enterprise aesthetic, heavy

All three require a package version as a dependency — shadcn/ui does not.

## Consequences
Full control over component source. No breaking change risk from upstream library updates. Components are accessible — Radix primitives handle ARIA, keyboard navigation, and focus management.
