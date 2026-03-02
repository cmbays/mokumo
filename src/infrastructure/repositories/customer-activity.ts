import 'server-only'

// Auth classification: AUTHENTICATED — contains CRM activity data (PII-adjacent).
// All functions require session auth before returning data (enforced by server actions).
//
// Router: DATA_PROVIDER env var selects the data source.
//   - 'supabase' → Supabase PostgreSQL (production / preview)
//   - unset      → Supabase (activity is always real; no mock fallback needed for this entity)
//
// Design: CustomerActivityService is the ONLY write path.
// Consumers (server actions) import `customerActivityService` from here.
// The raw repository is not exported — use the service instead.

import { CustomerActivityService } from '@domain/services/customer-activity.service'
import { supabaseCustomerActivityRepository } from '@infra/repositories/_providers/supabase/customer-activity'
import type { ICustomerActivityRepository } from '@domain/ports/customer-activity.port'

// ─── Provider selection ───────────────────────────────────────────────────────

function getRepo(): ICustomerActivityRepository {
  // For now we always use Supabase — activities are always persisted to the DB.
  // This hook point allows a mock provider to be injected in future test environments
  // via DATA_PROVIDER='mock' without touching service or action code.
  return supabaseCustomerActivityRepository
}

// ─── Singleton service ────────────────────────────────────────────────────────

/**
 * Shared `CustomerActivityService` instance.
 *
 * Server actions import this singleton:
 *   import { customerActivityService } from '@infra/repositories/customer-activity'
 *
 * The service is the ONLY write path — never import the repo directly.
 */
export const customerActivityService = new CustomerActivityService(getRepo())

// ─── Named re-exports for convenience (list reads) ────────────────────────────

/**
 * Thin wrapper: list activities for a customer.
 * Delegates to `customerActivityService.list()`.
 * Provided as a named export so server components can call it without holding
 * a reference to the entire service object.
 */
export async function listCustomerActivities(
  customerId: string,
  opts: {
    limit?: number
    cursor?: string | null
    filter?: import('@domain/ports/customer-activity.port').ActivityFilter
  } = {}
): ReturnType<CustomerActivityService['list']> {
  return customerActivityService.list(customerId, opts)
}
