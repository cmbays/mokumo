---
title: Domain Glossary
description: Print shop terminology and domain concepts used throughout Mokumo.
---

# Domain Glossary

> Reference for domain language used in code, documentation, and conversation. Terms are grouped by domain area.

---

## Business Entities

| Term         | Definition                                                                                            |
| ------------ | ----------------------------------------------------------------------------------------------------- |
| **Shop**     | The print business (4Ink). Single-tenant — one shop per deployment.                                   |
| **Customer** | A person or company who orders printed goods. May have contacts, addresses, and artwork.              |
| **Contact**  | An individual person associated with a customer company.                                              |
| **Quote**    | A priced proposal for a print job. Contains line items, garment selections, and pricing calculations. |
| **Job**      | An accepted quote in production. Moves through lanes on the production board.                         |
| **Invoice**  | A bill generated from a completed job. Tracks payment status.                                         |

---

## Garments & Catalog

| Term               | Definition                                                                                               |
| ------------------ | -------------------------------------------------------------------------------------------------------- |
| **Style**          | A garment model (e.g., Gildan 5000). Identified by style number. Has multiple colors.                    |
| **Color Group**    | A named color variant of a style (e.g., "Forest Green"). Contains size availability.                     |
| **Color Family**   | Industry-standard grouping (e.g., "Greens"). 15 families from S&S Activewear.                            |
| **SKU**            | A specific style + color + size combination. The atomic ordering unit.                                   |
| **Size Breakdown** | A record of quantities per size (e.g., `{ S: 10, M: 25, L: 15 }`).                                       |
| **Catalog Sync**   | Background process that pulls garment data from supplier APIs into local tables.                         |
| **Shop Curation**  | `is_enabled` / `is_favorite` flags that let the shop owner filter the full catalog to their working set. |

---

## Decoration Methods

| Term                     | Definition                                                                         |
| ------------------------ | ---------------------------------------------------------------------------------- |
| **Screen Printing**      | Traditional ink-on-garment via burned screens. Most complex production pipeline.   |
| **DTF (Direct to Film)** | Transfers printed on film, then heat-pressed onto garments. Uses gang sheets.      |
| **DTF Press**            | Shop presses customer-supplied DTF transfers. Simplest flow — no art or film work. |
| **Service Type**         | The decoration method for a job. Determines which task template auto-populates.    |

---

## Production

| Term               | Definition                                                                                       |
| ------------------ | ------------------------------------------------------------------------------------------------ |
| **Lane**           | A column on the production board. Universal: Ready, In Progress, Review, Blocked, Done.          |
| **Task**           | A checklist item within a job. Service-type-specific (e.g., "Burn screens" for screen printing). |
| **Task Template**  | Canonical task list for a service type. Auto-populates when a job is created.                    |
| **Print Location** | Where decoration goes on a garment (front, back, left chest, sleeve, etc.).                      |
| **Color Count**    | Number of ink colors in a design. Drives screen printing pricing.                                |
| **Gang Sheet**     | A layout sheet combining multiple transfer designs to minimize waste (DTF).                      |

---

## Screen Room

| Term           | Definition                                                                             |
| -------------- | -------------------------------------------------------------------------------------- |
| **Screen**     | A mesh frame with emulsion used to transfer ink. Linked to specific jobs.              |
| **Mesh Count** | Thread density of the screen mesh. Higher = finer detail, lower = heavier ink deposit. |
| **Emulsion**   | Light-sensitive coating applied to screens. Hardens when exposed to UV light.          |
| **Burn**       | Exposing a coated screen to UV through a film positive, creating the stencil.          |
| **Reclaim**    | Cleaning a screen for reuse — removing ink, emulsion, and ghost images.                |

---

## Pricing

| Term               | Definition                                                                              |
| ------------------ | --------------------------------------------------------------------------------------- |
| **Pricing Matrix** | Configurable per-service-type pricing. Maps quantity breaks × color count → unit price. |
| **Quantity Break** | Price tier based on total garment count (e.g., 1-11, 12-35, 36-71, 72+).                |
| **Setup Fee**      | One-time charge per print location (covers screen making, setup time).                  |
| **Markup**         | Percentage applied above garment cost. Varies by customer tier or pricing template.     |
| **Garment Cost**   | Wholesale price from supplier. Varies by quantity tier.                                 |

---

## Suppliers

| Term                 | Definition                                                                    |
| -------------------- | ----------------------------------------------------------------------------- |
| **S&S Activewear**   | Primary garment supplier. REST V2 API, Basic Auth, 60 req/min.                |
| **SanMar**           | Second major supplier (future integration). PromoStandards-compatible.        |
| **PromoStandards**   | Industry SOAP/XML standard for supplier data exchange.                        |
| **GTIN / UPC**       | Universal product identifier. Cross-references garments across suppliers.     |
| **Supplier Adapter** | Code pattern that normalizes different supplier APIs into a common interface. |

---

## Infrastructure

| Term               | Definition                                                                               |
| ------------------ | ---------------------------------------------------------------------------------------- |
| **Composite PK**   | `(source, external_id)` pattern for multi-supplier readiness. Avoids ID collisions.      |
| **DAL**            | Data Access Layer. Repository pattern with port interfaces and provider implementations. |
| **RLS**            | Row-Level Security (Supabase). Database-enforced access control per user/shop.           |
| **Server Action**  | Next.js mutation function that runs on the server. Used for all write operations.        |
| **Vertical Slice** | A complete feature from UI to API to database. Ships a user-visible capability.          |

---

## Related Documents

- [Product Design](/product/product-design) — scope and constraints
- [Tech Stack](/engineering/architecture/tech-stack) — tool choices
- [User Journeys](/product/user-journeys) — how terms map to user actions
