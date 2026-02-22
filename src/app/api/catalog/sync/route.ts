import 'server-only'
import { timingSafeEqual } from 'node:crypto'
import { syncCatalogFromSupplier } from '@infra/services/catalog-sync.service'
import { logger } from '@shared/lib/logger'

const syncLogger = logger.child({ domain: 'catalog-sync-endpoint' })

/**
 * POST /api/catalog/sync
 *
 * Admin-only endpoint to sync the S&S Activewear catalog to Supabase PostgreSQL.
 * Validates the x-admin-secret header against process.env.ADMIN_SECRET using constant-time comparison.
 */
export async function POST(request: Request): Promise<Response> {
  try {
    // Validate that ADMIN_SECRET is configured
    const expectedSecret = process.env.ADMIN_SECRET
    if (!expectedSecret) {
      syncLogger.error('ADMIN_SECRET env var is not configured')
      return Response.json({ error: 'Server misconfigured' }, { status: 500 })
    }

    // Validate admin secret using constant-time comparison to prevent timing attacks
    const secret = request.headers.get('x-admin-secret') ?? ''
    const secretBuffer = Buffer.from(secret)
    const expectedBuffer = Buffer.from(expectedSecret)

    let isValid = false
    try {
      isValid =
        secretBuffer.length === expectedBuffer.length &&
        timingSafeEqual(secretBuffer, expectedBuffer)
    } catch {
      // timingSafeEqual throws if lengths differ; catch and treat as invalid
      isValid = false
    }

    if (!isValid) {
      syncLogger.warn('Catalog sync request denied: invalid or missing admin secret')
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Sync the catalog
    const synced = await syncCatalogFromSupplier()

    return Response.json({ synced, timestamp: new Date().toISOString() }, { status: 200 })
  } catch (error) {
    syncLogger.error('Catalog sync failed', { error })
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
