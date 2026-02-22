/**
 * Integration-style test for the garments repository router.
 * Verifies that SUPPLIER_ADAPTER env var switches between providers.
 */
import { describe, it, expect, vi, afterEach } from 'vitest'

// Mock server-only module so tests can run
vi.mock('server-only', () => ({}))

// Mock both providers so no real I/O occurs
vi.mock('@infra/repositories/_providers/mock/garments', () => ({
  getGarmentCatalog: vi.fn().mockResolvedValue([{ id: 'mock-garment', source: 'mock' }]),
  getGarmentById: vi.fn().mockResolvedValue({ id: 'mock-garment', source: 'mock' }),
  getAvailableBrands: vi.fn().mockResolvedValue(['MockBrand']),
  getGarmentCatalogMutable: vi.fn().mockReturnValue([]),
}))

vi.mock('@infra/repositories/_providers/supplier/garments', () => ({
  getGarmentCatalog: vi.fn().mockResolvedValue([{ id: 'supplier-garment', source: 'supplier' }]),
  getGarmentById: vi.fn().mockResolvedValue({ id: 'supplier-garment', source: 'supplier' }),
  getAvailableBrands: vi.fn().mockResolvedValue(['SupplierBrand']),
}))

vi.mock('@infra/repositories/_providers/supabase/garments', () => ({
  getGarmentCatalog: vi.fn().mockResolvedValue([{ id: 'supabase-garment', source: 'supabase' }]),
  getGarmentById: vi.fn().mockResolvedValue({ id: 'supabase-garment', source: 'supabase' }),
  getAvailableBrands: vi.fn().mockResolvedValue(['SupabaseBrand']),
}))

afterEach(() => {
  vi.unstubAllEnvs()
  vi.resetModules()
})

describe('garments repository router', () => {
  it('uses mock provider when SUPPLIER_ADAPTER is not set', async () => {
    vi.stubEnv('SUPPLIER_ADAPTER', '')
    const { getGarmentCatalog } = await import('@infra/repositories/garments')
    const result = await getGarmentCatalog()
    expect(result[0]).toMatchObject({ source: 'mock' })
  })

  it('uses supplier provider when SUPPLIER_ADAPTER=ss-activewear', async () => {
    vi.stubEnv('SUPPLIER_ADAPTER', 'ss-activewear')
    const { getGarmentCatalog } = await import('@infra/repositories/garments')
    const result = await getGarmentCatalog()
    expect(result[0]).toMatchObject({ source: 'supplier' })
  })

  it('uses supplier provider via MockAdapter when SUPPLIER_ADAPTER=mock (no HTTP calls)', async () => {
    vi.stubEnv('SUPPLIER_ADAPTER', 'mock')
    const { getGarmentCatalog } = await import('@infra/repositories/garments')
    const result = await getGarmentCatalog()
    expect(result[0]).toMatchObject({ source: 'supplier' })
  })

  it('getGarmentById routes to mock when SUPPLIER_ADAPTER unset', async () => {
    vi.stubEnv('SUPPLIER_ADAPTER', '')
    const { getGarmentById } = await import('@infra/repositories/garments')
    const result = await getGarmentById('some-id')
    expect(result).toMatchObject({ source: 'mock' })
  })

  it('getGarmentById routes to supplier when SUPPLIER_ADAPTER set', async () => {
    vi.stubEnv('SUPPLIER_ADAPTER', 'ss-activewear')
    const { getGarmentById } = await import('@infra/repositories/garments')
    const result = await getGarmentById('3001')
    expect(result).toMatchObject({ source: 'supplier' })
  })

  it('getAvailableBrands routes to mock when SUPPLIER_ADAPTER unset', async () => {
    vi.stubEnv('SUPPLIER_ADAPTER', '')
    const { getAvailableBrands } = await import('@infra/repositories/garments')
    const result = await getAvailableBrands()
    expect(result).toEqual(['MockBrand'])
  })

  it('getAvailableBrands routes to supplier when SUPPLIER_ADAPTER set', async () => {
    vi.stubEnv('SUPPLIER_ADAPTER', 'ss-activewear')
    const { getAvailableBrands } = await import('@infra/repositories/garments')
    const result = await getAvailableBrands()
    expect(result).toEqual(['SupplierBrand'])
  })

  it('uses Supabase catalog when SUPPLIER_ADAPTER=supabase-catalog', async () => {
    vi.stubEnv('SUPPLIER_ADAPTER', 'supabase-catalog')
    const { getGarmentCatalog } = await import('@infra/repositories/garments')
    const result = await getGarmentCatalog()
    expect(result[0]).toMatchObject({ source: 'supabase' })
  })

  it('getGarmentById routes to Supabase when SUPPLIER_ADAPTER=supabase-catalog', async () => {
    vi.stubEnv('SUPPLIER_ADAPTER', 'supabase-catalog')
    const { getGarmentById } = await import('@infra/repositories/garments')
    const result = await getGarmentById('3001')
    expect(result).toMatchObject({ source: 'supabase' })
  })

  it('getAvailableBrands routes to Supabase when SUPPLIER_ADAPTER=supabase-catalog', async () => {
    vi.stubEnv('SUPPLIER_ADAPTER', 'supabase-catalog')
    const { getAvailableBrands } = await import('@infra/repositories/garments')
    const result = await getAvailableBrands()
    expect(result).toEqual(['SupabaseBrand'])
  })
})
