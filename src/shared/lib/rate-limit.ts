import 'server-only'
import { Ratelimit } from '@upstash/ratelimit'
import { getRedis } from './redis'

const SIGNIN_ATTEMPTS = 5
const SIGNIN_WINDOW = '15 m'

let _signInLimiter: Ratelimit | null = null

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

/**
 * Check the sign-in rate limit for a given IP address.
 *
 * Returns { limited: true } when the caller has exceeded 5 attempts in 15
 * minutes. Returns { limited: false } when Redis is not configured (graceful
 * degradation for dev/CI environments).
 */
export async function checkSignInRateLimit(ip: string): Promise<{ limited: boolean }> {
  const limiter = getSignInLimiter()
  if (!limiter) return { limited: false }
  const { success } = await limiter.limit(ip)
  return { limited: !success }
}
