import 'server-only'
import { z } from 'zod'
import { syncRawPricingFromSupplier } from '@infra/services/pricing-sync.service'
import { validateAdminSecret } from '@shared/lib/admin-auth'
import { logger } from '@shared/lib/logger'
import { checkAdminSyncRateLimit, getClientIp } from '@shared/lib/rate-limit'
import { withRequestContext } from '@shared/lib/request-context'

const syncLogger = logger.child({ domain: 'pricing-sync-endpoint' })

const requestBodySchema = z
  .object({
    styleIds: z.array(z.string().min(1)).optional(),
  })
  .optional()

/**
 * POST /api/catalog/sync-pricing
 *
 * Admin-only endpoint to sync raw per-SKU pricing data from S&S Activewear
 * into the raw analytics table. Optional body: { styleIds: string[] } to
 * sync specific styles.
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

    // Parse optional body — return 400 for malformed input, not 500
    let styleIds: string[] | undefined
    const contentType = request.headers.get('content-type')
    if (contentType?.includes('application/json')) {
      try {
        const body = requestBodySchema.parse(await request.json())
        styleIds = body?.styleIds
      } catch (parseErr) {
        if (parseErr instanceof z.ZodError) {
          return Response.json({ error: 'Invalid request body' }, { status: 400 })
        }
        throw parseErr
      }
    }

    const result = await syncRawPricingFromSupplier(styleIds)

    return Response.json({ ...result, timestamp: new Date().toISOString() }, { status: 200 })
  } catch (error) {
    syncLogger.error('Pricing sync failed', { error })
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
})
