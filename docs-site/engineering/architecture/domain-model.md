---
title: 'Domain Model'
description: 'Entity relationships and key design decisions for the Mokumo domain model.'
category: canonical
status: active
phase: all
last_updated: 2026-03-08
last_verified: 2026-03-08
depends_on: []
---

# Domain Model

The domain model treats production as a first-class entity rather than a status label. Every entity in the graph below has a well-defined lifecycle, owner, and relationship boundary.

## Entity Relationships

```
Shop (tenant)
├── Customer
│   ├── Contact (1:many)
│   ├── Address (1:many)
│   ├── Preference (shop-level defaults, customer overrides)
│   └── Artwork (customer-scoped art vault)
│
├── Quote
│   ├── LineItem (1:many, polymorphic per service type)
│   │   ├── Garment (from catalog)
│   │   ├── SizeQuantityMatrix
│   │   ├── PrintConfig (service-type-specific)
│   │   ├── PricingBreakdown (blank + print + setup, per-item P&L)
│   │   └── Artwork (associated)
│   └── converts to → Invoice
│
├── Job (created from accepted Quote)
│   ├── ProductionStage (service-type-specific, ordered)
│   ├── ServiceType (screen-print | dtf | embroidery)
│   └── links to → Equipment (derived from service type)
│
├── Invoice
│   ├── LineItem (from Quote conversion)
│   ├── Payment (1:many, partial supported)
│   └── references → Quote
│
├── PricingMatrix (per service type, per shop, customer overrides possible)
│
├── Automation (pre-built rules: trigger > condition > action chain)
│
└── Catalog
    ├── Garment (from S&S / supplier API)
    ├── Ink (from supplier API, future)
    └── Thread (from supplier API, future)
```

## Key Design Decisions

The decisions that shaped this domain model are recorded as ADRs in `decisions/`:

- [ADR-001: Status Model](../decisions/adr-001-status-model.md) — Canonical groups + custom labels; dual-label for customer-facing contexts
- [ADR-002: Soft Delete](../decisions/adr-002-soft-delete.md) — `deleted_at` on all production entities; never hard delete financial data
- [ADR-003: Sequence Numbers via Advisory Locks](../decisions/adr-003-sequence-numbers.md) — Race-safe quote/invoice/job number generation
- [ADR-004: Float-Based Sort Order](../decisions/adr-004-sort-order.md) — Drag-drop reordering without re-indexing
- [ADR-005: Service Type Polymorphism](../decisions/adr-005-service-type-polymorphism.md) — Shared quote/job architecture with service-type-specific config
- [ADR-006: Financial Precision with big.js](../decisions/adr-006-financial-precision.md) — No floating-point rounding errors; 100% test coverage mandate
