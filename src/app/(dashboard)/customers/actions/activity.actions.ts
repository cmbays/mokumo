'use server'

import { z } from 'zod'
import { logger } from '@shared/lib/logger'
import { customerActivityService } from '@infra/repositories/customer-activity'
import type { ActivityPage, CustomerActivity } from '@domain/ports/customer-activity.port'
import { activitySourceSchema } from '@domain/ports/customer-activity.port'
import { verifySession } from '@infra/auth/session'

import type { ActivityError, ActivityResult } from '@features/customers/lib/activity-types'

// Re-export so app/-layer callers can import types from here directly.
export type { ActivityError, ActivityResult }

const log = logger.child({ domain: 'customers', action: 'activity' })

// ─── Input schemas ────────────────────────────────────────────────────────────

const addNoteInputSchema = z.object({
  customerId: z.string().uuid(),
  content: z.string().min(1, 'Note content is required').max(2000, 'Note too long'),
  /** Optional entity link — e.g. link note to a quote or job */
  relatedEntityType: z.enum(['quote', 'job', 'invoice']).nullable().optional(),
  relatedEntityId: z.string().uuid().nullable().optional(),
})

const loadMoreInputSchema = z.object({
  customerId: z.string().uuid(),
  /** ISO datetime cursor from the previous page's nextCursor */
  cursor: z.string().datetime().nullable().optional(),
  /** Source filter chip selection — null / undefined = All */
  source: activitySourceSchema.nullable().optional(),
  limit: z.number().int().min(1).max(50).optional(),
})

// ─── addCustomerNote ──────────────────────────────────────────────────────────

/**
 * Server action: persist a manual note to the customer activity timeline.
 *
 * Called from `ActivityFeed` when the user submits the Quick Note textarea.
 * The service is the write path — this action never touches the repo directly.
 */
export async function addCustomerNote(
  rawInput: unknown
): Promise<ActivityResult<CustomerActivity>> {
  const session = await verifySession()
  if (!session) {
    log.warn('Unauthenticated attempt to access customer activity')
    return { ok: false, error: 'UNAUTHORIZED' }
  }

  const parsed = addNoteInputSchema.safeParse(rawInput)

  if (!parsed.success) {
    log.warn('addCustomerNote: validation failed', { error: parsed.error.message })
    return { ok: false, error: 'VALIDATION_ERROR' }
  }

  const input = parsed.data

  log.info('addCustomerNote: saving note', { customerId: input.customerId })

  try {
    const activity = await customerActivityService.log({
      customerId: input.customerId,
      shopId: session.shopId,
      source: 'manual',
      direction: 'internal',
      actorType: 'staff',
      actorId: session.userId,
      content: input.content,
      externalRef: null,
      relatedEntityType: input.relatedEntityType ?? null,
      relatedEntityId: input.relatedEntityId ?? null,
    })

    log.info('addCustomerNote: note saved', { activityId: activity.id })

    return { ok: true, value: activity }
  } catch (err) {
    log.error('addCustomerNote: unexpected error', {
      error: Error.isError(err) ? err.message : String(err),
      customerId: input.customerId,
    })
    return { ok: false, error: 'INTERNAL_ERROR' }
  }
}

// ─── loadMoreActivities ───────────────────────────────────────────────────────

/**
 * Server action: fetch the next page of activities for a customer.
 *
 * Uses cursor-based pagination on `created_at` DESC.
 * Called from `ActivityFeed` when the user clicks "Load more".
 */
export async function loadMoreActivities(rawInput: unknown): Promise<ActivityResult<ActivityPage>> {
  const session = await verifySession()
  if (!session) {
    log.warn('Unauthenticated attempt to access customer activity')
    return { ok: false, error: 'UNAUTHORIZED' }
  }

  const parsed = loadMoreInputSchema.safeParse(rawInput)

  if (!parsed.success) {
    log.warn('loadMoreActivities: validation failed', { error: parsed.error.message })
    return { ok: false, error: 'VALIDATION_ERROR' }
  }

  const { customerId, cursor, source, limit } = parsed.data

  log.debug('loadMoreActivities', { customerId, cursor, source })

  try {
    const page = await customerActivityService.list(customerId, {
      limit: limit ?? 20,
      cursor: cursor ?? null,
      filter: source ? { source } : undefined,
    })

    return { ok: true, value: page }
  } catch (err) {
    log.error('loadMoreActivities: unexpected error', {
      error: Error.isError(err) ? err.message : String(err),
      customerId,
    })
    return { ok: false, error: 'INTERNAL_ERROR' }
  }
}
