# Catalog Schema Normalization + Real S&S Product Images

**Goal:** Replace the denormalized `catalog` JSONB table with 6 normalized tables, populate them from S&S API (preserving hex codes and all 8 image types), and replace the SVG tinting mockup in GarmentCard with real product photos.

**Architecture:** Approach C (additive + archive) — new tables live alongside old `catalog` during the sprint; a final migration renames `catalog` → `catalog_archived`. The sync service writes to new tables; the repository is updated to read from them. The old table provides a rollback safety net for one sprint.

**Tech Stack:** Drizzle ORM + Drizzle Kit (migrations), Supabase PostgreSQL, `next/image` proxy for S&S CDN, Zod domain schemas, React/Next.js App Router.

**Design doc:** `docs/workspace/adhoc-0219-catalog-normalization/design.md`

---

## Overview of Phases

| Phase                  | Tasks | Summary                                             |
| ---------------------- | ----- | --------------------------------------------------- |
| 1 — Category Taxonomy  | 1–2   | Expand enum to 12 values, fix silent fallback       |
| 2 — Drizzle Schema     | 3–4   | Define 6 new tables, generate + apply migration     |
| 3 — Domain Types       | 5     | New Zod types for normalized entities               |
| 4 — Catalog Sync       | 6–7   | Rewrite sync to write to new normalized tables      |
| 5 — next/image Proxy   | 8     | Allow S&S CDN domain in Next.js                     |
| 6 — Repository Layer   | 9     | New repository function returning rich catalog type |
| 7 — UI: GarmentCard    | 10    | Replace SVG mockup with real front image            |
| 8 — UI: GarmentMockup  | 11    | Add `imageUrl` prop + SVG fallback                  |
| 9 — UI: Hover Carousel | 12    | Image type strip (front/back/on-model/swatch)       |
| 10 — Archive           | 13    | Rename old `catalog` → `catalog_archived`           |

Tasks within each phase are sequential. Phases 5, 6, 7, 8, 9 can start once Phase 4 is merged.

---

## Task 1: Expand garment category enum to 12 values

**Files:**

- Modify: `src/domain/entities/garment.ts`
- Modify: `src/infrastructure/repositories/_providers/supplier/garments.ts`
- Modify: `src/app/(dashboard)/settings/pricing/_components/MatrixPreviewSelector.tsx`
- Test: `src/infrastructure/repositories/_providers/supplier/__tests__/garments.test.ts` (or find existing test file)

**Step 1: Find existing category mapping tests**

```bash
grep -r "canonicalCategoryToGarmentCategory\|CATEGORY_MAPPING\|garmentCategoryEnum" \
  src --include="*.test.ts" -l
```

Expected: one or more test files testing the category mapping function.

**Step 2: Add failing tests for new categories + `other` fallback**

Open the found test file and add:

```typescript
describe('canonicalCategoryToGarmentCategory — new categories', () => {
  it('maps "Accessories" to "accessories"', () => {
    expect(canonicalCategoryToGarmentCategory(['Accessories'])).toBe('accessories')
  })
  it('maps "Bags & Accessories" to "accessories"', () => {
    expect(canonicalCategoryToGarmentCategory(['Bags & Accessories'])).toBe('accessories')
  })
  it('maps "Wovens" to "wovens"', () => {
    expect(canonicalCategoryToGarmentCategory(['Wovens'])).toBe('wovens')
  })
  it('returns "other" for completely unknown categories instead of silently falling back to t-shirts', () => {
    expect(canonicalCategoryToGarmentCategory(['Socks'])).toBe('other')
  })
})
```

**Step 3: Run tests to verify they fail**

```bash
npx vitest run src/infrastructure/repositories/_providers/supplier/__tests__/
```

Expected: FAIL — `other` and `accessories` not in enum.

**Step 4: Update garment category enum in domain entity**

File: `src/domain/entities/garment.ts` — change:

```typescript
export const garmentCategoryEnum = z.enum([
  't-shirts',
  'polos',
  'fleece',
  'knits-layering',
  'outerwear',
  'pants',
  'shorts',
  'headwear',
  'activewear',
  'accessories',
  'wovens',
  'other',
])
```

**Step 5: Update CATEGORY_MAPPING and fix fallback**

File: `src/infrastructure/repositories/_providers/supplier/garments.ts`:

Add to `CATEGORY_MAPPING`:

```typescript
  // Accessories
  accessories: 'accessories',
  'bags-accessories': 'accessories',
  bags: 'accessories',
  // Wovens
  wovens: 'wovens',
  'woven-shirts': 'wovens',
```

Change `FALLBACK_GARMENT_CATEGORY`:

```typescript
const FALLBACK_GARMENT_CATEGORY: GarmentCategory = 'other'
```

**Step 6: Update UI label map in MatrixPreviewSelector**

File: `src/app/(dashboard)/settings/pricing/_components/MatrixPreviewSelector.tsx`:

```typescript
const garmentLabels: Record<GarmentCategory, string> = {
  't-shirts': 'T-Shirts',
  polos: 'Polos',
  fleece: 'Fleece',
  'knits-layering': 'Knits & Layering',
  outerwear: 'Outerwear',
  pants: 'Pants',
  shorts: 'Shorts',
  headwear: 'Headwear',
  activewear: 'Activewear',
  accessories: 'Accessories',
  wovens: 'Wovens',
  other: 'Other',
}
```

**Step 7: Run tests to verify they pass**

```bash
npx vitest run src/infrastructure/repositories/_providers/supplier/__tests__/
```

Expected: PASS all category tests.

**Step 8: Full test suite + type check**

```bash
npm test && npx tsc --noEmit
```

Expected: green.

**Step 9: Commit**

```bash
git add src/domain/entities/garment.ts \
  src/infrastructure/repositories/_providers/supplier/garments.ts \
  src/app/(dashboard)/settings/pricing/_components/MatrixPreviewSelector.tsx
git commit -m "feat(catalog): expand garment category enum to 12 values, fix fallback to 'other'"
```

---

## Task 2: Write 6 new Drizzle schema tables

**Files:**

- Create: `src/db/schema/catalog-normalized.ts`

**Step 1: Create the schema file**

