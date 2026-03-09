---
title: 'ADR-021: Data Access Layer + Supplier Adapter Pattern'
description: 'All data access goes through lib/dal/; per-supplier adapters normalize to canonical schemas so the rest of the app is supplier-agnostic.'
category: decision
status: active
adr_status: accepted
adr_number: 021
date: 2026-03-08
supersedes: null
superseded_by: null
depends_on: [013, 014]
---

# ADR-021: Data Access Layer + Supplier Adapter Pattern

## Status

Accepted

## Context

Components should not know whether data comes from mock fixtures or the database. Supplier integrations should normalize to a canonical schema so the rest of the app doesn't care which supplier is active — and so adding a second supplier doesn't require a refactor.

## Decision

All data access through `lib/dal/`. Per-supplier adapters (`MockAdapter`, `SSActivewearAdapter`, future `PromoStandardsAdapter`) implement a common `SupplierAdapter` interface and normalize to canonical `Garment`, `Pricing`, `Inventory` schemas.

## Consequences

Mock-to-database swap requires zero component changes. Multi-supplier support is an adapter addition, not a refactor. The DAL is the only place allowed to import from `infrastructure/` repositories.
