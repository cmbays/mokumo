import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('server-only', () => ({}))
vi.mock('@shared/lib/logger', () => ({
  logger: { child: () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }) },
}))

const mockVerify = vi.fn()
const mockReceiver = { verify: mockVerify }

vi.mock('@shared/lib/qstash', () => ({
  getQStashReceiver: vi.fn(),
}))

vi.mock('@shared/lib/request-context', () => ({
  requestContext: {
    run: (_ctx: unknown, fn: () => unknown) => fn(),
  },
}))

import { getQStashReceiver } from '@shared/lib/qstash'
import { POST } from '../dlq/route'

const mockGetReceiver = vi.mocked(getQStashReceiver)

function makeDlqRequest(body?: unknown, headers: Record<string, string> = {}) {
  return new Request('http://localhost/api/jobs/dlq', {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...headers },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('POST /api/jobs/dlq — authentication', () => {
  it('returns 401 when no receiver configured in production', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    mockGetReceiver.mockReturnValue(null)

    const res = await POST(makeDlqRequest({ failed: true }))

    expect(res.status).toBe(401)
    vi.unstubAllEnvs()
  })

  it('proceeds when no receiver in development', async () => {
    vi.stubEnv('NODE_ENV', 'development')
    mockGetReceiver.mockReturnValue(null)

    const res = await POST(makeDlqRequest({ failed: true }))

    // DLQ always returns 200 on success
    expect(res.status).toBe(200)
    vi.unstubAllEnvs()
  })

  it('returns 401 when signature verification fails', async () => {
    mockGetReceiver.mockReturnValue(mockReceiver as never)
    mockVerify.mockRejectedValue(new Error('bad signature'))

    const res = await POST(makeDlqRequest({ failed: true }, { 'upstash-signature': 'bad' }))

    expect(res.status).toBe(401)
  })

  it('returns 401 when verify returns false', async () => {
    mockGetReceiver.mockReturnValue(mockReceiver as never)
    mockVerify.mockResolvedValue(false)

    const res = await POST(makeDlqRequest({ failed: true }, { 'upstash-signature': 'sig' }))

    expect(res.status).toBe(401)
  })
})

describe('POST /api/jobs/dlq — always-200 contract', () => {
  beforeEach(() => {
    mockGetReceiver.mockReturnValue(mockReceiver as never)
    mockVerify.mockResolvedValue(true)
  })

  it('returns 200 with dead-lettered status when verified', async () => {
    const res = await POST(
      makeDlqRequest({ jobType: 'inventory-refresh' }, { 'upstash-signature': 'sig' })
    )
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.status).toBe('dead-lettered')
  })

  it('returns 200 even when request body is not valid JSON', async () => {
    const req = new Request('http://localhost/api/jobs/dlq', {
      method: 'POST',
      headers: { 'upstash-signature': 'sig' },
      body: 'malformed',
    })
    mockVerify.mockResolvedValue(true)

    const res = await POST(req)

    expect(res.status).toBe(200)
  })
})
