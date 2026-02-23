/**
 * Supplier Pricing Domain Service
 *
 * Pure functions for resolving supplier pricing from structured tier data.
 * All monetary arithmetic uses big.js via money(), round2(), toNumber().
 *
 * 100% test coverage required — same tier as pricing.service.ts.
 */
import type {
  StructuredSupplierPricing,
  SupplierPricingTier,
  PriceGroup,
  ResolvedPrice,
} from '@domain/entities/supplier-pricing'
import { money, round2, toNumber } from '@domain/lib/money'

/**
 * Resolve the effective price for a given quantity and optional price group.
 *
 * Finds the tier where quantity >= minQty and (maxQty is null or quantity <= maxQty).
 * If priceGroup is provided, narrows to matching group first.
 * Returns null if no matching tier is found.
 */
export function resolveEffectivePrice(
  pricing: StructuredSupplierPricing,
  opts: { quantity: number; priceGroup?: PriceGroup }
): ResolvedPrice | null {
  const { quantity, priceGroup } = opts

  // Collect all tiers, optionally filtering by price group
  let candidates: SupplierPricingTier[] = []

  for (const pg of pricing.priceGroups) {
    if (priceGroup) {
      if (
        pg.group.colorPriceGroup !== priceGroup.colorPriceGroup ||
        pg.group.sizePriceGroup !== priceGroup.sizePriceGroup
      ) {
        continue
      }
    }
    candidates = candidates.concat(pg.tiers)
  }

  // Find the matching tier for the requested quantity
  const tier = candidates.find(
    (t) => quantity >= t.minQty && (t.maxQty === null || quantity <= t.maxQty)
  )

  if (!tier) return null

  const totalPrice = toNumber(round2(money(tier.unitPrice).times(quantity)))

  return {
    tierName: tier.tierName,
    unitPrice: tier.unitPrice,
    minQty: tier.minQty,
    maxQty: tier.maxQty,
    quantity,
    totalPrice,
  }
}

/**
 * Group all tiers by their price group key.
 *
 * Returns a Map keyed by "colorPriceGroup::sizePriceGroup" with the
 * array of tiers for that group. Used by the quote builder to display
 * all available pricing tiers.
 */
export function resolveAllTiers(
  pricing: StructuredSupplierPricing
): Map<string, SupplierPricingTier[]> {
  const result = new Map<string, SupplierPricingTier[]>()

  for (const pg of pricing.priceGroups) {
    const key = `${pg.group.colorPriceGroup}::${pg.group.sizePriceGroup}`
    result.set(key, pg.tiers)
  }

  return result
}

/**
 * Apply a size adjustment to a base price.
 *
 * Used when certain sizes (e.g. 2XL, 3XL) carry a surcharge over the
 * base price group. All arithmetic via big.js.
 */
export function applySizeAdjustment(basePrice: number, adjustment: number): number {
  return toNumber(round2(money(basePrice).plus(money(adjustment))))
}
