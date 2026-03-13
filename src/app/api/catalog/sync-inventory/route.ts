import 'server-only'
import { syncInventoryFromSupplier } from '@infra/services/inventory-sync.service'
import { validateAdminSecret } from '@shared/lib/admin-auth'
import { logger } from '@shared/lib/logger'
import {
  checkAdminSyncRateLimit,
  checkCronInventorySyncRateLimit,
  getClientIp,
} from '@shared/lib/rate-limit'
import { withRequestContext } from '@shared/lib/request-context'

// Prevent Next.js from statically optimising this route — cron jobs need fresh data.
export const dynamic = 'force-dynamic'

const syncLogger = logger.child({ domain: 'inventory-sync-endpoint' })

/**
 * GET /api/catalog/sync-inventory
 *
 * Vercel Cron target — runs every 15 minutes ("*\/15 * * * *").
 * Vercel authenticates the request with Authorization: Bearer {CRON_SECRET}.
 *
 * Rate limiting: 1 execution per 10-minute window (Redis sliding window, fixed key).
 * Fails open when Redis is unavailable — syncs must not be blocked by Redis outages.
 *
 * Cache invalidation: revalidateTag('inventory') after a successful sync so the
 * getInStockStyleIds() cache (60s TTL) is flushed and the UI picks up fresh data promptly.
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

  const { limited } = await checkCronInventorySyncRateLimit()
  if (limited) {
    syncLogger.warn('Cron inventory sync rate-limited — previous run still within 10-minute window')
    return Response.json(
      { error: 'Too many requests' },
      { status: 429, headers: { 'Retry-After': '600' } }
    )
  }

  let result: Awaited<ReturnType<typeof syncInventoryFromSupplier>>
  try {
    result = await syncInventoryFromSupplier()
  } catch (error) {
    syncLogger.error('Inventory sync (cron) failed', {
      error: Error.isError(error) ? error.message : String(error),
      errorName: Error.isError(error) ? error.name : 'unknown',
    })
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }

  // Flush the in-stock style IDs cache so the UI reflects the new inventory
  // within the next 60s (the getInStockStyleIds TTL). Isolated so a cache
  // invalidation failure never misreports a successful sync as a 500.
  try {
    const { revalidateTag } = await import('next/cache')
    revalidateTag('inventory', { expire: 0 })
  } catch (revalidateError) {
    syncLogger.warn('revalidateTag failed after successful inventory sync (cron)', {
      error: String(revalidateError),
    })
  }

  return Response.json({ ...result, timestamp: new Date().toISOString() }, { status: 200 })
})

/**
 * POST /api/catalog/sync-inventory
 *
 * Manual admin trigger — use x-admin-secret header for authentication.
 * Same sync logic as the cron GET; useful for on-demand refreshes in dev/staging.
 *
 * Auth check happens before the rate-limit check so unauthenticated callers
 * cannot consume limiter tokens for legitimate IPs.
 */
export const POST = withRequestContext(async (request: Request): Promise<Response> => {
  // Auth first — unauthenticated requests never reach the rate limiter.
  const auth = validateAdminSecret(request)
  if (!auth.valid) {
    return Response.json({ error: auth.error }, { status: auth.status })
  }

  const ip = getClientIp(request)
  const { limited } = await checkAdminSyncRateLimit(ip)
  if (limited) {
    return Response.json(
      { error: 'Too many requests' },
      { status: 429, headers: { 'Retry-After': '60' } }
    )
  }

  let result: Awaited<ReturnType<typeof syncInventoryFromSupplier>>
  try {
    result = await syncInventoryFromSupplier()
  } catch (error) {
    syncLogger.error('Inventory sync (manual) failed', {
      error: Error.isError(error) ? error.message : String(error),
      errorName: Error.isError(error) ? error.name : 'unknown',
    })
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }

  try {
    const { revalidateTag } = await import('next/cache')
    revalidateTag('inventory', { expire: 0 })
  } catch (revalidateError) {
    syncLogger.warn('revalidateTag failed after successful inventory sync (manual)', {
      error: String(revalidateError),
    })
  }

  return Response.json({ ...result, timestamp: new Date().toISOString() }, { status: 200 })
})
