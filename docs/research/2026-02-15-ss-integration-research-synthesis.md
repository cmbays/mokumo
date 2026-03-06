---
title: 'S&S Activewear Integration — Research Synthesis'
description: 'Unified findings from 4 parallel research agents: Security, Industry Standards, Multi-Supplier Architecture, and Infrastructure Path'
date: 2026-02-15
phase: 2
vertical: infrastructure
stage: research
status: complete
---

# S&S Activewear Integration — Research Synthesis

## Executive Summary

Four parallel research agents investigated the full scope of integrating S&S Activewear's API into Mokumo. This document synthesizes their findings into actionable recommendations.

**The verdict**: Start with S&S REST API V2 (the easiest, richest data), introduce a Data Access Layer (DAL) immediately, build toward Supabase + Drizzle ORM as the production stack, and design for multi-supplier extensibility from day one.

**Estimated timeline**: 8-12 weeks for full backend migration (Phase 2). S&S API proxy can ship in ~1 week.

**Production cost**: $0 during development, ~$45/month in production (Supabase Pro + Vercel Pro).

---

## 1. S&S Activewear API Overview

### REST API V2 (Proprietary — Recommended Starting Point)

| Property       | Value                                                      |
| -------------- | ---------------------------------------------------------- |
| **Base URL**   | `https://api.ssactivewear.com/v2/`                         |
| **Auth**       | HTTP Basic (Account Number = username, API Key = password) |
| **Format**     | JSON (default) or XML via `?mediatype=json`                |
| **Rate Limit** | 60 requests/minute (`X-Rate-Limit-Remaining` header)       |

**Key endpoints**:

| Endpoint          | Purpose                                                         | Mokumo Use                      |
| ----------------- | --------------------------------------------------------------- | ----------------------------------------- |
| `/v2/styles/`     | Style-level catalog data                                        | Garment catalog browsing                  |
| `/v2/products/`   | Full SKU-level data (colors, sizes, pricing, images, inventory) | Garment selection, pricing, mockup images |
| `/v2/categories/` | Flat category list                                              | Filter/facet UI                           |
| `/v2/inventory/`  | Streamlined warehouse-level stock                               | Availability checks                       |
| `/v2/brands/`     | Brand listing                                                   | Filter UI                                 |

**Product image fields** (per color):

- `colorFrontImage`, `colorBackImage`, `colorSideImage`, `colorDirectSideImage`
- `colorOnModelFrontImage`, `colorOnModelSideImage`, `colorOnModelBackImage`
- `colorSwatchImage`
- URL pattern: `https://www.ssactivewear.com/{path}` with `_fs`/`_fm`/`_fl` size variants

**Pricing fields** (per SKU):

- `piecePrice`, `dozenPrice`, `casePrice`
- `mapPrice`, `salePrice`, `customerPrice` (account-specific)

### Schema Compatibility

The existing `garmentCatalogSchema` in `lib/schemas/garment.ts` was designed to mirror S&S data (line 3 comment confirms this). The field mapping is near 1:1:

| Our Field         | S&S Field                 | Notes                        |
| ----------------- | ------------------------- | ---------------------------- |
| `brand`           | `brandName`               | Direct match                 |
| `sku`             | `partNumber`              | Direct match (e.g., "3001")  |
| `name`            | `styleName`               | Direct match                 |
| `baseCategory`    | `baseCategory`            | Direct match                 |
| `basePrice`       | `piecePrice`              | Needs pricing tier logic     |
| `availableColors` | Color objects per product | Needs extraction             |
| `availableSizes`  | Size objects per product  | Needs order/price adjustment |

---

## 2. Security Requirements (Must-Fix Before Go-Live)

### 4 Must-Fix Blockers

| #   | Blocker                            | Risk                                                                                 | Solution                                                                                                                   |
| --- | ---------------------------------- | ------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------- |
| 1   | **Endpoint Whitelisting**          | No generic proxy — open proxy = SSRF                                                 | Whitelist only `/v2/styles/`, `/v2/products/`, `/v2/categories/`, `/v2/inventory/`, `/v2/brands/`. Reject all other paths. |
| 2   | **Pricing Data Stripping**         | `customerPrice` is commercially sensitive                                            | Strip `customerPrice`, `mapPrice` fields from proxy responses. Only expose `piecePrice`, `dozenPrice`, `casePrice`.        |
| 3   | **Distributed Rate Limiting**      | In-memory rate limiting fails on Vercel serverless (cold starts, multiple instances) | Use Upstash Redis (`@upstash/ratelimit`) for distributed rate limiting.                                                    |
| 4   | **S&S Rate Limit Circuit Breaker** | Exceeding 60 req/min = account ban risk                                              | Read `X-Rate-Limit-Remaining` header, stop proxying when < 5 remaining, return 429 with `Retry-After`.                     |

