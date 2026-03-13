import 'server-only'
import { getQStashClient } from '@shared/lib/qstash'
import { logger } from '@shared/lib/logger'
import { jobTypeSchema, DEFAULT_RETRY_POLICY, type JobType, type JobPayload } from './job-types'

const dispatchLogger = logger.child({ domain: 'job-dispatcher' })

// ─── Port interface ─────────────────────────────────────────────────────────

export type DispatchResult = {
  messageId: string
}

export type IJobDispatcher = {
  /**
   * Enqueue a background job via QStash.
   *
   * Returns the QStash messageId on success, or null when QStash is not
   * configured (graceful degradation in dev/CI).
   */
  dispatch(
    jobType: JobType,
    data?: Record<string, unknown>
  ): Promise<DispatchResult | null>
}

// ─── QStash implementation ──────────────────────────────────────────────────

/**
 * Builds the job handler URL for a given job type.
 * Requires NEXT_PUBLIC_APP_URL to be set in production.
 */
function buildJobUrl(jobType: JobType): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  return `${baseUrl}/api/jobs/${jobType}`
}

/**
 * Builds the dead letter queue callback URL.
 */
function buildDlqUrl(): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  return `${baseUrl}/api/jobs/dlq`
}

export const jobDispatcher: IJobDispatcher = {
  async dispatch(jobType, data = {}) {
    const client = getQStashClient()
    if (!client) {
      dispatchLogger.debug('QStash not configured — skipping job dispatch', { jobType })
      return null
    }

    const payload: JobPayload = {
      jobType,
      dispatchedAt: new Date().toISOString(),
      data,
    }

    dispatchLogger.info('Dispatching background job', { jobType, data })

    const result = await client.publishJSON({
      url: buildJobUrl(jobType),
      body: payload,
      retries: DEFAULT_RETRY_POLICY.retries,
      failureCallback: buildDlqUrl(),
    })

    dispatchLogger.info('Job dispatched', { jobType, messageId: result.messageId })

    return { messageId: result.messageId }
  },
}

// ─── Named exports for convenience ─────────────────────────────────────────

/**
 * Dispatch a job by job type string (validated at runtime via Zod).
 * Convenience wrapper for use in server actions.
 */
export async function dispatchJob(
  jobType: string,
  data?: Record<string, unknown>
): Promise<DispatchResult | null> {
  const parsed = jobTypeSchema.safeParse(jobType)
  if (!parsed.success) {
    dispatchLogger.warn('dispatchJob: invalid job type', { jobType })
    return null
  }
  return jobDispatcher.dispatch(parsed.data, data)
}
