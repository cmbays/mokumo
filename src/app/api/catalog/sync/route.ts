import 'server-only'
import { syncCatalogFromSupplier } from '@infra/services/catalog-sync.service'
import { validateAdminSecret } from '@shared/lib/admin-auth'
import { logger } from '@shared/lib/logger'
import { checkAdminSyncRateLimit, getClientIp } from '@shared/lib/rate-limit'

const syncLogger = logger.child({ domain: 'catalog-sync-endpoint' })

/**
 * POST /api/catalog/sync
 *
 * Admin-only endpoint to sync the S&S Activewear catalog to Supabase PostgreSQL.
 */
export async function POST(request: Request): Promise<Response> {
  try {
    const ip = getClientIp(request)
    const { limited } = await checkAdminSyncRateLimit(ip)
    if (limited) {
      return Response.json({ error: 'Too many requests' }, { status: 429, headers: { 'Retry-After': '60' } })
    }

    const auth = validateAdminSecret(request)
    if (!auth.valid) {
      return Response.json({ error: auth.error }, { status: auth.status })
    }

    const synced = await syncCatalogFromSupplier()

    return Response.json({ synced, timestamp: new Date().toISOString() }, { status: 200 })
  } catch (error) {
    syncLogger.error('Catalog sync failed', { error })
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
