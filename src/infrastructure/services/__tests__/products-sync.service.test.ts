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
      return {
        values: (...vArgs: unknown[]) => {
          mockValues(...vArgs)
          // Return an object that supports both:
          //   await db.insert(t).values(rows)                         (raw products)
          //   await db.insert(t).values(rows).onConflictDoUpdate(...) (catalog_sizes)
          return { onConflictDoUpdate: vi.fn().mockResolvedValue(undefined) }
        },
      }
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
  catalogStyles: { externalId: 'external_id', source: 'source', id: 'id' },
  catalogSizes: { styleId: 'style_id', name: 'name' },
}))

// Mock the adapter module — the factory must be self-contained (vi.mock is hoisted)
vi.mock('@lib/suppliers/registry', () => ({
  getSsActivewearAdapter: vi.fn(),
}))

import type { SSActivewearAdapter } from '@lib/suppliers/adapters/ss-activewear'
import { getSsActivewearAdapter } from '@lib/suppliers/registry'
import { syncProductsFromSupplier } from '../products-sync.service'

// ─── Setup ────────────────────────────────────────────────────────────────────

const mockGetRawProductsBatch = vi.fn()

beforeEach(() => {
  vi.clearAllMocks()
})

function setupSSAdapter() {
  vi.mocked(getSsActivewearAdapter).mockReturnValue({
    getRawProductsBatch: mockGetRawProductsBatch,
  } as unknown as SSActivewearAdapter)
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('syncProductsFromSupplier', () => {
  it('returns { synced: 0, errors: 0, total: 0 } when no styles to sync', async () => {
    setupSSAdapter()
    mockWhere.mockResolvedValueOnce([])
    const result = await syncProductsFromSupplier()
    expect(result).toEqual({ synced: 0, errors: 0, total: 0 })
  })

  it('syncs products for provided styleIds using a single batched API call', async () => {
    setupSSAdapter()
    mockGetRawProductsBatch.mockResolvedValueOnce([
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
        sizeIndex: 0,
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

    const result = await syncProductsFromSupplier(['1234'])
    expect(result.synced).toBe(1)
    expect(result.errors).toBe(0)
    // Batch call receives the array, not a single string
    expect(mockGetRawProductsBatch).toHaveBeenCalledWith(['1234'])
    expect(mockInsert).toHaveBeenCalled()
  })

  it('counts batch.length errors when the batch API call fails', async () => {
    setupSSAdapter()
    // First batch of ['1234', '5678'] fails; no second call because both are in one batch
    mockGetRawProductsBatch.mockRejectedValueOnce(new Error('API timeout'))

    const result = await syncProductsFromSupplier(['1234', '5678'])
    expect(result.synced).toBe(0)
    expect(result.errors).toBe(2) // entire batch counted as errors
  })

  it('groups multi-style batch response and syncs each style separately', async () => {
    setupSSAdapter()
    // Both styles come back in one response array (mixed)
    mockGetRawProductsBatch.mockResolvedValueOnce([
      {
        sku: '5000-RED-M',
        styleID: '1234',
        styleName: 'Tee',
        brandName: 'Gildan',
        colorName: 'Red',
        colorCode: '',
        colorPriceCodeName: '',
        sizeName: 'M',
        sizeCode: '',
        sizePriceCodeName: '',
        sizeIndex: 0,
        piecePrice: 2.99,
        dozenPrice: null,
        casePrice: null,
        caseQty: null,
        customerPrice: null,
        mapPrice: null,
        salePrice: null,
        saleExpiration: null,
        gtin: null,
      },
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
        sizeIndex: 0,
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

    const result = await syncProductsFromSupplier(['1234', '5678'])
    expect(result.synced).toBe(2)
    expect(result.errors).toBe(0)
    // Only ONE batch API call for both styles
    expect(mockGetRawProductsBatch).toHaveBeenCalledTimes(1)
    expect(mockGetRawProductsBatch).toHaveBeenCalledWith(['1234', '5678'])
  })

  it('skips styles with no products in the batch response', async () => {
    setupSSAdapter()
    mockGetRawProductsBatch.mockResolvedValueOnce([])

    const result = await syncProductsFromSupplier(['1234'])
    expect(result.synced).toBe(0)
    expect(result.errors).toBe(0)
    expect(mockInsert).not.toHaveBeenCalled()
  })
})
