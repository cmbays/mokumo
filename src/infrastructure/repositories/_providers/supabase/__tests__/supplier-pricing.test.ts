import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Hoisted mock functions (available inside vi.mock factories) ──────────

const { mockSelect, mockWhere, mockGetRedis, mockRedisGet, mockRedisSet, mockRedisPipeline } =
  vi.hoisted(() => {
    const mockWhere = vi.fn()
    const mockInnerJoin2 = vi.fn(() => ({ where: mockWhere }))
    const mockInnerJoin1 = vi.fn(() => ({ innerJoin: mockInnerJoin2 }))
    const mockFrom = vi.fn(() => ({ innerJoin: mockInnerJoin1 }))
    const mockSelect = vi.fn(() => ({ from: mockFrom }))
    const mockRedisGet = vi.fn()
    const mockRedisSet = vi.fn()
    const mockRedisPipeline = vi.fn()
    const mockGetRedis = vi.fn()
    return {
      mockSelect,
      mockWhere,
      mockGetRedis,
      mockRedisGet,
      mockRedisSet,
      mockRedisPipeline,
    }
  })

// ── Module mocks ─────────────────────────────────────────────────────────

vi.mock('server-only', () => ({}))
vi.mock('@shared/lib/supabase/db', () => ({ db: { select: mockSelect } }))
vi.mock('@shared/lib/redis', () => ({
  getRedis: (...args: unknown[]) => mockGetRedis(...args),
}))
vi.mock('@shared/lib/logger', () => ({
  logger: {
    child: () => ({ warn: vi.fn(), error: vi.fn(), info: vi.fn() }),
  },
}))

import { parseSupplierPricingRows, getStylePricing, getStylesPricing } from '../supplier-pricing'
import { structuredSupplierPricingSchema } from '@domain/entities/supplier-pricing'

// ── Fixtures ─────────────────────────────────────────────────────────────

const FIXTURE_ROWS = [
  {
    styleId: '3001',
    source: 'ss_activewear',
    productName: 'Bella+Canvas 3001',
    brandName: 'Bella+Canvas',
    colorPriceGroup: 'White',
    sizePriceGroup: 'S-XL',
    tierName: 'piece',
    minQty: 1,
    maxQty: 11,
    unitPrice: 2.99,
  },
  {
    styleId: '3001',
    source: 'ss_activewear',
    productName: 'Bella+Canvas 3001',
    brandName: 'Bella+Canvas',
    colorPriceGroup: 'White',
    sizePriceGroup: 'S-XL',
    tierName: 'dozen',
    minQty: 12,
    maxQty: 71,
    unitPrice: 2.49,
  },
  {
    styleId: '3001',
    source: 'ss_activewear',
    productName: 'Bella+Canvas 3001',
    brandName: 'Bella+Canvas',
    colorPriceGroup: 'White',
    sizePriceGroup: 'S-XL',
    tierName: 'case',
    minQty: 72,
    maxQty: null,
    unitPrice: 1.99,
  },
]

// ── Helpers ──────────────────────────────────────────────────────────────

function setupRedis(cached: unknown = null) {
  mockGetRedis.mockReturnValue({
    get: mockRedisGet.mockResolvedValue(cached),
    set: mockRedisSet.mockResolvedValue('OK'),
    pipeline: mockRedisPipeline,
  })
}

function setupRedisNull() {
  mockGetRedis.mockReturnValue(null)
}

function setupDbRows(rows: typeof FIXTURE_ROWS) {
  mockWhere.mockResolvedValue(rows)
}

// ── Tests ────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks()
})

