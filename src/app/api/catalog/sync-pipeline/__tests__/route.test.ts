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

vi.mock('@infra/services/catalog-pipeline.service', () => ({
  runCatalogPipeline: vi.fn(),
}))

import { GET, POST } from '../route'
import { checkAdminSyncRateLimit } from '@shared/lib/rate-limit'
import { validateAdminSecret } from '@shared/lib/admin-auth'
import { runCatalogPipeline } from '@infra/services/catalog-pipeline.service'

const CRON_SECRET = 'test-cron-secret'

const PIPELINE_RESULT = {
  styles: { synced: 100, errors: 0 },
  products: {
    stylesProcessed: 100,
    colorsUpserted: 320,
    sizesUpserted: 0,
    skusInserted: 4808,
    errors: 0,
  },
  brands: { brandsUpserted: 42, errors: 0 },
  duration: 45000,
  timestamp: '2026-03-01T02:01:30.000Z',
}

function makeGetRequest(overrides: { headers?: Record<string, string> } = {}): Request {
  return new Request('http://localhost/api/catalog/sync-pipeline', {
    method: 'GET',
    headers: { authorization: `Bearer ${CRON_SECRET}`, ...overrides.headers },
  })
}

function makePostRequest(
  overrides: { headers?: Record<string, string>; body?: unknown } = {}
): Request {
  const { headers = {}, body } = overrides
  return new Request('http://localhost/api/catalog/sync-pipeline', {
    method: 'POST',
    headers: { 'x-admin-secret': 'test-admin-secret', ...headers },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.stubEnv('CRON_SECRET', CRON_SECRET)
  vi.mocked(checkAdminSyncRateLimit).mockResolvedValue({ limited: false })
  vi.mocked(validateAdminSecret).mockReturnValue({ valid: true })
  vi.mocked(runCatalogPipeline).mockResolvedValue(PIPELINE_RESULT)
})

// ─── GET /api/catalog/sync-pipeline (Vercel cron) ─────────────────────────────

describe('GET /api/catalog/sync-pipeline', () => {
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

  it('returns 200 with full CatalogPipelineResult on success', async () => {
    const response = await GET(makeGetRequest())
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.styles).toEqual({ synced: 100, errors: 0 })
    expect(body.products.skusInserted).toBe(4808)
    expect(body.brands.brandsUpserted).toBe(42)
    expect(body.duration).toBe(45000)
    expect(body.timestamp).toBeDefined()
  })

  it('calls runCatalogPipeline with no options', async () => {
    await GET(makeGetRequest())
    expect(runCatalogPipeline).toHaveBeenCalledWith()
  })

  it('does not call pipeline when auth fails', async () => {
    const response = await GET(makeGetRequest({ headers: { authorization: 'Bearer bad' } }))
    expect(response.status).toBe(401)
    expect(runCatalogPipeline).not.toHaveBeenCalled()
  })

  it('returns 500 when runCatalogPipeline throws', async () => {
    vi.mocked(runCatalogPipeline).mockRejectedValueOnce(new Error('S&S API down'))
    const response = await GET(makeGetRequest())
    expect(response.status).toBe(500)
    const body = await response.json()
    expect(body.error).toBe('Internal server error')
  })
})

// ─── POST /api/catalog/sync-pipeline (admin manual trigger) ───────────────────

describe('POST /api/catalog/sync-pipeline', () => {
  describe('rate limiting', () => {
    it('returns 429 with Retry-After header when rate limited', async () => {
      vi.mocked(checkAdminSyncRateLimit).mockResolvedValue({ limited: true })
      const response = await POST(makePostRequest({ headers: { 'x-forwarded-for': '10.0.0.1' } }))
      expect(response.status).toBe(429)
      expect(response.headers.get('Retry-After')).toBe('60')
      const body = await response.json()
      expect(body.error).toBe('Too many requests')
    })

    it('does not call pipeline when rate limited', async () => {
      vi.mocked(checkAdminSyncRateLimit).mockResolvedValue({ limited: true })
      await POST(makePostRequest())
      expect(runCatalogPipeline).not.toHaveBeenCalled()
    })

    it('extracts the first IP from x-forwarded-for', async () => {
      await POST(makePostRequest({ headers: { 'x-forwarded-for': '203.0.113.1, 10.0.0.1' } }))
      expect(checkAdminSyncRateLimit).toHaveBeenCalledWith('203.0.113.1')
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
      expect(runCatalogPipeline).not.toHaveBeenCalled()
    })

    it('returns 200 with full CatalogPipelineResult on success', async () => {
      const response = await POST(makePostRequest())
      expect(response.status).toBe(200)
      const body = await response.json()
      expect(body.styles).toEqual({ synced: 100, errors: 0 })
      expect(body.products.skusInserted).toBe(4808)
      expect(body.brands.brandsUpserted).toBe(42)
      expect(body.duration).toBe(45000)
      expect(body.timestamp).toBeDefined()
    })

    it('passes styleIds from request body to the pipeline', async () => {
      await POST(
        makePostRequest({
          headers: { 'content-type': 'application/json' },
          body: { styleIds: ['STYLE-001', 'STYLE-002'] },
        })
      )

      expect(runCatalogPipeline).toHaveBeenCalledWith({
        styleIds: ['STYLE-001', 'STYLE-002'],
        offset: undefined,
        limit: undefined,
      })
    })

    it('passes offset and limit from request body to the pipeline', async () => {
      await POST(
        makePostRequest({
          headers: { 'content-type': 'application/json' },
          body: { offset: 50, limit: 100 },
        })
      )

      expect(runCatalogPipeline).toHaveBeenCalledWith({
        styleIds: undefined,
        offset: 50,
        limit: 100,
      })
    })

    it('calls pipeline with undefined options when no body is provided', async () => {
      await POST(makePostRequest())
      expect(runCatalogPipeline).toHaveBeenCalledWith(undefined)
    })

    it('returns 400 for a malformed request body', async () => {
      const response = await POST(
        makePostRequest({
          headers: { 'content-type': 'application/json' },
          body: { styleIds: [123, 456] }, // numbers instead of strings
        })
      )
      expect(response.status).toBe(400)
      const body = await response.json()
      expect(body.error).toBe('Invalid request body')
    })

    it('returns 500 when runCatalogPipeline throws', async () => {
      vi.mocked(runCatalogPipeline).mockRejectedValueOnce(new Error('DB connection lost'))
      const response = await POST(makePostRequest())
      expect(response.status).toBe(500)
      const body = await response.json()
      expect(body.error).toBe('Internal server error')
    })
  })
})
