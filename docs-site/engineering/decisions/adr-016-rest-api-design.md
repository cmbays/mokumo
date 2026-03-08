---
title: 'ADR-016: REST API + Bearer Tokens + Webhooks on All Tiers'
description: 'REST API with Bearer token auth and webhooks available on all pricing tiers from M1 onward.'
category: decision
status: active
adr_status: proposed
adr_number: 016
date: 2026-03-08
supersedes: null
superseded_by: null
depends_on: [009]
---

# ADR-016: REST API + Bearer Tokens + Webhooks on All Tiers

## Status
Proposed

## Context
API access philosophy and design principles for external consumers and integrations. Need to establish authentication approach and webhook availability policy before shipping the first external-facing endpoints.

## Decision
REST endpoints for all entities (customers, quotes, jobs, invoices, artwork). Bearer token auth — not API tokens in query params, which appear in server logs. Webhooks for state changes on all pricing tiers. Rate limiting via Upstash Ratelimit with reasonable limits. Formal API endpoints ship incrementally per feature milestone from M1 onward.

## Consequences
API-first design means internal use cases and external integrations share the same surface. Bearer tokens prevent credential exposure in logs. Webhooks on all tiers removes a pricing gate. Zapier/Make integrations are enabled from day one without tier restriction.
