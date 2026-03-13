import { z } from 'zod'

// ─── Zod schemas ──────────────────────────────────────────────────────────────

export const activityEventEntityTypeSchema = z.enum([
  'customer',
  'quote',
  'job',
  'invoice',
  'artwork',
])

export const activityEventTypeSchema = z.enum([
  'created',
  'updated',
  'archived',
  'status_changed',
  'note_added',
  'attachment_added',
  'payment_recorded',
  'approved',
  'rejected',
  'converted',
])

export const activityEventActorTypeSchema = z.enum(['staff', 'system', 'customer'])

/** Internal validation schema — strict, all fields required (service applies defaults before parse) */
export const activityEventInputSchema = z.object({
  shopId: z.string().uuid(),
  entityType: activityEventEntityTypeSchema,
  entityId: z.string().uuid(),
  eventType: activityEventTypeSchema,
  actorType: activityEventActorTypeSchema,
  /** null for system actors */
  actorId: z.string().uuid().nullable(),
  /** Event-specific structured data */
  metadata: z.record(z.string(), z.unknown()).nullable(),
})

/** A single persisted activity event */
export const activityEventSchema = z.object({
  id: z.string().uuid(),
  shopId: z.string().uuid(),
  entityType: activityEventEntityTypeSchema,
  entityId: z.string().uuid(),
  eventType: activityEventTypeSchema,
  actorType: activityEventActorTypeSchema,
  actorId: z.string().uuid().nullable(),
  metadata: z.record(z.string(), z.unknown()).nullable(),
  createdAt: z.string().datetime(),
})

/** Cursor-based page of activity events */
export const activityEventPageSchema = z.object({
  items: z.array(activityEventSchema),
  nextCursor: z.string().datetime().nullable(),
  hasMore: z.boolean(),
})

// ─── Derived types ────────────────────────────────────────────────────────────

export type ActivityEventEntityType = z.infer<typeof activityEventEntityTypeSchema>
export type ActivityEventType = z.infer<typeof activityEventTypeSchema>
export type ActivityEventActorType = z.infer<typeof activityEventActorTypeSchema>
export type ActivityEvent = z.infer<typeof activityEventSchema>
export type ActivityEventPage = z.infer<typeof activityEventPageSchema>

/** Options for paginating an entity's activity feed. */
export type ListForEntityOpts = {
  shopId: string
  limit?: number
  cursor?: string | null
  eventTypes?: ActivityEventType[]
}

/**
 * Public input type for recording an activity event.
 *
 * `actorType`, `actorId`, and `metadata` are optional — the service applies
 * sensible defaults (system, null, null) before persisting.
 */
export type ActivityEventInput = {
  shopId: string
  entityType: ActivityEventEntityType
  entityId: string
  eventType: ActivityEventType
  actorType?: ActivityEventActorType
  actorId?: string | null
  metadata?: Record<string, unknown> | null
}

// ─── Port interface ───────────────────────────────────────────────────────────

export type IActivityEventRepository = {
  /**
   * Record a single activity event.
   * The service calls this — never called directly from server actions.
   */
  record(input: ActivityEventInput): Promise<ActivityEvent>

  /**
   * Fetch a page of events for an entity, newest first.
   *
   * @param entityType - Entity type (customer, quote, job, etc.)
   * @param entityId   - UUID of the entity
   * @param opts.shopId  - Required for RLS scoping
   * @param opts.limit   - Max items per page (default 20)
   * @param opts.cursor  - ISO datetime from previous page's nextCursor
   * @param opts.eventTypes - Filter to specific event types (omit = all)
   */
  listForEntity(
    entityType: ActivityEventEntityType,
    entityId: string,
    opts: ListForEntityOpts
  ): Promise<ActivityEventPage>
}
