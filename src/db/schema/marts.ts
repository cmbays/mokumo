/**
 * Marts schema — read-only dbt-managed dimensional model tables.
 *
 * These tables are created and populated by `dbt run`. Drizzle declares them
 * here for type-safe queries but never generates migrations for them.
 * The `marts` schema is excluded from `drizzle.config.ts` schemaFilter.
 *
 * NOT exported from schema/index.ts — these are dbt-managed, not Drizzle-managed.
 */
import { pgSchema, varchar, numeric, integer, date, boolean } from 'drizzle-orm/pg-core'

export const martsSchema = pgSchema('marts')

// ---------------------------------------------------------------------------
// Dimension: Product — one row per (source, style_id)
// ---------------------------------------------------------------------------

export const dimProduct = martsSchema.table('dim_product', {
  productKey: varchar('product_key', { length: 32 }).primaryKey(),
  source: varchar('source', { length: 50 }).notNull(),
  styleId: varchar('style_id', { length: 100 }).notNull(),
  productName: varchar('product_name', { length: 500 }),
  brandName: varchar('brand_name', { length: 255 }),
  gtin: varchar('gtin', { length: 20 }),
})

// ---------------------------------------------------------------------------
// Dimension: Supplier — one row per supplier
// ---------------------------------------------------------------------------

export const dimSupplier = martsSchema.table('dim_supplier', {
  supplierKey: varchar('supplier_key', { length: 32 }).primaryKey(),
  supplierCode: varchar('supplier_code', { length: 50 }).notNull(),
  supplierName: varchar('supplier_name', { length: 255 }).notNull(),
  website: varchar('website', { length: 500 }),
  isActive: boolean('is_active').notNull(),
})

// ---------------------------------------------------------------------------
// Dimension: Price Group — one row per (source, color_price_group, size_price_group)
// ---------------------------------------------------------------------------

export const dimPriceGroup = martsSchema.table('dim_price_group', {
  priceGroupKey: varchar('price_group_key', { length: 32 }).primaryKey(),
  source: varchar('source', { length: 50 }).notNull(),
  colorPriceGroup: varchar('color_price_group', { length: 255 }).notNull(),
  sizePriceGroup: varchar('size_price_group', { length: 255 }).notNull(),
})

// ---------------------------------------------------------------------------
// Fact: Supplier Pricing — one row per product x supplier x price_group x tier
// ---------------------------------------------------------------------------

export const fctSupplierPricing = martsSchema.table('fct_supplier_pricing', {
  pricingFactKey: varchar('pricing_fact_key', { length: 32 }).primaryKey(),
  productKey: varchar('product_key', { length: 32 }).notNull(),
  supplierKey: varchar('supplier_key', { length: 32 }).notNull(),
  priceGroupKey: varchar('price_group_key', { length: 32 }).notNull(),
  tierName: varchar('tier_name', { length: 20 }).notNull(),
  effectiveDate: date('effective_date').notNull(),
  isCurrent: boolean('is_current').notNull(),
  minQty: integer('min_qty').notNull(),
  maxQty: integer('max_qty'),
  unitPrice: numeric('unit_price', { precision: 10, scale: 4, mode: 'number' }).notNull(),
})
