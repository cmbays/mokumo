/**
 * CustomerActivityService — domain service for the customer activity timeline.
 *
 * Central write path: ALL activity events flow through `log()`.
 * Server actions call this service — they never write to the repository directly.
 *
 * Read path: `list()` delegates to the repository for cursor-based pagination.
 *
 * The service receives its repository via constructor injection (DI).
 * The composition root (`src/infrastructure/bootstrap.ts`) wires the concrete
 * Supabase implementation to this port at startup.
 */

import type {
  ICustomerActivityRepository,
  ActivityInput,
  CustomerActivity,
  ActivityPage,
  ActivityFilter,
} from '@domain/ports/customer-activity.port'
import { activityInputSchema } from '@domain/ports/customer-activity.port'

export class CustomerActivityService {
  constructor(private readonly repo: ICustomerActivityRepository) {}

  /**
   * Log a single activity event to the customer timeline.
   *
   * This is the ONLY write path — all mutations must call this method.
   * Input is validated via Zod before persistence.
   *
   * @throws ZodError if input is invalid
   * @throws Error if the repository insert fails
   */
  async log(input: ActivityInput): Promise<CustomerActivity> {
    const validated = activityInputSchema.parse(input)
    return this.repo.insert(validated)
  }

  /**
   * List activities for a customer, newest first, with cursor-based pagination.
   *
   * @param customerId - UUID of the customer
   * @param opts.limit - Items per page (default 20, max 50)
   * @param opts.cursor - ISO datetime cursor from previous page's nextCursor
   * @param opts.filter - Optional source filter
   */
  async list(
    customerId: string,
    opts: {
      limit?: number
      cursor?: string | null
      filter?: ActivityFilter
    } = {}
  ): Promise<ActivityPage> {
    const limit = Math.min(opts.limit ?? 20, 50)
    return this.repo.listForCustomer(customerId, {
      limit,
      cursor: opts.cursor,
      filter: opts.filter,
    })
  }
}
