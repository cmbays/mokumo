import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('server-only', () => ({}))

// ---------------------------------------------------------------------------
// Hoist mocks so they're available when vi.mock factories are evaluated
// ---------------------------------------------------------------------------

const {
  mockInsertOnConflict,
  mockInsertValues,
  mockInsert,
  mockLimit,
  mockWhere,
  mockFrom,
  mockSelectCols,
  mockDb,
  mockVerifySession,
} = vi.hoisted(() => {
  const mockInsertOnConflict = vi.fn().mockResolvedValue(undefined)
  const mockInsertValues = vi.fn(() => ({ onConflictDoUpdate: mockInsertOnConflict }))
  const mockInsert = vi.fn(() => ({ values: mockInsertValues }))

  const mockLimit = vi.fn()
  const mockWhere = vi.fn(() => ({ limit: mockLimit }))
  const mockFrom = vi.fn(() => ({ where: mockWhere }))
  const mockSelectCols = vi.fn(() => ({ from: mockFrom }))
  const mockDb = { select: mockSelectCols, insert: mockInsert }

  const mockVerifySession = vi.fn()

  return {
    mockInsertOnConflict,
    mockInsertValues,
    mockInsert,
    mockLimit,
    mockWhere,
    mockFrom,
    mockSelectCols,
    mockDb,
    mockVerifySession,
  }
})

vi.mock('@shared/lib/supabase/db', () => ({ db: mockDb }))

vi.mock('@infra/auth/session', () => ({ verifySession: mockVerifySession }))

vi.mock('@db/schema/catalog-normalized', () => ({
  catalogStylePreferences: {
    scopeType: 'scope_type',
    scopeId: 'scope_id',
    styleId: 'style_id',
    isEnabled: 'is_enabled',
    isFavorite: 'is_favorite',
  },
}))

vi.mock('drizzle-orm', async (importOriginal) => {
  const actual = await importOriginal<typeof import('drizzle-orm')>()
  return {
    ...actual,
    eq: (col: unknown, val: unknown) => ({ col, val, op: 'eq' }),
    and: (...args: unknown[]) => ({ args, op: 'and' }),
  }
})

vi.mock('@shared/lib/logger', () => ({
  logger: { child: () => ({ info: vi.fn(), error: vi.fn(), warn: vi.fn() }) },
}))

// ---------------------------------------------------------------------------
// Import SUT after mocks
// ---------------------------------------------------------------------------

import { toggleStyleEnabled, toggleStyleFavorite } from '../actions'

const STYLE_ID = '00000000-0000-4000-8000-aaaaaaaaaaaa'
const SHOP_ID = '00000000-0000-4000-8000-000000004e6b'
const SESSION = { userId: 'user-1', role: 'owner', shopId: SHOP_ID }

// ---------------------------------------------------------------------------
// toggleStyleEnabled
// ---------------------------------------------------------------------------

