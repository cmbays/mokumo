import 'server-only'
import { z } from 'zod'
import { runCatalogPipeline } from '@infra/services/catalog-pipeline.service'
import { validateAdminSecret } from '@shared/lib/admin-auth'
import { logger } from '@shared/lib/logger'
import { checkAdminSyncRateLimit, getClientIp } from '@shared/lib/rate-limit'
import { withRequestContext } from '@shared/lib/request-context'

// Prevent Next.js from statically optimising this route — cron jobs need fresh data.
export const dynamic = 'force-dynamic'

const syncLogger = logger.child({ domain: 'catalog-pipeline-endpoint' })

const requestBodySchema = z
  .object({
    styleIds: z.array(z.string().min(1)).optional(),
    /** Pagination: skip the first N styles from the full catalog list. */
    offset: z.number().int().nonnegative().optional(),
    /** Pagination: process at most N styles (after offset). */
    limit: z.number().int().positive().max(500).optional(),
  })
  .optional()

/**
 * GET /api/catalog/sync-pipeline
 *
 * Vercel Cron target — runs every Sunday at 02:00 UTC ("0 2 * * 0").
 * Vercel authenticates the request with Authorization: Bearer {CRON_SECRET}.
 * Runs the full catalog pipeline: styles → products → brands.
 */
export const GET = withRequestContext(async (request: Request): Promise<Response> => {
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret) {
    syncLogger.error('CRON_SECRET env var is not configured')
    return Response.json({ error: 'Server misconfigured' }, { status: 500 })
  }

  if (request.headers.get('authorization') !== `Bearer ${cronSecret}`) {
    syncLogger.warn('Cron request denied: missing or invalid Authorization header')
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const result = await runCatalogPipeline()
    return Response.json(result, { status: 200 })
  } catch (error) {
    syncLogger.error('Catalog pipeline (cron) failed', {
      error: Error.isError(error) ? error.message : String(error),
      errorName: Error.isError(error) ? error.name : 'unknown',
    })
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
})

/**
 * POST /api/catalog/sync-pipeline
 *
 * Admin-triggered full catalog pipeline — chains styles → products → brands.
 * Optional body: { styleIds?: string[], offset?: number, limit?: number }
 * to limit the products-sync step to a subset of styles.
 */
export const POST = withRequestContext(async (request: Request): Promise<Response> => {
  try {
    const ip = getClientIp(request)
    const { limited } = await checkAdminSyncRateLimit(ip)
    if (limited) {
      return Response.json(
        { error: 'Too many requests' },
        { status: 429, headers: { 'Retry-After': '60' } }
      )
    }

    const auth = validateAdminSecret(request)
    if (!auth.valid) {
      return Response.json({ error: auth.error }, { status: auth.status })
    }

    let pipelineOpts: z.infer<typeof requestBodySchema>
    const contentType = request.headers.get('content-type')
    if (contentType?.includes('application/json')) {
      try {
        const body = requestBodySchema.parse(await request.json())
        pipelineOpts = body
      } catch (parseErr) {
        if (parseErr instanceof z.ZodError) {
          return Response.json({ error: 'Invalid request body' }, { status: 400 })
        }
        throw parseErr
      }
    }

    const result = await runCatalogPipeline(pipelineOpts)
    return Response.json(result, { status: 200 })
  } catch (error) {
    syncLogger.error('Catalog pipeline (manual) failed', {
      error: Error.isError(error) ? error.message : String(error),
      errorName: Error.isError(error) ? error.name : 'unknown',
    })
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
})