### Additional Security Measures

- **Credential isolation**: S&S API key in `process.env.SS_API_KEY` and `SS_ACCOUNT_NUMBER`, never exposed to client
- **Response caching**: Cache S&S responses (styles: 24h, products: 1h, inventory: 5min) to reduce API calls
- **Error sanitization**: Never forward raw S&S error messages to client (may contain credential info)
- **Request validation**: Validate all query parameters with Zod before forwarding to S&S

---

## 3. Industry Standards & Multi-Supplier Landscape

### PromoStandards

PromoStandards is the **nonprofit industry standard** for the promotional products industry (200+ member organizations). It defines 11 SOAP/XML web services covering product data, media, pricing, inventory, ordering, and invoicing.

**All 3 major distributors support it:**

| Distributor        | Products | Key APIs                                       | REST?                                  |
| ------------------ | -------- | ---------------------------------------------- | -------------------------------------- |
| **S&S Activewear** | 4,959    | Product 2.0, MED 1.1, PPC 1.0, INV 2.0, PO 1.0 | **Yes** (proprietary + PromoStandards) |
| **SanMar**         | 2,917    | Product 2.0, MED 1.1, PPC 1.0, INV 2.0, PO 1.0 | No (SOAP only)                         |
| **alphabroder**    | 5,340    | Product 2.0, MED 1.1, PPC 1.0, INV 2.0, PO 1.0 | No (PromoStandards SOAP)               |

**Critical context**: S&S acquired alphabroder in October 2024. API convergence is likely but unannounced.

### Why S&S REST API First

- Modern JSON format (no SOAP/XML parsing)
- Richest data model (hex colors, 8 image types, warehouse-level inventory)
- 60 req/min rate limit is sufficient for single-shop use
- S&S + alphabroder merger means 2 of 3 major distributors under one API umbrella

### Universal Product Identifier

**GTIN (UPC barcode)** is the single most reliable cross-reference for identifying the same physical product across distributors. All three distributors expose GTIN per SKU. This is the key for deduplication when a brand (e.g., Gildan 5000) is sold by multiple distributors.

### Color Naming: No Universal Standard

Each distributor uses proprietary color names. Only S&S provides HTML hex codes (`color1`, `color2`). For multi-supplier, we'll need a color registry with fuzzy matching.

### How Competitors Handle This

Printavo, shopVOX, and DecoNetwork all build **direct proprietary integrations per supplier** (not PromoStandards-only). They normalize into internal data models — exactly the adapter pattern we're proposing.

### PSRESTful: REST Proxy for PromoStandards

When we need SanMar/other suppliers, **PSRESTful** (`psrestful.com`) provides a REST/JSON proxy over SOAP endpoints for 430+ suppliers. Pricing: Free (10 calls/day), Standard ($99.99/mo), Premium ($299.99/mo). Alternative: `promostandards-sdk-js` npm package for direct SOAP consumption.

---

## 4. Multi-Supplier Architecture

### SupplierAdapter Interface

```typescript
interface SupplierAdapter {
  readonly supplierId: string
  readonly name: string

  getStyle(styleId: string): Promise<CanonicalStyle>
  searchCatalog(params: CatalogSearchParams): Promise<CatalogSearchResult>
  getInventory(skuIds: string[]): Promise<InventoryResult[]>
  getStylesBatch(styleIds: string[]): Promise<CanonicalStyle[]>
  getBrands(): Promise<Brand[]>
  getCategories(): Promise<Category[]>
  healthCheck(): Promise<HealthStatus>
}
```

### CanonicalStyle Schema

A normalized product representation that maps from any supplier:

```typescript
interface CanonicalStyle {
  id: string // Internal UUID
  supplierId: string // Which supplier
  sourceStyleId: string // Supplier's style ID
  gtin?: string // Universal cross-reference
  brand: string
  styleName: string
  styleNumber: string
  description: string
  categories: string[]
  colors: CanonicalColor[]
  sizes: CanonicalSize[]
  images: CanonicalImage[]
  pricing: CanonicalPricing
  lastSynced: Date
}
```

### Adapter Implementations

