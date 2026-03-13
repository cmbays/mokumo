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
  checkCronInventorySyncRateLimit: vi.fn(),
  getClientIp: (request: Request) =>
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown',
}))

vi.mock('next/cache', () => ({
  revalidateTag: vi.fn(),
}))

vi.mock('@shared/lib/admin-auth', () => ({
  validateAdminSecret: vi.fn(),
}))

vi.mock('@shared/lib/request-context', () => ({
  withRequestContext: (handler: (req: Request) => Promise<Response>) => handler,
}))

vi.mock('@infra/services/inventory-sync.service', () => ({
  syncInventoryFromSupplier: vi.fn(),
}))

import { GET, POST } from '../route'
import { checkAdminSyncRateLimit, checkCronInventorySyncRateLimit } from '@shared/lib/rate-limit'
import { validateAdminSecret } from '@shared/lib/admin-auth'
import { syncInventoryFromSupplier } from '@infra/services/inventory-sync.service'
import { revalidateTag } from 'next/cache'

const CRON_SECRET = 'test-cron-secret'

function makeGetRequest(overrides: { headers?: Record<string, string> } = {}): Request {
  return new Request('http://localhost/api/catalog/sync-inventory', {
    method: 'GET',
    headers: { authorization: `Bearer ${CRON_SECRET}`, ...overrides.headers },
  })
}

function makePostRequest(overrides: { headers?: Record<string, string> } = {}): Request {
  return new Request('http://localhost/api/catalog/sync-inventory', {
    method: 'POST',
    headers: { 'x-admin-secret': 'test-admin-secret', ...overrides.headers },
  })
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.stubEnv('CRON_SECRET', CRON_SECRET)
  vi.mocked(checkAdminSyncRateLimit).mockResolvedValue({ limited: false })
  vi.mocked(checkCronInventorySyncRateLimit).mockResolvedValue({ limited: false })
  vi.mocked(validateAdminSecret).mockReturnValue({ valid: true })
  vi.mocked(syncInventoryFromSupplier).mockResolvedValue({ synced: 10, rawInserted: 50, errors: 0 })
})

// ─── GET /api/catalog/sync-inventory (Vercel cron) ────────────────────────────

describe('GET /api/catalog/sync-inventory', () => {
  it('returns 500 when CRON_SECRET env var is not set', async () => {
    vi.stubEnv('CRON_SECRET', '')
    const response = await GET(makeGetRequest())
    expect(response.status).toBe(500)
    const body = await response.json()
    expect(body.error).toBe('Server misconfigured')
  })

  it('returns 401 when Authorization header is missing', async () => {
    const response = await GET(makeGetRequest({ headers: { authorization: '' } }))
    expect(response.status).toBe(401)
    const body = await response.json()
    expect(body.error).toBe('Unauthorized')
  })

  it('returns 401 when Bearer token does not match CRON_SECRET', async () => {
    const response = await GET(
      makeGetRequest({ headers: { authorization: 'Bearer wrong-secret' } })
    )
    expect(response.status).toBe(401)
    const body = await response.json()
    expect(body.error).toBe('Unauthorized')
  })

  it('returns 200 with sync result and timestamp on success', async () => {
    const response = await GET(makeGetRequest())
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.synced).toBe(10)
    expect(body.rawInserted).toBe(50)
    expect(body.errors).toBe(0)
    expect(body.timestamp).toBeDefined()
  })

  it('calls revalidateTag("inventory") after a successful sync', async () => {
    await GET(makeGetRequest())
    expect(revalidateTag).toHaveBeenCalledWith('inventory', {})
  })

  it('does not call revalidateTag when sync throws', async () => {
    vi.mocked(syncInventoryFromSupplier).mockRejectedValueOnce(new Error('DB down'))
    await GET(makeGetRequest())
    expect(revalidateTag).not.toHaveBeenCalled()
  })

  it('returns 500 when syncInventoryFromSupplier throws', async () => {
    vi.mocked(syncInventoryFromSupplier).mockRejectedValueOnce(new Error('DB down'))
    const response = await GET(makeGetRequest())
    expect(response.status).toBe(500)
    const body = await response.json()
    expect(body.error).toBe('Internal server error')
  })

  it('does not call sync service when auth fails', async () => {
    const response = await GET(makeGetRequest({ headers: { authorization: 'Bearer bad' } }))
    expect(response.status).toBe(401)
    expect(syncInventoryFromSupplier).not.toHaveBeenCalled()
  })

  describe('cron rate limiting', () => {
    it('returns 429 with Retry-After: 600 when cron rate limited', async () => {
      vi.mocked(checkCronInventorySyncRateLimit).mockResolvedValue({ limited: true })
      const response = await GET(makeGetRequest())
      expect(response.status).toBe(429)
      expect(response.headers.get('Retry-After')).toBe('600')
      const body = await response.json()
      expect(body.error).toBe('Too many requests')
    })

    it('does not call sync service when cron rate limited', async () => {
      vi.mocked(checkCronInventorySyncRateLimit).mockResolvedValue({ limited: true })
      await GET(makeGetRequest())
      expect(syncInventoryFromSupplier).not.toHaveBeenCalled()
    })

    it('calls sync service when cron rate limit allows', async () => {
      vi.mocked(checkCronInventorySyncRateLimit).mockResolvedValue({ limited: false })
      await GET(makeGetRequest())
      expect(syncInventoryFromSupplier).toHaveBeenCalledOnce()
    })
  })
})