```typescript
// src/db/schema/catalog-normalized.ts
import {
  pgTable,
  pgEnum,
  uuid,
  varchar,
  text,
  boolean,
  integer,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core'
import { numeric } from 'drizzle-orm/pg-core'

// ─── Enums ────────────────────────────────────────────────────────────────────

export const garmentCategoryPgEnum = pgEnum('garment_category', [
  't-shirts',
  'polos',
  'fleece',
  'knits-layering',
  'outerwear',
  'pants',
  'shorts',
  'headwear',
  'activewear',
  'accessories',
  'wovens',
  'other',
])

export const catalogImageTypePgEnum = pgEnum('catalog_image_type', [
  'front',
  'back',
  'side',
  'direct-side',
  'on-model-front',
  'on-model-back',
  'on-model-side',
  'swatch',
])

// ─── catalog_brands ───────────────────────────────────────────────────────────

export const catalogBrands = pgTable('catalog_brands', {
  id: uuid('id').primaryKey().defaultRandom(),
  canonicalName: varchar('canonical_name', { length: 255 }).notNull().unique(),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

// ─── catalog_brand_sources ────────────────────────────────────────────────────

export const catalogBrandSources = pgTable(
  'catalog_brand_sources',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    brandId: uuid('brand_id')
      .notNull()
      .references(() => catalogBrands.id),
    source: varchar('source', { length: 50 }).notNull(),
    externalId: varchar('external_id', { length: 100 }).notNull(),
    externalName: varchar('external_name', { length: 255 }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex('catalog_brand_sources_source_external_id_key').on(t.source, t.externalId)]
)

// ─── catalog_styles ───────────────────────────────────────────────────────────

export const catalogStyles = pgTable(
  'catalog_styles',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    source: varchar('source', { length: 50 }).notNull(),
    externalId: varchar('external_id', { length: 100 }).notNull(),
    brandId: uuid('brand_id')
      .notNull()
      .references(() => catalogBrands.id),
    styleNumber: varchar('style_number', { length: 100 }).notNull(),
    name: varchar('name', { length: 500 }).notNull(),
    description: text('description'),
    category: garmentCategoryPgEnum('category').notNull(),
    subcategory: varchar('subcategory', { length: 100 }),
    gtin: varchar('gtin', { length: 20 }),
    piecePrice: numeric('piece_price', { precision: 10, scale: 2, mode: 'number' }),
    dozenPrice: numeric('dozen_price', { precision: 10, scale: 2, mode: 'number' }),
    casePrice: numeric('case_price', { precision: 10, scale: 2, mode: 'number' }),
    lastSyncedAt: timestamp('last_synced_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex('catalog_styles_source_external_id_key').on(t.source, t.externalId)]
)

// ─── catalog_colors ───────────────────────────────────────────────────────────

export const catalogColors = pgTable(
  'catalog_colors',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    styleId: uuid('style_id')
      .notNull()
      .references(() => catalogStyles.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 100 }).notNull(),
    hex1: varchar('hex1', { length: 7 }),
    hex2: varchar('hex2', { length: 7 }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex('catalog_colors_style_id_name_key').on(t.styleId, t.name)]
)

// ─── catalog_images ───────────────────────────────────────────────────────────

export const catalogImages = pgTable(
  'catalog_images',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    colorId: uuid('color_id')
      .notNull()
      .references(() => catalogColors.id, { onDelete: 'cascade' }),
    imageType: catalogImageTypePgEnum('image_type').notNull(),
    url: varchar('url', { length: 1024 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex('catalog_images_color_id_image_type_key').on(t.colorId, t.imageType)]
)

// ─── catalog_sizes ────────────────────────────────────────────────────────────

export const catalogSizes = pgTable(
  'catalog_sizes',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    styleId: uuid('style_id')
      .notNull()
      .references(() => catalogStyles.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 50 }).notNull(),
    sortOrder: integer('sort_order').notNull().default(0),
    priceAdjustment: numeric('price_adjustment', {
      precision: 10,
      scale: 2,
      mode: 'number',
    })
      .notNull()
      .default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex('catalog_sizes_style_id_name_key').on(t.styleId, t.name)]
)

// ─── catalog_style_preferences ────────────────────────────────────────────────

export const catalogStylePreferences = pgTable(
  'catalog_style_preferences',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    scopeType: varchar('scope_type', { length: 20 }).notNull().default('shop'),
    scopeId: uuid('scope_id').notNull(),
    styleId: uuid('style_id')
      .notNull()
      .references(() => catalogStyles.id),
    isEnabled: boolean('is_enabled'),
    isFavorite: boolean('is_favorite'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('catalog_style_preferences_scope_type_scope_id_style_id_key').on(
      t.scopeType,
      t.scopeId,
      t.styleId
    ),
  ]
)
```

**Step 2: Export new tables from the db schema index**

Find and open `src/db/schema/index.ts` (or wherever schemas are re-exported). Add:

```typescript
export * from './catalog-normalized'
```

**Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

**Step 4: Commit**

```bash
git add src/db/schema/catalog-normalized.ts src/db/schema/index.ts
git commit -m "feat(schema): add 6 normalized catalog tables (brands, styles, colors, images, sizes, preferences)"
```

---

## Task 3: Generate and apply the database migration

**Step 1: Generate the SQL migration**

```bash
npm run db:generate
```

Expected: creates a new file in `supabase/migrations/` like `0006_catalog_normalized_tables.sql`.

**Step 2: Inspect the generated SQL**

Open the generated migration file and verify:

- Two `CREATE TYPE ... AS ENUM` for `garment_category` and `catalog_image_type`
- Seven `CREATE TABLE` statements (6 data tables + preferences)
- Correct `UNIQUE` constraints (compound keys on source+external_id etc.)
- `ON DELETE CASCADE` on `catalog_colors`, `catalog_images`, `catalog_sizes`

If there are issues, edit the Drizzle schema file and re-run `db:generate`.

**Step 3: Apply migration to local Supabase**

```bash
npm run db:migrate
```

Expected: migration applied with no errors.

**Step 4: Verify in Drizzle Studio**

```bash
npm run db:studio
```

