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

const mockInsert = vi.fn()
const mockValues = vi.fn()
const mockOnConflictDoUpdate = vi.fn().mockResolvedValue(undefined)

vi.mock('@shared/lib/supabase/db', () => ({
  db: {
    insert: (...args: unknown[]) => {
      mockInsert(...args)
      return {
        values: (...vArgs: unknown[]) => {
          mockValues(...vArgs)
          return {
            onConflictDoUpdate: mockOnConflictDoUpdate,
          }
        },
      }
    },
  },
}))

vi.mock('@db/schema/catalog-normalized', () => ({
  catalogBrands: { canonicalName: 'canonical_name_col' },
}))

// resolveImageUrl is imported from products-sync.utils — mock it to test
// brands-sync.service in isolation without the URL-building logic.
vi.mock('@infra/services/products-sync.utils', () => ({
  resolveImageUrl: (path: string) => {
    if (!path) return null
    if (path.startsWith('http')) return path
    return `https://www.ssactivewear.com${path.startsWith('/') ? '' : '/'}${path}`
  },
}))

const mockGetRawBrands = vi.fn()

vi.mock('@lib/suppliers/registry', () => ({
  getSsActivewearAdapter: () => ({
    getRawBrands: mockGetRawBrands,
  }),
}))

import { syncBrandsFromSupplier } from '../brands-sync.service'

describe('syncBrandsFromSupplier', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockOnConflictDoUpdate.mockResolvedValue(undefined)
  })

  it('upserts brands returned by adapter.getRawBrands()', async () => {
    mockGetRawBrands.mockResolvedValue([
      {
        brandID: '1',
        brandName: 'Gildan',
        brandImage: '/images/gildan.jpg',
        description: 'Value brand',
      },
      { brandID: '2', brandName: 'Next Level', brandImage: '', description: '' },
    ])

    await syncBrandsFromSupplier()

    expect(mockValues).toHaveBeenCalledOnce()
    const [insertedValues] = mockValues.mock.calls[0] as [Array<Record<string, unknown>>]

    const gildan = insertedValues.find((v) => v.canonicalName === 'Gildan')
    expect(gildan).toEqual(
      expect.objectContaining({
        canonicalName: 'Gildan',
        brandImageUrl: 'https://www.ssactivewear.com/images/gildan.jpg',
        description: 'Value brand',
      })
    )

    const nextLevel = insertedValues.find((v) => v.canonicalName === 'Next Level')
    expect(nextLevel).toEqual(
      expect.objectContaining({
        canonicalName: 'Next Level',
        brandImageUrl: null,
        description: null,
      })
    )
  })

  it('returns correct brandsUpserted count', async () => {
    mockGetRawBrands.mockResolvedValue([
      { brandID: '1', brandName: 'Gildan', brandImage: '', description: '' },
      { brandID: '2', brandName: 'Next Level', brandImage: '', description: '' },
      { brandID: '3', brandName: 'Bella+Canvas', brandImage: '', description: '' },
    ])

    const result = await syncBrandsFromSupplier()

    expect(result.brandsUpserted).toBe(3)
    expect(result.errors).toBe(0)
  })

  it('handles empty brands response gracefully', async () => {
    mockGetRawBrands.mockResolvedValue([])

    const result = await syncBrandsFromSupplier()

    expect(result.brandsUpserted).toBe(0)
    expect(result.errors).toBe(0)
    expect(mockInsert).not.toHaveBeenCalled()
  })

  it('resolves absolute image URLs unchanged', async () => {
    mockGetRawBrands.mockResolvedValue([
      { brandName: 'Gildan', brandImage: 'https://cdn.example.com/gildan.jpg', description: '' },
    ])

    await syncBrandsFromSupplier()

    const [insertedValues] = mockValues.mock.calls[0] as [Array<Record<string, unknown>>]
    expect(insertedValues[0].brandImageUrl).toBe('https://cdn.example.com/gildan.jpg')
  })

  it('trims whitespace-only descriptions to null', async () => {
    mockGetRawBrands.mockResolvedValue([
      { brandName: 'Gildan', brandImage: '', description: '   ' },
    ])

    await syncBrandsFromSupplier()

    const [insertedValues] = mockValues.mock.calls[0] as [Array<Record<string, unknown>>]
    expect(insertedValues[0].description).toBeNull()
  })

  it('skips brands with empty brandName', async () => {
    mockGetRawBrands.mockResolvedValue([
      { brandName: '', brandImage: '', description: '' },
      { brandName: 'Gildan', brandImage: '', description: '' },
    ])

    const result = await syncBrandsFromSupplier()

    expect(result.brandsUpserted).toBe(1)
    const [insertedValues] = mockValues.mock.calls[0] as [Array<Record<string, unknown>>]
    expect(insertedValues).toHaveLength(1)
    expect(insertedValues[0].canonicalName).toBe('Gildan')
  })

  it('skips brands with whitespace-only brandName', async () => {
    mockGetRawBrands.mockResolvedValue([{ brandName: '   ', brandImage: '', description: '' }])

    const result = await syncBrandsFromSupplier()

    expect(result.brandsUpserted).toBe(0)
    expect(mockInsert).not.toHaveBeenCalled()
  })

  it('propagates errors thrown by the adapter', async () => {
    mockGetRawBrands.mockRejectedValue(new Error('S&S API unreachable'))

    await expect(syncBrandsFromSupplier()).rejects.toThrow('S&S API unreachable')
    expect(mockInsert).not.toHaveBeenCalled()
  })
})
