---
title: 'Mobile Optimization Vertical — Kickoff'
subtitle: 'Registered mobile-optimization as a new vertical and laid the foundation for systematic mobile improvement'
date: 2026-02-14
phase: 1
pipelineName: mobile-optimization
pipelineType: horizontal
products: [dashboard, quotes, customers, invoices, jobs]
domains: [garments, pricing]
tools: []
stage: research
tags: [plan, build]
sessionId: '0ba68ef8-1b02-40be-a039-2c63d6d15cd1'
branch: 'session/0214-mobile-vertical'
status: complete
---

## Context

Mokumo's desktop experience is polished, but the mobile experience has significant gaps. Rather than treating mobile fixes as ad-hoc tasks, we're establishing Mobile Optimization as a first-class vertical that runs through the full pipeline: research → interview → breadboarding → implementation-planning → build → review → learnings.

## What Was Done

### Vertical Registration

Added `mobile-optimization` slug to all 6 locations where verticals are registered:

1. **KB Schema** (`knowledge-base/src/content.config.ts`) — Zod enum validation
2. **Vertical detail page** (`knowledge-base/src/pages/verticals/[vertical].astro`) — static paths, labels, route generation
3. **Vertical health component** (`knowledge-base/src/components/VerticalHealth.astro`) — display labels
4. **KB index page** (`knowledge-base/src/pages/index.astro`) — vertical labels + mobile filter dropdown
5. **KB sidebar** (`knowledge-base/src/components/Sidebar.astro`) — sidebar filter buttons
6. **CLAUDE.md** — Canonical vertical slug documentation

### Design Decisions

- **Not a main app sidebar item**: Mobile Optimization improves _existing_ screens rather than adding a new app section. No new routes needed in the main Next.js app.
- **Placed before `meta`**: The `meta` vertical is a catch-all, so `mobile-optimization` sits just before it in all lists.
- **Sidebar abbreviation**: Used "Mobile Opt." in the KB sidebar to fit the narrow 260px sidebar width.

## What's Next

The next session should begin the **research** phase:

1. **Audit every existing screen** on mobile viewport sizes (375px, 390px, 428px)
2. **Catalog all mobile issues** — broken layouts, touch targets too small, horizontal overflow, missing responsive breakpoints
3. **Prioritize by user impact** — which screens does the shop owner actually need on mobile?
4. **Research mobile patterns** — how do competing production management tools handle mobile?
5. **Interview Gary** — what does he actually do on his phone vs. desktop?

### Future Phase: Native App

A later phase will evaluate building a native iOS/Android app (React Native, Expo, or PWA). The research phase should include questions about which workflows truly need native capabilities (push notifications, camera for garment photos, offline access).