Open browser, confirm the 7 new tables exist and the two new enums are visible.

**Step 5: Run CI check (drizzle drift)**

```bash
npx drizzle-kit check
```

Expected: no drift warnings.

**Step 6: Commit**

```bash
git add supabase/migrations/
git commit -m "migration: add normalized catalog tables and garment_category/catalog_image_type enums"
```

---

## Task 4: Write domain types for normalized catalog entities

**Files:**

- Create: `src/domain/entities/catalog-style.ts`

**Step 1: Write the failing test first**

Create `src/domain/entities/__tests__/catalog-style.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import {
  catalogColorSchema,
  catalogImageSchema,
  normalizedGarmentCatalogSchema,
} from '../catalog-style'

describe('catalogColorSchema', () => {
  it('accepts a color with images', () => {
    const result = catalogColorSchema.safeParse({
      id: '00000000-0000-4000-8000-000000000001',
      styleId: '00000000-0000-4000-8000-000000000002',
      name: 'Athletic Heather',
      hex1: '#9e9e9e',
      hex2: null,
      images: [{ imageType: 'front', url: 'https://www.ssactivewear.com/images/img.jpg' }],
    })
    expect(result.success).toBe(true)
  })
})

describe('normalizedGarmentCatalogSchema', () => {
  it('accepts a full normalized style', () => {
    const result = normalizedGarmentCatalogSchema.safeParse({
      id: '00000000-0000-4000-8000-000000000001',
      source: 'ss-activewear',
      externalId: '3001',
      brand: 'Bella+Canvas',
      styleNumber: 'BC3001',
      name: 'Unisex Jersey Short Sleeve Tee',
      description: '',
      category: 't-shirts',
      subcategory: null,
      piecePrice: 4.25,
      colors: [],
      sizes: [],
      isEnabled: true,
      isFavorite: false,
    })
    expect(result.success).toBe(true)
  })
})
```

**Step 2: Run test to verify it fails**

```bash
npx vitest run src/domain/entities/__tests__/catalog-style.test.ts
```

Expected: FAIL — module not found.

**Step 3: Create the domain types file**

```typescript
// src/domain/entities/catalog-style.ts
import { z } from 'zod'
import { garmentCategoryEnum } from './garment'

export const catalogImageSchema = z.object({
  imageType: z.enum([
    'front',
    'back',
    'side',
    'direct-side',
    'on-model-front',
    'on-model-back',
    'on-model-side',
    'swatch',
  ]),
  url: z.string().url(),
})

export type CatalogImage = z.infer<typeof catalogImageSchema>

export const catalogColorSchema = z.object({
  id: z.string().uuid(),
  styleId: z.string().uuid(),
  name: z.string().min(1),
  hex1: z.string().nullable(),
  hex2: z.string().nullable(),
  images: z.array(catalogImageSchema),
})

export type CatalogColor = z.infer<typeof catalogColorSchema>

export const catalogSizeSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  sortOrder: z.number().int().nonnegative(),
  priceAdjustment: z.number(),
})

export type CatalogSize = z.infer<typeof catalogSizeSchema>

/** Rich catalog style — styles joined with colors, images, and sizes. */
export const normalizedGarmentCatalogSchema = z.object({
  id: z.string().uuid(),
  source: z.string().min(1),
  externalId: z.string().min(1),
  brand: z.string().min(1),
  styleNumber: z.string().min(1),
  name: z.string().min(1),
  description: z.string().nullable(),
  category: garmentCategoryEnum,
  subcategory: z.string().nullable(),
  piecePrice: z.number().nonnegative().nullable(),
  colors: z.array(catalogColorSchema),
  sizes: z.array(catalogSizeSchema),
  /** Resolved from catalog_style_preferences — defaults: enabled=true, favorite=false */
  isEnabled: z.boolean(),
  isFavorite: z.boolean(),
})

export type NormalizedGarmentCatalog = z.infer<typeof normalizedGarmentCatalogSchema>
```

**Step 4: Run test to verify it passes**

```bash
npx vitest run src/domain/entities/__tests__/catalog-style.test.ts
```

Expected: PASS.

**Step 5: Full test suite**

```bash
npm test
```

Expected: green.

**Step 6: Commit**

```bash
git add src/domain/entities/catalog-style.ts src/domain/entities/__tests__/catalog-style.test.ts
git commit -m "feat(domain): add NormalizedGarmentCatalog type with colors + images"
```

---

## Task 5: Write normalized catalog sync helper functions

This task extracts the complex multi-table upsert logic into testable helper functions before wiring them into the sync service.

**Files:**

- Create: `src/infrastructure/services/catalog-sync-normalized.ts`

**Step 1: Write failing unit tests**

Create `src/infrastructure/services/__tests__/catalog-sync-normalized.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  extractSubcategory,
  extractBaseCategory,
  buildBrandUpsertValue,
  buildStyleUpsertValue,
} from '../catalog-sync-normalized'

describe('extractSubcategory', () => {
  it('extracts subcategory after " - " delimiter', () => {
    expect(extractSubcategory('T-Shirts - Premium')).toBe('Premium')
  })
  it('returns null when no delimiter', () => {
    expect(extractSubcategory('T-Shirts')).toBeNull()
  })
  it('returns null for empty string', () => {
    expect(extractSubcategory('')).toBeNull()
  })
})

describe('extractBaseCategory', () => {
  it('returns the string before " - "', () => {
    expect(extractBaseCategory('Fleece - Quarter Zip')).toBe('Fleece')
  })
  it('returns full string when no delimiter', () => {
    expect(extractBaseCategory('Headwear')).toBe('Headwear')
  })
})

describe('buildBrandUpsertValue', () => {
  it('creates a brand upsert value', () => {
    const val = buildBrandUpsertValue('Bella+Canvas')
    expect(val.canonicalName).toBe('Bella+Canvas')
    expect(val.isActive).toBe(true)
  })
})

describe('buildStyleUpsertValue', () => {
  it('creates a style upsert value from a CanonicalStyle', () => {
    const style = {
      supplierId: '3001',
      styleNumber: 'BC3001',
      styleName: 'Unisex Jersey Tee',
      brand: 'Bella+Canvas',
      description: '',
      categories: ['T-Shirts - Premium'],
      colors: [],
      sizes: [],
      pricing: { piecePrice: 4.25, dozenPrice: null, casePrice: null },
      gtin: null,
      supplier: 'ss-activewear' as const,
    }
    const brandId = '00000000-0000-4000-8000-000000000001'
    const val = buildStyleUpsertValue(style, brandId, 'ss-activewear')
    expect(val.externalId).toBe('3001')
    expect(val.source).toBe('ss-activewear')
    expect(val.brandId).toBe(brandId)
    expect(val.category).toBe('t-shirts')
    expect(val.subcategory).toBe('Premium')
    expect(val.piecePrice).toBe(4.25)
  })
})
```