describe('toggleStyleEnabled', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockInsertOnConflict.mockResolvedValue(undefined)
    mockVerifySession.mockResolvedValue(SESSION)
  })

  it('returns error for invalid styleId', async () => {
    const result = await toggleStyleEnabled('not-a-uuid')

    expect(result).toEqual({ success: false, error: 'Invalid styleId' })
    expect(mockVerifySession).not.toHaveBeenCalled()
  })

  it('returns Unauthorized when session is null', async () => {
    mockVerifySession.mockResolvedValueOnce(null)

    const result = await toggleStyleEnabled(STYLE_ID)

    expect(result).toEqual({ success: false, error: 'Unauthorized' })
    expect(mockInsert).not.toHaveBeenCalled()
  })

  it('toggles from default (true) to false when no row exists', async () => {
    mockLimit.mockResolvedValueOnce([]) // no existing row → current defaults to true

    const result = await toggleStyleEnabled(STYLE_ID)

    expect(result).toEqual({ success: true, isEnabled: false })
    expect(mockInsertValues).toHaveBeenCalledWith(
      expect.objectContaining({
        isEnabled: false,
        scopeType: 'shop',
        scopeId: SHOP_ID,
        styleId: STYLE_ID,
      })
    )
  })

  it('toggles from explicit true to false', async () => {
    mockLimit.mockResolvedValueOnce([{ isEnabled: true }])

    const result = await toggleStyleEnabled(STYLE_ID)

    expect(result).toEqual({ success: true, isEnabled: false })
  })

  it('toggles from explicit false to true', async () => {
    mockLimit.mockResolvedValueOnce([{ isEnabled: false }])

    const result = await toggleStyleEnabled(STYLE_ID)

    expect(result).toEqual({ success: true, isEnabled: true })
  })

  it('toggles from null (inherit default=true) to false', async () => {
    mockLimit.mockResolvedValueOnce([{ isEnabled: null }])

    const result = await toggleStyleEnabled(STYLE_ID)

    expect(result).toEqual({ success: true, isEnabled: false })
  })

  it('returns error when DB insert fails', async () => {
    mockLimit.mockResolvedValueOnce([])
    mockInsertOnConflict.mockRejectedValueOnce(new Error('DB error'))

    const result = await toggleStyleEnabled(STYLE_ID)

    expect(result).toEqual({ success: false, error: 'Failed to update style preference' })
  })
})

// ---------------------------------------------------------------------------
// toggleStyleFavorite
// ---------------------------------------------------------------------------

describe('toggleStyleFavorite', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockInsertOnConflict.mockResolvedValue(undefined)
    mockVerifySession.mockResolvedValue(SESSION)
  })

  it('returns error for invalid styleId', async () => {
    const result = await toggleStyleFavorite('not-a-uuid')

    expect(result).toEqual({ success: false, error: 'Invalid styleId' })
    expect(mockVerifySession).not.toHaveBeenCalled()
  })

  it('returns Unauthorized when session is null', async () => {
    mockVerifySession.mockResolvedValueOnce(null)

    const result = await toggleStyleFavorite(STYLE_ID)

    expect(result).toEqual({ success: false, error: 'Unauthorized' })
    expect(mockInsert).not.toHaveBeenCalled()
  })

  it('toggles from default (false) to true when no row exists', async () => {
    mockLimit.mockResolvedValueOnce([]) // no row → current defaults to false

    const result = await toggleStyleFavorite(STYLE_ID)

    expect(result).toEqual({ success: true, isFavorite: true })
    expect(mockInsertValues).toHaveBeenCalledWith(
      expect.objectContaining({
        isFavorite: true,
        scopeType: 'shop',
        scopeId: SHOP_ID,
        styleId: STYLE_ID,
      })
    )
  })

  it('toggles from explicit true to false', async () => {
    mockLimit.mockResolvedValueOnce([{ isFavorite: true }])

    const result = await toggleStyleFavorite(STYLE_ID)

    expect(result).toEqual({ success: true, isFavorite: false })
  })

  it('toggles from explicit false to true', async () => {
    mockLimit.mockResolvedValueOnce([{ isFavorite: false }])

    const result = await toggleStyleFavorite(STYLE_ID)

    expect(result).toEqual({ success: true, isFavorite: true })
  })

  it('toggles from null (inherit default=false) to true', async () => {
    mockLimit.mockResolvedValueOnce([{ isFavorite: null }])

    const result = await toggleStyleFavorite(STYLE_ID)

    expect(result).toEqual({ success: true, isFavorite: true })
  })

  it('returns error when DB insert fails', async () => {
    mockLimit.mockResolvedValueOnce([])
    mockInsertOnConflict.mockRejectedValueOnce(new Error('DB error'))

    const result = await toggleStyleFavorite(STYLE_ID)

    expect(result).toEqual({ success: false, error: 'Failed to update style preference' })
  })
})
