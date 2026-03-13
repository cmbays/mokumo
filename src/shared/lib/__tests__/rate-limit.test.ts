import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// server-only guard must be mocked before importing any server-only module
vi.mock('server-only', () => ({}))

vi.mock('@shared/lib/logger', () => ({
  logger: {
    child: vi.fn().mockReturnValue({
      error: vi.fn(),
      warn: vi.fn(),
      info: vi.fn(),
      debug: vi.fn(),
    }),
  },
}))

// vi.hoisted ensures these variables are initialized before vi.mock factories execute
const mockLimit = vi.hoisted(() => vi.fn())
const mockGetRedis = vi.hoisted(() => vi.fn())
const mockRatelimitCtor = vi.hoisted(() => vi.fn())

vi.mock('@upstash/ratelimit', () => {
  // Must be a regular function (not arrow) to be used as a constructor with `new`
  function MockRatelimit(this: unknown, config: unknown) {
    mockRatelimitCtor(config)
    return { limit: mockLimit }
  }
  MockRatelimit.slidingWindow = function () {
    return { type: 'sliding-window' }
  }
  return { Ratelimit: MockRatelimit }
})

vi.mock('@shared/lib/redis', () => ({ getRedis: mockGetRedis }))

import {
  checkAdminSyncRateLimit,
  checkCronInventorySyncRateLimit,
  getClientIp,
} from '@shared/lib/rate-limit'

describe('checkAdminSyncRateLimit', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  describe('when Redis is not configured', () => {
    beforeEach(() => {
      mockGetRedis.mockReturnValue(null)
    })

    it('fails open (limited: false) in development', async () => {
      vi.stubEnv('NODE_ENV', 'development')
      const result = await checkAdminSyncRateLimit('127.0.0.1')
      expect(result.limited).toBe(false)
    })

    it('fails open (limited: false) in test environment', async () => {
      vi.stubEnv('NODE_ENV', 'test')
      const result = await checkAdminSyncRateLimit('127.0.0.1')
      expect(result.limited).toBe(false)
    })

    it('fails closed (limited: true) in production', async () => {
      vi.stubEnv('NODE_ENV', 'production')
      const result = await checkAdminSyncRateLimit('192.168.1.1')
      expect(result.limited).toBe(true)
    })
  })

  describe('when Redis is configured', () => {
    beforeEach(() => {
      mockGetRedis.mockReturnValue({})
    })

    it('uses rate_limit:admin_sync as the Redis key prefix', async () => {
      mockLimit.mockResolvedValue({ success: true })
      await checkAdminSyncRateLimit('1.2.3.4')
      // Only verified on first construction — singleton reuses after that
      expect(mockRatelimitCtor).toHaveBeenCalledWith(
        expect.objectContaining({ prefix: 'rate_limit:admin_sync' })
      )
    })

    it('returns limited: false when under the rate limit', async () => {
      mockLimit.mockResolvedValue({ success: true })
      const result = await checkAdminSyncRateLimit('10.0.0.1')
      expect(result.limited).toBe(false)
    })

    it('returns limited: true when the rate limit is exceeded', async () => {
      mockLimit.mockResolvedValue({ success: false })
      const result = await checkAdminSyncRateLimit('10.0.0.2')
      expect(result.limited).toBe(true)
    })

    it('passes the IP as the limit key', async () => {
      mockLimit.mockResolvedValue({ success: true })
      await checkAdminSyncRateLimit('203.0.113.42')
      expect(mockLimit).toHaveBeenCalledWith('203.0.113.42')
    })

    it('fails open on Redis errors rather than crashing', async () => {
      mockLimit.mockRejectedValue(new Error('Connection timeout'))
      const result = await checkAdminSyncRateLimit('10.0.0.3')
      expect(result.limited).toBe(false)
    })
  })
})

describe('checkCronInventorySyncRateLimit', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  describe('when Redis is not configured', () => {
    beforeEach(() => {
      mockGetRedis.mockReturnValue(null)
    })

    it('fails open (limited: false) in all environments — no NODE_ENV check unlike admin/signin', async () => {
      vi.stubEnv('NODE_ENV', 'production')
      const result = await checkCronInventorySyncRateLimit()
      expect(result.limited).toBe(false)
    })

    it('fails open in development too', async () => {
      vi.stubEnv('NODE_ENV', 'development')
      const result = await checkCronInventorySyncRateLimit()
      expect(result.limited).toBe(false)
    })
  })

  describe('when Redis is configured', () => {
    beforeEach(() => {
      mockGetRedis.mockReturnValue({})
    })

    it('uses rate_limit:cron_sync_inventory as the Redis key prefix', async () => {
      mockLimit.mockResolvedValue({ success: true })
      await checkCronInventorySyncRateLimit()
      expect(mockRatelimitCtor).toHaveBeenCalledWith(
        expect.objectContaining({ prefix: 'rate_limit:cron_sync_inventory' })
      )
    })

    it('uses a fixed key ("cron-sync-inventory"), not an IP address', async () => {
      mockLimit.mockResolvedValue({ success: true })
      await checkCronInventorySyncRateLimit()
      expect(mockLimit).toHaveBeenCalledWith('cron-sync-inventory')
    })

    it('returns limited: false when under the rate limit', async () => {
      mockLimit.mockResolvedValue({ success: true })
      const result = await checkCronInventorySyncRateLimit()
      expect(result.limited).toBe(false)
    })

    it('returns limited: true when the rate limit is exceeded', async () => {
      mockLimit.mockResolvedValue({ success: false })
      const result = await checkCronInventorySyncRateLimit()
      expect(result.limited).toBe(true)
    })

    it('fails open on Redis errors rather than crashing', async () => {
      mockLimit.mockRejectedValue(new Error('Connection timeout'))
      const result = await checkCronInventorySyncRateLimit()
      expect(result.limited).toBe(false)
    })
  })
})

describe('getClientIp', () => {
  it('extracts the first IP from x-forwarded-for', () => {
    const request = new Request('http://localhost/', {
      headers: { 'x-forwarded-for': '203.0.113.1, 10.0.0.1' },
    })
    expect(getClientIp(request)).toBe('203.0.113.1')
  })

  it('trims whitespace around the IP', () => {
    const request = new Request('http://localhost/', {
      headers: { 'x-forwarded-for': '  198.51.100.5  ' },
    })
    expect(getClientIp(request)).toBe('198.51.100.5')
  })

  it('falls back to "unknown" when x-forwarded-for is absent', () => {
    const request = new Request('http://localhost/')
    expect(getClientIp(request)).toBe('unknown')
  })
})
