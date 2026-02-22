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
  numeric,
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
  ]
)
