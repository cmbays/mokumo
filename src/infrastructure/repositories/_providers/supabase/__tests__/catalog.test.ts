import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock server-only module so tests can run outside Next.js server context
vi.mock('server-only', () => ({}))

// Mock next/cache so unstable_cache is a transparent passthrough in tests
vi.mock('next/cache', () => ({
  unstable_cache: vi.fn((fn: () => Promise<unknown>) => fn),
}))

import {
  parseNormalizedCatalogRow,
  getEffectiveStylePreferences,
  getCatalogStylesSlim,
  getCatalogColorSupplement,
  getCatalogStyleDetail,
} from '../catalog'
import { verifySession } from '@infra/auth/session'

// ---------------------------------------------------------------------------
// parseNormalizedCatalogRow — unit tests (pure mapping)
// ---------------------------------------------------------------------------

describe('parseNormalizedCatalogRow', () => {
  it('maps db row to NormalizedGarmentCatalog with defaults for empty arrays', () => {
    const row = {
      id: '00000000-0000-4000-8000-000000000001',
      source: 'ss-activewear',
      external_id: '3001',
      brand_canonical: 'Bella+Canvas',
      style_number: 'BC3001',
      name: 'Unisex Jersey Tee',
      description: null,
      category: 't-shirts',
      subcategory: null,
      colors: [],
      sizes: [],
      is_enabled: null,
      is_favorite: null,
    }
    const result = parseNormalizedCatalogRow(row)
    expect(result.brand).toBe('Bella+Canvas')
    expect(result.category).toBe('t-shirts')
    expect(result.isEnabled).toBe(true) // NULL → default true
    expect(result.isFavorite).toBe(false) // NULL → default false
  })

  it('parses colors with images through Zod validation', () => {
    const row = {
      id: '00000000-0000-4000-8000-000000000002',
      source: 'ss-activewear',
      external_id: '3002',
      brand_canonical: 'Gildan',
      style_number: 'G500',
      name: 'Heavy Cotton Tee',
      description: 'A heavy cotton tee',
      category: 'fleece',
      subcategory: null,
      colors: [
        {
          id: '00000000-0000-4000-a000-000000000010',
          name: 'Black',
          hex1: '#000000',
          hex2: null,
          colorFamilyName: null,
          colorGroupName: null,
          images: [{ imageType: 'front', url: 'https://example.com/front.jpg' }],
        },
      ],
      sizes: [
        {
          id: '00000000-0000-4000-a000-000000000020',
          name: 'M',
          sortOrder: 1,
          priceAdjustment: 0,
        },
      ],
      is_enabled: true,
      is_favorite: true,
    }
    const result = parseNormalizedCatalogRow(row)
    expect(result.colors).toHaveLength(1)
    expect(result.colors[0].images).toHaveLength(1)
    expect(result.colors[0].hex1).toBe('#000000')
    expect(result.sizes).toHaveLength(1)
    expect(result.sizes[0].sortOrder).toBe(1)
    expect(result.isEnabled).toBe(true)
    expect(result.isFavorite).toBe(true)
  })

  it('resolves explicit false preferences (not just NULL defaults)', () => {
    const row = {
      id: '00000000-0000-4000-8000-000000000003',
      source: 'ss-activewear',
      external_id: '3003',
      brand_canonical: 'Gildan',
      style_number: 'G200',
      name: 'Ultra Cotton Tee',
      description: null,
      category: 't-shirts',
      subcategory: null,
      colors: [],
      sizes: [],
      is_enabled: false, // explicitly disabled by shop
      is_favorite: false,
    }
    const result = parseNormalizedCatalogRow(row)
    expect(result.isEnabled).toBe(false) // explicit false must not be overridden by ?? default
    expect(result.isFavorite).toBe(false)
  })

  it('resolves NULL is_enabled to true (shop default)', () => {
    const row = {
      id: '00000000-0000-4000-8000-000000000004',
      source: 'ss-activewear',
      external_id: '3004',
      brand_canonical: 'Bella+Canvas',
      style_number: 'BC3001CVC',
      name: 'CVC Tee',
      description: null,
      category: 't-shirts',
      subcategory: null,
      colors: [],
      sizes: [],
      is_enabled: null,
      is_favorite: null,
    }
    const result = parseNormalizedCatalogRow(row)
    // NULL pref row = no row written yet = inherit shop defaults
    expect(result.isEnabled).toBe(true)
    expect(result.isFavorite).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// getEffectiveStylePreferences — integration-style tests (mocked DB)
// ---------------------------------------------------------------------------

const STYLE_ID = '00000000-0000-4000-8000-aaaaaaaaaaaa'
const SHOP_A = '00000000-0000-4000-8000-bbbbbbbbbbbb'
const SHOP_B = '00000000-0000-4000-8000-cccccccccccc'

// Drizzle query builder mock — returns controllable rows
const mockLimit = vi.fn()
const mockOrderBy = vi.fn()
const mockWhere = vi.fn(() => ({ limit: mockLimit, orderBy: mockOrderBy }))
const mockSelect = vi.fn(() => ({ from: vi.fn(() => ({ where: mockWhere })) }))
const mockExecute = vi.fn()
const mockDb = { select: mockSelect, execute: mockExecute }

vi.mock('@shared/lib/supabase/db', () => ({ db: mockDb }))

// Drizzle operators are pass-through in test
vi.mock('drizzle-orm', async (importOriginal) => {
  const actual = await importOriginal<typeof import('drizzle-orm')>()
  return {
    ...actual,
    eq: (col: unknown, val: unknown) => ({ col, val, op: 'eq' }),
    and: (...args: unknown[]) => ({ args, op: 'and' }),
  }
})

// Mock schema so tests don't need pg-core setup
vi.mock('@db/schema/catalog-normalized', () => ({
  catalogStylePreferences: {
    scopeType: 'scopeType',
    scopeId: 'scopeId',
    styleId: 'styleId',
    isEnabled: 'isEnabled',
    isFavorite: 'isFavorite',
  },
  catalogSizes: {
    id: 'id',
    styleId: 'styleId',
    name: 'name',
    sortOrder: 'sortOrder',
    priceAdjustment: 'priceAdjustment',
  },
}))

vi.mock('@infra/auth/session', () => ({
  verifySession: vi.fn(),
}))

describe('getEffectiveStylePreferences', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns stored values when a preference row exists', async () => {
    mockLimit.mockResolvedValueOnce([{ isEnabled: false, isFavorite: true }])

    const result = await getEffectiveStylePreferences(STYLE_ID, SHOP_A)

    expect(result).toEqual({ isEnabled: false, isFavorite: true })
  })

  it('returns defaults (true, false) when no preference row exists', async () => {
    mockLimit.mockResolvedValueOnce([]) // no row

    const result = await getEffectiveStylePreferences(STYLE_ID, SHOP_A)

    expect(result).toEqual({ isEnabled: true, isFavorite: false })
  })

  it('returns defaults when preference values are null (inherit from scope)', async () => {
    mockLimit.mockResolvedValueOnce([{ isEnabled: null, isFavorite: null }])

    const result = await getEffectiveStylePreferences(STYLE_ID, SHOP_A)

    expect(result).toEqual({ isEnabled: true, isFavorite: false })
  })

  it('scope isolation — different shops query independently', async () => {
    // Shop A has preferences; Shop B doesn't
    mockLimit
      .mockResolvedValueOnce([{ isEnabled: false, isFavorite: true }]) // SHOP_A
      .mockResolvedValueOnce([]) // SHOP_B

    const resultA = await getEffectiveStylePreferences(STYLE_ID, SHOP_A)
    const resultB = await getEffectiveStylePreferences(STYLE_ID, SHOP_B)

    expect(resultA).toEqual({ isEnabled: false, isFavorite: true })
    expect(resultB).toEqual({ isEnabled: true, isFavorite: false }) // defaults
    expect(mockLimit).toHaveBeenCalledTimes(2)
  })

  it('preserves explicit false for is_enabled (does not coerce to default)', async () => {
    mockLimit.mockResolvedValueOnce([{ isEnabled: false, isFavorite: false }])

    const result = await getEffectiveStylePreferences(STYLE_ID, SHOP_A)

    expect(result.isEnabled).toBe(false) // explicit false ≠ null; must not revert to default
  })
})

// ---------------------------------------------------------------------------
// getCatalogStylesSlim — Tier 1 slim metadata
// ---------------------------------------------------------------------------

const MOCK_SESSION = { userId: 'user-1', role: 'owner' as const, shopId: 'shop-uuid-1' }

describe('getCatalogStylesSlim', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns [] when verifySession returns null (unauthenticated)', async () => {
    vi.mocked(verifySession).mockResolvedValueOnce(null)
    const result = await getCatalogStylesSlim()
    expect(result).toEqual([])
  })

  it('returns mapped slim styles for authenticated session', async () => {
    vi.mocked(verifySession).mockResolvedValueOnce(MOCK_SESSION)
    mockExecute.mockResolvedValueOnce([
      {
        id: '00000000-0000-4000-8000-aaaaaaaaaaaa',
        brand_canonical: 'Bella+Canvas',
        style_number: 'BC3001',
        is_enabled: null,
        is_favorite: null,
        card_image_url: 'https://example.com/img.jpg',
      },
    ])
    const result = await getCatalogStylesSlim()
    expect(result).toHaveLength(1)
    expect(result[0].styleNumber).toBe('BC3001')
    expect(result[0].brand).toBe('Bella+Canvas')
    expect(result[0].isEnabled).toBe(true) // NULL → default true
    expect(result[0].isFavorite).toBe(false) // NULL → default false
    expect(result[0].cardImageUrl).toBe('https://example.com/img.jpg')
  })
})

