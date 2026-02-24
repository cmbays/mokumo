/**
 * Pricing Override Domain Service
 *
 * Pure functions for resolving the effective unit price for a catalog style
 * by applying the shop pricing override cascade:
 *
 *   supplier base price (fct_supplier_pricing, read-only)
 *     → scope_type='shop'     (global shop markup)
 *         → scope_type='brand'    (brand-level override)
 *             → scope_type='customer' (customer-specific pricing)
 *
 * All monetary arithmetic uses big.js via money(), round2(), toNumber().
 * No floating-point operations are used anywhere in this module.
 */
import type {
  PricingOverride,
  PricingOverrideRules,
  ResolvedEffectivePrice,
} from '@domain/entities/pricing-override'
import { money, round2, toNumber } from '@domain/lib/money'

// ---------------------------------------------------------------------------
// applyRule — apply a single override rules payload to a base price
// ---------------------------------------------------------------------------

/**
 * Apply a single override's rules to a price.
 *
 * Resolution order when multiple keys coexist:
 *   fixed_price  >  markup_percent  >  discount_percent
 *
 * Returns the new price as a 2dp string.
 */
export function applyRule(basePriceStr: string, rules: PricingOverrideRules): string {
  const base = money(basePriceStr)

  if (rules.fixed_price !== undefined) {
    return toNumber(round2(money(rules.fixed_price))).toFixed(2)
  }

  if (rules.markup_percent !== undefined) {
    const factor = money(rules.markup_percent).div(100).plus(1)
    return toNumber(round2(base.times(factor))).toFixed(2)
  }

  if (rules.discount_percent !== undefined) {
    const factor = money(1).minus(money(rules.discount_percent).div(100))
    return toNumber(round2(base.times(factor))).toFixed(2)
  }

  // No matching rule (shouldn't happen given schema validation, but be safe)
  return toNumber(round2(base)).toFixed(2)
}

// ---------------------------------------------------------------------------
// resolveEffectivePrice — full cascade resolution
// ---------------------------------------------------------------------------

/**
 * Context for override matching — identifies the style and its brand
 * so that brand-level and category-level overrides can be applied.
 */
export type OverrideResolutionContext = {
  styleId: string
  brandId: string
  /** Optional customer UUID for customer-scoped overrides. */
  customerId?: string
}

/**
 * Resolve the effective unit price for a style by walking the override cascade.
 *
 * The `overrides` list should contain **all** overrides relevant to the shop:
 *   - scope_type='shop'  (already filtered to the authenticated shop)
 *   - scope_type='brand' (already filtered to the authenticated shop)
 *   - scope_type='customer' (already filtered to the authenticated shop + optional customerId)
 *
 * Overrides are matched by entity type:
 *   - entity_type='style'    → matches if override.entityId === ctx.styleId
 *   - entity_type='brand'    → matches if override.entityId === ctx.brandId
 *   - entity_type='category' → matches all styles (entity_id is null)
 *
 * Within each scope tier, overrides are sorted by priority DESC so the highest
 * priority override within a tier wins. Tiers are applied in cascade order
 * (shop → brand → customer), meaning later tiers override earlier ones.
 */
export function resolveEffectivePrice(
  basePriceStr: string,
  overrides: PricingOverride[],
  ctx: OverrideResolutionContext
): ResolvedEffectivePrice {
  const matched = matchOverrides(overrides, ctx)

  if (matched.length === 0) {
    return {
      effectivePrice: toNumber(round2(money(basePriceStr))).toFixed(2),
      appliedOverrides: [],
      isBasePrice: true,
    }
  }

  // Walk the cascade: apply overrides in order (shop first, then brand, then customer)
  // Each tier replaces the running price from the previous tier.
  let running = basePriceStr
  for (const override of matched) {
    running = applyRule(running, override.rules)
  }

  return {
    effectivePrice: running,
    appliedOverrides: matched.map((o) => ({
      id: o.id,
      scopeType: o.scopeType,
      rules: o.rules,
    })),
    isBasePrice: false,
  }
}

// ---------------------------------------------------------------------------
// matchOverrides — filter and sort overrides for a given context
// ---------------------------------------------------------------------------

/**
 * Filter overrides to those matching the resolution context, then sort
 * them into cascade order: shop → brand → customer, priority DESC within tier.
 */
export function matchOverrides(
  overrides: PricingOverride[],
  ctx: OverrideResolutionContext
): PricingOverride[] {
  const SCOPE_ORDER: Record<string, number> = { shop: 0, brand: 1, customer: 2 }

  return overrides
    .filter((o) => isMatchingOverride(o, ctx))
    .sort((a, b) => {
      // Primary: cascade tier (shop < brand < customer)
      const tierA = SCOPE_ORDER[a.scopeType] ?? 0
      const tierB = SCOPE_ORDER[b.scopeType] ?? 0
      if (tierA !== tierB) return tierA - tierB

      // Secondary: priority DESC (higher priority wins within tier)
      return b.priority - a.priority
    })
}

function isMatchingOverride(override: PricingOverride, ctx: OverrideResolutionContext): boolean {
  switch (override.entityType) {
    case 'style':
      return override.entityId === ctx.styleId
    case 'brand':
      return override.entityId === ctx.brandId
    case 'category':
      // Category overrides apply to all styles (entity_id is null)
      return override.entityId === null
    default:
      return false
  }
}
