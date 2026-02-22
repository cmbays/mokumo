# Catalog Schema Normalization + Real Product Images

**Date**: 2026-02-19
**Issue**: #164 — Replace mockup tinting with real S&S product photos
**Parent Epic**: #140 — Garment catalog: supplier API integration
**Status**: Design approved, implementation complete (PR #558)

---

## Problem Statement

The current `catalog` table is a denormalized blob:

- `availableColors` and `availableSizes` are JSONB arrays — no relational structure
- Colors lose their hex codes and images during sync (mapped to name strings only)
- The `id` column is the S&S `styleID` string — breaks when a second supplier is added
- `is_enabled` and `is_favorite` are mixed with supplier data — gets overwritten on re-sync
- No `source` column — tech debt flagged in #550

The `GarmentMockup` component uses SVG `feColorMatrix` tinting (a single white template + color filter) rather than real product photos. Issue #164 replaces this with actual S&S CDN images.

---

## Design Decisions

| Decision            | Choice                                | Rationale                                                             |
| ------------------- | ------------------------------------- | --------------------------------------------------------------------- |
| Schema approach     | Full normalization (7 tables)         | Extensible to multi-supplier, color-first flows, preferences, pricing |
| Old `catalog` table | Archived as `catalog_archived`        | Safety net for one sprint, then dropped                               |
| PK type             | `gen_random_uuid()`                   | Globally unique, no supplier lock-in                                  |
| Supplier identity   | `UNIQUE(source, external_id)`         | Multi-supplier upsert key — resolves #550                             |
| Image serving       | `next/image` proxy + S&S CDN          | Edge caching, resizing, WebP — no storage overhead                    |
| Image storage       | One row per image type per color      | Normalized; all 8 S&S types preserved                                 |
| Category taxonomy   | 12-value enum + raw `subcategory`     | Enum drives business logic; subcategory is display-only               |
| Preferences         | Separate table, lazy creation         | Clean separation of external data vs. shop logic                      |
| Brands              | Canonical table + source bridge       | One Gildan row regardless of how many suppliers carry it              |
| Pricing             | **Deferred** — separate future sprint | Dynamic, account-specific; separate from static catalog               |

---

## Category Taxonomy

**12-value canonical enum** (`garment_category`):

```text
t-shirts, polos, fleece, knits-layering, outerwear, pants,
shorts, headwear, activewear, accessories, wovens, other
```

- `other` replaces the current silent fallback to `t-shirts` for unknown categories
- `subcategory` column stores the raw S&S string after `-` (e.g. `"Quarter Zip"`, `"Premium"`)

---

## Schema: 7 Tables

### `catalog_brands` — canonical brand entities

```sql
id              uuid PK DEFAULT gen_random_uuid()
canonical_name  varchar(255) NOT NULL UNIQUE   -- "Gildan", "Bella+Canvas"
is_active       boolean NOT NULL DEFAULT true
created_at      timestamptz NOT NULL DEFAULT now()
updated_at      timestamptz NOT NULL DEFAULT now()
```

### `catalog_brand_sources` — supplier → canonical brand bridge

```sql
id             uuid PK DEFAULT gen_random_uuid()
brand_id       uuid NOT NULL REFERENCES catalog_brands(id)
source         varchar(50) NOT NULL              -- 'ss-activewear', 'sanmar'
external_id    varchar(100) NOT NULL             -- supplier's brand code
external_name  varchar(255)                      -- how supplier spells it
UNIQUE(source, external_id)
created_at     timestamptz NOT NULL DEFAULT now()
updated_at     timestamptz NOT NULL DEFAULT now()
```

### `catalog_styles` — one per style

```sql
id              uuid PK DEFAULT gen_random_uuid()
source          varchar(50) NOT NULL              -- 'ss-activewear'
external_id     varchar(100) NOT NULL             -- S&S styleID
UNIQUE(source, external_id)
brand_id        uuid NOT NULL REFERENCES catalog_brands(id)
style_number    varchar(100) NOT NULL             -- partNumber "BC3001"
name            varchar(500) NOT NULL
description     text
category        garment_category NOT NULL         -- 12-value enum
subcategory     varchar(100)                      -- raw subcategory, nullable
gtin            varchar(20)                       -- UPC cross-reference
piece_price     numeric(10,2)                     -- S&S piecePrice (supplier cost)
dozen_price     numeric(10,2)
case_price      numeric(10,2)
last_synced_at  timestamptz
created_at      timestamptz NOT NULL DEFAULT now()
updated_at      timestamptz NOT NULL DEFAULT now()
```

> Note: Pricing columns stay here for now as supplier-sourced reference data.
> `shop_pricing_overrides` (future sprint) handles markups and customer pricing.

### `catalog_colors` — one per color per style

```sql
id        uuid PK DEFAULT gen_random_uuid()
style_id  uuid NOT NULL REFERENCES catalog_styles(id) ON DELETE CASCADE
name      varchar(100) NOT NULL             -- "Athletic Heather"
hex1      varchar(7)                        -- #RRGGBB primary
hex2      varchar(7)                        -- #RRGGBB secondary (two-tone/heather)
UNIQUE(style_id, name)
created_at  timestamptz NOT NULL DEFAULT now()
updated_at  timestamptz NOT NULL DEFAULT now()
```

### `catalog_images` — one per image type per color

```sql
id          uuid PK DEFAULT gen_random_uuid()
color_id    uuid NOT NULL REFERENCES catalog_colors(id) ON DELETE CASCADE
image_type  catalog_image_type NOT NULL   -- 8-value enum (see below)
url         varchar(1024) NOT NULL         -- S&S CDN URL, served via next/image
UNIQUE(color_id, image_type)
created_at  timestamptz NOT NULL DEFAULT now()
updated_at  timestamptz NOT NULL DEFAULT now()
```

**`catalog_image_type` enum (8 values):**
`front, back, side, direct-side, on-model-front, on-model-back, on-model-side, swatch`

### `catalog_sizes` — one per size per style

```sql
id               uuid PK DEFAULT gen_random_uuid()
style_id         uuid NOT NULL REFERENCES catalog_styles(id) ON DELETE CASCADE
name             varchar(50) NOT NULL        -- "S", "3XL", "YS", etc.
sort_order       integer NOT NULL DEFAULT 0
price_adjustment numeric(10,2) NOT NULL DEFAULT 0
UNIQUE(style_id, name)
created_at  timestamptz NOT NULL DEFAULT now()
updated_at  timestamptz NOT NULL DEFAULT now()
```

### `catalog_style_preferences` — shop business logic (lazy creation)

```sql
id          uuid PK DEFAULT gen_random_uuid()
scope_type  varchar(20) NOT NULL    -- 'shop' now; 'brand'/'customer' future
scope_id    uuid NOT NULL           -- shop UUID (today: hardcoded shop_4ink UUID)
style_id    uuid NOT NULL REFERENCES catalog_styles(id)
is_enabled  boolean                 -- NULL = inherit from parent scope
is_favorite boolean                 -- NULL = inherit from parent scope
UNIQUE(scope_type, scope_id, style_id)
created_at  timestamptz NOT NULL DEFAULT now()
updated_at  timestamptz NOT NULL DEFAULT now()
```

**NULL = inherit** is the cascade mechanism. Missing row = fall up to shop default.
Shop default for `is_enabled`: `true`. Shop default for `is_favorite`: `false`.

---

## UI Changes

### GarmentCard (catalog browse)

- Replace `<GarmentMockup garmentCategory colorHex size="sm">` with real product photo
- Show `front` image for the currently selected/first color
- Image rendered via `next/image` with S&S domain whitelisted

### GarmentMockup (quote/job detail)

- When a real `front` image URL is available: render it as the base layer
- Artwork overlays continue to work on top of real photos
- Fallback: if no image URL, retain current SVG tinting behavior

### Hover image carousel (new)

- Front image shown by default in detail views
- Hover/focus reveals a small overlay strip: `front | back | on-model-front | swatch`
- Active type highlights; click switches the main image
- Mobile: tap to expand, swipe between types

---

## Migration Strategy (Approach C — additive + archive)

1. **Wave 0**: Add new tables alongside old `catalog`. No behavior change.
2. **Wave 1**: Run data migration: copy `catalog` rows → new tables.
3. **Wave 2**: Update catalog sync to write to new tables exclusively.
4. **Wave 3**: Update repository layer to query new tables.
5. **Wave 4**: Wire UI to real images.
6. **Wave 5**: Rename old `catalog` → `catalog_archived`. Drop after one sprint.

---

## Deferred Work (future sprints)

These are designed into the schema above but not implemented in this sprint:

| Feature                | Design Artifact                               | Notes                                                   |
| ---------------------- | --------------------------------------------- | ------------------------------------------------------- |
| Preferences cascade    | `catalog_style_preferences` scope_type column | Add brand/customer scope_type values + resolution logic |
| Color-level prefs      | Future `catalog_color_preferences`            | Same pattern as style prefs                             |
| Supplier pricing       | Future `catalog_supplier_pricing`             | Per-size pricing tiers, promotions, expiry              |
| Shop pricing overrides | Future `shop_pricing_overrides`               | Markups, customer-specific pricing hierarchy            |
| Shop UUID              | `scope_id` on preferences                     | Replace hardcoded `'shop_4ink'` string (resolves #550)  |
