import 'server-only'
import { getQStashReceiver } from '@shared/lib/qstash'
import { logger } from '@shared/lib/logger'
import { requestContext } from '@shared/lib/request-context'
import { jobTypeSchema, jobPayloadSchema } from '@infra/jobs/job-types'
import { handleInventoryRefresh } from '@infra/jobs/handlers/inventory-refresh.handler'

// Prevent Next.js from statically optimising this route.
export const dynamic = 'force-dynamic'

const jobLogger = logger.child({ domain: 'job-handler' })

// ─── Handler registry ──────────────────────────────────────────────────────

type HandlerFn = (data: Record<string, unknown>) => Promise<void>

const handlers: Record<string, HandlerFn> = {
  'inventory-refresh': handleInventoryRefresh,
  'cache-warm': async () => {
    // TODO(M1): implement cache warming
    jobLogger.info('cache-warm handler: no-op placeholder')
  },
  'garment-sync': async () => {
    // TODO(M1): implement garment sync
    jobLogger.info('garment-sync handler: no-op placeholder')
  },
}

// ─── Signature verification ────────────────────────────────────────────────

async function verifyQStashSignature(request: Request): Promise<boolean> {
  const receiver = getQStashReceiver()
  if (!receiver) {
    // No signing keys configured — only allow in non-production environments
    if (process.env.NODE_ENV === 'production') {
      jobLogger.error('QStash signing keys not configured in production — rejecting request')
      return false
    }
    jobLogger.warn('QStash signing keys not configured — skipping signature check (dev/CI only)')
    return true
  }

  const body = await request.text()
  const signature = request.headers.get('upstash-signature')

  if (!signature) {
    jobLogger.warn('Job request missing upstash-signature header')
    return false
  }

  try {
    const isValid = await receiver.verify({ signature, body })
    return isValid
  } catch {
    jobLogger.warn('QStash signature verification failed')
    return false
  }
}

// ─── POST handler ──────────────────────────────────────────────────────────

/**
 * POST /api/jobs/[jobType]
 *
 * QStash webhook receiver. Verifies the request signature, parses the payload,
 * and delegates to the appropriate handler.
 *
 * QStash retries this endpoint up to DEFAULT_RETRY_POLICY.retries times on
 * non-2xx responses, with exponential backoff.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ jobType: string }> }
): Promise<Response> {
  return requestContext.run({ requestId: crypto.randomUUID() }, async () => {
    const { jobType: rawJobType } = await params

    const jobTypeParsed = jobTypeSchema.safeParse(rawJobType)
    if (!jobTypeParsed.success) {
      jobLogger.warn('Unknown job type', { rawJobType })
      // Return 400 — QStash will NOT retry on 4xx, which is correct for unknown types
      return Response.json({ error: 'Unknown job type' }, { status: 400 })
    }

    const jobType = jobTypeParsed.data
    const handlerLogger = jobLogger.child({ jobType })

    // Clone the request: verifyQStashSignature reads the body as text,
    // then the handler below reads it again as JSON.
    const clonedRequest = request.clone()
    const isValid = await verifyQStashSignature(clonedRequest)
    if (!isValid) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let payload: Record<string, unknown>
    try {
      payload = await request.json()
    } catch {
      handlerLogger.warn('Failed to parse job payload as JSON')
      return Response.json({ error: 'Invalid JSON payload' }, { status: 400 })
    }

    const parsed = jobPayloadSchema.safeParse(payload)
    if (!parsed.success) {
      handlerLogger.warn('Job payload failed schema validation', {
        errors: parsed.error.flatten(),
      })
      return Response.json({ error: 'Invalid payload schema' }, { status: 400 })
    }

    const handler = handlers[jobType]
    if (!handler) {
      handlerLogger.error('No handler registered for job type', { jobType })
      return Response.json({ error: 'No handler for job type' }, { status: 500 })
    }

    handlerLogger.info('Executing job', { dispatchedAt: parsed.data.dispatchedAt })

    try {
      await handler(parsed.data.data ?? {})
      handlerLogger.info('Job completed successfully')
      return Response.json({ ok: true }, { status: 200 })
    } catch (error) {
      handlerLogger.error('Job handler threw an error', {
        error: Error.isError(error) ? error.message : String(error),
        errorName: Error.isError(error) ? error.name : 'unknown',
      })
      // Return 500 — QStash will retry
      return Response.json({ error: 'Job execution failed' }, { status: 500 })
    }
  })
}
