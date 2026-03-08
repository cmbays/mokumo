---
title: Supplier Integration
description: Supplier API capabilities, multi-supplier architecture, and integration strategy for garment sourcing.
---

# Supplier Integration

> Research date: March 2026. Covers S&S Activewear (active), SanMar (planned), and PromoStandards (evaluated).

---

## Current State

Mokumo integrates with **S&S Activewear REST V2** for garment catalog data. The integration covers:

| Capability                              | Status | Endpoint                                     |
| --------------------------------------- | ------ | -------------------------------------------- |
| Product catalog (styles, colors, sizes) | Active | `GET /v2/styles/`, `GET /v2/products/`       |
| Product images                          | Active | `GET /v2/products/` (image URLs in response) |
| Pricing (piece, dozen, case, customer)  | Active | `GET /v2/products/` (pricing fields)         |
| Inventory (per-warehouse quantities)    | Active | `GET /v2/products/` (inventory fields)       |
| Color families                          | Active | `GET /v2/products/` (`colorFamily` field)    |

**Rate limit**: 60 requests/minute. `X-Rate-Limit-Remaining` header for feedback.

**Auth**: HTTP Basic Auth with S&S API credentials.

---

## S&S Activewear — Untapped Capabilities

The S&S API has a full order management surface we haven't integrated:

### Order Placement

`POST /v2/orders/` supports wholesale order placement with:

- Shipping address, line items (by SkuID/SKU/GTIN), shipping method (16+ carriers)
- Multi-warehouse fulfillment (automatic or specified)
- Partial fulfillment (proceeds on available items, notifies on shortages)
- Test orders (auto-created and cancelled)

**Response includes**: Order number, expected delivery date, line-item specifics, subtotal, shipping, tax, total.

**Order statuses**: `InProgress`, `Shipped`, `Completed` (will-call ready), `Canceled`.

### Tracking and Logistics

| Endpoint                 | Purpose                                                      |
| ------------------------ | ------------------------------------------------------------ |
| `GET /v2/trackingdata/`  | Shipment tracking for placed orders                          |
| `GET /v2/daysintransit/` | Delivery estimates by carrier and destination ZIP            |
| `GET /v2/orders/`        | Order history (last 3 months, filterable by PO/invoice/date) |

**Delivery statuses**: In Transit, Out For Delivery, Delivered, Exception, Expired, Pending, Unknown.

### Account and Billing

| Endpoint                   | Purpose                                   |
| -------------------------- | ----------------------------------------- |
| `GET /v2/paymentprofiles/` | Saved payment methods on the account      |
| `GET /v2/invoices/`        | S&S billing history and invoice documents |
| `PUT /v2/crossref/`        | Map internal SKUs to S&S SKU identifiers  |

### Pricing Fields

The Products endpoint returns multiple pricing tiers per SKU:

| Field           | Meaning                                          |
| --------------- | ------------------------------------------------ |
| `piecePrice`    | Standard single-unit price                       |
| `dozenPrice`    | Price at 12-unit quantity break                  |
| `casePrice`     | Price at case quantity (varies by style)         |
| `salePrice`     | Promotional price with `saleExpiration` date     |
| `mapPrice`      | Minimum Advertised Price floor                   |
| `customerPrice` | Account-specific contracted price ("your price") |

**`customerPrice`** reflects the shop's negotiated rate — this is the number that matters for margin calculations. Pricing tiers are account-negotiated through the S&S rep, not volume-based per order.

### Inventory Detail

Per-SKU inventory includes:

- `qty` — combined across all warehouses
- `warehouses[]` — per-warehouse breakdown with:
  - `warehouseAbbr`, `qty`, `closeout` (discontinuation flag)
  - `dropship`, `fullCaseOnly`
  - `expectedInventory` — incoming restock with expected dates

**`expectedInventory`** is valuable — shows when out-of-stock items will be available again.

