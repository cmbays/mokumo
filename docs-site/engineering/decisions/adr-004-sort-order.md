---
title: 'ADR-004: Float-Based Sort Order'
description: 'Drag-drop reordering uses float positions to avoid full-list re-indexing.'
category: decision
status: active
adr_status: accepted
adr_number: 004
date: 2026-03-08
depends_on: []
---

# ADR-004: Float-Based Sort Order

## Status
Accepted

## Context
Line items, production stages, and other ordered lists need to support drag-and-drop reordering. Integer-based position columns require reassigning every subsequent row's index on each move — an O(n) write operation. For lists that may grow to dozens of items, this creates unnecessary database churn and risks race conditions when multiple reorders happen quickly.

## Decision
Ordered entities store their position as a float. Inserting between two items assigns a value midway between their positions (e.g., between 1.0 and 2.0 → 1.5). Only the moved item's position field is updated. When float precision degrades after many reorders (values become too close to distinguish), a background normalization pass resets the list to evenly spaced values.

## Consequences
Drag-drop reorders require a single-row update rather than a bulk update, making them fast and conflict-free. The normalization edge case is rare in practice and can be handled lazily. Float precision limits mean a list cannot be reordered indefinitely without normalization, but this is an acceptable operational constraint.