// ---------------------------------------------------------------------------
// getCatalogColorSupplement — Tier 1 supplement
// ---------------------------------------------------------------------------

describe('getCatalogColorSupplement', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns [] when verifySession returns null (unauthenticated)', async () => {
    vi.mocked(verifySession).mockResolvedValueOnce(null)
    const result = await getCatalogColorSupplement()
    expect(result).toEqual([])
  })

  it('returns mapped supplement rows for authenticated session', async () => {
    vi.mocked(verifySession).mockResolvedValueOnce(MOCK_SESSION)
    mockExecute.mockResolvedValueOnce([
      {
        style_number: 'BC3001',
        color_id: '00000000-0000-4000-8000-cccccccccccc',
        color_name: 'Black',
        hex1: '#000000',
        color_family_name: 'Neutrals',
        color_group_name: 'Black',
      },
    ])
    const result = await getCatalogColorSupplement()
    expect(result).toHaveLength(1)
    expect(result[0].styleNumber).toBe('BC3001')
    expect(result[0].name).toBe('Black')
    expect(result[0].hex1).toBe('#000000')
    expect(result[0].colorFamilyName).toBe('Neutrals')
    expect(result[0].colorGroupName).toBe('Black')
  })

  it('rethrows db errors', async () => {
    vi.mocked(verifySession).mockResolvedValueOnce(MOCK_SESSION)
    mockExecute.mockRejectedValueOnce(new Error('DB connection failed'))
    await expect(getCatalogColorSupplement()).rejects.toThrow('DB connection failed')
  })
})