| Adapter                 | Data Source        | Phase             |
| ----------------------- | ------------------ | ----------------- |
| `MockAdapter`           | `lib/mock-data.ts` | Phase 1 (current) |
| `SSActivewearAdapter`   | S&S REST API V2    | Phase 2           |
| `PromoStandardsAdapter` | PSRESTful or SOAP  | Phase 3           |

### Cache Strategy

```typescript
interface CacheStore {
  get<T>(key: string): Promise<T | null>
  set<T>(key: string, value: T, ttl: number): Promise<void>
  delete(key: string): Promise<void>
}
```

| Data Type         | TTL       | Rationale                   |
| ----------------- | --------- | --------------------------- |
| Styles/catalog    | 24 hours  | Product data changes rarely |
| Product details   | 1 hour    | Price/color updates         |
| Inventory         | 5 minutes | Stock levels are volatile   |
| Categories/brands | 7 days    | Reference data              |

**Implementation**: Start with in-memory (for dev/testing), migrate to Upstash Redis for production (required for Vercel serverless).

---

## 5. Infrastructure: Demo to Production Path

### The Strangler Fig Migration

The strategy is to wrap the current mock data in an abstraction layer, then gradually replace the internals with real data sources — without changing any component code.

### Phase 1.5: Data Access Layer (DAL) — HIGHEST LEVERAGE

**The single most important action** is introducing `lib/dal/` between components and data.

```
BEFORE:  Component → import { jobs } from "@/lib/mock-data"
AFTER:   Component → import { getJobs } from "@/lib/dal/jobs"  → async mock passthrough
LATER:   Component → import { getJobs } from "@/lib/dal/jobs"  → Supabase query (same import!)
```

35+ files currently import directly from `@/lib/mock-data`. Every new feature adds more. The DAL creates the seam that makes everything else possible.

### Phase 2: Backend Foundation

**Recommended stack:**

| Layer            | Choice                                                                 | Rationale                                                               |
| ---------------- | ---------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| **Database**     | Supabase (PostgreSQL)                                                  | DB + Auth + Storage + Realtime in one. $0 dev, $25/mo prod.             |
| **ORM**          | Drizzle ORM                                                            | TypeScript-native, `drizzle-zod` generates Zod from tables, tiny bundle |
| **Auth**         | Supabase Auth                                                          | Native RLS integration, 50K MAU free, JWT claims in DB policies         |
| **File Storage** | Supabase Storage                                                       | 1GB free, native auth integration, CDN-backed URLs                      |
| **API Pattern**  | DAL functions + Server Components (reads) + Server Actions (mutations) | No new dependencies needed                                              |

**Why NOT tRPC**: Adds dependency + learning curve. Benefits (type safety, middleware) already provided by Zod schemas + DAL. Not worth it for a single-user app.

**Why NOT Server Actions alone**: All Server Actions are POST requests — can't leverage Next.js caching for reads. DAL works with both Server Components (reads) and Server Actions (writes).

### Schema Migration Strategy: Zod → Drizzle

1. Create Drizzle table definitions that match existing Zod schemas (one-time, 15 schemas)
2. Nested objects (contacts[], groups[], addresses[]) become normalized tables with FKs
3. Zod schemas remain the validation/API boundary; Drizzle schemas define the DB
4. DAL reassembles normalized DB rows into Zod-typed objects

### Entity Migration Order

```
Step 0: DAL Introduction (mock passthrough)
Step 1: Supabase project setup
Step 2: Auth foundation (demo user preserved)
Step 3: Reference data (Color, Garment, MockupTemplate)
Step 4: Customer (most complex normalization — template for all others)
Step 5: Note, Artwork (simple FKs)
Step 6: Quote + line items
Step 7: Job + tasks + notes + history (most complex entity)
Step 8: Screen
Step 9: Invoice + payments + credit memos (financial precision)
Step 10: Pricing templates (keep as JSONB)
```

### Cost Analysis

| Environment | Stack                          | Monthly Cost                    |
| ----------- | ------------------------------ | ------------------------------- |
| Development | Supabase Free + Vercel Hobby   | **$0**                          |
| Production  | Supabase Pro + Vercel Pro      | **~$45**                        |
| Alternative | Vercel Postgres + Blob + Clerk | ~$45+ (3 vendors, 3 dashboards) |

---

## 6. Decision Matrix

### Must Decide NOW (Expensive to Change Later)

| Decision                      | Recommendation                              | Why Now                                                                 |
| ----------------------------- | ------------------------------------------- | ----------------------------------------------------------------------- |
| **DAL abstraction**           | Introduce immediately                       | Every new feature that imports `mock-data` directly adds migration debt |
| **Database platform**         | Supabase                                    | Different SQL dialects, auth models, client patterns across platforms   |
| **ORM**                       | Drizzle                                     | Schema definitions are ORM-specific                                     |
| **Nested data normalization** | Contacts/groups/addresses → separate tables | Embedded arrays don't map to relational tables                          |

