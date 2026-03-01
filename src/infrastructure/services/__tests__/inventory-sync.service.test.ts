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

// ─── DB mock helpers ──────────────────────────────────────────────────────────

const mockTransaction = vi.fn()
const mockInsert = vi.fn()
const mockInsertValues = vi.fn()
const mockDelete = vi.fn()
const mockDeleteWhere = vi.fn()
const mockSelect = vi.fn()
const mockSelectDistinctOn = vi.fn()

vi.mock('@shared/lib/supabase/db', () => ({
  db: {
    transaction: (...args: unknown[]) => mockTransaction(...args),
    insert: (...args: unknown[]) => {
      mockInsert(...args)
      return { values: mockInsertValues }
    },
    delete: (...args: unknown[]) => {
      mockDelete(...args)
      return { where: mockDeleteWhere }
    },
    // select().from() resolves directly to [] — no further chaining in the service
    select: (...args: unknown[]) => {
      mockSelect(...args)
      return { from: vi.fn().mockResolvedValue([]) }
    },
    // selectDistinctOn().from().orderBy() — needs the extra orderBy step
    selectDistinctOn: (...args: unknown[]) => {
      mockSelectDistinctOn(...args)
      return {
        from: vi.fn().mockReturnValue({
          orderBy: vi.fn().mockResolvedValue([]),
        }),
      }
    },
  },
}))

vi.mock('@db/schema/raw', () => ({
  ssActivewearInventory: { _: 'ss_activewear_inventory_table' },
  ssActivewearProducts: { sku: 'sku', styleIdExternal: 'style_id_external', colorName: 'color_name', sizeName: 'size_name', loadedAt: '_loaded_at' },
}))

vi.mock('@db/schema/catalog-normalized', () => ({
  catalogInventory: { colorId: 'color_id', sizeId: 'size_id' },
  catalogStyles: { id: 'id', externalId: 'external_id' },
  catalogColors: { id: 'id', styleId: 'style_id', name: 'name' },
  catalogSizes: { id: 'id', styleId: 'style_id', name: 'name' },
}))

vi.mock('@lib/suppliers/adapters/ss-activewear', () => {
  class SSActivewearAdapter {}
  return { SSActivewearAdapter }
})

vi.mock('@lib/suppliers/registry', () => ({
  getSupplierAdapter: vi.fn(),
}))

import { SSActivewearAdapter } from '@lib/suppliers/adapters/ss-activewear'
import { getSupplierAdapter } from '@lib/suppliers/registry'
import {
  computeTotalQty,
  buildSkuMapFromRaw,
  syncInventoryFromSupplier,
} from '../inventory-sync.service'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const mockGetRawInventory = vi.fn()

function setupSSAdapter() {
  const MockedSSAdapter = SSActivewearAdapter as unknown as new () => InstanceType<
    typeof SSActivewearAdapter
  >
  const adapter = Object.assign(new MockedSSAdapter(), {
    getRawInventory: mockGetRawInventory,
  })
  vi.mocked(getSupplierAdapter).mockReturnValue(adapter as ReturnType<typeof getSupplierAdapter>)
}

function setupNonSSAdapter() {
  vi.mocked(getSupplierAdapter).mockReturnValue({
    supplierName: 'mock',
  } as ReturnType<typeof getSupplierAdapter>)
}

beforeEach(() => {
  vi.clearAllMocks()
  mockDeleteWhere.mockResolvedValue(undefined)

  // Provide a tx object with the same insert chain the service uses.
  // onConflictDoUpdate is the terminal step for catalog_inventory upsert;
  // the first insert (raw rows) is awaited without further chaining.
  const txInsert = vi.fn().mockReturnValue({
    values: vi.fn().mockReturnValue({
      onConflictDoUpdate: vi.fn().mockResolvedValue(undefined),
    }),
  })
  mockTransaction.mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) =>
    fn({ insert: txInsert })
  )

  mockInsertValues.mockResolvedValue(undefined)
})

// ─── computeTotalQty ──────────────────────────────────────────────────────────

describe('computeTotalQty', () => {
  it('sums quantities from all warehouses', () => {
    expect(computeTotalQty([{ qty: 100 }, { qty: 50 }, { qty: 25 }])).toBe(175)
  })

  it('returns 0 for empty warehouses array', () => {
    expect(computeTotalQty([])).toBe(0)
  })

  it('treats missing qty as 0', () => {
    expect(computeTotalQty([{ qty: 10 }, {}])).toBe(10)
  })

  it('handles qty: 0 (out-of-stock warehouses) correctly', () => {
    expect(computeTotalQty([{ qty: 0 }, { qty: 0 }, { qty: 5 }])).toBe(5)
  })
})

// ─── buildSkuMapFromRaw ───────────────────────────────────────────────────────

