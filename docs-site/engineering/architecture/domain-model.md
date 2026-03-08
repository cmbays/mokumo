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

| Decision                      | Choice                                                      | Why                                                                                                                                                                              | Alternative Considered                                         |
| ----------------------------- | ----------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| **Soft delete**               | `deleted_at` on all production entities                     | Data safety — can restore accidentally deleted quotes/jobs                                                                                                                       | Hard delete (too risky for financial data)                     |
| **Sequence numbers**          | PG advisory locks                                           | Race-safe auto-increment for quote/invoice/job numbers. Pattern from Plane source                                                                                                | Serial columns (race conditions in concurrent requests)        |
| **Sort order**                | Float-based                                                 | Drag-drop reordering without re-indexing entire list. Pattern from Plane source                                                                                                  | Integer-based (requires re-indexing)                           |
| **Status model**              | Canonical groups + custom labels                            | Statuses map to canonical groups (draft, active, in-progress, complete, cancelled) that the system understands. Custom labels for display. Dual-label (admin vs customer-facing) | Free-form labels (lose system-level semantics)                 |
| **Service type polymorphism** | Shared quote/job architecture, service-type-specific config | One composable system, not three separate products. Pricing axes, production stages, and artwork metadata vary per service type                                                  | Separate modules per service type (duplication, inconsistency) |
| **Financial precision**       | `big.js` for all calculations                               | No floating-point rounding errors. 100% test coverage mandate                                                                                                                    | Native JS numbers (rounding errors on money)                   |
