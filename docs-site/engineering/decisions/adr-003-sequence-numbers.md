---
title: 'ADR-003: Sequence Numbers via Advisory Locks'
description: 'pg_advisory_xact_lock() provides race-safe sequence number generation for quotes, invoices, and jobs.'
category: decision
status: active
adr_status: accepted
adr_number: 003
date: 2026-03-08
depends_on: []
---

# ADR-003: Sequence Numbers via Advisory Locks

## Status
Accepted

## Context
Quotes, invoices, and jobs require sequential, human-readable reference numbers (e.g., Q-1042, INV-0338). These numbers must be unique per shop, gapless in normal operation, and safe under concurrent requests. PostgreSQL serial columns and application-level MAX()+1 queries both have race conditions when multiple requests attempt number generation simultaneously.

## Decision
Sequence numbers are generated inside a transaction using `pg_advisory_xact_lock()` to serialize concurrent requests at the database level. The lock is scoped to a hash of the shop ID and sequence type, so shops do not block each other. The lock is released automatically when the transaction commits or rolls back.

See `patterns/advisory-locks.md` for the full implementation recipe.

## Consequences
Number generation is safe under concurrent load without application-level locking infrastructure or a dedicated sequence service. The approach is simple to implement and easy to reason about. Advisory locks do add a small serialization bottleneck per shop per sequence type, but at typical shop transaction volumes this is not a concern.