**Step 2: Run test to verify it fails**

```bash
npx vitest run src/infrastructure/services/__tests__/catalog-sync-normalized.test.ts
```

Expected: FAIL — module not found.

**Step 3: Implement the helper module**

```typescript
// src/infrastructure/services/catalog-sync-normalized.ts
import 'server-only'
import type { CanonicalStyle } from 'lib/suppliers/types'
import { canonicalCategoryToGarmentCategory } from '@infra/repositories/_providers/supplier/garments'

/** Extract the raw subcategory string after " - " delimiter. Returns null if absent. */
export function extractSubcategory(category: string): string | null {
  const parts = category.split(' - ')
  return parts.length > 1 ? (parts[1]?.trim() ?? null) : null
}

/** Extract the base category string before " - " delimiter. */
export function extractBaseCategory(category: string): string {
  return category.split(' - ')[0] ?? category
}

/** Build the value object for a brand upsert. */
export function buildBrandUpsertValue(canonicalName: string) {
  return {
    canonicalName,
    isActive: true,
    updatedAt: new Date(),
  }
}

/** Build the value object for a style upsert. */
export function buildStyleUpsertValue(style: CanonicalStyle, brandId: string, source: string) {
  const primaryCategory = style.categories[0] ?? ''
  const subcategory = extractSubcategory(primaryCategory)

  return {
    source,
    externalId: style.supplierId,
    brandId,
    styleNumber: style.styleNumber,
    name: style.styleName,
    description: style.description || null,
    category: canonicalCategoryToGarmentCategory(style.categories),
    subcategory,
    gtin: style.gtin,
    piecePrice: style.pricing.piecePrice ?? null,
    dozenPrice: style.pricing.dozenPrice ?? null,
    casePrice: style.pricing.casePrice ?? null,
    lastSyncedAt: new Date(),
    updatedAt: new Date(),
  }
}

/** Build color upsert value for catalog_colors. */
export function buildColorUpsertValue(styleId: string, color: CanonicalStyle['colors'][number]) {
  return {
    styleId,
    name: color.name,
    hex1: color.hex1,
    hex2: color.hex2,
    updatedAt: new Date(),
  }
}

/** Build image upsert value for catalog_images. */
export function buildImageUpsertValue(
  colorId: string,
  image: CanonicalStyle['colors'][number]['images'][number]
) {
  return {
    colorId,
    imageType: image.type,
    url: image.url,
    updatedAt: new Date(),
  }
}

/** Build size upsert value for catalog_sizes. */
export function buildSizeUpsertValue(styleId: string, size: CanonicalStyle['sizes'][number]) {
  return {
    styleId,
    name: size.name,
    sortOrder: size.sortOrder,
    priceAdjustment: size.priceAdjustment,
    updatedAt: new Date(),
  }
}
```

**Step 4: Run tests to verify they pass**

```bash
npx vitest run src/infrastructure/services/__tests__/catalog-sync-normalized.test.ts
```

Expected: PASS.

**Step 5: Full test suite**

```bash
npm test
```

Expected: green.

**Step 6: Commit**

```bash
git add src/infrastructure/services/catalog-sync-normalized.ts \
  src/infrastructure/services/__tests__/catalog-sync-normalized.test.ts
git commit -m "feat(sync): add normalized catalog sync helpers (brand, style, color, image, size builders)"
```

---

## Task 6: Rewrite catalog sync service to write to normalized tables

**Files:**

- Modify: `src/infrastructure/services/catalog-sync.service.ts`

The sync strategy processes each batch in 5 steps:

1. Collect unique brand names → bulk upsert `catalog_brands` → get name→id map
2. Upsert brand source bridges (`catalog_brand_sources`)
3. For each style: upsert to `catalog_styles` using brand UUID → get style UUID
4. For each color per style: upsert `catalog_colors` → get color UUID
5. Bulk upsert images + sizes using color/style UUIDs

**Step 1: Read the current sync service before editing**

Read `src/infrastructure/services/catalog-sync.service.ts` fully (already done above — it writes to the old `catalog` table).

**Step 2: Rewrite the sync service**

Replace the file content with:

