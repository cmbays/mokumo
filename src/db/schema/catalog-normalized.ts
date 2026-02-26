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
  index,
  numeric,
  jsonb,
} from 'drizzle-orm/pg-core'

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
      .references(() => catalogBrands.id, { onDelete: 'cascade' }),
    source: varchar('source', { length: 50 }).notNull(),
    externalId: varchar('external_id', { length: 100 }).notNull(),
    externalName: varchar('external_name', { length: 255 }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('catalog_brand_sources_source_external_id_key').on(t.source, t.externalId),
    index('idx_catalog_brand_sources_brand_id').on(t.brandId),
  ]
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
    lastSyncedAt: timestamp('last_synced_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('catalog_styles_source_external_id_key').on(t.source, t.externalId),
    index('idx_catalog_styles_brand_id').on(t.brandId),
  ]
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
    colorFamilyName: varchar('color_family_name', { length: 100 }),
    colorCode: varchar('color_code', { length: 50 }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('catalog_colors_style_id_name_key').on(t.styleId, t.name),
    index('idx_catalog_colors_style_id').on(t.styleId),
  ]
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
  (t) => [
    uniqueIndex('catalog_images_color_id_image_type_key').on(t.colorId, t.imageType),
    index('idx_catalog_images_color_id').on(t.colorId),
  ]
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
  (t) => [
    uniqueIndex('catalog_sizes_style_id_name_key').on(t.styleId, t.name),
    index('idx_catalog_sizes_style_id').on(t.styleId),
  ]
)

// ─── catalog_style_preferences ────────────────────────────────────────────────

export const catalogStylePreferences = pgTable(
  'catalog_style_preferences',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    scopeType: varchar('scope_type', { length: 20 }).notNull().default('shop'),
    /** Scope identifier — must be a UUID. All supported scope types (shop, brand, customer) resolve to UUID PKs. */
    scopeId: uuid('scope_id').notNull(),
    styleId: uuid('style_id')
      .notNull()
      .references(() => catalogStyles.id, { onDelete: 'cascade' }),
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
    index('idx_catalog_style_preferences_style_id').on(t.styleId),
  ]
)

// ─── catalog_color_preferences ────────────────────────────────────────────────
//
// Mirrors catalog_style_preferences but for colors.
// scope_type: 'shop' | 'brand'  (customer scope deferred)
// scope_id: UUID of the owning entity (shop UUID or brand UUID)
// is_favorite: NULL = unset, TRUE = favorited, FALSE = explicitly unfavorited

export const catalogColorPreferences = pgTable(
  'catalog_color_preferences',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    scopeType: varchar('scope_type', { length: 20 }).notNull().default('shop'),
    /** Scope identifier — must be a UUID. 'shop' → shop UUID, 'brand' → catalog_brands.id */
    scopeId: uuid('scope_id').notNull(),
    colorId: uuid('color_id')
      .notNull()
      .references(() => catalogColors.id, { onDelete: 'cascade' }),
    isFavorite: boolean('is_favorite'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('catalog_color_preferences_scope_type_scope_id_color_id_key').on(
      t.scopeType,
      t.scopeId,
      t.colorId
    ),
    index('idx_catalog_color_preferences_color_id').on(t.colorId),
    index('idx_catalog_color_preferences_scope').on(t.scopeType, t.scopeId),
  ]
)

// ─── catalog_inventory ────────────────────────────────────────────────────────
//
// Schema-only for Issue #618. No application reads this session.
// Future: populated by S&S inventory sync job.

export const catalogInventory = pgTable(
  'catalog_inventory',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    colorId: uuid('color_id')
      .notNull()
      .references(() => catalogColors.id, { onDelete: 'cascade' }),
    sizeId: uuid('size_id')
      .notNull()
      .references(() => catalogSizes.id, { onDelete: 'cascade' }),
    quantity: integer('quantity').notNull().default(0),
    lastSyncedAt: timestamp('last_synced_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('catalog_inventory_color_id_size_id_key').on(t.colorId, t.sizeId),
    index('idx_catalog_inventory_color_id').on(t.colorId),
    index('idx_catalog_inventory_size_id').on(t.sizeId),
  ]
)

// ─── shop_pricing_overrides ───────────────────────────────────────────────────
//
// Cascade model (lowest → highest precedence, higher priority wins):
//   fct_supplier_pricing (dbt marts, read-only base price)
//     → scope_type='shop'     (global shop markup)
//         → scope_type='brand'    (brand-level override)
//             → scope_type='customer' (customer-specific pricing)
//
// rules JSONB keys (one or more may be present):
//   markup_percent   — add N% on top of base price
//   discount_percent — subtract N% from base price
//   fixed_price      — ignore base; use this absolute price (numeric, 2dp)
//   Resolution order when multiple keys are present: fixed_price > markup_percent > discount_percent

export const shopPricingOverrides = pgTable(
  'shop_pricing_overrides',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    /** Who owns this override — 'shop' | 'brand' | 'customer' */
    scopeType: varchar('scope_type', { length: 20 }).notNull(),
    /** UUID of the owning entity (shop UUID, brand UUID, or customer UUID) */
    scopeId: uuid('scope_id').notNull(),

    /** What kind of entity this applies to — 'style' | 'brand' | 'category' */
    entityType: varchar('entity_type', { length: 20 }).notNull(),
    /**
     * UUID of the target entity.
     * NULL when entity_type = 'category' (applies to entire category).
     * References catalog_styles.id for 'style', catalog_brands.id for 'brand'.
     */
    entityId: uuid('entity_id'),

    /**
     * JSON override rules. Valid keys:
     *   - markup_percent: number     (e.g. 40 means +40%)
     *   - discount_percent: number   (e.g. 10 means -10%)
     *   - fixed_price: string        (e.g. "12.50" — stored as string for precision)
     */
    rules: jsonb('rules').notNull().default({}),

    /** Higher value wins when multiple overrides match the same entity */
    priority: integer('priority').notNull().default(0),

    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('idx_spo_scope').on(t.scopeType, t.scopeId),
    index('idx_spo_entity').on(t.entityType, t.entityId),
  ]
)
