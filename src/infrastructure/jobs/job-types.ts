import { z } from 'zod'

// ─── Job type registry ─────────────────────────────────────────────────────

/**
 * All supported background job types.
 *
 * Adding a new job: add the string here, then add a handler in
 * src/infrastructure/jobs/handlers/ and register it in the dispatcher.
 */
export const jobTypeSchema = z.enum([
  'inventory-refresh',
  'cache-warm',
  'garment-sync',
])

export type JobType = z.infer<typeof jobTypeSchema>

// ─── Retry policy ──────────────────────────────────────────────────────────

/**
 * Default retry policy for all background jobs.
 *
 * QStash applies exponential backoff automatically when retries > 0.
 * The formula is: delay_seconds = min(retryIndex^2 * 10, 86400)
 * → retry 1: ~10s, retry 2: ~40s, retry 3: ~90s
 */
export const DEFAULT_RETRY_POLICY = {
  retries: 3,
} as const

// ─── Payload schema ────────────────────────────────────────────────────────

/** Wrapper schema for all job payloads delivered by QStash */
export const jobPayloadSchema = z.object({
  jobType: jobTypeSchema,
  /** ISO 8601 timestamp when the job was dispatched (for tracing) */
  dispatchedAt: z.string().datetime(),
  /** Arbitrary job-specific data */
  data: z.record(z.string(), z.unknown()).optional(),
})

export type JobPayload = z.infer<typeof jobPayloadSchema>
