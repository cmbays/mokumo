import { z } from 'zod'

// ---------------------------------------------------------------------------
// Supplier Pricing Tier — a single quantity-based price break
// ---------------------------------------------------------------------------

export const supplierPricingTierSchema = z.object({
  tierName: z.enum(['piece', 'dozen', 'case']),
  minQty: z.number().int().positive(),
  maxQty: z.number().int().positive().nullable(),
  unitPrice: z.number().positive(),
})

export type SupplierPricingTier = z.infer<typeof supplierPricingTierSchema>

// ---------------------------------------------------------------------------
// Price Group — color/size grouping that shares the same pricing
// ---------------------------------------------------------------------------

export const priceGroupSchema = z.object({
  colorPriceGroup: z.string().min(1),
  sizePriceGroup: z.string().min(1),
})

export type PriceGroup = z.infer<typeof priceGroupSchema>

// ---------------------------------------------------------------------------
// Structured Supplier Pricing — full pricing data for a style
// ---------------------------------------------------------------------------

export const structuredSupplierPricingSchema = z.object({
  styleId: z.string().min(1),
  source: z.string().min(1),
  productName: z.string().nullable(),
  brandName: z.string().nullable(),
  priceGroups: z.array(
    z.object({
      group: priceGroupSchema,
      tiers: z.array(supplierPricingTierSchema).min(1),
    })
  ),
})

export type StructuredSupplierPricing = z.infer<typeof structuredSupplierPricingSchema>

// ---------------------------------------------------------------------------
// Resolved Price — result of resolving a price for a specific quantity
// ---------------------------------------------------------------------------

export const resolvedPriceSchema = z.object({
  tierName: z.enum(['piece', 'dozen', 'case']),
  unitPrice: z.number().positive(),
  minQty: z.number().int().positive(),
  maxQty: z.number().int().positive().nullable(),
  quantity: z.number().int().positive(),
  totalPrice: z.number().nonnegative(),
})

export type ResolvedPrice = z.infer<typeof resolvedPriceSchema>
