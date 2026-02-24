import 'server-only'

// Auth classification: AUTHENTICATED — shop pricing configuration.
// All functions require a valid session; shopId is passed by the caller
// (resolved via verifySession() at the action/page layer).

export {
  getOverridesForShop,
  upsertPricingOverride,
  deletePricingOverride,
} from '@infra/repositories/_providers/supabase/pricing-overrides'

export type { UpsertPricingOverrideInput } from '@infra/repositories/_providers/supabase/pricing-overrides'
