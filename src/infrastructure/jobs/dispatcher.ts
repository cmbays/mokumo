import 'server-only'
import { getQStashClient } from '@shared/lib/qstash'
import { logger } from '@shared/lib/logger'
import { jobTypeSchema, DEFAULT_RETRY_POLICY, type JobType, type JobPayload } from './job-types'
import type { IJobDispatcher, DispatchResult } from '@domain/ports/job-dispatcher.port'

export type { IJobDispatcher, DispatchResult }

const dispatchLogger = logger.child({ domain: 'job-dispatcher' })

// ─── QStash implementation ──────────────────────────────────────────────────

/**
 * Resolves the application base URL for webhook callbacks.
 *
 * Resolution order:
 *  1. NEXT_PUBLIC_APP_URL  — explicit, canonical, preferred
 *  2. VERCEL_URL           — injected automatically on Vercel (preview + prod deploys)
 *  3. http://localhost:3000 — dev fallback only
 *
 * Logs a warning when falling back to VERCEL_URL or localhost in production,
 * because VERCEL_URL may be a branch URL rather than the canonical hostname.
 */
function resolveBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL
  }
  if (process.env.VERCEL_URL) {
    const url = `https://${process.env.VERCEL_URL}`
    if (process.env.NODE_ENV === 'production') {
      dispatchLogger.warn(
        'NEXT_PUBLIC_APP_URL not set — using VERCEL_URL for job callbacks. ' +
          'Set NEXT_PUBLIC_APP_URL to the canonical hostname to avoid preview-URL mismatch.',
        { vercelUrl: process.env.VERCEL_URL }
      )
    }
    return url
  }
  if (process.env.NODE_ENV === 'production') {
    dispatchLogger.error(
      'Neither NEXT_PUBLIC_APP_URL nor VERCEL_URL is set in production. ' +
        'Job webhook callbacks will point to localhost and will fail.',
      {}
    )
  }
  return 'http://localhost:3000'
}

function buildJobUrl(jobType: string): string {
  return `${resolveBaseUrl()}/api/jobs/${jobType}`
}

function buildDlqUrl(): string {
  return `${resolveBaseUrl()}/api/jobs/dlq`
}

export const jobDispatcher: IJobDispatcher = {
  async dispatch(jobType, data = {}) {
    const client = getQStashClient()
    if (!client) {
      dispatchLogger.debug('QStash not configured — skipping job dispatch', { jobType })
      return null
    }

    const payload: JobPayload = {
      jobType: jobType as JobType,
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
