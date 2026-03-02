import {
  pgTable,
  pgEnum,
  uuid,
  varchar,
  integer,
  boolean,
  numeric,
  timestamp,
  index,
} from 'drizzle-orm/pg-core'
import { shops } from './shops'

// ─── Enums ────────────────────────────────────────────────────────────────────

export const interpolationModeEnum = pgEnum('interpolation_mode', ['linear', 'step'])

// ─── pricing_templates ────────────────────────────────────────────────────────
// Named pricing configurations per shop + service type.
// Only one template per (shop, service_type) may have is_default = true —
// enforced by partial unique index in migration (WHERE is_default = true).

export const pricingTemplates = pgTable(
  'pricing_templates',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    shopId: uuid('shop_id')
      .notNull()
      .references(() => shops.id, { onDelete: 'cascade' }),

    name: varchar('name', { length: 255 }).notNull(), // e.g. 'Standard Screen Print'
    serviceType: varchar('service_type', { length: 50 }).notNull(), // 'screen-print' | 'dtf' | 'embroidery'
    interpolationMode: interpolationModeEnum('interpolation_mode').notNull().default('linear'),

    // Per-color screen setup fee — amortized into unit price at quote time
    setupFeePerColor: numeric('setup_fee_per_color', {
      precision: 10,
      scale: 2,
      mode: 'number',
    })
      .notNull()
      .default(0),

    // Flat upcharge for 2XL+ garments
    sizeUpchargeXxl: numeric('size_upcharge_xxl', {
      precision: 10,
      scale: 2,
      mode: 'number',
    })
      .notNull()
      .default(0),

    // Standard production window in calendar days — basis for rush tier detection
    standardTurnaroundDays: integer('standard_turnaround_days').notNull().default(7),

    // Exactly one template per (shop_id, service_type) may be default —
    // enforced by partial unique index in migration, not here.
    isDefault: boolean('is_default').notNull().default(false),

    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    // Filter templates by shop on list screen
    index('idx_pricing_templates_shop_id').on(t.shopId),
    // getDefaultTemplate query: (shop_id, service_type) lookup
    index('idx_pricing_templates_shop_service').on(t.shopId, t.serviceType),
  ]
)

// ─── print_cost_matrix ────────────────────────────────────────────────────────
// Decoration cost grid: rows = qty anchors, columns = color counts.
// color_count is NULL for DTF (full-color, no ink dimension).
//
// Uniqueness is enforced by two partial indexes in migration:
//   WHERE color_count IS NOT NULL → UNIQUE (template_id, qty_anchor, color_count)
//   WHERE color_count IS NULL     → UNIQUE (template_id, qty_anchor)

export const printCostMatrix = pgTable(
  'print_cost_matrix',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    templateId: uuid('template_id')
      .notNull()
      .references(() => pricingTemplates.id, { onDelete: 'cascade' }),

    qtyAnchor: integer('qty_anchor').notNull(), // e.g. 12, 24, 48, 72, 144
    colorCount: integer('color_count'), // 1–6 for screen print; null for DTF
    costPerPiece: numeric('cost_per_piece', {
      precision: 10,
      scale: 4,
      mode: 'number',
    }).notNull(),
  },
  (t) => [
    // All cells for a template in one query
    index('idx_print_cost_matrix_template_id').on(t.templateId),
  ]
)

// ─── garment_markup_rules ─────────────────────────────────────────────────────
// Per-category blank markup configured by the shop owner.
// markup_multiplier: 2.0 = 100% markup (sell at 2× cost), 1.5 = 50% markup, etc.

export const garmentMarkupRules = pgTable(
  'garment_markup_rules',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    shopId: uuid('shop_id')
      .notNull()
      .references(() => shops.id, { onDelete: 'cascade' }),

    garmentCategory: varchar('garment_category', { length: 50 }).notNull(), // 'tshirt', 'hoodie', 'hat', etc.
    markupMultiplier: numeric('markup_multiplier', {
      precision: 5,
      scale: 4,
      mode: 'number',
    }).notNull(), // 2.0 = 100% markup
  },
  (t) => [
    // getMarkupRules query: all rules for a shop
    index('idx_garment_markup_rules_shop_id').on(t.shopId),
  ]
)

// ─── rush_tiers ───────────────────────────────────────────────────────────────
// Shop-configurable rush surcharge tiers.
// Surcharge formula: flat_fee + (order_subtotal × pct_surcharge)

export const rushTiers = pgTable(
  'rush_tiers',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    shopId: uuid('shop_id')
      .notNull()
      .references(() => shops.id, { onDelete: 'cascade' }),

    name: varchar('name', { length: 100 }).notNull(), // e.g. 'Next Day', 'Same Day'
    daysUnderStandard: integer('days_under_standard').notNull(), // tier activates when job needs to be done X days faster than standard
    flatFee: numeric('flat_fee', { precision: 10, scale: 2, mode: 'number' }).notNull().default(0),
    pctSurcharge: numeric('pct_surcharge', { precision: 5, scale: 4, mode: 'number' })
      .notNull()
      .default(0), // 0.10 = 10%
    displayOrder: integer('display_order').notNull().default(0),
  },
  (t) => [
    // getRushTiers query: ordered list for a shop
    index('idx_rush_tiers_shop_id').on(t.shopId),
  ]
)