```typescript
import 'server-only'
import { sql } from 'drizzle-orm'
import { getSupplierAdapter } from '@lib/suppliers/registry'
import { canonicalStyleToGarmentCatalog } from '@infra/repositories/_providers/supplier/garments'
import {
  buildBrandUpsertValue,
  buildStyleUpsertValue,
  buildColorUpsertValue,
  buildImageUpsertValue,
  buildSizeUpsertValue,
} from './catalog-sync-normalized'
import { logger } from '@shared/lib/logger'

const syncLogger = logger.child({ domain: 'catalog-sync' })

const CATALOG_PAGE_SIZE = 100
const MAX_CATALOG_PAGES = 500
const BATCH_SIZE = 50 // Smaller batch — each style triggers multiple child inserts

/**
 * Sync the supplier catalog to normalized Supabase tables.
 *
 * Writes to: catalog_brands, catalog_brand_sources, catalog_styles,
 *            catalog_colors, catalog_images, catalog_sizes
 *
 * Preserves: catalog_style_preferences (never touched by sync)
 * Skips old: catalog table (still exists as fallback, not written to)
 */
export async function syncCatalogFromSupplier(): Promise<number> {
  try {
    syncLogger.info('Starting normalized catalog sync from supplier')

    const { db } = await import('@shared/lib/supabase/db')
    const {
      catalogBrands,
      catalogBrandSources,
      catalogStyles,
      catalogColors,
      catalogImages,
      catalogSizes,
    } = await import('@db/schema/catalog-normalized')

    const adapter = getSupplierAdapter('ss-activewear')
    const allStyles: Awaited<ReturnType<typeof adapter.searchCatalog>>['styles'] = []
    let offset = 0
    let page = 0

    // ── Paginate all styles from supplier ──────────────────────────────────
    while (true) {
      const result = await adapter.searchCatalog({ limit: CATALOG_PAGE_SIZE, offset })
      allStyles.push(...result.styles)

      if (result.styles.length === 0 || !result.hasMore) break
      offset += result.styles.length
      page++

      if (page >= MAX_CATALOG_PAGES) {
        syncLogger.error('Exceeded MAX_CATALOG_PAGES', { page, offset })
        break
      }
    }

    if (allStyles.length === 0) {
      syncLogger.warn('No styles from supplier')
      return 0
    }

    let syncedTotal = 0

    for (let i = 0; i < allStyles.length; i += BATCH_SIZE) {
      const batch = allStyles.slice(i, i + BATCH_SIZE)

      // ── Step 1: Upsert brands, get name → UUID map ──────────────────────
      const uniqueBrandNames = [...new Set(batch.map((s) => s.brand))]
      const brandRows = await db
        .insert(catalogBrands)
        .values(uniqueBrandNames.map(buildBrandUpsertValue))
        .onConflictDoUpdate({
          target: catalogBrands.canonicalName,
          set: { updatedAt: new Date() },
        })
        .returning({ id: catalogBrands.id, canonicalName: catalogBrands.canonicalName })

      const brandIdByName = new Map(brandRows.map((r) => [r.canonicalName, r.id]))

      // ── Step 2: Upsert brand source bridges ─────────────────────────────
      const brandSourceValues = batch.map((s) => ({
        brandId: brandIdByName.get(s.brand)!,
        source: 'ss-activewear',
        externalId: s.supplierId,
        externalName: s.brand,
        updatedAt: new Date(),
      }))
      await db
        .insert(catalogBrandSources)
        .values(brandSourceValues)
        .onConflictDoUpdate({
          target: [catalogBrandSources.source, catalogBrandSources.externalId],
          set: { externalName: sql`excluded.external_name`, updatedAt: new Date() },
        })

      // ── Step 3: Upsert styles, get externalId → UUID map ─────────────────
      const styleValues = batch.map((s) =>
        buildStyleUpsertValue(s, brandIdByName.get(s.brand)!, 'ss-activewear')
      )
      const styleRows = await db
        .insert(catalogStyles)
        .values(styleValues)
        .onConflictDoUpdate({
          target: [catalogStyles.source, catalogStyles.externalId],
          set: {
            name: sql`excluded.name`,
            styleNumber: sql`excluded.style_number`,
            description: sql`excluded.description`,
            category: sql`excluded.category`,
            subcategory: sql`excluded.subcategory`,
            gtin: sql`excluded.gtin`,
            piecePrice: sql`excluded.piece_price`,
            dozenPrice: sql`excluded.dozen_price`,
            casePrice: sql`excluded.case_price`,
            lastSyncedAt: sql`excluded.last_synced_at`,
            updatedAt: new Date(),
          },
        })
        .returning({ id: catalogStyles.id, externalId: catalogStyles.externalId })

      const styleIdByExternalId = new Map(styleRows.map((r) => [r.externalId, r.id]))

      // ── Step 4: Colors, images, sizes per style ──────────────────────────
      for (const style of batch) {
        const styleId = styleIdByExternalId.get(style.supplierId)
        if (!styleId) continue

        if (style.colors.length > 0) {
          const colorValues = style.colors.map((c) => buildColorUpsertValue(styleId, c))
          const colorRows = await db
            .insert(catalogColors)
            .values(colorValues)
            .onConflictDoUpdate({
              target: [catalogColors.styleId, catalogColors.name],
              set: {
                hex1: sql`excluded.hex1`,
                hex2: sql`excluded.hex2`,
                updatedAt: new Date(),
              },
            })
            .returning({ id: catalogColors.id, name: catalogColors.name })

          const colorIdByName = new Map(colorRows.map((r) => [r.name, r.id]))

          // Images
          const imageValues = style.colors.flatMap((c) => {
            const colorId = colorIdByName.get(c.name)
            if (!colorId) return []
            return c.images.map((img) => buildImageUpsertValue(colorId, img))
          })
          if (imageValues.length > 0) {
            await db
              .insert(catalogImages)
              .values(imageValues)
              .onConflictDoUpdate({
                target: [catalogImages.colorId, catalogImages.imageType],
                set: { url: sql`excluded.url`, updatedAt: new Date() },
              })
          }
        }

        if (style.sizes.length > 0) {
          const sizeValues = style.sizes.map((s) => buildSizeUpsertValue(styleId, s))
          await db
            .insert(catalogSizes)
            .values(sizeValues)
            .onConflictDoUpdate({
              target: [catalogSizes.styleId, catalogSizes.name],
              set: {
                sortOrder: sql`excluded.sort_order`,
                priceAdjustment: sql`excluded.price_adjustment`,
                updatedAt: new Date(),
              },
            })
        }
      }

      syncedTotal += batch.length
      syncLogger.info('Normalized catalog sync batch completed', {
        batchSize: batch.length,
        totalSynced: syncedTotal,
        totalRemaining: allStyles.length - syncedTotal,
      })
    }

    syncLogger.info('Normalized catalog sync completed', { synced: syncedTotal })
    return syncedTotal
  } catch (error) {
    syncLogger.error('Normalized catalog sync failed', { error })
    throw error
  }
}
```

**Step 3: Type check**

```bash
npx tsc --noEmit
```

Expected: no errors.

**Step 4: Run full test suite**

```bash
npm test
```

