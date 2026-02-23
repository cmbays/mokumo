import { describe, it, expect, vi, beforeEach } from 'vitest'

// server-only guard must be mocked before importing any server-only module
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
}))

// Mock the dynamic imports for db and schemas
const mockInsert = vi.fn()
const mockValues = vi.fn()
const mockSelect = vi.fn()
const mockFrom = vi.fn()
const mockWhere = vi.fn()

vi.mock('@shared/lib/supabase/db', () => ({
  db: {
    insert: (...args: unknown[]) => {
      mockInsert(...args)
      return { values: mockValues }
    },
    select: (...args: unknown[]) => {
      mockSelect(...args)
      return {
        from: (...fArgs: unknown[]) => {
          mockFrom(...fArgs)
          return {
            where: (...wArgs: unknown[]) => {
              mockWhere(...wArgs)
              return []
            },
          }
        },
      }
    },
  },
}))

vi.mock('@db/schema/raw', () => ({
  ssActivewearProducts: { _: 'ss_activewear_products_table' },
}))

vi.mock('@db/schema/catalog-normalized', () => ({
  catalogStyles: { externalId: 'external_id', source: 'source' },
}))

// Mock the adapter module — the factory must be self-contained (vi.mock is hoisted)
vi.mock('@lib/suppliers/adapters/ss-activewear', () => {
  class SSActivewearAdapter {}
  return { SSActivewearAdapter }
})

vi.mock('@lib/suppliers/registry', () => ({
  getSupplierAdapter: vi.fn(),
}))

import { SSActivewearAdapter } from '@lib/suppliers/adapters/ss-activewear'
import { getSupplierAdapter } from '@lib/suppliers/registry'
import { syncRawPricingFromSupplier } from '../pricing-sync.service'

// ─── Setup ────────────────────────────────────────────────────────────────────

const mockGetRawProducts = vi.fn()

beforeEach(() => {
  vi.clearAllMocks()
  mockValues.mockResolvedValue(undefined)
})

function setupSSAdapter() {
  // Create an instance that passes `instanceof SSActivewearAdapter`
  // Cast through unknown: the vi.mock factory replaces the class with a no-arg constructor,
  // but TypeScript still sees the original 2-arg signature.
  const MockedSSAdapter = SSActivewearAdapter as unknown as new () => InstanceType<
    typeof SSActivewearAdapter
  >
  const adapter = Object.assign(new MockedSSAdapter(), {
    getRawProducts: mockGetRawProducts,
  })
  vi.mocked(getSupplierAdapter).mockReturnValue(adapter as ReturnType<typeof getSupplierAdapter>)
}

function setupNonSSAdapter() {
  vi.mocked(getSupplierAdapter).mockReturnValue({
    supplierName: 'mock',
  } as ReturnType<typeof getSupplierAdapter>)
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('syncRawPricingFromSupplier', () => {
  it('returns { synced: 0, errors: 0 } when adapter is not SSActivewearAdapter', async () => {
    setupNonSSAdapter()
    const result = await syncRawPricingFromSupplier()
    expect(result).toEqual({ synced: 0, errors: 0 })
  })

  it('returns { synced: 0, errors: 0 } when no styles to sync', async () => {
    setupSSAdapter()
    mockWhere.mockResolvedValueOnce([])
    const result = await syncRawPricingFromSupplier()
    expect(result).toEqual({ synced: 0, errors: 0 })
  })

  it('syncs products for provided styleIds', async () => {
    setupSSAdapter()
    mockGetRawProducts.mockResolvedValueOnce([
      {
        sku: '5000-RED-M',
        styleID: '1234',
        styleName: 'Tee',
        brandName: 'Gildan',
        colorName: 'Red',
        colorCode: '',
        colorPriceCodeName: 'STD',
        sizeName: 'M',
        sizeCode: '',
        sizePriceCodeName: 'REG',
        piecePrice: 2.99,
        dozenPrice: 2.49,
        casePrice: 1.99,
        caseQty: 72,
        customerPrice: null,
        mapPrice: null,
        salePrice: null,
        saleExpiration: null,
        gtin: '123456789012',
      },
    ])

    const result = await syncRawPricingFromSupplier(['1234'])
    expect(result.synced).toBe(1)
    expect(result.errors).toBe(0)
    expect(mockGetRawProducts).toHaveBeenCalledWith('1234')
    expect(mockInsert).toHaveBeenCalled()
  })

  it('counts errors but continues on individual style failures', async () => {
    setupSSAdapter()
    mockGetRawProducts.mockRejectedValueOnce(new Error('API timeout')).mockResolvedValueOnce([
      {
        sku: '6000-BLU-L',
        styleID: '5678',
        styleName: 'Polo',
        brandName: 'Port',
        colorName: 'Blue',
        colorCode: '',
        colorPriceCodeName: '',
        sizeName: 'L',
        sizeCode: '',
        sizePriceCodeName: '',
        piecePrice: 5.99,
        dozenPrice: null,
        casePrice: null,
        caseQty: null,
        customerPrice: null,
        mapPrice: null,
        salePrice: null,
        saleExpiration: null,
        gtin: null,
      },
    ])

    const result = await syncRawPricingFromSupplier(['1234', '5678'])
    expect(result.synced).toBe(1)
    expect(result.errors).toBe(1)
  })

  it('skips styles with no products', async () => {
    setupSSAdapter()
    mockGetRawProducts.mockResolvedValueOnce([])

    const result = await syncRawPricingFromSupplier(['1234'])
    expect(result.synced).toBe(0)
    expect(result.errors).toBe(0)
    expect(mockInsert).not.toHaveBeenCalled()
  })
})
