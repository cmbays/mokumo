import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('server-only', () => ({}))

// ─── QStash client mock ────────────────────────────────────────────────────

const mockPublishJSON = vi.fn()
const mockClient = { publishJSON: mockPublishJSON }

vi.mock('@shared/lib/qstash', () => ({
  getQStashClient: vi.fn(),
}))

import { getQStashClient } from '@shared/lib/qstash'
import { jobDispatcher, dispatchJob } from '../dispatcher'

const mockGetQStashClient = vi.mocked(getQStashClient)

describe('jobDispatcher.dispatch', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns null when QStash client is not configured', async () => {
    mockGetQStashClient.mockReturnValue(null)

    const result = await jobDispatcher.dispatch('inventory-refresh', {})
    expect(result).toBeNull()
    expect(mockPublishJSON).not.toHaveBeenCalled()
  })

  it('publishes a job when client is configured', async () => {
    mockGetQStashClient.mockReturnValue(mockClient as never)
    mockPublishJSON.mockResolvedValue({ messageId: 'msg-123' })

    const result = await jobDispatcher.dispatch('inventory-refresh', { test: true })

    expect(result).toEqual({ messageId: 'msg-123' })
    expect(mockPublishJSON).toHaveBeenCalledOnce()

    const call = mockPublishJSON.mock.calls[0]?.[0]
    expect(call.url).toContain('/api/jobs/inventory-refresh')
    expect(call.body.jobType).toBe('inventory-refresh')
    expect(call.body.data).toEqual({ test: true })
    expect(call.retries).toBe(3)
    expect(call.failureCallback).toContain('/api/jobs/dlq')
  })

  it('includes dispatchedAt ISO timestamp in payload', async () => {
    mockGetQStashClient.mockReturnValue(mockClient as never)
    mockPublishJSON.mockResolvedValue({ messageId: 'msg-456' })

    const before = Date.now()
    await jobDispatcher.dispatch('cache-warm')
    const after = Date.now()

    const call = mockPublishJSON.mock.calls[0]?.[0]
    const dispatched = new Date(call.body.dispatchedAt).getTime()
    expect(dispatched).toBeGreaterThanOrEqual(before)
    expect(dispatched).toBeLessThanOrEqual(after)
  })

  it('uses empty object as default data', async () => {
    mockGetQStashClient.mockReturnValue(mockClient as never)
    mockPublishJSON.mockResolvedValue({ messageId: 'msg-789' })

    await jobDispatcher.dispatch('garment-sync')

    const call = mockPublishJSON.mock.calls[0]?.[0]
    expect(call.body.data).toEqual({})
  })
})

describe('dispatchJob', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns null for unknown job type', async () => {
    const result = await dispatchJob('not-a-real-job')
    expect(result).toBeNull()
    expect(mockPublishJSON).not.toHaveBeenCalled()
  })

  it('dispatches valid job type string', async () => {
    mockGetQStashClient.mockReturnValue(mockClient as never)
    mockPublishJSON.mockResolvedValue({ messageId: 'msg-000' })

    const result = await dispatchJob('inventory-refresh', { batchSize: 100 })
    expect(result).toEqual({ messageId: 'msg-000' })
  })

  it('returns null when QStash not configured', async () => {
    mockGetQStashClient.mockReturnValue(null)

    const result = await dispatchJob('inventory-refresh')
    expect(result).toBeNull()
  })
})
