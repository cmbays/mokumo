---
title: 'ADR-024: PostHog — Product Analytics + Feature Flags'
description: 'PostHog provides feature flags, product analytics, and session replay under one SDK and free tier.'
category: decision
status: active
adr_status: proposed
adr_number: 024
date: 2026-03-08
supersedes: null
superseded_by: null
depends_on: []
---

# ADR-024: PostHog — Product Analytics + Feature Flags

## Status
Proposed

## Context
Need feature flags for progressive rollout and dark launches. Need product analytics to understand which features shops use. Currently using PostHog in a limited capacity.

## Decision
PostHog for feature flags, product analytics, and session replay. Ships with M3.

## Options Considered
- **LaunchDarkly** — feature flags only, higher cost
- **Mixpanel** — analytics only, no flags
- **Split.io** — flags only

PostHog combines all three under one SDK and free tier.

## Consequences
Feature flags enable progressive rollout without code deploys. Session replay helps debug UX issues. Analytics inform which features get investment. Free tier (1M events/month) is sufficient through early growth.
