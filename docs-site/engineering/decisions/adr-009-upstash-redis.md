---
title: 'ADR-009: Upstash Redis — Distributed Cache + Rate Limiting'
description: 'Upstash Redis via HTTP REST API provides a serverless-compatible distributed cache and rate limiting backend.'
category: decision
status: active
adr_status: accepted
adr_number: 009
date: 2026-03-08
supersedes: null
superseded_by: null
depends_on: [007]
---

# ADR-009: Upstash Redis — Distributed Cache + Rate Limiting

## Status

Accepted

## Context

Vercel's serverless model creates a new process per request — persistent Redis connections are not viable. Need a distributed cache shared across all serverless instances, and a rate limiting backend that works without persistent connections.

## Decision

Upstash Redis via HTTP-based REST API. Used for: supplier API response caching, rate limiting via `@upstash/ratelimit`.

## Options Considered

- **In-memory cache** — resets on cold start, not shared across instances, breaks under scale
- **Self-managed Redis on Railway/Fly** — requires persistent connections, incompatible with Vercel serverless

## Consequences

Serverless-native; no persistent connections required; approximately $0/month in development and ~$10/month in production. Same vendor as QStash (ADR-012) — one account, one billing line.
