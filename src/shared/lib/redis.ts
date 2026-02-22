import 'server-only'
import { Redis } from '@upstash/redis'

let _redis: Redis | null = null

/**
 * Returns a lazily-initialized Upstash Redis client, or null when the
 * environment variables are not configured (local dev, CI without Upstash).
 *
 * Callers must handle the null case — rate limiting and caching silently
 * degrade rather than hard-failing in environments without Redis.
 */
export function getRedis(): Redis | null {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    return null
  }
  if (!_redis) {
    _redis = Redis.fromEnv()
  }
  return _redis
}
