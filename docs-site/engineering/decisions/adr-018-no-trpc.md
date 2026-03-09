---
title: 'ADR-018: No tRPC — Server Actions + DAL Provide Type-Safe API Layer'
description: 'tRPC is not adopted; next-safe-action server actions and the Drizzle DAL already provide end-to-end type safety without a separate API router.'
category: decision
status: active
adr_status: proposed
adr_number: 018
date: 2026-03-08
supersedes: null
superseded_by: null
depends_on: [013, 014, 015]
---

# ADR-018: No tRPC — Server Actions + DAL Provide Type-Safe API Layer

## Status

Proposed

## Context

tRPC is commonly recommended for Next.js SaaS apps to provide end-to-end type safety between client and server. Evaluated whether to adopt it.

## Decision

Not adopting tRPC. `next-safe-action` server actions + Drizzle DAL already provide end-to-end type safety without a separate API router layer.

## Options Considered

- **tRPC** — most valuable when multiple independent clients (mobile app + web app + third-party) consume the same API. For a Next.js app where server components and server actions live in the same codebase, tRPC adds an extra abstraction layer that the framework already provides natively. Our `next-safe-action` three-tier client handles auth, validation, and error normalization at the server action boundary.

Reconsider if: a native mobile app is built, or third-party developers need a typed SDK to consume the API — at that point tRPC (or a dedicated API layer) becomes the right tool.

## Consequences

Simpler dependency surface. Server actions are the typed RPC layer. External API consumers (non-Next.js clients) use REST endpoints (see ADR-016).
