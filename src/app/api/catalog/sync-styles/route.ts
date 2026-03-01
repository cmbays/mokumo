import 'server-only'
import { syncStylesFromSupplier } from '@infra/services/styles-sync.service'
import { validateAdminSecret } from '@shared/lib/admin-auth'
import { logger } from '@shared/lib/logger'
import { checkAdminSyncRateLimit, getClientIp } from '@shared/lib/rate-limit'
import { withRequestContext } from '@shared/lib/request-context'

const syncLogger = logger.child({ domain: 'styles-sync-endpoint' })

/**
 * POST /api/catalog/sync-styles
 *
 * Admin-only endpoint to sync the S&S Activewear styles catalog to Supabase PostgreSQL.
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

    const synced = await syncStylesFromSupplier()

    return Response.json({ synced, timestamp: new Date().toISOString() }, { status: 200 })
  } catch (error) {
    syncLogger.error('Styles sync failed', {
      error: Error.isError(error) ? error.message : String(error),
      errorName: Error.isError(error) ? error.name : 'unknown',
    })
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
})
