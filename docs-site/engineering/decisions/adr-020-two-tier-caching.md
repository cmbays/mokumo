---
title: 'ADR-020: Two-Tier Caching — LRU In-Memory + Redis'
description: 'L1 LRU in-memory cache and L2 Upstash Redis cache minimize supplier API calls across serverless instances.'
category: decision
status: active
adr_status: proposed
adr_number: 020
date: 2026-03-08
supersedes: null
superseded_by: null
depends_on: [009]
---

# ADR-020: Two-Tier Caching — LRU In-Memory + Redis

## Status

Proposed

## Context

Supplier API responses (catalog, pricing, inventory) are expensive to re-fetch and change infrequently. Need fast cache for repeated requests within a serverless instance and a shared cache across all instances.

## Decision

L1 = LRU in-memory cache (3-second TTL, per-instance). L2 = Upstash Redis (24-hour TTL, shared). Check L1 first, fall through to L2, fall through to the API. On L2 hit, warm L1.

## Consequences

Sub-millisecond cache hits for hot paths within an instance. Shared Redis prevents cache stampede across instances. 3-second L1 TTL prevents stale in-memory data on high-traffic instances. Ships with M3 when the supplier API is production-traffic-enabled.
