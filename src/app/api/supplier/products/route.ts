import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { z } from 'zod'
import { ssGet, SSClientError, SSRateLimitError, SS_CACHE_TTL } from '@lib/suppliers/ss-client'
import { logger } from '@shared/lib/logger'

const routeLogger = logger.child({ domain: 'supplier-route', segment: 'products' })

/**
 * styleId is required — prevents pulling the entire S&S product catalog
 * in a single request, which would exhaust the 60 req/min rate limit.
 */
const querySchema = z.object({
  styleId: z.string().min(1).max(500),
})

export async function GET(request: NextRequest) {
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
    const data = await ssGet('products', { styleId: parsed.data.styleId }, SS_CACHE_TTL.products)
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
}
