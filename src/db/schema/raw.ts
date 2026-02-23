/**
 * Raw analytics schema — verbatim supplier API responses.
 *
 * Append-only: no upsert constraints. Each sync run inserts new rows.
 * dbt staging models handle dedup via `row_number() partition by sku order by _loaded_at desc`.
 *
 * Managed by Drizzle for migration generation; read by dbt for analytics pipeline.
 */
import { pgSchema, bigint, varchar, numeric, timestamp, index } from 'drizzle-orm/pg-core'

export const rawSchema = pgSchema('raw')

/**
 * Per-SKU pricing data from S&S Activewear /v2/products/ endpoint.
 *
 * One row per SKU per sync run. Pricing columns use numeric(10,4) for
 * internal precision — customer-facing marts round to (10,2).
 */
export const ssActivewearProducts = rawSchema.table(
  'ss_activewear_products',
  {
    id: bigint('id', { mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
    sku: varchar('sku', { length: 50 }).notNull(),
    styleIdExternal: varchar('style_id_external', { length: 100 }).notNull(),
    styleName: varchar('style_name', { length: 500 }),
    brandName: varchar('brand_name', { length: 255 }),
    colorName: varchar('color_name', { length: 255 }),
    colorCode: varchar('color_code', { length: 50 }),
    colorPriceCodeName: varchar('color_price_code_name', { length: 255 }),
    sizeName: varchar('size_name', { length: 100 }),
    sizeCode: varchar('size_code', { length: 50 }),
    sizePriceCodeName: varchar('size_price_code_name', { length: 255 }),
    piecePrice: numeric('piece_price', { precision: 10, scale: 4 }),
    dozenPrice: numeric('dozen_price', { precision: 10, scale: 4 }),
    casePrice: numeric('case_price', { precision: 10, scale: 4 }),
    caseQty: varchar('case_qty', { length: 20 }),
    customerPrice: numeric('customer_price', { precision: 10, scale: 4 }),
    mapPrice: numeric('map_price', { precision: 10, scale: 4 }),
    salePrice: numeric('sale_price', { precision: 10, scale: 4 }),
    saleExpiration: varchar('sale_expiration', { length: 50 }),
    gtin: varchar('gtin', { length: 20 }),
    loadedAt: timestamp('_loaded_at', { withTimezone: true }).notNull().defaultNow(),
    source: varchar('_source', { length: 50 }).notNull().default('ss_activewear'),
  },
  (t) => [
    index('idx_raw_ss_products_sku').on(t.sku),
    index('idx_raw_ss_products_style_id').on(t.styleIdExternal),
    index('idx_raw_ss_products_loaded_at').on(t.loadedAt),
  ]
)
