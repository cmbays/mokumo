---
title: 'ADR-017: State Management — Zustand for UI State, URL Params for Nav State'
description: 'Zustand manages cross-component UI state; URL search params manage shareable navigation state; server components own all data fetching.'
category: decision
status: active
adr_status: proposed
adr_number: 017
date: 2026-03-08
supersedes: null
superseded_by: null
depends_on: [014]
---

# ADR-017: State Management — Zustand for UI State, URL Params for Nav State

## Status

Proposed

## Context

Initial decision was "no global state managers" to reduce surface area. In practice, React Context providers used for cross-component UI state (sidebar state, row selection, tooltip/popover registration, drag state) cause cascading re-renders — every consumer re-renders when any part of context changes, even slices they don't use. This produced visible UX degradation: slow response to interactions, tooltip rendering bugs, and input lag.

## Decision

Zustand for cross-component UI state. URL search params for shareable/navigable state (filters, pagination, active tab). Server components for server data. `useState` for local ephemeral state. Zustand stores are UI-only — never used for server data fetching.

Division of responsibility:

- **Zustand**: sidebar open/closed, table row selection, active drag state, notification queue, modal state
- **URL params**: search query, active filters, pagination, selected tab
- **Server components/actions**: all data from the database
- **useState**: input value, local toggle, hover state

## Options Considered

- **React Context** — re-renders all consumers on any value change; produces cascading re-render bugs at scale. Zustand uses fine-grained subscriptions — components re-render only when their specific slice changes. Zustand adds approximately 1KB and requires no Provider wrapper.

## Consequences

Eliminates cascading re-render bugs from Context abuse. Zustand's devtools make UI state debuggable. Requires discipline: Zustand stores must never fetch data (that belongs to server components/actions).
