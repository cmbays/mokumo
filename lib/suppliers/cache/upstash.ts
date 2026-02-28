/**
 * UpstashCacheStore — Redis-backed CacheStore for the supplier adapter layer.
 *
 * Implements the CacheStore interface using Upstash Redis REST API.
 * Values are serialized to JSON on write and deserialized on read.
 * TTL is set atomically via the `ex` option on SET — no separate EXPIRE call needed.
 *
 * When UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN are not configured,
 * use InMemoryCacheStore instead. This class assumes credentials are present.
 *
 * @module lib/suppliers/cache/upstash
 */
import { Redis } from '@upstash/redis'
import type { CacheStore } from '../types'
import { logger } from '@shared/lib/logger'

const cacheLogger = logger.child({ domain: 'upstash-cache' })

export class UpstashCacheStore implements CacheStore {
  private readonly redis: Redis

  constructor() {
    // Redis constructor reads UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN
    // from environment automatically. Throws at construction if either is missing.
    this.redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      // Upstash automatically deserializes JSON — no manual JSON.parse needed.
      const value = await this.redis.get<T>(key)
      return value ?? null
    } catch (err) {
      cacheLogger.warn('Cache GET failed, treating as miss', {
        key,
        error: Error.isError(err) ? err.message : String(err),
      })
      return null
    }
  }

  async set<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
    try {
      // `ex` sets the expiry in seconds atomically with the SET command.
      await this.redis.set(key, value, { ex: ttlSeconds })
    } catch (err) {
      // Cache write failures are non-fatal — the caller gets fresh data next time.
      cacheLogger.warn('Cache SET failed', {
        key,
        ttlSeconds,
        error: Error.isError(err) ? err.message : String(err),
      })
    }
  }

  async del(key: string): Promise<void> {
    try {
      await this.redis.del(key)
    } catch (err) {
      cacheLogger.warn('Cache DEL failed', {
        key,
        error: Error.isError(err) ? err.message : String(err),
      })
    }
  }
}
