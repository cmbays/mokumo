import 'server-only'

import { eq, and, lt, inArray, desc } from 'drizzle-orm'
import { db } from '@shared/lib/supabase/db'
import { validateUUID } from '@infra/repositories/_shared/validation'
import { activityEvents } from '@db/schema/activity-events'
import type {
  IActivityEventRepository,
  ActivityEventInput,
  ActivityEvent,
  ActivityEventPage,
  ActivityEventEntityType,
  ActivityEventType,
} from '@domain/ports/activity-event.port'
import { activityEventSchema } from '@domain/ports/activity-event.port'
import { logger } from '@shared/lib/logger'

const repoLogger = logger.child({ domain: 'supabase-activity-events' })

// ─── Row mapper ───────────────────────────────────────────────────────────────

function mapRow(row: typeof activityEvents.$inferSelect): ActivityEvent {
  return activityEventSchema.parse({
    id: row.id,
    shopId: row.shopId,
    entityType: row.entityType,
    entityId: row.entityId,
    eventType: row.eventType,
    actorType: row.actorType,
    actorId: row.actorId ?? null,
    metadata: row.metadata ?? null,
    createdAt: row.createdAt.toISOString(),
  })
}

// ─── Supabase implementation ──────────────────────────────────────────────────

export const supabaseActivityEventRepository: IActivityEventRepository = {
  async record(input: ActivityEventInput): Promise<ActivityEvent> {
    if (!validateUUID(input.shopId)) throw new Error(`record: invalid shopId "${input.shopId}"`)
    if (!validateUUID(input.entityId))
      throw new Error(`record: invalid entityId "${input.entityId}"`)

    repoLogger.debug('Recording activity event', {
      entityType: input.entityType,
      entityId: input.entityId,
      eventType: input.eventType,
      actorType: input.actorType,
    })

    const rows = await db
      .insert(activityEvents)
      .values({
        shopId: input.shopId,
        entityType: input.entityType,
        entityId: input.entityId,
        eventType: input.eventType,
        actorType: input.actorType,
        actorId: input.actorId ?? null,
        metadata: input.metadata ?? null,
      })
      .returning()

    const row = rows[0]
    if (!row) {
      throw new Error('supabaseActivityEventRepository.record: no row returned')
    }

    repoLogger.info('Activity event recorded', { eventId: row.id, eventType: row.eventType })

    return mapRow(row)
  },

  async listForEntity(
    entityType: ActivityEventEntityType,
    entityId: string,
    opts: {
      shopId: string
      limit?: number
      cursor?: string | null
      eventTypes?: ActivityEventType[]
    }
  ): Promise<ActivityEventPage> {
    if (!validateUUID(entityId)) throw new Error(`listForEntity: invalid entityId "${entityId}"`)
    if (!validateUUID(opts.shopId))
      throw new Error(`listForEntity: invalid shopId "${opts.shopId}"`)

    const limit = Math.min(opts.limit ?? 20, 50)
    const cursor = opts.cursor ?? null

    repoLogger.debug('Listing activity events', {
      entityType,
      entityId,
      limit,
      hasCursor: !!cursor,
      eventTypes: opts.eventTypes,
    })

    // Build WHERE conditions
    const conditions = [
      eq(activityEvents.entityType, entityType),
      eq(activityEvents.entityId, entityId),
      eq(activityEvents.shopId, opts.shopId),
    ]

    if (cursor) {
      conditions.push(lt(activityEvents.createdAt, new Date(cursor)))
    }

    if (opts.eventTypes && opts.eventTypes.length > 0) {
      conditions.push(inArray(activityEvents.eventType, opts.eventTypes))
    }

    // Fetch limit + 1 to detect hasMore
    const rows = await db
      .select()
      .from(activityEvents)
      .where(and(...conditions))
      .orderBy(desc(activityEvents.createdAt))
      .limit(limit + 1)

    const hasMore = rows.length > limit
    const pageRows = hasMore ? rows.slice(0, limit) : rows

    const items = pageRows.map(mapRow)

    const nextCursor =
      hasMore && pageRows.length > 0 ? pageRows[pageRows.length - 1]!.createdAt.toISOString() : null

    return { items, nextCursor, hasMore }
  },
}
