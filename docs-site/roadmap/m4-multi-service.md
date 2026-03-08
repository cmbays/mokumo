---
title: 'M4: Multi-Service + Customer Portal'
description: Prove the architecture handles multiple decoration types. Give customers a self-service touchpoint.
---

# M4: Multi-Service + Customer Portal

> **Status**: Planned
> **Exit signal**: A shop with multiple decoration services can run all of them through Mokumo. Customers can self-serve on their orders.

Prove the architecture handles multiple decoration types. Give customers a self-service touchpoint.

## What Ships

| Component                               | Depends On                  | Key Deliverables                                                                                           |
| --------------------------------------- | --------------------------- | ---------------------------------------------------------------------------------------------------------- |
| DTF quote builder                       | M2 patterns, pricing engine | DTF-specific pricing (transfer size × quantity), job tracking. Validates extensible quote/job architecture |
| DTF Press quote builder                 | M2 patterns                 | Simplified flow for customer-supplied transfers — flat-rate per garment with quantity tiers                |
| Embroidery quote builder (nice-to-have) | DTF complete                | Stitch count pricing, embroidery-specific production stages                                                |
| Multi-service quotes                    | DTF + screen print          | One quote with line items from multiple service types                                                      |
| Customer portal                         | M2 quote-to-cash            | View quotes, approve artwork, see job status, view invoices. Magic link email auth                         |
| Online stores (basic)                   | Customer portal             | Shop creates store link → customers order → bulk order created                                             |
| Multi-user roles                        | M0 Auth + RLS               | Admin (full access) and User (production access). RLS-enforced data isolation                              |

## Projects in This Milestone

### Quoting — DTF (P7)

DTF-specific quoting with gang sheet builder, per-transfer pricing, and sheet cost optimization.

**User story**: Customer needs 50 tees with a full-color photographic design — impossible with screen print. Gary switches to the DTF tab, uploads artwork sized to 11"×11", adds a chest logo, enters quantity. The system calculates gang sheet layout, cost, and pricing.

**Key decisions:**

- Content-first workflow (artwork → size → quantity) — inverted from screen print (garment-first)
- Sheet optimization for minimum cost, not minimum waste
- Press labor as separate line item for accurate margin calculation
- Existing DTF domain code (560+ lines) wraps into the quote builder UI

### Quoting — DTF Press (P8)

Simplified quoting for customer-supplied transfers.

**User story**: A customer brings 75 pre-made DTF transfers plus 75 blank tees. Gary enters quantity × pressing rate + intake handling. Auto-generated waiver covers quality responsibility.

**Key decisions:**

- Simplest service type — no artwork processing, no gang sheets, no color decisions
- Garment sourcing toggle: customer-supplied vs. shop-sourced
- Intake QC workflow with test press step

### Customer Portal (P14)

Customer-facing portal for artwork approval, job status, invoice payment, and order history.

**User story**: Coach Johnson receives an artwork approval request, logs into the portal (branded as `orders.4inkprint.com`), approves two files, rejects one with feedback. Meanwhile, he checks order status and pays an invoice.

**Key decisions:**

- Same Supabase Auth instance with `customer` role — RLS enforces isolation
- Persistent login over URL-per-document — builds the relationship for repeat customers
- Per-artwork approval (approve front, reject back, independently)
- White-labeled by default — no "Powered by Mokumo" unless opted in
- Custom domain designed from M0, implemented last (M6)

### Online Stores (P16)

Shop-managed storefronts for schools, teams, and organizations.

**Scope**: Store creation, product selection with shop pricing, customer-facing storefront, order aggregation into production pipeline, payment collection.

> Explicitly Phase 3+ for full scope. Basic store-to-production flow is M4 if capacity allows.

## Related

- [M2: Quote-to-Cash](/roadmap/m2-quote-to-cash) — prerequisite: screen print pilot complete
- [M3: Operational Depth](/roadmap/m3-operational-depth) — settings and automations
- [M5: Analytics](/roadmap/m5-analytics) — business intelligence from production data
- [Roadmap Overview](/roadmap/overview) — full milestone map