### alphabroder Merger Impact

S&S acquired alphabroder (October 2024). Timeline:

- **March 2025**: S&S started supporting alphabroder API traffic through S&S endpoint
- **July 2025**: All alphabroder API traffic redirected to S&S. alphabroder brand retired (US).

**Impact for us**: No code changes needed. 100+ brands now accessible through existing S&S credentials, including former alphabroder-only brands (Under Armour and 40+ others).

**No V3 announcement** as of March 2026.

---

## SanMar — Integration Path

SanMar is the second major garment supplier. Their API is **SOAP-first** (no native REST).

### Available Services

| Service                     | Protocol | Purpose                                             |
| --------------------------- | -------- | --------------------------------------------------- |
| Product Information         | SOAP     | Catalog data, descriptions, GTINs                   |
| Pricing                     | SOAP     | Per-account pricing (piece/dozen/case/sale/myPrice) |
| Inventory (+ V2)            | SOAP     | Per-warehouse stock (capped at 500 per warehouse)   |
| Purchase Order              | SOAP     | Order placement                                     |
| Order/Shipment Notification | SOAP     | Order status and tracking                           |
| Invoice                     | SOAP     | Invoice retrieval                                   |
| Packing Slip                | SOAP     | Shipping documentation                              |

### API Access

Requires approval from SanMar's Integration Support team:

- Email: `sanmarintegrations@sanmar.com`
- Process: email request → e-sign agreement → credentials within 2-3 business days

### Data Model Comparison

| Dimension      | S&S Activewear                            | SanMar                                    |
| -------------- | ----------------------------------------- | ----------------------------------------- |
| Primary SKU ID | `skuId` (integer)                         | `inventoryKey` (numeric)                  |
| Pricing tiers  | piece / dozen / case / sale / customer    | piece / dozen / case / sale / myPrice     |
| Inventory cap  | No cap documented                         | 500 per warehouse                         |
| Color taxonomy | `colorFamily` + `colorGroupName` (3-tier) | Free-text color names only                |
| Image delivery | CDN URLs in API response                  | Data Library / FTP / PromoStandards Media |
| Bulk inventory | API polling only                          | FTP `sanmar_dip.txt` (hourly updates)     |
| Real-time push | None (poll-based)                         | None (poll-based)                         |
| Style numbers  | S&S internal numbering                    | SanMar internal numbering                 |

**Key difference**: SanMar has no `colorFamily` equivalent. Cross-supplier color matching by name is fragile ("Royal Blue" vs "True Navy"). GTIN is the only reliable deduplication key.

### Integration Options (Ranked)

| Option                  | Effort                                 | Cost                 | Supplier Coverage              |
| ----------------------- | -------------------------------------- | -------------------- | ------------------------------ |
| **PSRESTful proxy**     | Low — REST/JSON wrapper                | $100/year (Standard) | 554 suppliers including SanMar |
| **PromoStandards SOAP** | Medium — SOAP client + XML mapping     | $0                   | Any PS-compliant supplier      |
| **SanMar native SOAP**  | Medium — their specific WSDL endpoints | $0                   | SanMar only                    |

**Recommendation**: PSRESTful for fastest path to SanMar + multi-supplier. The $100/year cost is trivial and eliminates SOAP complexity entirely.

---

## PromoStandards

PromoStandards is a nonprofit standards body for the promotional products industry. Defines SOAP/XML web service specifications for supplier data exchange.

### Service Catalog

| Service                     | What It Covers                                           |
| --------------------------- | -------------------------------------------------------- |
| Product Data                | Full catalog: styles, colors, sizes, descriptions, specs |
| Media Content               | Product images and media assets                          |
| Pricing & Configuration     | Pricing tiers, decoration area config, price breaks      |
| Inventory                   | Per-SKU stock availability                               |
| Purchase Order              | Submit orders to suppliers                               |
| Order Status                | Track order progress                                     |
| Order Shipment Notification | Tracking and delivery updates                            |
| Invoice                     | Invoice retrieval                                        |

