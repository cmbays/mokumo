import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

vi.mock('server-only', () => ({}))

// Mock before any import so the constructors are captured by the module
const MockClient = vi.fn()
const MockReceiver = vi.fn()

vi.mock('@upstash/qstash', () => ({
  Client: MockClient,
  Receiver: MockReceiver,
}))

// Reset module registry before each test so singleton state is cleared.
// vi.mock declarations above persist through vi.resetModules() — they are
// hoisted and registered globally, not in the module cache.
beforeEach(() => {
  vi.resetModules()
  vi.clearAllMocks()
})

afterEach(() => {
  vi.unstubAllEnvs()
})

// ─── getQStashClient ────────────────────────────────────────────────────────

describe('getQStashClient', () => {
  it('returns null when QSTASH_TOKEN is absent', async () => {
    vi.stubEnv('QSTASH_TOKEN', '')
    const { getQStashClient } = await import('../qstash')
    expect(getQStashClient()).toBeNull()
    expect(MockClient).not.toHaveBeenCalled()
  })

  it('returns a Client instance when QSTASH_TOKEN is present', async () => {
    vi.stubEnv('QSTASH_TOKEN', 'tok_test')
    const { getQStashClient } = await import('../qstash')
    const client = getQStashClient()
    expect(client).not.toBeNull()
    expect(MockClient).toHaveBeenCalledWith({ token: 'tok_test' })
  })

  it('returns the same instance on repeated calls (singleton)', async () => {
    vi.stubEnv('QSTASH_TOKEN', 'tok_singleton')
    const { getQStashClient } = await import('../qstash')
    const first = getQStashClient()
    const second = getQStashClient()
    expect(first).toBe(second)
    expect(MockClient).toHaveBeenCalledOnce()
  })
})

// ─── getQStashReceiver ──────────────────────────────────────────────────────

describe('getQStashReceiver', () => {
  it('returns null when QSTASH_CURRENT_SIGNING_KEY is absent', async () => {
    vi.stubEnv('QSTASH_CURRENT_SIGNING_KEY', '')
    vi.stubEnv('QSTASH_NEXT_SIGNING_KEY', 'nsk')
    const { getQStashReceiver } = await import('../qstash')
    expect(getQStashReceiver()).toBeNull()
    expect(MockReceiver).not.toHaveBeenCalled()
  })

  it('returns null when QSTASH_NEXT_SIGNING_KEY is absent', async () => {
    vi.stubEnv('QSTASH_CURRENT_SIGNING_KEY', 'csk')
    vi.stubEnv('QSTASH_NEXT_SIGNING_KEY', '')
    const { getQStashReceiver } = await import('../qstash')
    expect(getQStashReceiver()).toBeNull()
    expect(MockReceiver).not.toHaveBeenCalled()
  })

  it('returns a Receiver instance when both keys are present', async () => {
    vi.stubEnv('QSTASH_CURRENT_SIGNING_KEY', 'csk_test')
    vi.stubEnv('QSTASH_NEXT_SIGNING_KEY', 'nsk_test')
    const { getQStashReceiver } = await import('../qstash')
    const receiver = getQStashReceiver()
    expect(receiver).not.toBeNull()
    expect(MockReceiver).toHaveBeenCalledWith({
      currentSigningKey: 'csk_test',
      nextSigningKey: 'nsk_test',
    })
  })

  it('returns the same instance on repeated calls (singleton)', async () => {
    vi.stubEnv('QSTASH_CURRENT_SIGNING_KEY', 'csk')
    vi.stubEnv('QSTASH_NEXT_SIGNING_KEY', 'nsk')
    const { getQStashReceiver } = await import('../qstash')
    const first = getQStashReceiver()
    const second = getQStashReceiver()
    expect(first).toBe(second)
    expect(MockReceiver).toHaveBeenCalledOnce()
  })
})
