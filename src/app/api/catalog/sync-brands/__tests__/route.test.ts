import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('server-only', () => ({}))

vi.mock('@shared/lib/logger', () => ({
  logger: {
    child: vi.fn().mockReturnValue({
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      debug: vi.fn(),
    }),
  },
  setLogContextGetter: vi.fn(),
}))

vi.mock('@shared/lib/rate-limit', () => ({
  checkAdminSyncRateLimit: vi.fn(),
  getClientIp: (request: Request) =>
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown',
}))

vi.mock('@shared/lib/admin-auth', () => ({
  validateAdminSecret: vi.fn(),
}))

vi.mock('@shared/lib/request-context', () => ({
  withRequestContext: (handler: (req: Request) => Promise<Response>) => handler,
}))

vi.mock('@infra/services/brands-sync.service', () => ({
  syncBrandsFromSupplier: vi.fn(),
}))

import { POST } from '../route'
import { checkAdminSyncRateLimit } from '@shared/lib/rate-limit'
import { validateAdminSecret } from '@shared/lib/admin-auth'
import { syncBrandsFromSupplier } from '@infra/services/brands-sync.service'

function makeRequest(overrides: { headers?: Record<string, string> } = {}): Request {
  return new Request('http://localhost/api/catalog/sync-brands', {
    method: 'POST',
    headers: { 'x-admin-secret': 'test-secret', ...overrides.headers },
  })
}

describe('POST /api/catalog/sync-brands', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(validateAdminSecret).mockReturnValue({ valid: true })
    vi.mocked(syncBrandsFromSupplier).mockResolvedValue({ brandsUpserted: 10, errors: 0 })
  })

  describe('rate limiting', () => {
    it('returns 429 with Retry-After header when the rate limit is exceeded', async () => {
      vi.mocked(checkAdminSyncRateLimit).mockResolvedValue({ limited: true })

      const response = await POST(makeRequest({ headers: { 'x-forwarded-for': '10.0.0.1' } }))

      expect(response.status).toBe(429)
      expect(response.headers.get('Retry-After')).toBe('60')
      const body = await response.json()
      expect(body.error).toBe('Too many requests')
    })

    it('extracts the first IP from x-forwarded-for and passes it to the limiter', async () => {
      vi.mocked(checkAdminSyncRateLimit).mockResolvedValue({ limited: false })

      await POST(makeRequest({ headers: { 'x-forwarded-for': '203.0.113.1, 10.0.0.1' } }))

      expect(checkAdminSyncRateLimit).toHaveBeenCalledWith('203.0.113.1')
    })

    it('falls back to "unknown" when x-forwarded-for is absent', async () => {
      vi.mocked(checkAdminSyncRateLimit).mockResolvedValue({ limited: false })

      await POST(makeRequest())

      expect(checkAdminSyncRateLimit).toHaveBeenCalledWith('unknown')
    })

    it('does not call the sync service when rate limited', async () => {
      vi.mocked(checkAdminSyncRateLimit).mockResolvedValue({ limited: true })

      await POST(makeRequest())

      expect(syncBrandsFromSupplier).not.toHaveBeenCalled()
    })
  })

  describe('when not rate limited', () => {
    beforeEach(() => {
      vi.mocked(checkAdminSyncRateLimit).mockResolvedValue({ limited: false })
    })

    it('returns 401 when the admin secret is invalid', async () => {
      vi.mocked(validateAdminSecret).mockReturnValue({
        valid: false,
        error: 'Unauthorized',
        status: 401,
      })

      const response = await POST(makeRequest())

      expect(response.status).toBe(401)
    })

    it('returns 200 with brandsUpserted, errors, and timestamp on success', async () => {
      vi.mocked(syncBrandsFromSupplier).mockResolvedValue({ brandsUpserted: 42, errors: 0 })

      const response = await POST(makeRequest())

      expect(response.status).toBe(200)
      const body = await response.json()
      expect(body.brandsUpserted).toBe(42)
      expect(body.errors).toBe(0)
      expect(body.timestamp).toBeDefined()
    })

    it('returns 500 when the sync service throws', async () => {
      vi.mocked(syncBrandsFromSupplier).mockRejectedValue(new Error('S&S API unreachable'))

      const response = await POST(makeRequest())

      expect(response.status).toBe(500)
      const body = await response.json()
      expect(body.error).toBe('Internal server error')
    })
  })
})
