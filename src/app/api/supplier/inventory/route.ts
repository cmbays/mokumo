import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { z } from 'zod'
import { ssGet, SSClientError, SSRateLimitError, SS_CACHE_TTL } from '@lib/suppliers/ss-client'
import { logger } from '@shared/lib/logger'
import { withRequestContext } from '@shared/lib/request-context'

const routeLogger = logger.child({ domain: 'supplier-route', segment: 'inventory' })

/**
 * skuIds: comma-separated list of S&S SKU IDs.
 * Max length guards against request-size abuse; individual IDs typically
 * look like "3001C-S-Black" (style-size-color), roughly 20 chars each.
 */
const querySchema = z.object({
  skuIds: z.string().min(1).max(2000),
})

export const GET = withRequestContext(async (request: NextRequest) => {
  // TODO(Phase 2): Replace with Supabase Auth JWT verification
  const cookieStore = await cookies()
  const demoAccess = cookieStore.get('demo-access')?.value
  if (demoAccess !== 'true') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const parsed = querySchema.safeParse(Object.fromEntries(request.nextUrl.searchParams))
  if (!parsed.success) {
    routeLogger.warn('Query parameter validation failed', {
      fields: parsed.error.issues.map((i) => i.path.join('.')),
    })
    return NextResponse.json({ error: 'Invalid query parameters' }, { status: 400 })
  }

  try {
    // S&S API expects 'skuids' (lowercase) — remap from our camelCase param name
    const data = await ssGet('inventory', { skuids: parsed.data.skuIds }, SS_CACHE_TTL.inventory)
    return NextResponse.json(data)
  } catch (err) {
    if (err instanceof SSRateLimitError) {
      return NextResponse.json(
        { error: 'Rate limit reached. Please retry later.' },
        { status: 429, headers: { 'Retry-After': String(err.retryAfter) } }
      )
    }
    if (err instanceof SSClientError) {
      return NextResponse.json({ error: 'Supplier API unavailable' }, { status: err.status })
    }
    routeLogger.error('Unhandled error in supplier route', {
      error: Error.isError(err) ? err.message : String(err),
      errorName: Error.isError(err) ? err.name : 'unknown',
    })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
})
