import 'server-only'
import { getQStashReceiver } from '@shared/lib/qstash'
import { logger } from '@shared/lib/logger'
import { withRequestContext } from '@shared/lib/request-context'

// Prevent Next.js from statically optimising this route.
export const dynamic = 'force-dynamic'

const dlqLogger = logger.child({ domain: 'job-dlq' })

// ─── POST handler ──────────────────────────────────────────────────────────

/**
 * POST /api/jobs/dlq
 *
 * Dead letter queue receiver. Called by QStash after all retries for a job
 * have been exhausted. Logs the failed job for monitoring and alerting.
 *
 * This endpoint is configured as `failureCallback` in the dispatcher.
 * It always returns 200 so QStash does not retry the DLQ notification itself.
 */
export const POST = withRequestContext(async (request: Request): Promise<Response> => {
  const receiver = getQStashReceiver()
  if (receiver) {
    const body = await request.clone().text()
    const signature = request.headers.get('upstash-signature') ?? ''
    try {
      const isValid = await receiver.verify({ signature, body })
      if (!isValid) {
        dlqLogger.warn('DLQ request failed signature verification')
        return Response.json({ error: 'Unauthorized' }, { status: 401 })
      }
    } catch {
      dlqLogger.warn('DLQ signature verification error')
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    body = null
  }

  // QStash wraps the original failed message in a sourceMessageId header
  const sourceMessageId = request.headers.get('upstash-source-message-id')
  const failedUrl = request.headers.get('upstash-failure-callback-forward-source-url')
  const retryCount = request.headers.get('upstash-retried')

  dlqLogger.error('Job exhausted all retries — moving to dead letter', {
    sourceMessageId,
    failedUrl,
    retryCount,
    payload: body,
  })

  // Always return 200 — if we return non-2xx, QStash would retry the DLQ
  // notification itself, which is not what we want.
  return Response.json({ ok: true, status: 'dead-lettered' }, { status: 200 })
})
