import 'server-only'
import { syncInventoryFromSupplier } from '@infra/services/inventory-sync.service'
import { validateAdminSecret } from '@shared/lib/admin-auth'
import { logger } from '@shared/lib/logger'
import { checkAdminSyncRateLimit, getClientIp } from '@shared/lib/rate-limit'
import { withRequestContext } from '@shared/lib/request-context'

// Prevent Next.js from statically optimising this route — cron jobs need fresh data.
export const dynamic = 'force-dynamic'

const syncLogger = logger.child({ domain: 'inventory-sync-endpoint' })

/**
 * GET /api/catalog/sync-inventory
 *
 * Vercel Cron target — runs every hour ("0 * * * *").
 * Vercel authenticates the request with Authorization: Bearer {CRON_SECRET}.
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
    const result = await syncInventoryFromSupplier()
    return Response.json({ ...result, timestamp: new Date().toISOString() }, { status: 200 })
  } catch (error) {
    syncLogger.error('Inventory sync (cron) failed', {
      error: Error.isError(error) ? error.message : String(error),
      errorName: Error.isError(error) ? error.name : 'unknown',
    })
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
})

/**
 * POST /api/catalog/sync-inventory
 *
 * Manual admin trigger — use x-admin-secret header for authentication.
 * Same sync logic as the cron GET; useful for on-demand refreshes in dev/staging.
 */
export const POST = withRequestContext(async (request: Request): Promise<Response> => {
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

  try {
    const result = await syncInventoryFromSupplier()
    return Response.json({ ...result, timestamp: new Date().toISOString() }, { status: 200 })
  } catch (error) {
    syncLogger.error('Inventory sync (manual) failed', {
      error: Error.isError(error) ? error.message : String(error),
      errorName: Error.isError(error) ? error.name : 'unknown',
    })
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
})