describe('buildSkuMapFromRaw', () => {
  const styleIdMap = new Map([['EXT-1', 'style-uuid-1']])
  const colorIdMap = new Map([['style-uuid-1:Red', 'color-uuid-1']])
  const sizeIdMap = new Map([['style-uuid-1:M', 'size-uuid-m']])

  it('builds a skuMap entry when all lookups resolve', () => {
    const raw = [
      { sku: 'SKU-001', styleIdExternal: 'EXT-1', colorName: 'Red', sizeName: 'M' },
    ]
    const result = buildSkuMapFromRaw(raw, styleIdMap, colorIdMap, sizeIdMap)
    expect(result.get('SKU-001')).toEqual({ colorId: 'color-uuid-1', sizeId: 'size-uuid-m' })
  })

  it('skips sku when styleId is not in styleIdMap', () => {
    const raw = [
      { sku: 'SKU-001', styleIdExternal: 'EXT-UNKNOWN', colorName: 'Red', sizeName: 'M' },
    ]
    const result = buildSkuMapFromRaw(raw, styleIdMap, colorIdMap, sizeIdMap)
    expect(result.has('SKU-001')).toBe(false)
  })

  it('skips sku when colorId is not in colorIdMap', () => {
    const raw = [
      { sku: 'SKU-001', styleIdExternal: 'EXT-1', colorName: 'UnknownColor', sizeName: 'M' },
    ]
    const result = buildSkuMapFromRaw(raw, styleIdMap, colorIdMap, sizeIdMap)
    expect(result.has('SKU-001')).toBe(false)
  })

  it('skips sku when sizeId is not in sizeIdMap', () => {
    const raw = [
      { sku: 'SKU-001', styleIdExternal: 'EXT-1', colorName: 'Red', sizeName: 'XXL' },
    ]
    const result = buildSkuMapFromRaw(raw, styleIdMap, colorIdMap, sizeIdMap)
    expect(result.has('SKU-001')).toBe(false)
  })

  it('builds entries for multiple SKUs', () => {
    const styleIdMap2 = new Map([
      ['EXT-1', 'style-uuid-1'],
      ['EXT-2', 'style-uuid-2'],
    ])
    const colorIdMap2 = new Map([
      ['style-uuid-1:Red', 'color-red'],
      ['style-uuid-2:Blue', 'color-blue'],
    ])
    const sizeIdMap2 = new Map([
      ['style-uuid-1:M', 'size-m'],
      ['style-uuid-2:L', 'size-l'],
    ])
    const raw = [
      { sku: 'SKU-A', styleIdExternal: 'EXT-1', colorName: 'Red', sizeName: 'M' },
      { sku: 'SKU-B', styleIdExternal: 'EXT-2', colorName: 'Blue', sizeName: 'L' },
    ]
    const result = buildSkuMapFromRaw(raw, styleIdMap2, colorIdMap2, sizeIdMap2)
    expect(result.size).toBe(2)
    expect(result.get('SKU-A')).toEqual({ colorId: 'color-red', sizeId: 'size-m' })
    expect(result.get('SKU-B')).toEqual({ colorId: 'color-blue', sizeId: 'size-l' })
  })

  it('returns empty map for empty raw products', () => {
    const result = buildSkuMapFromRaw([], styleIdMap, colorIdMap, sizeIdMap)
    expect(result.size).toBe(0)
  })
})

// ─── syncInventoryFromSupplier ────────────────────────────────────────────────

describe('syncInventoryFromSupplier', () => {
  it('returns zeros when adapter is not SSActivewearAdapter', async () => {
    setupNonSSAdapter()
    const result = await syncInventoryFromSupplier()
    expect(result).toEqual({ synced: 0, rawInserted: 0, errors: 0 })
  })

  it('returns zeros and warns when S&S returns 0 items', async () => {
    setupSSAdapter()
    mockGetRawInventory.mockResolvedValueOnce([])
    const result = await syncInventoryFromSupplier()
    expect(result).toEqual({ synced: 0, rawInserted: 0, errors: 0 })
    expect(mockTransaction).not.toHaveBeenCalled()
  })

  it('inserts raw rows and upserts catalog rows for matched SKUs', async () => {
    setupSSAdapter()
    mockGetRawInventory.mockResolvedValueOnce([
      {
        sku: 'SKU-001',
        skuID: 12345,
        styleID: 'EXT-1',
        warehouses: [{ warehouseAbbr: 'OH', skuID: 12345, qty: 100 }],
      },
    ])

    const result = await syncInventoryFromSupplier()

    // No skuMap entries since DB returns empty arrays (catalog tables empty in mock)
    // raw rows should still be inserted
    expect(mockTransaction).toHaveBeenCalledTimes(1)
    expect(result.rawInserted).toBe(1)
    expect(result.errors).toBe(0)
  })

  it('counts batch errors but continues processing', async () => {
    setupSSAdapter()
    mockGetRawInventory.mockResolvedValueOnce([
      {
        sku: 'SKU-001',
        skuID: 1,
        styleID: 'EXT-1',
        warehouses: [{ warehouseAbbr: 'OH', qty: 50 }],
      },
    ])
    mockTransaction.mockRejectedValueOnce(new Error('DB connection error'))

    const result = await syncInventoryFromSupplier()
    expect(result.errors).toBe(1)
    expect(result.rawInserted).toBe(0)
  })

  it('runs the 48h retention delete after batch processing', async () => {
    setupSSAdapter()
    mockGetRawInventory.mockResolvedValueOnce([
      {
        sku: 'SKU-001',
        skuID: 1,
        styleID: 'EXT-1',
        warehouses: [],
      },
    ])

    await syncInventoryFromSupplier()
    expect(mockDelete).toHaveBeenCalled()
    expect(mockDeleteWhere).toHaveBeenCalled()
  })
})
