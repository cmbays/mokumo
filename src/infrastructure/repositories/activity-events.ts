import 'server-only'

// Auth classification: AUTHENTICATED — contains audit trail data.
// All functions require session auth before returning data (enforced by server actions).
//
// Design: activityEventService is the ONLY write path.
// Consumers (server actions) import `activityEventService` from here.
// The raw repository is not exported — use the service instead.

import { ActivityEventService } from '@domain/services/activity-event.service'
import type {
  ActivityEventEntityType,
  ActivityEventInput,
  ListForEntityOpts,
} from '@domain/ports/activity-event.port'
import type { ActivityEntityId } from '@domain/lib/branded'

// ─── Lazy Supabase module ─────────────────────────────────────────────────────
// Mirrors the pattern in customer-activity.ts: dynamic import defers the
// Drizzle/Postgres client to request time, preventing Turbopack from tracing
// the DB client into the module graph during Next.js build-time analysis.

let _service: ActivityEventService | null = null

async function resolveService(): Promise<ActivityEventService> {
  if (!_service) {
    const { supabaseActivityEventRepository } =
      await import('./_providers/supabase/activity-events')
    _service = new ActivityEventService(supabaseActivityEventRepository)
  }
  return _service
}

// ─── Singleton service (lazy façade) ─────────────────────────────────────────

/**
 * Lazy façade over `ActivityEventService`.
 *
 * Usage:
 *   await activityEventService.record({ shopId, entityType: 'customer', ... })
 *   await activityEventService.listForEntity('customer', id, { shopId })
 */
export const activityEventService = {
  record: (input: ActivityEventInput) => resolveService().then((s) => s.record(input)),
  listForEntity: (
    entityType: ActivityEventEntityType,
    entityId: ActivityEntityId,
    opts: ListForEntityOpts
  ) => resolveService().then((s) => s.listForEntity(entityType, entityId, opts)),
}

// ─── Named re-exports for convenience ────────────────────────────────────────

export async function listEntityActivity(
  entityType: ActivityEventEntityType,
  entityId: ActivityEntityId,
  opts: ListForEntityOpts
): ReturnType<ActivityEventService['listForEntity']> {
  return activityEventService.listForEntity(entityType, entityId, opts)
}