describe('parseSupplierPricingRows', () => {
  it('returns null for empty rows', () => {
    const result = parseSupplierPricingRows([], '3001', 'ss_activewear')
    expect(result).toBeNull()
  })

  it('parses single price group with three tiers', () => {
    const result = parseSupplierPricingRows(FIXTURE_ROWS, '3001', 'ss_activewear')
    expect(result).not.toBeNull()
    expect(result!.styleId).toBe('3001')
    expect(result!.source).toBe('ss_activewear')
    expect(result!.productName).toBe('Bella+Canvas 3001')
    expect(result!.brandName).toBe('Bella+Canvas')
    expect(result!.priceGroups).toHaveLength(1)
    expect(result!.priceGroups[0].tiers).toHaveLength(3)
  })

  it('groups multiple price groups correctly', () => {
    const rows = [
      { ...FIXTURE_ROWS[0] },
      { ...FIXTURE_ROWS[0], colorPriceGroup: 'Colors', unitPrice: 3.49 },
    ]
    const result = parseSupplierPricingRows(rows, '3001', 'ss_activewear')
    expect(result).not.toBeNull()
    expect(result!.priceGroups).toHaveLength(2)
    expect(result!.priceGroups[0].group.colorPriceGroup).toBe('White')
    expect(result!.priceGroups[1].group.colorPriceGroup).toBe('Colors')
  })

  it('output validates against Zod schema', () => {
    const result = parseSupplierPricingRows([FIXTURE_ROWS[0]], '3001', 'ss_activewear')
    const validation = structuredSupplierPricingSchema.safeParse(result)
    expect(validation.success).toBe(true)
  })

  it('handles null productName and brandName', () => {
    const rows = [{ ...FIXTURE_ROWS[0], productName: null, brandName: null }]
    const result = parseSupplierPricingRows(rows, '3001', 'ss_activewear')
    expect(result).not.toBeNull()
    expect(result!.productName).toBeNull()
    expect(result!.brandName).toBeNull()
  })

  it('skips rows with unknown tierName', () => {
    const rows = [{ ...FIXTURE_ROWS[0] }, { ...FIXTURE_ROWS[0], tierName: 'bulk' }]
    const result = parseSupplierPricingRows(rows, '3001', 'ss_activewear')
    expect(result!.priceGroups[0].tiers).toHaveLength(1)
    expect(result!.priceGroups[0].tiers[0].tierName).toBe('piece')
  })
})

describe('getStylePricing', () => {
  it('returns null for empty styleId', async () => {
    const result = await getStylePricing('', 'ss_activewear')
    expect(result).toBeNull()
    expect(mockSelect).not.toHaveBeenCalled()
  })

  it('returns null for empty source', async () => {
    const result = await getStylePricing('3001', '')
    expect(result).toBeNull()
    expect(mockSelect).not.toHaveBeenCalled()
  })

  it('returns null for overly long styleId', async () => {
    const result = await getStylePricing('x'.repeat(101), 'ss_activewear')
    expect(result).toBeNull()
  })

  it('returns cached result when Redis has data', async () => {
    const cached = { styleId: '3001', source: 'ss_activewear', priceGroups: [] }
    setupRedis(cached)

    const result = await getStylePricing('3001', 'ss_activewear')
    expect(result).toEqual(cached)
    expect(mockSelect).not.toHaveBeenCalled()
  })

  it('queries DB on cache miss and caches result', async () => {
    setupRedis(null)
    setupDbRows(FIXTURE_ROWS)

    const result = await getStylePricing('3001', 'ss_activewear')
    expect(result).not.toBeNull()
    expect(result!.styleId).toBe('3001')
    expect(mockSelect).toHaveBeenCalled()
    expect(mockRedisSet).toHaveBeenCalledWith(
      'supplier-pricing:ss_activewear:3001',
      expect.objectContaining({ styleId: '3001' }),
      { ex: 900 }
    )
  })

  it('queries DB when Redis is unavailable', async () => {
    setupRedisNull()
    setupDbRows(FIXTURE_ROWS)

    const result = await getStylePricing('3001', 'ss_activewear')
    expect(result).not.toBeNull()
    expect(result!.styleId).toBe('3001')
    expect(mockRedisSet).not.toHaveBeenCalled()
  })

  it('returns null when DB returns no rows', async () => {
    setupRedis(null)
    setupDbRows([])

    const result = await getStylePricing('3001', 'ss_activewear')
    expect(result).toBeNull()
    expect(mockRedisSet).not.toHaveBeenCalled()
  })

  it('proceeds when Redis read throws', async () => {
    mockGetRedis.mockReturnValue({
      get: vi.fn().mockRejectedValue(new Error('Redis down')),
      set: mockRedisSet.mockResolvedValue('OK'),
    })
    setupDbRows(FIXTURE_ROWS)

    const result = await getStylePricing('3001', 'ss_activewear')
    expect(result).not.toBeNull()
  })

  it('still returns result when Redis write throws', async () => {
    mockGetRedis.mockReturnValue({
      get: mockRedisGet.mockResolvedValue(null),
      set: vi.fn().mockRejectedValue(new Error('Redis down')),
    })
    setupDbRows(FIXTURE_ROWS)

    const result = await getStylePricing('3001', 'ss_activewear')
    expect(result).not.toBeNull()
  })

  it('rethrows DB errors', async () => {
    setupRedis(null)
    mockWhere.mockRejectedValue(new Error('DB connection failed'))

    await expect(getStylePricing('3001', 'ss_activewear')).rejects.toThrow('DB connection failed')
  })
})

