---
title: 'ADR-007: Vercel — Hosting + Two-Branch Deploy'
description: 'Vercel hosts the Next.js app with a two-branch model to control staging deployments and avoid rate limiting side effects.'
category: decision
status: active
adr_status: accepted
adr_number: 007
date: 2026-03-08
supersedes: null
superseded_by: null
depends_on: []
---

# ADR-007: Vercel — Hosting + Two-Branch Deploy

## Status
Accepted

## Context
Needed hosting for the Next.js app with preview deployments on Vercel's serverless infrastructure. Auto-deploying from main caused rate limiting issues with the supplier API during CI — every push to main triggered a preview build that made live API calls. A two-branch model (production branch + staging branch) gives manual control over what reaches staging without triggering automatic preview builds on every main push.

## Decision
Vercel with a two-branch model. The production branch deploys to production. A staging branch deploys to preview/staging. Push manually to staging to trigger preview deployments. No auto-deploy from main.

## Options Considered
- **Railway** — no Next.js-native edge functions
- **Fly.io** — requires Docker, adds ops overhead
- **Self-hosted** — no preview deployments without significant infrastructure work

## Consequences
Preview deployments are available on demand without rate-limiting side effects. Requires a deliberate push to trigger staging review. Native Next.js server components, edge functions, and ISR work without configuration.
