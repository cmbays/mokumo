/**
 * @deprecated Phase 1 flat catalog table, archived in migration 0004.
 * Use catalog-normalized.ts tables for all new work.
 */
import { pgTable, varchar, numeric, boolean, jsonb, timestamp, index } from 'drizzle-orm/pg-core'

export const catalog = pgTable(
  'catalog_archived',
  {
    id: varchar('id', { length: 50 }).primaryKey(), // S&S styleId (numeric string like "3001")
    brand: varchar('brand', { length: 255 }).notNull(),
    sku: varchar('sku', { length: 100 }).notNull(),
    name: varchar('name', { length: 500 }).notNull(),
    baseCategory: varchar('base_category', { length: 100 }).notNull(),
    basePrice: numeric('base_price', { precision: 10, scale: 2, mode: 'number' }).notNull(),
    availableColors: jsonb('available_colors').$type<string[]>().notNull().default([]),
    availableSizes: jsonb('available_sizes')
      .$type<Array<{ name: string; order: number; priceAdjustment: number }>>()
      .notNull()
      .default([]),
    isEnabled: boolean('is_enabled').notNull().default(true),
    isFavorite: boolean('is_favorite').notNull().default(false),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('idx_catalog_archived_is_enabled').on(t.isEnabled)]
)
