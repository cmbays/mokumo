// lib/suppliers/adapters/mock.ts
import { garmentCatalog } from '@infra/repositories/_providers/mock/data'
import type {
  SupplierAdapter,
  SupplierName,
  CanonicalStyle,
  CacheStore,
  CatalogSearchInput,
  CatalogSearchResult,
  HealthStatus,
} from '../types'
import { catalogSearchParamsSchema } from '../types'

const CACHE_TTL = {
  catalog: 86400, // 24h — static mock data never changes
  inventory: 300, // 5min — mirrors volatile S&S inventory TTL
}

export class MockAdapter implements SupplierAdapter {
  readonly supplierName: SupplierName = 'mock'

  constructor(private readonly cache: CacheStore) {}

  private toCanonicalStyle(garment: (typeof garmentCatalog)[number]): CanonicalStyle {
    return {
      supplierId: garment.id,
      styleNumber: garment.sku,
      styleName: garment.name,
      brand: garment.brand,
      description: '',
      categories: [garment.baseCategory],
      colors: garment.availableColors.map((id) => ({
        name: id,
        hex1: null,
        hex2: null,
        images: [],
      })),
      sizes: garment.availableSizes.map((s) => ({
        name: s.name,
        sortOrder: s.order,
        priceAdjustment: s.priceAdjustment,
      })),
      pricing: {
        piecePrice: garment.basePrice,
        dozenPrice: null,
        casePrice: null,
        caseQty: null,
      },
      gtin: null,
      supplier: this.supplierName,
    }
  }

  async getStyle(styleId: string): Promise<CanonicalStyle | null> {
    const cacheKey = `mock:style:${styleId}`
    const cached = await this.cache.get<CanonicalStyle>(cacheKey)
    if (cached) return cached

    const garment = garmentCatalog.find((g) => g.id === styleId)
    if (!garment) return null

    const style = this.toCanonicalStyle(garment)
    await this.cache.set(cacheKey, style, CACHE_TTL.catalog)
    return style
  }

  async getStylesBatch(styleIds: string[]): Promise<CanonicalStyle[]> {
    const results = await Promise.all(styleIds.map((id) => this.getStyle(id)))
    return results.filter((s): s is CanonicalStyle => s !== null)
  }

  // Mock data is in-process — no cache needed. Real adapters (e.g. SSActivewearAdapter) should
  // cache searchCatalog results with CACHE_TTL.catalog to avoid N+1 HTTP calls per request.
  async searchCatalog(params: CatalogSearchInput): Promise<CatalogSearchResult> {
    const { brand, category, query, limit, offset } = catalogSearchParamsSchema.parse(params)

    let results = garmentCatalog.map((g) => this.toCanonicalStyle(g))

    if (brand) results = results.filter((s) => s.brand === brand)
    if (category) results = results.filter((s) => s.categories.includes(category))
    if (query) {
      const q = query.toLowerCase()
      results = results.filter(
        (s) =>
          s.styleName.toLowerCase().includes(q) ||
          s.brand.toLowerCase().includes(q) ||
          s.styleNumber.toLowerCase().includes(q)
      )
    }

    const total = results.length
    const sliced = results.slice(offset, offset + limit)
    return { styles: sliced, total, hasMore: offset + sliced.length < total }
  }

  async getInventory(skuIds: string[]): Promise<Record<string, number>> {
    return Object.fromEntries(skuIds.map((id) => [id, 999]))
  }

  async getBrands(): Promise<string[]> {
    const brands = new Set(garmentCatalog.map((g) => g.brand))
    return Array.from(brands).sort()
  }

  async getCategories(): Promise<string[]> {
    const cats = new Set(garmentCatalog.map((g) => g.baseCategory))
    return Array.from(cats).sort()
  }

  async healthCheck(): Promise<HealthStatus> {
    return {
      healthy: true,
      supplier: this.supplierName,
      checkedAt: new Date(),
    }
  }
}
