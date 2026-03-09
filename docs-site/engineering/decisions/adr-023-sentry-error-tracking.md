---
title: 'ADR-023: Sentry — Error Tracking'
description: 'Sentry with Next.js SDK provides production error tracking before any real shop uses the product.'
category: decision
status: active
adr_status: proposed
adr_number: 023
date: 2026-03-08
supersedes: null
superseded_by: null
depends_on: [007]
---

# ADR-023: Sentry — Error Tracking

## Status

Proposed

## Context

Production errors in a shop management tool have real business impact — a failed quote save or broken invoice means lost revenue for the shop. Error tracking must be in place before any real shop uses the product, not deferred to a hardening milestone.

## Decision

Sentry with Next.js SDK. Implement at M2 or before first beta user — not later. Sentry source maps must be configured at deploy time; add to the Vercel build step.

## Options Considered

- **LogRocket** — session replay focus, higher cost
- **Datadog** — overkill for solo dev stage
- **Custom error logging** — builds instead of buys a solved problem

## Consequences

Production errors surface with stack traces, request context, and user session. The Next.js SDK handles both client-side and server-side errors. Free tier (5K errors/month) is sufficient through beta.
