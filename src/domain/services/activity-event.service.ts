/**
 * ActivityEventService — domain service for the system audit event log.
 *
 * Central write path: ALL activity events flow through `record()`.
 * Server actions call this service — never write to the repository directly.
 *
 * Read path: `listForEntity()` delegates to the repository for cursor-based
 * pagination scoped to a specific entity (customer, quote, job, etc.).
 */

import type {
  IActivityEventRepository,
  ActivityEventInput,
  ActivityEvent,
  ActivityEventPage,
  ActivityEventEntityType,
  ActivityEventType,
} from '@domain/ports/activity-event.port'
import { activityEventInputSchema } from '@domain/ports/activity-event.port'

export class ActivityEventService {
  constructor(private readonly repo: IActivityEventRepository) {}

  /**
   * Record a single activity event.
   *
   * Input is validated via Zod before persistence. This is the ONLY write
   * path — all mutations must call this method.
   *
   * @throws ZodError if input is invalid
   * @throws Error if the repository insert fails
   */
  async record(input: ActivityEventInput): Promise<ActivityEvent> {
    // Apply defaults for optional fields before strict schema parse
    const withDefaults = {
      ...input,
      actorType: input.actorType ?? 'system',
      actorId: input.actorId ?? null,
      metadata: input.metadata ?? null,
    }
    const validated = activityEventInputSchema.parse(withDefaults)
    return this.repo.record(validated)
  }

  /**
   * List activity events for an entity, newest first, with cursor-based
   * pagination.
   *
   * @param entityType - Entity type (customer, quote, job, etc.)
   * @param entityId   - UUID of the entity
   * @param opts.shopId     - Required for RLS scoping
   * @param opts.limit      - Items per page (default 20, max 50)
   * @param opts.cursor     - ISO datetime cursor from previous page
   * @param opts.eventTypes - Filter to specific event types (omit = all)
   */
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
    const limit = Math.min(opts.limit ?? 20, 50)
    return this.repo.listForEntity(entityType, entityId, {
      shopId: opts.shopId,
      limit,
      cursor: opts.cursor,
      eventTypes: opts.eventTypes,
    })
  }
}