Expected: green (sync service has no unit tests — it's tested via integration).

**Step 5: Trigger a manual sync to verify data lands in new tables**

With local Supabase running:

```bash
curl -X POST http://localhost:3000/api/sync-catalog \
  -H "Content-Type: application/json"
```

Then open Drizzle Studio (`npm run db:studio`) and verify:

- `catalog_brands` has rows
- `catalog_styles` has rows with UUID PKs
- `catalog_colors` has rows with hex1/hex2 values
- `catalog_images` has rows with S&S CDN URLs
- `catalog_sizes` has rows

**Step 6: Commit**

```bash
git add src/infrastructure/services/catalog-sync.service.ts
git commit -m "feat(sync): rewrite catalog sync to write to normalized tables (brands, styles, colors, images, sizes)"
```

---

## Task 7: Add S&S CDN domain to next/image allowed list

**Files:**

- Modify: `next.config.ts`

**Step 1: Add remotePatterns**

```typescript
// next.config.ts
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'www.ssactivewear.com',
        pathname: '/**',
      },
    ],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
    ]
  },
}

export default nextConfig
```

**Step 2: Build to verify no config errors**

```bash
npm run build
```

Expected: successful build. (Or `npx tsc --noEmit` if full build is slow.)

**Step 3: Commit**

```bash
git add next.config.ts
git commit -m "config: allow www.ssactivewear.com in next/image remotePatterns"
```

---

## Task 8: New repository function returning normalized catalog data

**Files:**

- Create: `src/infrastructure/repositories/_providers/supabase/catalog.ts`
- Modify: `src/infrastructure/repositories/garments.ts` (add router case)

**Step 1: Write the failing test**

Create `src/infrastructure/repositories/_providers/supabase/__tests__/catalog.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { parseNormalizedCatalogRow } from '../catalog'

describe('parseNormalizedCatalogRow', () => {
  it('maps db row to NormalizedGarmentCatalog', () => {
    const row = {
      id: '00000000-0000-4000-8000-000000000001',
      source: 'ss-activewear',
      external_id: '3001',
      brand_canonical: 'Bella+Canvas',
      style_number: 'BC3001',
      name: 'Unisex Jersey Tee',
      description: null,
      category: 't-shirts',
      subcategory: null,
      piece_price: 4.25,
      colors: [],
      sizes: [],
      is_enabled: null,
      is_favorite: null,
    }
    const result = parseNormalizedCatalogRow(row)
    expect(result.brand).toBe('Bella+Canvas')
    expect(result.category).toBe('t-shirts')
    expect(result.isEnabled).toBe(true) // NULL → default true
    expect(result.isFavorite).toBe(false) // NULL → default false
  })
})
```

**Step 2: Run test to verify it fails**

```bash
npx vitest run src/infrastructure/repositories/_providers/supabase/__tests__/catalog.test.ts
```

Expected: FAIL — module not found.

**Step 3: Implement the Supabase catalog provider**

```typescript
// src/infrastructure/repositories/_providers/supabase/catalog.ts
import 'server-only'
import { eq, sql } from 'drizzle-orm'
import type { NormalizedGarmentCatalog } from '@domain/entities/catalog-style'
import { logger } from '@shared/lib/logger'

const repoLogger = logger.child({ domain: 'supabase-catalog' })

/**
 * Parse a raw joined DB row into NormalizedGarmentCatalog.
 * NULL preferences resolve to defaults: isEnabled=true, isFavorite=false.
 */
export function parseNormalizedCatalogRow(row: {
  id: string
  source: string
  external_id: string
  brand_canonical: string
  style_number: string
  name: string
  description: string | null
  category: string
  subcategory: string | null
  piece_price: number | null
  colors: Array<{
    id: string
    name: string
    hex1: string | null
    hex2: string | null
    images: Array<{ imageType: string; url: string }>
  }>
  sizes: Array<{ id: string; name: string; sortOrder: number; priceAdjustment: number }>
  is_enabled: boolean | null
  is_favorite: boolean | null
}): NormalizedGarmentCatalog {
  return {
    id: row.id,
    source: row.source,
    externalId: row.external_id,
    brand: row.brand_canonical,
    styleNumber: row.style_number,
    name: row.name,
    description: row.description,
    category: row.category as NormalizedGarmentCatalog['category'],
    subcategory: row.subcategory,
    piecePrice: row.piece_price,
    colors: row.colors.map((c) => ({
      id: c.id,
      styleId: row.id,
      name: c.name,
      hex1: c.hex1,
      hex2: c.hex2,
      images: c.images,
    })),
    sizes: row.sizes.map((s) => ({
      id: s.id,
      name: s.name,
      sortOrder: s.sortOrder,
      priceAdjustment: s.priceAdjustment,
    })),
    isEnabled: row.is_enabled ?? true,
    isFavorite: row.is_favorite ?? false,
  }
}

/**
 * Fetch all normalized catalog styles with their colors, images, and sizes.
 * Left-joins catalog_style_preferences to resolve isEnabled/isFavorite with defaults.
 */
export async function getNormalizedCatalog(): Promise<NormalizedGarmentCatalog[]> {
  const { db } = await import('@shared/lib/supabase/db')
  const {
    catalogStyles,
    catalogColors,
    catalogImages,
    catalogSizes,
    catalogBrands,
    catalogStylePreferences,
  } = await import('@db/schema/catalog-normalized')

  // Use a raw SQL query for the joined result with JSON aggregation.
  // Drizzle doesn't natively support JSON_AGG aggregation sugar, so we use sql template.
  const rows = await db.execute(sql`
    SELECT
      cs.id,
      cs.source,
      cs.external_id,
      cb.canonical_name AS brand_canonical,
      cs.style_number,
      cs.name,
      cs.description,
      cs.category,
      cs.subcategory,
      cs.piece_price,
      COALESCE(
        JSON_AGG(
          DISTINCT JSONB_BUILD_OBJECT(
            'id', cc.id,
            'name', cc.name,
            'hex1', cc.hex1,
            'hex2', cc.hex2,
            'images', (
              SELECT COALESCE(
                JSON_AGG(
                  JSONB_BUILD_OBJECT('imageType', ci.image_type, 'url', ci.url)
                  ORDER BY ci.image_type
                ),
                '[]'::json
              )
              FROM catalog_images ci
              WHERE ci.color_id = cc.id
            )
          )
        ) FILTER (WHERE cc.id IS NOT NULL),
        '[]'::json
      ) AS colors,
      COALESCE(
        JSON_AGG(
          DISTINCT JSONB_BUILD_OBJECT(
            'id', csi.id,
            'name', csi.name,
            'sortOrder', csi.sort_order,
            'priceAdjustment', csi.price_adjustment
          )
        ) FILTER (WHERE csi.id IS NOT NULL),
        '[]'::json
      ) AS sizes,
      csp.is_enabled,
      csp.is_favorite
    FROM catalog_styles cs
    JOIN catalog_brands cb ON cb.id = cs.brand_id
    LEFT JOIN catalog_colors cc ON cc.style_id = cs.id
    LEFT JOIN catalog_sizes csi ON csi.style_id = cs.id
    LEFT JOIN catalog_style_preferences csp
      ON csp.style_id = cs.id AND csp.scope_type = 'shop'
    GROUP BY cs.id, cb.canonical_name, csp.is_enabled, csp.is_favorite
    ORDER BY cs.name ASC
  `)

  return (rows as unknown[]).map((row) =>
    parseNormalizedCatalogRow(row as Parameters<typeof parseNormalizedCatalogRow>[0])
  )
}
```

**Step 4: Run test to verify it passes**

```bash
npx vitest run src/infrastructure/repositories/_providers/supabase/__tests__/catalog.test.ts
```

Expected: PASS.

**Step 5: Full test suite**

```bash
npm test && npx tsc --noEmit
```

Expected: green.

**Step 6: Commit**

```bash
git add src/infrastructure/repositories/_providers/supabase/catalog.ts \
  src/infrastructure/repositories/_providers/supabase/__tests__/catalog.test.ts
git commit -m "feat(repo): add Supabase normalized catalog provider with JSON_AGG join query"
```

---

## Task 9: Update GarmentCard to show real front image

**Files:**

- Modify: `src/app/(dashboard)/garments/_components/GarmentCard.tsx`

The card currently passes `GarmentCatalog` (old type). We'll add an optional `normalizedGarment` prop path alongside the existing one, and render a real image when available.

**Step 1: Read GarmentCard fully** (already done — see line 69-74 above)

**Step 2: Modify GarmentCard to accept and render real image**

Add imports at the top of `GarmentCard.tsx`:

```typescript
import Image from 'next/image'
import type { NormalizedGarmentCatalog } from '@domain/entities/catalog-style'
```

Replace the `GarmentCardProps` type to accept either old or new garment:

```typescript
type GarmentCardProps = {
  garment: GarmentCatalog | NormalizedGarmentCatalog
  showPrice: boolean
  onToggleFavorite: (garmentId: string) => void
  onBrandClick?: (brandName: string) => void
  onClick: (garmentId: string) => void
}
```

Add a helper to check if the garment is normalized:

```typescript
function isNormalized(g: GarmentCatalog | NormalizedGarmentCatalog): g is NormalizedGarmentCatalog {
  return 'colors' in g && Array.isArray(g.colors)
}
```

Replace the `{/* Image */}` section (lines 68-74) with:

```tsx
{
  /* Image — real photo if available, SVG tinting fallback */
}
;<div className="flex justify-center py-2">
  {isNormalized(garment) && garment.colors[0]?.images.find((i) => i.imageType === 'front') ? (
    <div className="relative w-16 h-20 rounded overflow-hidden bg-surface">
      <Image
        src={garment.colors[0].images.find((i) => i.imageType === 'front')!.url}
        alt={`${garment.name} front view`}
        fill
        sizes="64px"
        className="object-contain"
      />
    </div>
  ) : (
    <GarmentMockup
      garmentCategory={garment.category ?? garment.baseCategory}
      colorHex={isNormalized(garment) ? (garment.colors[0]?.hex1 ?? '#ffffff') : '#ffffff'}
      size="sm"
    />
  )}
</div>
```

Note: `garment.category` is the field name in `NormalizedGarmentCatalog`; `garment.baseCategory` is in `GarmentCatalog`. Access both safely using the `isNormalized()` guard.

**Step 3: Fix any TypeScript errors from the prop union**

```bash
npx tsc --noEmit
```

Fix any type errors reported, especially around accessing `.brand`, `.sku`, `.name`, `.isEnabled`, `.isFavorite`, `.basePrice`/`.piecePrice` (old vs new names).

**Step 4: Run full test suite**

```bash
npm test
```

Expected: green.

**Step 5: Commit**

```bash
git add src/app/(dashboard)/garments/_components/GarmentCard.tsx
git commit -m "feat(ui): GarmentCard shows real S&S front photo when normalized garment data available"
```

---

## Task 10: Add imageUrl prop to GarmentMockup with fallback

**Files:**

- Modify: `src/features/quotes/components/mockup/GarmentMockup.tsx`

The mockup is used in quote/job detail views. When a real image is available, it should render under artwork overlays. The SVG tinting path remains as the fallback.

**Step 1: Add `imageUrl` prop**

Update `GarmentMockupProps`:

```typescript
type GarmentMockupProps = {
  garmentCategory: GarmentCategory
  colorHex: string
  artworkPlacements?: ArtworkPlacement[]
  view?: MockupView
  size?: keyof typeof SIZE_CLASSES
  className?: string
  templatePath?: string
  viewBoxWidth?: number
  viewBoxHeight?: number
  debug?: boolean
  /** Real S&S product photo URL. When provided, renders as the base layer instead of SVG tinting. */
  imageUrl?: string
}
```

Add `import Image from 'next/image'` at top.

In the component body, replace the garment template `<image>` element (SVG's `<image>`, not Next.js `Image`) with conditional logic:

```typescript
{imageUrl ? (
  // Real photo base layer — artwork overlays still render on top in the SVG
  <image
    href={imageUrl}
    width={viewBoxWidth}
    height={viewBoxHeight}
    preserveAspectRatio="xMidYMid meet"
  />
) : (
  // SVG tinting fallback
  <image href={svgPath} width={viewBoxWidth} height={viewBoxHeight} filter={`url(#${filterId})`} />
)}
```

Note: The `<defs>` block with `feColorMatrix` should only render when `imageUrl` is NOT provided (no need to compute color matrix for real photos).

**Step 2: Verify existing mockup tests still pass**

```bash
npm test
```

Expected: green (the new prop is optional, all existing usages are unchanged).

**Step 3: Commit**

```bash
git add src/features/quotes/components/mockup/GarmentMockup.tsx
git commit -m "feat(mockup): add optional imageUrl prop — renders real photo as base layer with SVG fallback"
```

---

## Task 11: Hover image type carousel component

This is a new client component that shows image type tabs on hover, allowing the user to switch between front/back/on-model/swatch.

**Files:**

- Create: `src/shared/ui/organisms/ImageTypeCarousel.tsx`

**Step 1: Create the component**

```tsx
// src/shared/ui/organisms/ImageTypeCarousel.tsx
'use client'

import { useState } from 'react'
import Image from 'next/image'
import { cn } from '@shared/lib/cn'
import type { CatalogImage } from '@domain/entities/catalog-style'

// The 4 types shown in the strip (in display order)
const STRIP_TYPES = ['front', 'back', 'on-model-front', 'swatch'] as const
type StripType = (typeof STRIP_TYPES)[number]

const STRIP_LABELS: Record<StripType, string> = {
  front: 'Front',
  back: 'Back',
  'on-model-front': 'On Model',
  swatch: 'Swatch',
}

type ImageTypeCarouselProps = {
  images: CatalogImage[]
  alt: string
  className?: string
}

export function ImageTypeCarousel({ images, alt, className }: ImageTypeCarouselProps) {
  const [activeType, setActiveType] = useState<string>('front')

  const imageMap = new Map(images.map((img) => [img.imageType, img.url]))
  const activeUrl = imageMap.get(activeType) ?? imageMap.get('front')

  if (!activeUrl) return null

  const availableStrip = STRIP_TYPES.filter((t) => imageMap.has(t))

  return (
    <div className={cn('group relative', className)}>
      {/* Main image */}
      <div className="relative w-full aspect-square bg-surface rounded-md overflow-hidden">
        <Image
          src={activeUrl}
          alt={`${alt} — ${activeType}`}
          fill
          sizes="(max-width: 768px) 50vw, 200px"
          className="object-contain transition-opacity duration-150"
        />
      </div>

      {/* Image type strip — visible on hover (desktop) / always visible (mobile) */}
      {availableStrip.length > 1 && (
        <div
          className={cn(
            'flex gap-1 mt-1.5 justify-center',
            'md:opacity-0 md:group-hover:opacity-100 md:transition-opacity md:duration-150'
          )}
        >
          {availableStrip.map((type) => (
            <button
              key={type}
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                setActiveType(type)
              }}
              className={cn(
                'px-1.5 py-0.5 text-[10px] rounded border transition-colors',
                activeType === type
                  ? 'border-action text-action bg-action/10'
                  : 'border-border text-muted-foreground hover:border-foreground/30'
              )}
            >
              {STRIP_LABELS[type]}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
```

**Step 2: Type check**

```bash
npx tsc --noEmit
```

**Step 3: Build**

```bash
npm run build
```

Expected: clean build.

**Step 4: Commit**

```bash
git add src/shared/ui/organisms/ImageTypeCarousel.tsx
git commit -m "feat(ui): add ImageTypeCarousel component with hover strip for front/back/on-model/swatch"
```

---

## Task 12: Wire ImageTypeCarousel into garment detail view

**Files:**

- Find and modify: garment detail page (likely `src/app/(dashboard)/garments/[id]/page.tsx` or `_components/GarmentDetail.tsx`)

**Step 1: Find the garment detail component**

```bash
find src/app/\(dashboard\)/garments -name "*.tsx" | sort
```

**Step 2: Import and use ImageTypeCarousel**

In the detail view where garment colors are shown, replace static image display with:

```tsx
import { ImageTypeCarousel } from '@shared/ui/organisms/ImageTypeCarousel'

// Where colors are rendered, for the selected color:
;<ImageTypeCarousel
  images={selectedColor.images}
  alt={`${garment.name} — ${selectedColor.name}`}
  className="w-full max-w-xs mx-auto"
/>
```

**Step 3: Run full test suite**

```bash
npm test && npx tsc --noEmit
```

**Step 4: Commit**

```bash
git add src/app/\(dashboard\)/garments/
git commit -m "feat(ui): wire ImageTypeCarousel into garment detail view"
```

---

## Task 13: Archive old catalog table (Approach C Wave 5)

> **Do this ONLY after Tasks 8–12 have been merged and verified working in production with the new tables.**

**Files:**

- Create: `supabase/migrations/XXXX_archive_old_catalog.sql`

**Step 1: Generate the archive migration**

Do NOT use `db:generate` for this — write the SQL manually to avoid Drizzle
schema conflicts:

```sql
-- Archive old denormalized catalog table
-- Run after confirming all reads/writes use normalized tables.
ALTER TABLE catalog RENAME TO catalog_archived;
```

Place this file in `supabase/migrations/` with the next sequence number.

**Step 2: Apply migration to local Supabase**

```bash
npm run db:migrate
```

**Step 3: Verify app still works**

```bash
npm run dev
```

Navigate to garments page. Verify catalog loads from new normalized tables (not `catalog_archived`).

**Step 4: Run full test suite**

```bash
npm test && npm run build
```

Expected: green. If any test or code still references the `catalog` table, fix before committing.

**Step 5: Commit**

```bash
git add supabase/migrations/
git commit -m "migration: rename catalog → catalog_archived (Approach C Wave 5)"
```

---

## Execution Checklist

Before opening the PR, verify:

- [ ] `npm test` passes (all 1385+ existing tests green)
- [ ] `npx tsc --noEmit` clean
- [ ] `npm run lint` clean
- [ ] `npm run build` clean
- [ ] `npx drizzle-kit check` no drift
- [ ] Manual sync runs without error and populates all 6 new tables
- [ ] GarmentCard shows real S&S photo (not SVG tint) in catalog browse
- [ ] Hover strip shows front/back/on-model/swatch tabs
- [ ] GarmentMockup fallback still works for garments without images
- [ ] `other` category appears for unknowns (not silently `t-shirts`)
