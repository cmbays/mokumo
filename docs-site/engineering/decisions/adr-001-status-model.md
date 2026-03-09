---
title: 'ADR-001: Status Model'
description: 'Canonical groups drive system behavior; custom labels drive user display.'
category: decision
status: active
adr_status: accepted
adr_number: 001
date: 2026-03-08
depends_on: []
---

# ADR-001: Status Model

## Status

Accepted

## Context

Production shops use wildly different terminology for workflow stages ("On the Press," "Awaiting Artwork," "Ready to Ship"). A purely free-form label system would make it impossible for the software to automate dashboard counts, production board columns, report calculations, and trigger-based automations — because the system would have no shared understanding of what any given label means.

The model must let shops customize display language while preserving system-level semantics. It also needs to distinguish between what an admin sees and what a customer sees, since those audiences have different information needs at each stage.

## Decision

Statuses use a two-layer model: **canonical groups** and **custom labels**.

- **Canonical groups** are system-level concepts (`draft`, `queued`, `in_progress`, `complete`, `cancelled`, `on_hold`). The system understands these — they drive dashboard counts, production board columns, automation triggers, and report calculations. Every status must map to exactly one canonical group; orphaned labels that carry no system meaning are not permitted.
- **Custom labels** are user-level display names. A shop can rename "In Progress" to "On the Press" or "Printing." The label changes; the system behavior doesn't.
- **Dual-label for customer-facing contexts**: each status record carries both an `admin_label` (internal display) and a `customer_label` (customer portal display), allowing simplified messaging externally without losing operational detail internally.
- **Automations reference canonical groups**: "When status changes to [Complete]" is a real automation trigger because `complete` is a canonical group the system understands.
- **Advanced mode (future)**: shops that need entirely new canonical groups and custom automation triggers can define them via an escape hatch. V1 ships with pre-defined status workflows per service type; advanced mode is not part of the initial release.

## Consequences

The canonical group layer makes automation and reporting reliable and predictable — any feature that reacts to status changes has a stable vocabulary to work against. Custom labels give shops the terminology they already use without forcing a rename across their whole team.

The dual-label design adds a small amount of schema complexity (two label fields per status record) but eliminates the need for a separate customer-communication mapping layer. Shops must map every custom status to a canonical group, which is a mild constraint — but it prevents the system from silently ignoring statuses that have no semantic meaning.
