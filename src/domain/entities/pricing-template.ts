import { z } from 'zod'

// ─── DB Row shapes (Zod-first, derived from Drizzle schema) ──────────────────

export const pricingTemplateSchema = z.object({
  id: z.string().uuid(),
  shopId: z.string().uuid(),
  name: z.string().min(1),
  serviceType: z.string().min(1), // 'screen-print' | 'dtf' | 'embroidery'
  interpolationMode: z.enum(['linear', 'step']).default('linear'),
  setupFeePerColor: z.number().nonnegative(),
  sizeUpchargeXxl: z.number().nonnegative(),
  standardTurnaroundDays: z.number().int().positive(),
  isDefault: z.boolean().default(false),
  createdAt: z.date(),
  updatedAt: z.date(),
})

export const printCostMatrixCellSchema = z.object({
  id: z.string().uuid(),
  templateId: z.string().uuid(),
  qtyAnchor: z.number().int().positive(),
  colorCount: z.number().int().positive().nullable(), // null = DTF (full-color)
  costPerPiece: z.number().nonnegative(),
})

export const garmentMarkupRuleSchema = z.object({
  id: z.string().uuid(),
  shopId: z.string().uuid(),
  garmentCategory: z.string().min(1), // 'tshirt', 'hoodie', 'hat', 'tank', 'polo', 'jacket'
  markupMultiplier: z.number().positive(), // 2.0 = 100% markup on blank cost
})

export const rushTierSchema = z.object({
  id: z.string().uuid(),
  shopId: z.string().uuid(),
  name: z.string().min(1),
  daysUnderStandard: z.number().int().positive(), // tier activates when job needs to be this many days faster
  flatFee: z.number().nonnegative(),
  pctSurcharge: z.number().nonnegative(), // fraction: 0.10 = 10%
  displayOrder: z.number().int().nonnegative(),
})

// ─── Enriched / composite shapes ──────────────────────────────────────────────

/** Full template with all matrix cells — returned by repository lookups. */
export const pricingTemplateWithMatrixSchema = pricingTemplateSchema.extend({
  cells: z.array(printCostMatrixCellSchema),
})

// ─── Computation engine I/O ───────────────────────────────────────────────────

/** Input to computeUnitPrice — everything needed to price one line item. */
export const unitPriceInputSchema = z.object({
  qty: z.number().int().positive(),
  colorCount: z.number().int().positive().nullable(), // null = DTF/full-color
  garmentCategory: z.string().min(1),
  blankCost: z.number().nonnegative(), // from S&S pricing at the given qty
  templateId: z.string().uuid(),
})

/** Detailed unit price breakdown returned by computeUnitPrice. */
export const unitPriceResultSchema = z.object({
  unitPrice: z.number().nonnegative(), // blankRevenue + decorationCost + setupFee
  blankRevenue: z.number().nonnegative(), // blankCost × markupMultiplier
  decorationCost: z.number().nonnegative(), // from print_cost_matrix
  setupFee: z.number().nonnegative(), // setupFeePerColor × colorCount
})

// ─── Insert types (id is optional — omitted on create, provided on update) ───

export const pricingTemplateInsertSchema = pricingTemplateSchema
  .omit({ createdAt: true, updatedAt: true })
  .extend({ id: z.string().uuid().optional() })

export const printCostMatrixCellInsertSchema = printCostMatrixCellSchema.omit({ id: true })

export const garmentMarkupRuleInsertSchema = garmentMarkupRuleSchema.omit({ id: true })

export const rushTierInsertSchema = rushTierSchema.omit({ id: true })

// ─── TypeScript types (derived from Zod schemas — no separate interfaces) ────

export type PricingTemplate = z.infer<typeof pricingTemplateSchema>
export type PrintCostMatrixCell = z.infer<typeof printCostMatrixCellSchema>
export type GarmentMarkupRule = z.infer<typeof garmentMarkupRuleSchema>
export type RushTier = z.infer<typeof rushTierSchema>
export type PricingTemplateWithMatrix = z.infer<typeof pricingTemplateWithMatrixSchema>
export type UnitPriceInput = z.infer<typeof unitPriceInputSchema>
export type UnitPriceResult = z.infer<typeof unitPriceResultSchema>
export type PricingTemplateInsert = z.infer<typeof pricingTemplateInsertSchema>
export type PrintCostMatrixCellInsert = z.infer<typeof printCostMatrixCellInsertSchema>
export type GarmentMarkupRuleInsert = z.infer<typeof garmentMarkupRuleInsertSchema>
export type RushTierInsert = z.infer<typeof rushTierInsertSchema>
