import { z } from 'zod'

// ---------------------------------------------------------------------------
// Scope type: who owns the override
// ---------------------------------------------------------------------------

export const pricingOverrideScopeTypeEnum = z.enum(['shop', 'brand', 'customer'])
export type PricingOverrideScopeType = z.infer<typeof pricingOverrideScopeTypeEnum>

// ---------------------------------------------------------------------------
// Entity type: what style/brand/category the override targets
// ---------------------------------------------------------------------------

export const pricingOverrideEntityTypeEnum = z.enum(['style', 'brand', 'category'])
export type PricingOverrideEntityType = z.infer<typeof pricingOverrideEntityTypeEnum>

// ---------------------------------------------------------------------------
// Rules payload — the actual override instruction
// ---------------------------------------------------------------------------

/**
 * Override rules JSONB payload.
 *
 * Only one key typically applies at a time, but multiple may coexist.
 * Resolution order when multiple keys are present:
 *   fixed_price  >  markup_percent  >  discount_percent
 *
 * - markup_percent: add N% on top of the base price
 * - discount_percent: subtract N% from the base price
 * - fixed_price: ignore the base price and use this value directly (2dp string for precision)
 *
 * An empty rules object `{}` is accepted by the schema (the DB column default).
 * Application code that writes overrides must always provide at least one key —
 * enforced at the server action boundary via pricingOverrideRulesSchema.refine().
 * Parsed rows from the DB may have `{}` only if they were inserted directly (e.g. via migration).
 */
export const pricingOverrideRulesSchema = z.object({
  markup_percent: z.number().nonnegative().optional(),
  discount_percent: z.number().nonnegative().optional(),
  fixed_price: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/, 'fixed_price must be a non-negative decimal string (max 2dp)')
    .optional(),
})

export type PricingOverrideRules = z.infer<typeof pricingOverrideRulesSchema>

/**
 * Validated rules schema for user-submitted input: requires at least one rule key.
 * Use this at server action boundaries; use pricingOverrideRulesSchema for DB row parsing.
 */
export const pricingOverrideRulesInputSchema = pricingOverrideRulesSchema.refine(
  (r) =>
    r.markup_percent !== undefined ||
    r.discount_percent !== undefined ||
    r.fixed_price !== undefined,
  {
    message:
      'At least one rule key must be present (markup_percent, discount_percent, or fixed_price)',
  }
)

// ---------------------------------------------------------------------------
// Full override record
// ---------------------------------------------------------------------------

export const pricingOverrideSchema = z
  .object({
    id: z.string().uuid(),
    scopeType: pricingOverrideScopeTypeEnum,
    scopeId: z.string().uuid(),
    entityType: pricingOverrideEntityTypeEnum,
    /** Null when entityType is 'category' (applies to all styles in the category). */
    entityId: z.string().uuid().nullable(),
    rules: pricingOverrideRulesSchema,
    priority: z.number().int().default(0),
    createdAt: z.date().optional(),
    updatedAt: z.date().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.entityType === 'category' && data.entityId !== null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['entityId'],
        message: 'entityId must be null when entityType is "category"',
      })
    }
    if ((data.entityType === 'style' || data.entityType === 'brand') && data.entityId === null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['entityId'],
        message: 'entityId must be a UUID when entityType is "style" or "brand"',
      })
    }
  })

export type PricingOverride = z.infer<typeof pricingOverrideSchema>

// ---------------------------------------------------------------------------
// Resolved effective price — output of the cascade service
// ---------------------------------------------------------------------------

export const resolvedEffectivePriceSchema = z.object({
  /** The final unit price after applying all overrides (2dp string for precision). */
  effectivePrice: z.string(),
  /** Chain of overrides applied in cascade order (shop → brand → customer). */
  appliedOverrides: z.array(
    z.object({
      id: z.string().uuid(),
      scopeType: pricingOverrideScopeTypeEnum,
      rules: pricingOverrideRulesSchema,
    })
  ),
  /** True when no overrides were applied — effectivePrice equals supplier base. */
  isBasePrice: z.boolean(),
})

export type ResolvedEffectivePrice = z.infer<typeof resolvedEffectivePriceSchema>
