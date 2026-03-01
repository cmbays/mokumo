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

vi.mock('@infra/services/products-sync.service', () => ({
  syncProductsFromSupplier: vi.fn(),
}))

import { POST } from '../route'
import { checkAdminSyncRateLimit } from '@shared/lib/rate-limit'
import { validateAdminSecret } from '@shared/lib/admin-auth'
import { syncProductsFromSupplier } from '@infra/services/products-sync.service'

function makeRequest(
  overrides: { headers?: Record<string, string>; body?: unknown } = {}
): Request {
  const { headers = {}, body } = overrides
  return new Request('http://localhost/api/catalog/sync-products', {
    method: 'POST',
    headers: { 'x-admin-secret': 'test-secret', ...headers },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
}

describe('POST /api/catalog/sync-products', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(validateAdminSecret).mockReturnValue({ valid: true })
    vi.mocked(syncProductsFromSupplier).mockResolvedValue({ synced: 10, errors: 0, total: 10 })
  })

  describe('rate limiting', () => {
    it('returns 429 with Retry-After header when the rate limit is exceeded', async () => {
      vi.mocked(checkAdminSyncRateLimit).mockResolvedValue({ limited: true })

      const response = await POST(makeRequest({ headers: { 'x-forwarded-for': '10.0.0.5' } }))

      expect(response.status).toBe(429)
      expect(response.headers.get('Retry-After')).toBe('60')
      const body = await response.json()
      expect(body.error).toBe('Too many requests')
    })

    it('extracts the first IP from x-forwarded-for and passes it to the limiter', async () => {
      vi.mocked(checkAdminSyncRateLimit).mockResolvedValue({ limited: false })

      await POST(makeRequest({ headers: { 'x-forwarded-for': '198.51.100.1, 10.0.0.2' } }))

      expect(checkAdminSyncRateLimit).toHaveBeenCalledWith('198.51.100.1')
    })

    it('falls back to "unknown" when x-forwarded-for is absent', async () => {
      vi.mocked(checkAdminSyncRateLimit).mockResolvedValue({ limited: false })

      await POST(makeRequest())

      expect(checkAdminSyncRateLimit).toHaveBeenCalledWith('unknown')
    })

    it('does not call the products sync service when rate limited', async () => {
      vi.mocked(checkAdminSyncRateLimit).mockResolvedValue({ limited: true })

      await POST(makeRequest())

      expect(syncProductsFromSupplier).not.toHaveBeenCalled()
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

    it('returns 200 with sync result on success', async () => {
      vi.mocked(syncProductsFromSupplier).mockResolvedValue({ synced: 48, errors: 2, total: 50 })

      const response = await POST(makeRequest())

      expect(response.status).toBe(200)
      const body = await response.json()
      expect(body.synced).toBe(48)
      expect(body.errors).toBe(2)
      expect(body.timestamp).toBeDefined()
    })

    it('passes styleIds from the request body to the sync service', async () => {
      const response = await POST(
        makeRequest({
          headers: { 'content-type': 'application/json' },
          body: { styleIds: ['STYLE-001', 'STYLE-002'] },
        })
      )

      expect(response.status).toBe(200)
      expect(syncProductsFromSupplier).toHaveBeenCalledWith(['STYLE-001', 'STYLE-002'], {
        offset: undefined,
        limit: undefined,
      })
    })

    it('returns 400 for a malformed request body', async () => {
      const badRequest = new Request('http://localhost/api/catalog/sync-products', {
        method: 'POST',
        headers: { 'x-admin-secret': 'test-secret', 'content-type': 'application/json' },
        body: JSON.stringify({ styleIds: [123, 456] }), // numbers instead of strings
      })

      const response = await POST(badRequest)

      expect(response.status).toBe(400)
    })
  })
})
