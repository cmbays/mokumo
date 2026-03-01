import 'server-only'
import { syncBrandsFromSupplier } from '@infra/services/brands-sync.service'
import { validateAdminSecret } from '@shared/lib/admin-auth'
import { logger } from '@shared/lib/logger'
import { checkAdminSyncRateLimit, getClientIp } from '@shared/lib/rate-limit'
import { withRequestContext } from '@shared/lib/request-context'

const syncLogger = logger.child({ domain: 'brands-sync-endpoint' })

/**
 * POST /api/catalog/sync-brands
 *
 * Admin-only endpoint to sync S&S brand metadata into catalog_brands.
 * No request body needed — brands are always synced in full (~100 rows).
 * Triggered manually or as part of the catalog pipeline (Wave 3b).
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

    const result = await syncBrandsFromSupplier()

    return Response.json({ ...result, timestamp: new Date().toISOString() }, { status: 200 })
  } catch (error) {
    syncLogger.error('Brands sync failed', {
      error: Error.isError(error) ? error.message : String(error),
      errorName: Error.isError(error) ? error.name : 'unknown',
    })
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
})