Both S&S and SanMar support nearly the full suite.

### PSRESTful — The REST Proxy

PSRESTful (psrestful.com) wraps PromoStandards SOAP in REST/JSON. 554 integrated suppliers.

| Tier     | Cost      | Calls/Day | Users |
| -------- | --------- | --------- | ----- |
| Free     | $0/month  | 10        | 1     |
| Standard | $100/year | 300       | 3     |
| Premium  | $300/year | Unlimited | 10    |

### What PromoStandards Does and Doesn't Solve

**Solves**: Per-supplier transport/protocol work. One integration → many suppliers.

**Doesn't solve**: Data semantics. Each supplier's style numbering, color naming, image formats, and size scales differ. You still need per-supplier data mapping for the canonical schema.

The existing `SSActivewearAdapter` pattern generalizes cleanly — a `PromoStandardsAdapter` would implement the same port interface.

---

## Multi-Supplier Architecture

### How Competitors Handle It

All competitors treat suppliers as **independent, parallel catalogs** with no cross-supplier deduplication:

- **Printavo**: Separate entries from S&S, SanMar, alphabroder, TSC. No GTIN matching.
- **InkSoft**: Live feeds from SanMar and S&S. "Recommended Products" filter curates picks. No dedup.
- **DecoNetwork**: 24+ supplier integrations. No documented cross-supplier deduplication.
- **YoPrint**: SanMar, alphabroder, S&S on Pro tier. Separate catalogs.

**Industry consensus**: Source-scoping (our `(source, external_id)` composite PK) aligns with how every competitor and the industry standard operates.

### GTIN Cross-Referencing

GTIN/UPC is the universal key. Assigned by the brand (Bella+Canvas), not the distributor. Same physical garment = same GTIN regardless of supplier.

**Availability**:

- S&S: `gtin` field in Products API response
- SanMar: `sanmar_pdd.txt` FTP file or `getProductInfoByStyle` SOAP call

**Caveat**: GTIN is not always populated (older styles, seasonal variants, data quality gaps). Fallback: `(brandName + styleNumber + colorName + sizeName)` with known fragility.

### Common Pitfalls

1. **Conflicting inventory** — same garment, different availability per supplier. Scoping to preferred supplier avoids misleading aggregation.
2. **Price discrepancies** — `customerPrice` at S&S is independent of `myPrice` at SanMar. Per-supplier credentials required for accurate comparison.
3. **Color naming fragility** — "Royal Blue" ≠ "True Navy." GTIN-level matching required for reliable dedup.
4. **Style number collisions** — not globally unique. `(source, external_id)` prevents this.
5. **Image format incompatibility** — different CDN structures, URL patterns, and image type conventions per supplier. Per-supplier adapters required.
6. **Polling frequency mismatches** — S&S: 60 req/min. SanMar: no hard limit but recommends conservative polling. FTP bulk files more efficient for full-catalog refresh.

---

## Integration Roadmap

```
Phase 2 (Current)  │ S&S catalog + pricing + inventory (active)
                    │ S&S customerPrice for margin calculations (next)
                    │ S&S expectedInventory for restock ETAs (next)
Future              │ SanMar via PSRESTful ($100/year)
                    │ S&S order placement (POST /v2/orders/)
                    │ S&S shipment tracking
                    │ GTIN cross-referencing for multi-supplier dedup
                    │ PromoStandards adapter for broader supplier coverage
```

---

## Related Documents

- [S&S API Reference](/engineering/guides/ss-api-reference) — existing API integration guide
- [Tech Stack](/engineering/architecture/tech-stack) — supplier adapter pattern
- [Infrastructure](/engineering/architecture/infrastructure) — cron/background job strategy
- [Roadmap Overview](/roadmap/overview) — Garments Catalog milestones