// ─── POST /api/catalog/sync-inventory (admin manual trigger) ──────────────────

describe('POST /api/catalog/sync-inventory', () => {
  describe('rate limiting', () => {
    it('returns 429 with Retry-After header when rate limited', async () => {
      vi.mocked(checkAdminSyncRateLimit).mockResolvedValue({ limited: true })
      const response = await POST(makePostRequest({ headers: { 'x-forwarded-for': '10.0.0.1' } }))
      expect(response.status).toBe(429)
      expect(response.headers.get('Retry-After')).toBe('60')
      const body = await response.json()
      expect(body.error).toBe('Too many requests')
    })

    it('does not call sync service when rate limited', async () => {
      vi.mocked(checkAdminSyncRateLimit).mockResolvedValue({ limited: true })
      await POST(makePostRequest())
      expect(syncInventoryFromSupplier).not.toHaveBeenCalled()
    })
  })

  describe('when not rate limited', () => {
    it('returns 401 when admin secret is invalid', async () => {
      vi.mocked(validateAdminSecret).mockReturnValue({
        valid: false,
        error: 'Unauthorized',
        status: 401,
      })
      const response = await POST(makePostRequest())
      expect(response.status).toBe(401)
    })

    it('returns 200 with sync result and timestamp on success', async () => {
      const response = await POST(makePostRequest())
      expect(response.status).toBe(200)
      const body = await response.json()
      expect(body.synced).toBe(10)
      expect(body.rawInserted).toBe(50)
      expect(body.errors).toBe(0)
      expect(body.timestamp).toBeDefined()
    })

    it('calls revalidateTag("inventory") after a successful sync', async () => {
      await POST(makePostRequest())
      expect(revalidateTag).toHaveBeenCalledWith('inventory', {})
    })

    it('returns 500 when syncInventoryFromSupplier throws', async () => {
      vi.mocked(syncInventoryFromSupplier).mockRejectedValueOnce(new Error('Service error'))
      const response = await POST(makePostRequest())
      expect(response.status).toBe(500)
      const body = await response.json()
      expect(body.error).toBe('Internal server error')
    })

    it('does not call revalidateTag when sync throws', async () => {
      vi.mocked(syncInventoryFromSupplier).mockRejectedValueOnce(new Error('Service error'))
      await POST(makePostRequest())
      expect(revalidateTag).not.toHaveBeenCalled()
    })
  })
})