describe('getStylesPricing', () => {
  it('returns empty Map for empty input', async () => {
    const result = await getStylesPricing([], 'ss_activewear')
    expect(result.size).toBe(0)
  })

  it('filters out invalid styleIds', async () => {
    setupRedisNull()
    setupDbRows(FIXTURE_ROWS)

    const result = await getStylesPricing(['3001', ''], 'ss_activewear')
    expect(result.size).toBe(1)
  })

  it('returns empty Map when all IDs are invalid', async () => {
    const result = await getStylesPricing(['', ''], 'ss_activewear')
    expect(result.size).toBe(0)
    expect(mockSelect).not.toHaveBeenCalled()
  })

  it('queries DB when Redis unavailable', async () => {
    setupRedisNull()
    setupDbRows(FIXTURE_ROWS)

    const result = await getStylesPricing(['3001'], 'ss_activewear')
    expect(result.size).toBe(1)
    expect(result.get('3001')!.styleId).toBe('3001')
  })

  it('uses Redis pipeline for cache lookups', async () => {
    const pipelineExec = vi.fn().mockResolvedValue([null])
    mockRedisPipeline.mockReturnValue({
      get: vi.fn().mockReturnThis(),
      exec: pipelineExec,
    })
    mockGetRedis.mockReturnValue({
      get: mockRedisGet,
      set: mockRedisSet.mockResolvedValue('OK'),
      pipeline: mockRedisPipeline,
    })
    setupDbRows(FIXTURE_ROWS)

    const result = await getStylesPricing(['3001'], 'ss_activewear')
    expect(result.size).toBe(1)
    expect(mockRedisPipeline).toHaveBeenCalled()
  })

  it('returns cached data without querying DB', async () => {
    const cached = {
      styleId: '3001',
      source: 'ss_activewear',
      productName: 'Cached',
      brandName: null,
      priceGroups: [],
    }
    const pipelineExec = vi.fn().mockResolvedValue([cached])
    mockRedisPipeline.mockReturnValue({
      get: vi.fn().mockReturnThis(),
      exec: pipelineExec,
    })
    mockGetRedis.mockReturnValue({
      get: mockRedisGet,
      set: mockRedisSet,
      pipeline: mockRedisPipeline,
    })

    const result = await getStylesPricing(['3001'], 'ss_activewear')
    expect(result.size).toBe(1)
    expect(result.get('3001')!.productName).toBe('Cached')
    expect(mockSelect).not.toHaveBeenCalled()
  })

  it('falls back to full DB query when pipeline throws', async () => {
    const pipelineExec = vi.fn().mockRejectedValue(new Error('Pipeline fail'))
    mockRedisPipeline.mockReturnValue({
      get: vi.fn().mockReturnThis(),
      exec: pipelineExec,
    })
    mockGetRedis.mockReturnValue({
      get: mockRedisGet,
      set: mockRedisSet.mockResolvedValue('OK'),
      pipeline: mockRedisPipeline,
    })
    setupDbRows(FIXTURE_ROWS)

    const result = await getStylesPricing(['3001'], 'ss_activewear')
    expect(result.size).toBe(1)
  })

  it('caches each parsed result individually', async () => {
    setupRedisNull()
    const rows = [
      ...FIXTURE_ROWS,
      { ...FIXTURE_ROWS[0], styleId: '5000', productName: 'Gildan 5000' },
    ]
    setupDbRows(rows)

    const result = await getStylesPricing(['3001', '5000'], 'ss_activewear')
    expect(result.size).toBe(2)
  })

  it('rethrows DB errors', async () => {
    setupRedisNull()
    mockWhere.mockRejectedValue(new Error('DB connection failed'))

    await expect(getStylesPricing(['3001'], 'ss_activewear')).rejects.toThrow(
      'DB connection failed'
    )
  })
})
