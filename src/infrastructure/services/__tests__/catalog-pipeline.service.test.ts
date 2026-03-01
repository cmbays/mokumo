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

vi.mock('@infra/services/styles-sync.service', () => ({
  syncStylesFromSupplier: vi.fn(),
}))

vi.mock('@infra/services/products-sync.service', () => ({
  syncProductsFromSupplier: vi.fn(),
}))

vi.mock('@infra/services/brands-sync.service', () => ({
  syncBrandsFromSupplier: vi.fn(),
}))

import { runCatalogPipeline } from '../catalog-pipeline.service'
import { syncStylesFromSupplier } from '@infra/services/styles-sync.service'
import { syncProductsFromSupplier } from '@infra/services/products-sync.service'
import { syncBrandsFromSupplier } from '@infra/services/brands-sync.service'

const DEFAULT_PRODUCTS_RESULT = {
  synced: 4808,
  errors: 0,
  total: 100,
  colorsUpserted: 320,
  imagesUpserted: 960,
}

const DEFAULT_BRANDS_RESULT = { brandsUpserted: 42, errors: 0 }

describe('runCatalogPipeline', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(syncStylesFromSupplier).mockResolvedValue(100)
    vi.mocked(syncProductsFromSupplier).mockResolvedValue(DEFAULT_PRODUCTS_RESULT)
    vi.mocked(syncBrandsFromSupplier).mockResolvedValue(DEFAULT_BRANDS_RESULT)
  })

  it('calls styles sync, then products sync, then brands sync in order', async () => {
    const callOrder: string[] = []

    vi.mocked(syncStylesFromSupplier).mockImplementation(async () => {
      callOrder.push('styles')
      return 100
    })
    vi.mocked(syncProductsFromSupplier).mockImplementation(async () => {
      callOrder.push('products')
      return DEFAULT_PRODUCTS_RESULT
    })
    vi.mocked(syncBrandsFromSupplier).mockImplementation(async () => {
      callOrder.push('brands')
      return DEFAULT_BRANDS_RESULT
    })

    await runCatalogPipeline()

    expect(callOrder).toEqual(['styles', 'products', 'brands'])
  })

  it('passes options through to products sync', async () => {
    await runCatalogPipeline({ styleIds: ['STYLE-001', 'STYLE-002'], offset: 10, limit: 50 })

    expect(syncProductsFromSupplier).toHaveBeenCalledWith(['STYLE-001', 'STYLE-002'], {
      offset: 10,
      limit: 50,
    })
  })

  it('passes undefined styleIds and options when called with no arguments', async () => {
    await runCatalogPipeline()

    expect(syncProductsFromSupplier).toHaveBeenCalledWith(undefined, {
      offset: undefined,
      limit: undefined,
    })
  })

  it('returns aggregate stats from all three services', async () => {
    vi.mocked(syncStylesFromSupplier).mockResolvedValue(75)
    vi.mocked(syncProductsFromSupplier).mockResolvedValue({
      synced: 3600,
      errors: 5,
      total: 75,
      colorsUpserted: 240,
      imagesUpserted: 720,
    })
    vi.mocked(syncBrandsFromSupplier).mockResolvedValue({ brandsUpserted: 30, errors: 0 })

    const result = await runCatalogPipeline()

    expect(result.styles).toEqual({ synced: 75, errors: 0 })
    expect(result.products).toEqual({
      stylesProcessed: 75,
      colorsUpserted: 240,
      sizesUpserted: 0,
      skusInserted: 3600,
      errors: 5,
    })
    expect(result.brands).toEqual({ brandsUpserted: 30, errors: 0 })
  })

  it('includes duration in milliseconds', async () => {
    vi.spyOn(performance, 'now').mockReturnValueOnce(0).mockReturnValueOnce(2500.7)

    const result = await runCatalogPipeline()

    // Math.round(2500.7 - 0) = 2501
    expect(result.duration).toBe(2501)
  })

  it('includes a timestamp ISO 8601 string', async () => {
    const result = await runCatalogPipeline()

    expect(result.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
  })

  it('if styles sync throws, pipeline propagates the error', async () => {
    vi.mocked(syncStylesFromSupplier).mockRejectedValue(new Error('S&S API unreachable'))

    await expect(runCatalogPipeline()).rejects.toThrow('S&S API unreachable')
    expect(syncProductsFromSupplier).not.toHaveBeenCalled()
    expect(syncBrandsFromSupplier).not.toHaveBeenCalled()
  })

  it('if products sync throws, pipeline propagates and skips brands sync', async () => {
    vi.mocked(syncProductsFromSupplier).mockRejectedValue(new Error('DB connection lost'))

    await expect(runCatalogPipeline()).rejects.toThrow('DB connection lost')
    expect(syncBrandsFromSupplier).not.toHaveBeenCalled()
  })
})
