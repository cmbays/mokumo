---
title: 'ADR-002: Soft Delete'
description: 'All production entities use deleted_at rather than hard deletion.'
category: decision
status: active
adr_status: accepted
adr_number: 002
date: 2026-03-08
depends_on: []
---

# ADR-002: Soft Delete

## Status
Accepted

## Context
Production shops occasionally delete records by mistake — a misclick on the wrong quote, an accidental job removal. Hard deletion makes recovery impossible and destroys audit history. Financial records (invoices, payments) carry legal and operational weight; irreversible deletion of those records is unacceptable even in error scenarios.

## Decision
Every production entity (quotes, jobs, invoices, line items, customers, contacts) carries a `deleted_at` timestamp column. Records are never hard deleted. Deletion sets `deleted_at` to the current timestamp; all queries filter on `deleted_at IS NULL` by default. Restoring a record clears the timestamp.

## Consequences
Accidental deletions are recoverable without database intervention. Audit trails remain intact for financial records. Queries must consistently apply the `deleted_at IS NULL` filter — this is handled at the ORM/query-builder layer to avoid accidental exposure of soft-deleted rows. Storage grows over time rather than shrinking on deletion, which is an accepted trade-off given the data volumes typical of a shop.
