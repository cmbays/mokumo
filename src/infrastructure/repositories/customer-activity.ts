import 'server-only'

// Auth classification: AUTHENTICATED — contains CRM activity data (PII-adjacent).
// All functions require session auth before returning data (enforced by server actions).
//
// Router: DATA_PROVIDER env var selects the data source.
//   - 'supabase' → Supabase PostgreSQL (production / preview)
//   - 'mock'     → in-process mock (empty feed; for local dev without DB credentials)
//   - unset      → Supabase
//
// Design: CustomerActivityService is the ONLY write path.
// Consumers (server actions) import `customerActivityService` from here.
// The raw repository is not exported — use the service instead.

import { CustomerActivityService } from '@domain/services/customer-activity.service'
import type { ICustomerActivityRepository } from '@domain/ports/customer-activity.port'

// ─── Mock repository ──────────────────────────────────────────────────────────
// Returns empty data when DATA_PROVIDER=mock — no Supabase credentials needed.

const mockActivityRepository: ICustomerActivityRepository = {
  insert: async (input) => ({
    id: '00000000-0000-0000-0000-000000000001',
    customerId: input.customerId,
    shopId: input.shopId,
    source: input.source,
    direction: input.direction,
    actorType: input.actorType,
    actorId: input.actorId,
    content: input.content,
    externalRef: input.externalRef,
    relatedEntityType: input.relatedEntityType,
    relatedEntityId: input.relatedEntityId,
    createdAt: new Date().toISOString(),
  }),
  listForCustomer: async () => ({ items: [], hasMore: false, nextCursor: null }),
}

// ─── Lazy Supabase module ─────────────────────────────────────────────────────
// Mirrors the pattern in customers.ts: dynamic import defers Drizzle/Postgres
// client initialization to request time, preventing Turbopack from tracing the
// DB client into the module graph during Next.js build-time page data collection.

let _service: CustomerActivityService | null = null

async function resolveService(): Promise<CustomerActivityService> {
  if (_service) return _service
  if (process.env.DATA_PROVIDER === 'mock') {
    _service = new CustomerActivityService(mockActivityRepository)
    return _service
  }
  const { supabaseCustomerActivityRepository } =
    await import('./_providers/supabase/customer-activity')
  _service = new CustomerActivityService(supabaseCustomerActivityRepository)
  return _service
}

// ─── Singleton service (lazy façade) ─────────────────────────────────────────

/**
 * Lazy façade over `CustomerActivityService`.
 *
 * API surface is identical to the original singleton — callers use `await`:
 *   await customerActivityService.log(input)
 *   await customerActivityService.list(customerId, opts)
 *
 * The Supabase module (and Drizzle client) is only loaded on the first call,
 * not at import time.
 */
export const customerActivityService = {
  log: (input: Parameters<CustomerActivityService['log']>[0]) =>
    resolveService().then((s) => s.log(input)),
  list: (customerId: string, opts?: Parameters<CustomerActivityService['list']>[1]) =>
    resolveService().then((s) => s.list(customerId, opts ?? {})),
}

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
