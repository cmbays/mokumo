import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { ssGet, SSClientError, SSRateLimitError, SS_CACHE_TTL } from '@lib/suppliers/ss-client'
import { logger } from '@shared/lib/logger'

const routeLogger = logger.child({ domain: 'supplier-route', segment: 'categories' })

export async function GET() {
  // TODO(Phase 2): Replace with Supabase Auth JWT verification
  const cookieStore = await cookies()
  const demoAccess = cookieStore.get('demo-access')?.value
  if (demoAccess !== 'true') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const data = await ssGet('categories', {}, SS_CACHE_TTL.categories)
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
