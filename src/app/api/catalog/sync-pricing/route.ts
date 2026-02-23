import 'server-only'
import { timingSafeEqual } from 'node:crypto'
import { z } from 'zod'
import { syncRawPricingFromSupplier } from '@infra/services/pricing-sync.service'
import { logger } from '@shared/lib/logger'

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
 * into the raw analytics table. Validates x-admin-secret using constant-time
 * comparison. Optional body: { styleIds: string[] } to sync specific styles.
 */
export async function POST(request: Request): Promise<Response> {
  try {
    const expectedSecret = process.env.ADMIN_SECRET
    if (!expectedSecret) {
      syncLogger.error('ADMIN_SECRET env var is not configured')
      return Response.json({ error: 'Server misconfigured' }, { status: 500 })
    }

    const secret = request.headers.get('x-admin-secret') ?? ''
    const secretBuffer = Buffer.from(secret)
    const expectedBuffer = Buffer.from(expectedSecret)

    let isValid = false
    try {
      isValid =
        secretBuffer.length === expectedBuffer.length &&
        timingSafeEqual(secretBuffer, expectedBuffer)
    } catch {
      isValid = false
    }

    if (!isValid) {
      syncLogger.warn('Pricing sync request denied: invalid or missing admin secret')
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse optional body
    let styleIds: string[] | undefined
    const contentType = request.headers.get('content-type')
    if (contentType?.includes('application/json')) {
      const body = requestBodySchema.parse(await request.json())
      styleIds = body?.styleIds
    }

    const result = await syncRawPricingFromSupplier(styleIds)

    return Response.json({ ...result, timestamp: new Date().toISOString() }, { status: 200 })
  } catch (error) {
    syncLogger.error('Pricing sync failed', { error })
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
