---
title: 'ADR-027: Performance Monitoring'
description: 'Decision on performance monitoring tooling and CI gates is open pending validation of measurement approach.'
category: decision
status: active
adr_status: open
adr_number: 027
date: 2026-03-08
supersedes: null
superseded_by: null
depends_on: [007, 024]
---

# ADR-027: Performance Monitoring

## Status
Open

## Context
Experiencing significant UX performance issues in development: 5-6 second page load times, input lag during search, unresponsive interactions during data loading. Need systematic performance measurement and gates before shipping to beta users.

## Decision
No decision yet. Options under consideration:

1. **Lighthouse CI** — automated performance audits on every PR; fails CI if scores drop below thresholds; measures LCP, FID, CLS, TTI.
2. **Vercel Analytics** — real user monitoring (RUM) built into Vercel; Web Vitals from actual users in production; zero configuration.
3. **PostHog Web Vitals** — consolidates with existing PostHog (ADR-024); measures Core Web Vitals as product events.
4. **Combination: Lighthouse CI + Vercel Analytics** — Lighthouse CI for PR gates, Vercel Analytics for production RUM.

## Options Considered
See Decision section above. What we need to validate: whether Lighthouse CI scores in CI correlate with the actual lag we're seeing (which may be data-fetching related, not rendering related).

## Consequences
TBD — pending decision.