// ---------------------------------------------------------------------------
// getCatalogStyleDetail — Tier 2 lazy color detail
// ---------------------------------------------------------------------------

const VALID_STYLE_UUID = '00000000-0000-4000-8000-aaaaaaaaaaaa'

describe('getCatalogStyleDetail', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns { colors: [], sizes: [] } for non-UUID styleId (Zod validation)', async () => {
    const result = await getCatalogStyleDetail('not-a-uuid')
    expect(result).toEqual({ colors: [], sizes: [], basePrice: null })
    expect(mockExecute).not.toHaveBeenCalled()
  })

  it('returns { colors: [], sizes: [] } for empty string styleId', async () => {
    const result = await getCatalogStyleDetail('')
    expect(result).toEqual({ colors: [], sizes: [], basePrice: null })
    expect(mockExecute).not.toHaveBeenCalled()
  })

  it('returns mapped color detail rows for valid UUID', async () => {
    mockExecute.mockResolvedValueOnce([
      {
        id: '00000000-0000-4000-8000-cccccccccccc',
        name: 'Black',
        hex1: '#000000',
        hex2: null,
        color_family_name: 'Neutrals',
        color_group_name: 'Black',
        images: [{ imageType: 'front', url: 'https://example.com/front.jpg' }],
      },
    ])
    mockOrderBy.mockResolvedValueOnce([])
    const result = await getCatalogStyleDetail(VALID_STYLE_UUID)
    expect(result.colors).toHaveLength(1)
    expect(result.colors[0].name).toBe('Black')
    expect(result.colors[0].hex1).toBe('#000000')
    expect(result.colors[0].images).toHaveLength(1)
    expect(result.colors[0].images[0].imageType).toBe('front')
    expect(result.sizes).toEqual([])
  })

  it('returns item with empty images array when image schema parse fails', async () => {
    mockExecute.mockResolvedValueOnce([
      {
        id: '00000000-0000-4000-8000-cccccccccccc',
        name: 'Black',
        hex1: '#000000',
        hex2: null,
        color_family_name: null,
        color_group_name: null,
        images: [{ badField: 'wrong-shape' }], // invalid → images: []
      },
    ])
    mockOrderBy.mockResolvedValueOnce([])
    const result = await getCatalogStyleDetail(VALID_STYLE_UUID)
    expect(result.colors).toHaveLength(1)
    expect(result.colors[0].images).toEqual([]) // parse failure degrades to empty
  })

  it('rethrows db errors', async () => {
    mockExecute.mockRejectedValueOnce(new Error('DB connection failed'))
    await expect(getCatalogStyleDetail(VALID_STYLE_UUID)).rejects.toThrow('DB connection failed')
  })
})