### Can Safely Defer

| Decision                  | When                      |
| ------------------------- | ------------------------- |
| Real-time subscriptions   | Phase 3 (multi-user)      |
| Multi-user auth / RLS     | Phase 3                   |
| File storage provider     | Phase 2b (artwork upload) |
| Error monitoring (Sentry) | Phase 2c or 3             |
| PWA / Service Worker      | Phase 3                   |
| Native mobile             | Phase 4                   |

### Explicitly Do NOT Introduce

- Redux/Zustand/global state
- GraphQL
- Microservices
- Separate API server (Express/Fastify)

---

## 7. Immediate Next Steps (Pre-API-Key)

These can all begin before receiving the S&S API credentials:

| #   | Task                                                         | Effort       | Blocks                  |
| --- | ------------------------------------------------------------ | ------------ | ----------------------- |
| 1   | **Create `lib/dal/`** with mock passthrough for all entities | M (2-3 days) | Nothing — can start now |
| 2   | **Update 35+ files** to import from DAL instead of mock-data | M (2-3 days) | Task 1                  |
| 3   | **Design SupplierAdapter interface** + MockAdapter           | S (1 day)    | Nothing                 |
| 4   | **Define Next.js Route Handler structure** for S&S proxy     | S (1 day)    | Nothing                 |
| 5   | **Set up Upstash Redis** for distributed rate limiting       | S (half day) | Nothing                 |

### Post-API-Key

| #   | Task                                                           | Effort       | Blocks           |
| --- | -------------------------------------------------------------- | ------------ | ---------------- |
| 6   | **Build SSActivewearAdapter** with endpoint whitelisting       | M (2-3 days) | API key + Task 3 |
| 7   | **Wire catalog browsing** to real S&S data                     | M (2-3 days) | Task 6           |
| 8   | **Replace mockup engine tinting** with real S&S product photos | M (2-3 days) | Task 6           |
| 9   | **Add inventory availability** to garment selection            | S (1-2 days) | Task 6           |
| 10  | **Build cache layer** (Upstash Redis)                          | M (2-3 days) | Task 5 + Task 6  |

---

## 8. Key Documentation Links

### S&S Activewear

- [REST API V2 Documentation](https://api.ssactivewear.com/V2/Default.aspx)
- [Products Endpoint](https://api.ssactivewear.com/V2/Products.aspx)
- [Styles Endpoint](https://api.ssactivewear.com/v2/Styles.aspx)
- [Categories Endpoint](https://api.ssactivewear.com/V2/Categories.aspx)
- [Inventory Endpoint](https://api.ssactivewear.com/V2/Inventory.aspx)

### PromoStandards

- [PromoStandards.org](https://promostandards.org/)
- [Endpoint Directory](https://promostandards.org/standards-endpoints/)
- [PSRESTful REST Proxy](https://psrestful.com/)
- [promostandards-sdk-js](https://www.npmjs.com/package/promostandards-sdk-js)

### Production Stack

- [Supabase + Next.js Quickstart](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs)
- [Supabase Server-Side Auth for Next.js](https://supabase.com/docs/guides/auth/server-side/nextjs)
- [Drizzle ORM + Zod](https://orm.drizzle.team/docs/zod)
- [Next.js Data Access Layer Pattern](https://nextjs.org/docs/app/guides/data-security)
- [Upstash Rate Limiting](https://upstash.com/docs/oss/sdks/ts/ratelimit/overview)

---

## Research Agents

| Agent                    | Focus                   | Key Finding                                                                                                                                   |
| ------------------------ | ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Security Researcher      | API proxy hardening     | 4 must-fix blockers before go-live (whitelisting, pricing stripping, distributed rate limiting, circuit breaker)                              |
| Standards Researcher     | Industry standards      | PromoStandards is universal (SOAP/XML), S&S REST is easiest start, GTIN is the universal product key, competitors build per-supplier adapters |
| Architecture Researcher  | Multi-supplier design   | SupplierAdapter interface, CanonicalStyle schema, CacheStore abstraction, MockAdapter for backward compatibility                              |
| Infrastructure Architect | Demo-to-production path | DAL pattern is highest leverage, Supabase + Drizzle is optimal stack, ~$45/mo production cost, 8-12 weeks migration                           |
