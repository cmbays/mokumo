import { z } from 'zod'

// ─── Zod schemas ──────────────────────────────────────────────────────────────

export const activitySourceSchema = z.enum([
  'manual',
  'system',
  'email',
  'sms',
  'voicemail',
  'portal',
])

export const activityDirectionSchema = z.enum(['inbound', 'outbound', 'internal'])

export const actorTypeSchema = z.enum(['staff', 'system', 'customer'])

export const relatedEntityTypeSchema = z.enum(['quote', 'job', 'invoice'])

/** Input for writing a single activity event */
export const activityInputSchema = z.object({
  customerId: z.string().uuid(),
  shopId: z.string().uuid(),
  source: activitySourceSchema,
  direction: activityDirectionSchema.default('internal'),
  actorType: actorTypeSchema,
  /** null for system actors */
  actorId: z.string().uuid().nullable().default(null),
  content: z.string().min(1).max(2000),
  externalRef: z.string().max(255).nullable().default(null),
  relatedEntityType: relatedEntityTypeSchema.nullable().default(null),
  relatedEntityId: z.string().uuid().nullable().default(null),
})

/** A single persisted activity record */
export const customerActivitySchema = z.object({
  id: z.string().uuid(),
  customerId: z.string().uuid(),
  shopId: z.string().uuid(),
  source: activitySourceSchema,
  direction: activityDirectionSchema,
  actorType: actorTypeSchema,
  actorId: z.string().uuid().nullable(),
  content: z.string(),
  externalRef: z.string().nullable(),
  relatedEntityType: relatedEntityTypeSchema.nullable(),
  relatedEntityId: z.string().uuid().nullable(),
  createdAt: z.string().datetime(),
})

/** Cursor-based page result */
export const activityPageSchema = z.object({
  items: z.array(customerActivitySchema),
  /** ISO datetime string of oldest item in page, used as cursor for next page */
  nextCursor: z.string().datetime().nullable(),
  hasMore: z.boolean(),
})

// ─── Derived types ────────────────────────────────────────────────────────────

export type ActivitySource = z.infer<typeof activitySourceSchema>
export type ActivityDirection = z.infer<typeof activityDirectionSchema>
export type ActorType = z.infer<typeof actorTypeSchema>
export type RelatedEntityType = z.infer<typeof relatedEntityTypeSchema>
export type ActivityInput = z.infer<typeof activityInputSchema>
export type CustomerActivity = z.infer<typeof customerActivitySchema>
export type ActivityPage = z.infer<typeof activityPageSchema>

/** Optional filter for the timeline query */
export type ActivityFilter = {
  /** Filter by source. Omit = all sources */
  source?: ActivitySource
}

// ─── Port interface ───────────────────────────────────────────────────────────

export type ICustomerActivityRepository = {
  /**
   * Persist a single activity event.
   * The service calls this — never called directly from actions.
   */
  insert(input: ActivityInput): Promise<CustomerActivity>

  /**
   * Fetch a page of activities for a customer, ordered newest-first.
   *
   * @param customerId - UUID of the customer
   * @param opts.limit - Max items per page (default 20)
   * @param opts.cursor - ISO datetime string from previous page's nextCursor
   * @param opts.filter - Optional source filter
   */
  listForCustomer(
    customerId: string,
    opts: {
      limit?: number
      cursor?: string | null
      filter?: ActivityFilter
    }
  ): Promise<ActivityPage>
}
