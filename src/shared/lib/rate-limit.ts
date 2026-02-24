import 'server-only'
import { Ratelimit } from '@upstash/ratelimit'
import { logger } from './logger'
import { getRedis } from './redis'

const rateLimitLogger = logger.child({ domain: 'rate-limit' })

/**
 * Extract the real client IP from a server-side Request.
 * Prefers the first value in x-forwarded-for (set by Vercel's edge proxy).
 * Falls back to 'unknown' when neither header is present.
 */
export function getClientIp(request: Request): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
}

const SIGNIN_ATTEMPTS = 5
const SIGNIN_WINDOW = '15 m'

const ADMIN_SYNC_ATTEMPTS = 5
const ADMIN_SYNC_WINDOW = '1 m'

let _signInLimiter: Ratelimit | null = null
let _adminSyncLimiter: Ratelimit | null = null

function getSignInLimiter(): Ratelimit | null {
  const redis = getRedis()
  if (!redis) return null
  if (!_signInLimiter) {
    _signInLimiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(SIGNIN_ATTEMPTS, SIGNIN_WINDOW),
      prefix: 'rate_limit:signin',
    })
  }
  return _signInLimiter
}

function getAdminSyncLimiter(): Ratelimit | null {
  const redis = getRedis()
  if (!redis) return null
  if (!_adminSyncLimiter) {
    _adminSyncLimiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(ADMIN_SYNC_ATTEMPTS, ADMIN_SYNC_WINDOW),
      prefix: 'rate_limit:admin_sync',
    })
  }
  return _adminSyncLimiter
}

/**
 * Check the admin sync rate limit for a client IP address.
 *
 * - Returns { limited: true } when the IP exceeds 5 requests per minute.
 * - Fails CLOSED in production when Redis is unavailable (config error → block syncs).
 * - Fails open in dev/CI where Redis is intentionally not configured.
 * - Catches Redis errors and fails open rather than crashing the sync endpoint.
 */
export async function checkAdminSyncRateLimit(ip: string): Promise<{ limited: boolean }> {
  const limiter = getAdminSyncLimiter()
  if (!limiter) {
    if (process.env.NODE_ENV === 'production') {
      rateLimitLogger.error(
        'rate_limit.redis_unavailable: Redis not configured in production — blocking admin sync'
      )
      return { limited: true }
    }
    return { limited: false }
  }
  try {
    const { success } = await limiter.limit(ip)
    return { limited: !success }
  } catch (err) {
    rateLimitLogger.error('rate_limit.redis_error', { error: String(err) })
    return { limited: false }
  }
}

/**
 * Check the sign-in rate limit for a compound key (typically `${ip}:${email}`).
 *
 * - Returns { limited: true } when the key exceeds 5 attempts per 15 minutes.
 * - Fails CLOSED in production when Redis is unavailable (config error → block logins).
 * - Fails open in dev/CI where Redis is intentionally not configured.
 * - Catches Redis errors and fails open rather than crashing the login action.
 */
export async function checkSignInRateLimit(key: string): Promise<{ limited: boolean }> {
  const limiter = getSignInLimiter()
  if (!limiter) {
    if (process.env.NODE_ENV === 'production') {
      rateLimitLogger.error(
        'rate_limit.redis_unavailable: Redis not configured in production — blocking sign-in'
      )
      return { limited: true }
    }
    return { limited: false }
  }
  try {
    const { success } = await limiter.limit(key)
    return { limited: !success }
  } catch (err) {
    rateLimitLogger.error('rate_limit.redis_error', { error: String(err) })
    return { limited: false }
  }
}
