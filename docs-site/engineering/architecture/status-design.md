---
title: 'Status Workflow Design'
description: 'Design principles for the canonical group + custom label status model.'
category: canonical
status: active
phase: all
last_updated: 2026-03-08
last_verified: 2026-03-08
depends_on: []
---

# Status Workflow Design

Statuses are not just labels — they are the connective tissue between production reality and software automation. The model separates system-level semantics (canonical groups) from user-level display (custom labels).

## Design Principles

1. **Canonical groups are system-level concepts**: `draft`, `queued`, `in_progress`, `complete`, `cancelled`, `on_hold`. The system understands these — they drive dashboard counts, production board columns, automation triggers, and report calculations.

2. **Custom labels are user-level display names**: A shop can rename "In Progress" to "On the Press" or "Printing." The label changes; the system behavior doesn't.

3. **Dual-label for customer-facing contexts**: Admin sees the internal label (e.g. "Awaiting Artwork"). The customer portal shows a simplified label (e.g. "In Production"). Each status record carries both `admin_label` and `customer_label` fields.

4. **Statuses trigger automations**: "When status changes to [Complete]" is a real automation trigger because `complete` is a canonical group the system understands. Custom statuses must map to a canonical group — orphaned labels that mean nothing to the system are not permitted.

5. **Advanced mode (future)**: Shops that need entirely new canonical groups and custom automation triggers can define them via an escape hatch. V1 ships with pre-defined status workflows per service type; advanced mode is not part of the initial release.

## Implementation Reference

See `domain-model.md` — the status model row in the Key Design Decisions table covers the schema-level choice. See `patterns/advisory-locks.md` for the sequence number pattern that pairs with status transitions.

The canonical group + custom label pattern is validated against Plane's `StateGroup` / `State` model (`plane/apps/api/plane/db/models/state.py`), adapted for shop production workflows.
