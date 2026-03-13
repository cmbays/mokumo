import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

vi.mock('server-only', () => ({}))
vi.mock('@shared/lib/logger', () => {
  const logger: Record<string, unknown> = {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  }
  logger.child = () => logger
  return { logger }
})

// ─── QStash receiver mock ────────────────────────────────────────────────

const mockVerify = vi.fn()
const mockReceiver = { verify: mockVerify }

vi.mock('@shared/lib/qstash', () => ({
  getQStashReceiver: vi.fn(),
}))

// ─── Handler registry mock ───────────────────────────────────────────────

vi.mock('@infra/jobs/handler-registry', () => ({
  handlerRegistry: {
    'inventory-refresh': vi.fn(),
    'cache-warm': vi.fn(),
    'garment-sync': vi.fn(),
  },
}))

// ─── Request context mock ────────────────────────────────────────────────

vi.mock('@shared/lib/request-context', () => ({
  requestContext: {
    run: (_ctx: unknown, fn: () => unknown) => fn(),
  },
}))

import { getQStashReceiver } from '@shared/lib/qstash'
import { handlerRegistry } from '@infra/jobs/handler-registry'
import { POST } from '../[jobType]/route'

const mockGetReceiver = vi.mocked(getQStashReceiver)
const mockInventoryHandler = vi.mocked(handlerRegistry['inventory-refresh'])

// ─── Helpers ─────────────────────────────────────────────────────────────

function makeRequest(body: unknown, headers: Record<string, string> = {}) {
  const json = JSON.stringify(body)
  return new Request('http://localhost/api/jobs/inventory-refresh', {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...headers },
    body: json,
  })
}

const validPayload = {
  jobType: 'inventory-refresh',
  dispatchedAt: new Date().toISOString(),
  data: {},
}

beforeEach(() => {
  vi.clearAllMocks()
})

afterEach(() => {
  vi.unstubAllEnvs()
})

// ─── Signature verification ───────────────────────────────────────────────

describe('POST /api/jobs/[jobType] — signature verification', () => {
  it('returns 401 when receiver is null in production', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    mockGetReceiver.mockReturnValue(null)

    const req = makeRequest(validPayload)
    const res = await POST(req, { params: Promise.resolve({ jobType: 'inventory-refresh' }) })

    expect(res.status).toBe(401)
  })

  it('allows through when receiver is null in development', async () => {
    vi.stubEnv('NODE_ENV', 'development')
    mockGetReceiver.mockReturnValue(null)
    mockInventoryHandler.mockResolvedValue(undefined)

    const req = makeRequest(validPayload)
    const res = await POST(req, { params: Promise.resolve({ jobType: 'inventory-refresh' }) })

    expect(res.status).toBe(200)
  })

  it('returns 401 when signature verification fails', async () => {
    mockGetReceiver.mockReturnValue(mockReceiver as never)
    mockVerify.mockRejectedValue(new Error('bad sig'))

    const req = makeRequest(validPayload, { 'upstash-signature': 'bad' })
    const res = await POST(req, { params: Promise.resolve({ jobType: 'inventory-refresh' }) })

    expect(res.status).toBe(401)
  })

  it('returns 401 when signature header is missing', async () => {
    mockGetReceiver.mockReturnValue(mockReceiver as never)

    const req = makeRequest(validPayload) // no upstash-signature header
    const res = await POST(req, { params: Promise.resolve({ jobType: 'inventory-refresh' }) })

    expect(res.status).toBe(401)
  })
})

// ─── Routing ──────────────────────────────────────────────────────────────

describe('POST /api/jobs/[jobType] — routing', () => {
  beforeEach(() => {
    mockGetReceiver.mockReturnValue(null)
    vi.stubEnv('NODE_ENV', 'development')
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('returns 400 for unknown job type', async () => {
    const req = makeRequest(validPayload)
    const res = await POST(req, { params: Promise.resolve({ jobType: 'nonexistent-job' }) })

    expect(res.status).toBe(400)
  })

  it('returns 200 when handler succeeds', async () => {
    mockInventoryHandler.mockResolvedValue(undefined)

    const req = makeRequest(validPayload)
    const res = await POST(req, { params: Promise.resolve({ jobType: 'inventory-refresh' }) })

    expect(res.status).toBe(200)
    expect(mockInventoryHandler).toHaveBeenCalledOnce()
  })

  it('returns 500 when handler throws (triggers QStash retry)', async () => {
    mockInventoryHandler.mockRejectedValue(new Error('sync failed'))

    const req = makeRequest(validPayload)
    const res = await POST(req, { params: Promise.resolve({ jobType: 'inventory-refresh' }) })

    expect(res.status).toBe(500)
  })

  it('returns 400 for invalid JSON payload', async () => {
    const req = new Request('http://localhost/api/jobs/inventory-refresh', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: 'not-json',
    })
    const res = await POST(req, { params: Promise.resolve({ jobType: 'inventory-refresh' }) })

    expect(res.status).toBe(400)
  })

  it('returns 400 when payload fails schema validation', async () => {
    const req = makeRequest({ jobType: 'inventory-refresh' }) // missing dispatchedAt
    const res = await POST(req, { params: Promise.resolve({ jobType: 'inventory-refresh' }) })

    expect(res.status).toBe(400)
  })
})
