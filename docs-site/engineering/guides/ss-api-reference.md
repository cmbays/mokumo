---
title: 'S&S Activewear API Reference (for Mock Data Alignment)'
description: 'Key API fields from S&S Activewear that our mock data should mirror for Phase 2 readiness'
category: reference
status: complete
phase: 1
created: 2026-02-08
last-verified: 2026-02-08
source: https://api.ssactivewear.com/V2/Products.aspx
---

# S&S Activewear API Reference

**Purpose**: Document the S&S Activewear API field structure so our Phase 1 mock data mirrors real API shapes. This ensures Phase 2 integration is a data source swap, not a refactor.

**API Base**: `https://api.ssactivewear.com/v2/`
**Auth**: Basic HTTP (Account Number + API Key)
**Rate Limit**: 60 requests/min
**Inventory Update Frequency**: Every 15 minutes
**Product Data Update**: Nightly

---

## Key Endpoints

| Endpoint                               | Purpose                             |
| -------------------------------------- | ----------------------------------- |
| `GET /v2/products/`                    | All products (SKU-level)            |
| `GET /v2/products/?style={partNumber}` | Filter by style (e.g., "3001")      |
| `GET /v2/products/?styleid={id}`       | Filter by style ID                  |
| `GET /v2/styles/`                      | Style-level data (no SKU breakdown) |
| `GET /v2/categories/`                  | Product categories                  |
| `GET /v2/brands/`                      | Brand list                          |
| `GET /v2/inventory/`                   | Inventory levels                    |

---

## Product Fields We Should Mirror in Mock Data

### Style/Garment Identification

```typescript
// S&S API fields → Our mock data mapping
interface SSStyle {
  styleID: number // → garment.id (unique style identifier)
  brandName: string // → garment.brand (e.g., "Bella+Canvas")
  styleName: string // → garment.name (e.g., "Unisex Jersey Short Sleeve")
  partNumber: string // → garment.sku (e.g., "3001")
  // Composite display: "Bella+Canvas 3001 — Unisex Jersey Short Sleeve"
}
```

### Color Fields (Critical for ColorSwatchPicker)

```typescript
interface SSColor {
  colorName: string // → "Black", "Athletic Heather"
  colorCode: string // → "01" (two-digit code)
  color1: string // → "#000000" (primary hex — swatch background)
  color2: string // → "#333333" (secondary hex — for heather/two-tone)
  colorSwatchTextColor: string // → "#FFFFFF" or "#000000" (text overlay color!)
  colorFamily: string // → "Black" (base color family for filtering)
  colorFamilyID: number // → grouping ID
  colorGroup: string // → similar color grouping
  colorGroupName: string // → group label
  colorPriceCodeName: string // → pricing category (some colors cost more)
  colorSwatchImage: string // → URL to swatch image (_fm = medium, _fl = large, _fs = small)
  colorFrontImage: string // → URL to front product image
  colorSideImage: string // → URL to side view
  colorBackImage: string // → URL to back view
}
```

**Key insight**: `colorSwatchTextColor` is the exact field that tells us whether to render white or dark text on each swatch. S&S already solved this problem — we should use the same approach.

### Size Fields

```typescript
interface SSSize {
  sizeName: string // → "S", "M", "L", "XL", "2XL"
  sizeCode: string // → single-digit code
  sizeOrder: string // → sort position (critical: ensures XS < S < M < L < XL)
  sizePriceCodeName: string // → pricing category (2XL+ often costs more)
}
```

### Pricing Fields

```typescript
interface SSPricing {
  piecePrice: number // → single unit price (e.g., $3.50)
  dozenPrice: number // → 12+ quantity price
  casePrice: number // → full case price
  caseQty: number // → units per case
  salePrice: number // → promotional price (if active)
  saleExpiration: string // → "MM/DD/YYYY"
  customerPrice: number // → account-specific negotiated price
  mapPrice: number // → minimum advertised price
}
```

**Pricing tier insight**: Our simplified formula should acknowledge that real pricing has tiers. For Phase 1, we can use `piecePrice` as the base and show the tier structure exists. Phase 2 will implement actual tier calculation.

### Inventory Fields

```typescript
interface SSInventory {
  qty: number // → total across all warehouses
  warehouses: SSWarehouse[] // → per-warehouse breakdown
}

interface SSWarehouse {
  warehouseAbbr: string // → "IL", "NV", "PA", "KS", "GA", "WA", "TX"
  qty: number // → available at this location
  closeout: boolean // → discontinued flag
  dropship: boolean // → drop-ship eligible
  fullCaseOnly: boolean // → case-only purchase required
}
```

---

## Mock Data Schema Recommendations

### Colors (for ColorSwatchPicker)

Our mock color data should use this shape:

```typescript
interface MockColor {
  id: string // unique identifier
  name: string // colorName from S&S
  hex: string // color1 from S&S (primary)
  hex2?: string // color2 from S&S (secondary, for heather)
  swatchTextColor: string // colorSwatchTextColor from S&S ("#FFFFFF" or "#000000")
  family: string // colorFamily from S&S (for filtering)
  isFavorite?: boolean // local preference (not from S&S)
}
```

### Garments (for garment selector)

```typescript
interface MockGarment {
  id: string
  brand: string // brandName
  sku: string // partNumber (e.g., "3001")
  name: string // styleName
  basePrice: number // piecePrice
  availableColors: string[] // array of color IDs
  availableSizes: MockSize[]
}

interface MockSize {
  name: string // sizeName
  order: number // sizeOrder (for sorting)
  priceAdjustment: number // 0 for S-XL, +$2 for 2XL+
}
```

### Quote Line Items

```typescript
interface MockLineItem {
  garmentId: string
  colorId: string
  sizes: Record<string, number> // { "S": 10, "M": 25, "L": 15 }
  printLocations: string[] // ["front", "back"]
  colorsPerLocation: number // default 1
  unitPrice: number // calculated
  lineTotal: number // unitPrice × totalQty
}
```

---

## What Print Life Uses from S&S

From our Playwright exploration, Print Life:

- Fetches product catalog (12+ products visible in grid)
- Shows color swatches per product (103 colors for Bella+Canvas 3001)
- Displays live stock levels per size/color combo
- Uses S&S pricing for base garment cost
- Integrates with S&S Activewear, SanMar, and Alphabroder

**Our Phase 1 mock data should include ~30-50 colors** (realistic subset) with proper hex values, text colors, and family groupings. This makes the swatch grid feel authentic even with mock data.

---

## SanMar API (Secondary Supplier)

SanMar uses SOAP-based web services (not REST). Key differences:

- Uses `inventory_key` as unique identifier (style + color + size combo)
- Inventory via `sanmar_dip.txt` file (updated hourly)
- Product search by style, color, and/or size combination

**Phase 2 consideration**: Support multiple suppliers. Data normalization layer to unify S&S REST and SanMar SOAP responses into common schema.

---

## Related Documents

- `docs/strategy/quoting-scope-definition.md` (mock data requirements)
- `lib/schemas/garment.ts` (current Zod schema — needs updating)
- `lib/mock-data.ts` (current mock data — needs expanding)
- `CLAUDE.md` (coding standards, Zod-first types)
