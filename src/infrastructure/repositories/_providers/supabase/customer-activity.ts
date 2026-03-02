import 'server-only'

import { eq, and, lt, desc } from 'drizzle-orm'
import { db } from '@shared/lib/supabase/db'
import { validateUUID } from '@infra/repositories/_shared/validation'
import { customerActivities } from '@db/schema/customers'
import type {
  ICustomerActivityRepository,
  ActivityInput,
  CustomerActivity,
  ActivityPage,
  ActivityFilter,
} from '@domain/ports/customer-activity.port'
import { customerActivitySchema } from '@domain/ports/customer-activity.port'
import { logger } from '@shared/lib/logger'

const repoLogger = logger.child({ domain: 'supabase-customer-activity' })

// ─── Row mapper ───────────────────────────────────────────────────────────────

function mapRow(row: typeof customerActivities.$inferSelect): CustomerActivity {
  return customerActivitySchema.parse({
    id: row.id,
    customerId: row.customerId,
    shopId: row.shopId,
    source: row.source,
    direction: row.direction,
    actorType: row.actorType,
    actorId: row.actorId ?? null,
    content: row.content,
    externalRef: row.externalRef ?? null,
    relatedEntityType: row.relatedEntityType ?? null,
    relatedEntityId: row.relatedEntityId ?? null,
    createdAt: row.createdAt.toISOString(),
  })
}

// ─── Supabase implementation ──────────────────────────────────────────────────

export const supabaseCustomerActivityRepository: ICustomerActivityRepository = {
  async insert(input: ActivityInput): Promise<CustomerActivity> {
    if (!validateUUID(input.customerId)) throw new Error(`insert: invalid customerId "${input.customerId}"`)
    if (!validateUUID(input.shopId)) throw new Error(`insert: invalid shopId "${input.shopId}"`)

    repoLogger.debug('Inserting customer activity', {
      customerId: input.customerId,
      source: input.source,
      actorType: input.actorType,
    })

    const rows = await db
      .insert(customerActivities)
      .values({
        customerId: input.customerId,
        shopId: input.shopId,
        source: input.source,
        direction: input.direction,
        actorType: input.actorType,
        actorId: input.actorId ?? null,
        content: input.content,
        externalRef: input.externalRef ?? null,
        relatedEntityType: input.relatedEntityType ?? null,
        relatedEntityId: input.relatedEntityId ?? null,
      })
      .returning()

    const row = rows[0]
    if (!row) {
      throw new Error('supabaseCustomerActivityRepository.insert: no row returned')
    }

    repoLogger.info('Customer activity inserted', { activityId: row.id })

    return mapRow(row)
  },

  async listForCustomer(
    customerId: string,
    opts: {
      limit?: number
      cursor?: string | null
      filter?: ActivityFilter
    }
  ): Promise<ActivityPage> {
    if (!validateUUID(customerId)) throw new Error(`listForCustomer: invalid customerId "${customerId}"`)

    const limit = Math.min(opts.limit ?? 20, 50)
    const cursor = opts.cursor ?? null

    repoLogger.debug('Listing customer activities', {
      customerId,
      limit,
      hasCursor: !!cursor,
      filter: opts.filter,
    })

    // Build WHERE conditions
    const conditions = [eq(customerActivities.customerId, customerId)]

    if (cursor) {
      conditions.push(lt(customerActivities.createdAt, new Date(cursor)))
    }

    if (opts.filter?.source) {
      conditions.push(eq(customerActivities.source, opts.filter.source))
    }

    // Fetch limit + 1 to detect hasMore
    const rows = await db
      .select()
      .from(customerActivities)
      .where(and(...conditions))
      .orderBy(desc(customerActivities.createdAt))
      .limit(limit + 1)

    const hasMore = rows.length > limit
    const pageRows = hasMore ? rows.slice(0, limit) : rows

    const items = pageRows.map(mapRow)

    // Next cursor is the createdAt of the last item in the current page
    const nextCursor =
      hasMore && pageRows.length > 0 ? pageRows[pageRows.length - 1]!.createdAt.toISOString() : null

    return {
      items,
      nextCursor,
      hasMore,
    }
  },
}
