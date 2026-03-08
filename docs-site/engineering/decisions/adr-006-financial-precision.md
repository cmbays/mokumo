---
title: 'ADR-006: Financial Precision with big.js'
description: 'All monetary calculations use big.js to eliminate floating-point rounding errors.'
category: decision
status: active
adr_status: accepted
adr_number: 006
date: 2026-03-08
depends_on: []
---

# ADR-006: Financial Precision with big.js

## Status
Accepted

## Context
JavaScript's native number type uses IEEE 754 double-precision floating point. This produces well-known rounding errors on decimal arithmetic (e.g., `0.1 + 0.2 !== 0.3`). For general computation this is acceptable, but for monetary calculations — pricing breakdowns, per-item P&L, invoice totals, payment reconciliation — rounding errors accumulate and produce incorrect totals that are visible to customers and create accounting discrepancies.

In the decorated apparel industry, per-unit costs frequently require sub-cent precision (e.g., $0.125/unit for high-volume screen printing). Standard IEEE 754 float arithmetic produces rounding errors at this precision level. `big.js` stores values to arbitrary precision and rounds only at display/output time. Store and calculate to minimum 3 decimal places; round to 2 for display.

## Decision
All monetary calculations use `big.js`, an arbitrary-precision decimal library. Native JS number arithmetic is never used for money. Results are serialized to string or stored as `numeric` in PostgreSQL to preserve precision across the stack. Financial calculation modules carry a 100% test coverage mandate.

## Consequences
Monetary calculations are correct and deterministic. The `big.js` API is slightly more verbose than native operators, but the trade-off is non-negotiable for financial data. The 100% test coverage mandate on financial modules provides a safety net for future changes and makes regressions immediately visible.
