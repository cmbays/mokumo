export type DispatchResult = {
  messageId: string
}

/**
 * Port interface for enqueueing background jobs.
 *
 * The domain-layer interface accepts a plain `string` jobType so the port has
 * no dependency on infrastructure-level job-type enums. Concrete implementations
 * (QStash, in-process test double) narrow this with their own validation.
 *
 * Returns null instead of throwing when the job system is not configured,
 * enabling graceful degradation in dev / CI environments without Upstash.
 */
export type IJobDispatcher = {
  dispatch(
    jobType: string,
    data?: Record<string, unknown>
  ): Promise<DispatchResult | null>
}
