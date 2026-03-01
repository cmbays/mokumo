/**
 * SSActivewearAdapter — server-side adapter for S&S Activewear REST API V2.
 *
 * Implements the SupplierAdapter interface using ssGet() from ss-client.ts
 * (which handles auth, rate-limit circuit breaking, and pricing field stripping).
 *
 * Browse vs. detail split:
 *   searchCatalog → /v2/styles/    (1 request, style-level metadata, empty colors/sizes)
 *   getStyle      → /v2/products/  (1 request, full color+size+image detail)
 *
 * Fallback: 502 errors (S&S unreachable) fall back to MockAdapter so the UI
 * stays functional during outages. Rate limit errors (429) and credential
 * errors (500) are propagated — these require operator action.
 *
 * @module lib/suppliers/adapters/ss-activewear
 */
import { z } from 'zod'
import { ssGet, SSClientError, SS_CACHE_TTL } from '../ss-client'
import {
  catalogSearchParamsSchema,
  canonicalImageTypeSchema,
  type SupplierAdapter,
  type SupplierName,
  type CanonicalStyle,
  type CanonicalColor,
  type CanonicalSize,
  type CacheStore,
  type CatalogSearchInput,
  type CatalogSearchResult,
  type HealthStatus,
} from '../types'
import type { MockAdapter } from './mock'
import { logger } from '@shared/lib/logger'

const adapterLogger = logger.child({ domain: 'ss-activewear-adapter' })

// ─── Raw S&S response schemas ─────────────────────────────────────────────────

/**
 * Style-level row from /v2/styles/ — metadata only, no color/size detail.
 * S&S may include additional fields; .passthrough() preserves them without
 * breaking validation.
 */
const ssStyleSchema = z
  .object({
    styleID: z.union([z.number(), z.string()]).transform(String),
    brandName: z.string(),
    partNumber: z.string().optional().default(''),
    styleName: z.string(),
    baseCategory: z.string().optional().default(''),
    description: z.string().optional().default(''),
  })
  .passthrough()

type SSStyle = z.infer<typeof ssStyleSchema>

/**
 * Product row from /v2/products/ — one row per color+size combination.
 * Multiple rows with the same colorName belong to the same color group.
 */
const ssProductSchema = z
  .object({
    sku: z.string(),
    styleID: z.union([z.number(), z.string()]).transform(String),
    partNumber: z.string().optional().default(''),
    styleName: z.string(),
    brandName: z.string(),
    baseCategory: z.string().optional().default(''),
    description: z.string().optional().default(''),
    colorName: z.string(),
    colorCode: z.string().optional().default(''),
    // S&S returns "colorFamily" (not "colorFamilyName") — the DB column is named color_family_name
    colorFamily: z.string().optional(),
    // S&S hex codes omit the # prefix (e.g. "FF0000"). Empty string = no hex.
    color1: z.string().optional().default(''),
    color2: z.string().optional().default(''),
    sizeName: z.string(),
    sizeCode: z.string().optional().default(''),
    sizeIndex: z.number().optional().default(0),
    gtin: z.string().optional(),
    piecePrice: z.number().nullable().optional(),
    dozenPrice: z.number().nullable().optional(),
    casePrice: z.number().nullable().optional(),
    caseQty: z.number().int().positive().nullable().optional(),
    // Pricing fields preserved by preserveRawFields — stripped in normal app requests
    customerPrice: z.number().nullable().optional(),
    mapPrice: z.number().nullable().optional(),
    salePrice: z.number().nullable().optional(),
    saleExpiration: z.string().nullable().optional(),
    // Price code groupings for quantity-break pricing
    colorPriceCodeName: z.string().optional().default(''),
    sizePriceCodeName: z.string().optional().default(''),
    // Eight image fields per color — may be empty string or relative URL path
    colorFrontImage: z.string().optional().default(''),
    colorBackImage: z.string().optional().default(''),
    colorSideImage: z.string().optional().default(''),
    colorDirectSideImage: z.string().optional().default(''),
    colorOnModelFrontImage: z.string().optional().default(''),
    colorOnModelBackImage: z.string().optional().default(''),
    colorOnModelSideImage: z.string().optional().default(''),
    colorSwatchImage: z.string().optional().default(''),
  })
  .passthrough()

export type SSProduct = z.infer<typeof ssProductSchema>

const ssInventoryItemSchema = z
  .object({
    sku: z.string(),
    // S&S returns either onHandQty or qty depending on API version
    onHandQty: z.number().optional(),
    qty: z.number().optional(),
  })
  .passthrough()

/**
 * Per-warehouse quantity record within a raw inventory item.
 * warehouseAbbr: OH, IL, PA, CN, MA, NV, GA, TX, KS, FO (freight-only), DS (drop-ship).
 */
const ssRawInventoryWarehouseSchema = z
  .object({
    warehouseAbbr: z.string(),
    skuID: z.number().optional(),
    qty: z.number(),
  })
  .passthrough()

/**
 * Full inventory item from GET /v2/inventory/ — used for bulk sync.
 * Differs from ssInventoryItemSchema (per-SKU lookup) by including styleID
 * and the warehouses JSONB array (instead of a single aggregated qty).
 */
const ssRawInventoryItemSchema = z
  .object({
    sku: z.string(),
    skuID: z.number().optional(),
    styleID: z.union([z.number(), z.string()]).transform(String),
    warehouses: z.array(ssRawInventoryWarehouseSchema).default([]),
  })
  .passthrough()

export type SSRawInventoryItem = z.infer<typeof ssRawInventoryItemSchema>

const ssBrandSchema = z
  .object({
    brandName: z.string(),
  })
  .passthrough()

const ssCategorySchema = z
  .object({
    categoryName: z.string(),
  })
  .passthrough()

// ─── Mapping helpers ──────────────────────────────────────────────────────────

const SS_IMAGE_BASE = 'https://www.ssactivewear.com'

/**
 * Normalize S&S hex to #RRGGBB format.
 * S&S omits the # prefix and uses empty string when no color is defined.
 */
function normalizeHex(raw: string): string | null {
  const hex = raw.trim()
  if (!hex) return null
  return hex.startsWith('#') ? hex : `#${hex}`
}

/**
 * Resolve a S&S image path to an absolute URL.
 * S&S returns relative paths like "/(token)/images/...".
 * Already-absolute URLs (starting with http) are passed through unchanged.
 */
function resolveImageUrl(path: string): string | null {
  if (!path) return null
  if (path.startsWith('http')) return path
  return `${SS_IMAGE_BASE}${path.startsWith('/') ? '' : '/'}${path}`
}

/**
 * Build the images array for a single color from one product row.
 * S&S provides one representative row per color (all sizes share the same images).
 */
function buildImages(product: SSProduct) {
  const entries: Array<{ raw: string; type: string }> = [
    { raw: product.colorFrontImage, type: 'front' },
    { raw: product.colorBackImage, type: 'back' },
    { raw: product.colorSideImage, type: 'side' },
    { raw: product.colorDirectSideImage, type: 'direct-side' },
    { raw: product.colorOnModelFrontImage, type: 'on-model-front' },
    { raw: product.colorOnModelBackImage, type: 'on-model-back' },
    { raw: product.colorOnModelSideImage, type: 'on-model-side' },
    { raw: product.colorSwatchImage, type: 'swatch' },
  ]

  return entries
    .map(({ raw, type }) => {
      const url = resolveImageUrl(raw)
      if (!url) return null
      const parsedType = canonicalImageTypeSchema.safeParse(type)
      if (!parsedType.success) return null
      return { type: parsedType.data, url }
    })
    .filter((img): img is NonNullable<typeof img> => img !== null)
}

/**
 * Aggregate flat product rows (one per color+size) into a CanonicalStyle.
 *
 * S&S products endpoint returns a flat array where every row is one SKU.
 * This function groups them:
 *   - By colorName → builds colors[] with images from the first row of each color
 *   - Globally deduped by sizeName → builds sizes[] sorted by sizeIndex
 *   - Pricing taken from the first row with a non-null piecePrice
 *   - GTIN taken from the first row that has one
 */
export function productsToCanonicalStyle(
  styleId: string,
  products: SSProduct[]
): CanonicalStyle | null {
  if (products.length === 0) return null

  const first = products[0]

  // Group products by colorName; keep only the first row per color for images/hex
  const colorMap = new Map<string, SSProduct>()
  // Collect sizes across all colors; dedupe by sizeName, sort by sizeIndex
  const sizeMap = new Map<string, CanonicalSize>()

  for (const p of products) {
    if (!colorMap.has(p.colorName)) {
      colorMap.set(p.colorName, p)
    }
    if (!sizeMap.has(p.sizeName)) {
      sizeMap.set(p.sizeName, {
        name: p.sizeName,
        sortOrder: p.sizeIndex,
        priceAdjustment: 0,
      })
    }
  }

  const colors: CanonicalColor[] = Array.from(colorMap.values()).map((p) => ({
    name: p.colorName,
    hex1: normalizeHex(p.color1),
    hex2: normalizeHex(p.color2),
    images: buildImages(p),
    // S&S field is "colorFamily"; our DB column is "color_family_name"
    colorFamilyName: p.colorFamily?.trim() || null,
    colorCode: p.colorCode?.trim() || null,
  }))

  const sizes: CanonicalSize[] = Array.from(sizeMap.values()).sort(
    (a, b) => a.sortOrder - b.sortOrder
  )

  const pricingSource = products.find((p) => p.piecePrice != null) ?? first
  const gtin = products.find((p) => p.gtin)?.gtin ?? null
  const caseQty = products.find((p) => p.caseQty != null)?.caseQty ?? null

  return {
    supplierId: styleId,
    styleNumber: first.partNumber,
    styleName: first.styleName,
    brand: first.brandName,
    description: first.description,
    categories: first.baseCategory ? [first.baseCategory] : [],
    colors,
    sizes,
    pricing: {
      piecePrice: pricingSource.piecePrice ?? null,
      dozenPrice: pricingSource.dozenPrice ?? null,
      casePrice: pricingSource.casePrice ?? null,
      caseQty,
    },
    gtin,
    supplier: 'ss-activewear' as const,
    lastSynced: new Date(),
  }
}

/**
 * Map a style-level row (from /v2/styles/) to a minimal CanonicalStyle.
 * Colors and sizes are empty — catalog browse doesn't need per-SKU detail.
 * Call getStyle() to get the full color+size+image representation.
 */
function styleToCanonicalStyle(style: SSStyle): CanonicalStyle {
  return {
    supplierId: style.styleID,
    styleNumber: style.partNumber,
    styleName: style.styleName,
    brand: style.brandName,
    description: style.description,
    categories: style.baseCategory ? [style.baseCategory] : [],
    colors: [],
    sizes: [],
    pricing: { piecePrice: null, dozenPrice: null, casePrice: null, caseQty: null },
    gtin: null,
    supplier: 'ss-activewear' as const,
    lastSynced: new Date(),
  }
}

// ─── Adapter ──────────────────────────────────────────────────────────────────

export class SSActivewearAdapter implements SupplierAdapter {
  readonly supplierName: SupplierName = 'ss-activewear'

  constructor(
    private readonly cache: CacheStore,
    /** Fallback used when S&S API is unreachable (502). */
    private readonly fallback: MockAdapter
  ) {}

  /**
   * Fetch full color+size+image detail for one style.
   * Calls /v2/products/?styleId=X — one request, cached at 1h TTL.
   */
  async getStyle(styleId: string): Promise<CanonicalStyle | null> {
    const cacheKey = `ss:style:${styleId}`
    const cached = await this.cache.get<CanonicalStyle>(cacheKey)
    if (cached) return cached

    let raw: unknown
    try {
      raw = await ssGet('products', { styleId }, SS_CACHE_TTL.products)
    } catch (err) {
      // 502 = unreachable → degrade gracefully to mock. 429/5xx = operator action needed → propagate.
      // SSRateLimitError extends SSClientError but has status=429, so it correctly rethrows here.
      if (err instanceof SSClientError && err.status === 502) {
        adapterLogger.warn('S&S unreachable in getStyle, falling back to mock', { styleId })
        return this.fallback.getStyle(styleId)
      }
      throw err
    }

    const products = z.array(ssProductSchema).parse(raw)
    // Log pricing field presence for diagnostics (debug level to avoid prod noise)
    if (products.length > 0) {
      const firstProduct = products[0]
      const hasPricing = firstProduct.piecePrice != null
      adapterLogger.debug('S&S API response pricing data', {
        styleId,
        productCount: products.length,
        firstSKU: firstProduct.sku,
        hasPricing,
        piecePriceValue: firstProduct.piecePrice,
        dozenPriceValue: firstProduct.dozenPrice,
        casePriceValue: firstProduct.casePrice,
      })
    }
    const style = productsToCanonicalStyle(styleId, products)
    if (style) {
      await this.cache.set(cacheKey, style, SS_CACHE_TTL.products)
    }
    return style
  }

  /**
   * Fetch all inventory SKUs from S&S in a single bulk request.
   * Used by the inventory sync cron job to populate raw.ss_activewear_inventory
   * and upsert catalog_inventory. Returns the full warehouses JSONB array
   * (not the aggregated qty used by getInventory).
   *
   * Note: TTL=0 bypasses Next.js fetch cache — cron jobs always need fresh data.
   * The ?skuids= filter is non-functional per S&S API; this returns all ~190k SKUs.
   */
  async getRawInventory(): Promise<SSRawInventoryItem[]> {
    const raw = await ssGet('inventory', {}, 0)
    return z.array(ssRawInventoryItemSchema).parse(raw)
  }

  /**
   * Fetch raw per-SKU product data with all pricing fields preserved.
   * Used by the pricing sync service to populate the raw analytics table.
   *
   * Unlike getStyle() which strips commercially sensitive fields, this
   * method uses preserveRawFields: true to keep customerPrice, mapPrice,
   * salePrice, and saleExpiration for the analytics pipeline.
   */
  async getRawProducts(styleId: string): Promise<SSProduct[]> {
    const raw = await ssGet('products', { styleId }, SS_CACHE_TTL.products, {
      preserveRawFields: true,
    })
    return z.array(ssProductSchema).parse(raw)
  }

  async getStylesBatch(styleIds: string[]): Promise<CanonicalStyle[]> {
    const results = await Promise.all(styleIds.map((id) => this.getStyle(id)))
    return results.filter((s): s is CanonicalStyle => s !== null)
  }

  /**
   * Browse the catalog by brand/category/text query.
   * Calls /v2/styles/ (style-level metadata only) — 1 request, cached at 24h TTL.
   * Text query and pagination are applied in-process after the API call.
   *
   * Note: returned CanonicalStyle objects have empty colors[] and sizes[].
   * Use getStyle() when full color/size/image detail is needed.
   */
  async searchCatalog(params: CatalogSearchInput): Promise<CatalogSearchResult> {
    const { brand, category, query, limit, offset } = catalogSearchParamsSchema.parse(params)

    const cacheKey = `ss:catalog:${brand ?? ''}:${category ?? ''}`
    const cached = await this.cache.get<CanonicalStyle[]>(cacheKey)

    let allStyles: CanonicalStyle[]

    if (cached) {
      allStyles = cached
    } else {
      const ssParams: Record<string, string> = {}
      if (brand) ssParams.brand = brand
      if (category) ssParams.category = category

      let raw: unknown
      try {
        raw = await ssGet('styles', ssParams, SS_CACHE_TTL.styles)
      } catch (err) {
        if (err instanceof SSClientError && err.status === 502) {
          adapterLogger.warn('S&S unreachable in searchCatalog, falling back to mock')
          return this.fallback.searchCatalog(params)
        }
        throw err
      }

      const styles = z.array(ssStyleSchema).parse(raw)
      allStyles = styles.map(styleToCanonicalStyle)
      await this.cache.set(cacheKey, allStyles, SS_CACHE_TTL.styles)
    }

    // Apply text query in-process (S&S styles endpoint doesn't support full-text search)
    let filtered = allStyles
    if (query) {
      const q = query.toLowerCase()
      filtered = allStyles.filter(
        (s) =>
          s.styleName.toLowerCase().includes(q) ||
          s.brand.toLowerCase().includes(q) ||
          s.styleNumber.toLowerCase().includes(q)
      )
    }

    const total = filtered.length
    const sliced = filtered.slice(offset, offset + limit)
    return { styles: sliced, total, hasMore: offset + sliced.length < total }
  }

  async getInventory(skuIds: string[]): Promise<Record<string, number>> {
    if (skuIds.length === 0) return {}

    let raw: unknown
    try {
      raw = await ssGet('inventory', { skuids: skuIds.join(',') }, SS_CACHE_TTL.inventory)
    } catch (err) {
      // 502 = unreachable → degrade gracefully to mock. 429/5xx = operator action needed → propagate.
      // SSRateLimitError extends SSClientError but has status=429, so it correctly rethrows here.
      if (err instanceof SSClientError && err.status === 502) {
        adapterLogger.warn('S&S unreachable in getInventory, falling back to mock', {
          skuCount: skuIds.length,
        })
        return this.fallback.getInventory(skuIds)
      }
      throw err
    }

    const items = z.array(ssInventoryItemSchema).parse(raw)
    return Object.fromEntries(items.map((item) => [item.sku, item.onHandQty ?? item.qty ?? 0]))
  }

  async getBrands(): Promise<string[]> {
    const cacheKey = 'ss:brands'
    const cached = await this.cache.get<string[]>(cacheKey)
    if (cached) return cached

    let raw: unknown
    try {
      raw = await ssGet('brands', {}, SS_CACHE_TTL.brands)
    } catch (err) {
      // 502 = unreachable → degrade gracefully to mock. 429/5xx = operator action needed → propagate.
      // SSRateLimitError extends SSClientError but has status=429, so it correctly rethrows here.
      if (err instanceof SSClientError && err.status === 502) {
        adapterLogger.warn('S&S unreachable in getBrands, falling back to mock')
        return this.fallback.getBrands()
      }
      throw err
    }

    const brands = z.array(ssBrandSchema).parse(raw)
    const names = brands.map((b) => b.brandName).sort()
    await this.cache.set(cacheKey, names, SS_CACHE_TTL.brands)
    return names
  }

  async getCategories(): Promise<string[]> {
    const cacheKey = 'ss:categories'
    const cached = await this.cache.get<string[]>(cacheKey)
    if (cached) return cached

    let raw: unknown
    try {
      raw = await ssGet('categories', {}, SS_CACHE_TTL.categories)
    } catch (err) {
      // 502 = unreachable → degrade gracefully to mock. 429/5xx = operator action needed → propagate.
      // SSRateLimitError extends SSClientError but has status=429, so it correctly rethrows here.
      if (err instanceof SSClientError && err.status === 502) {
        adapterLogger.warn('S&S unreachable in getCategories, falling back to mock')
        return this.fallback.getCategories()
      }
      throw err
    }

    const categories = z.array(ssCategorySchema).parse(raw)
    const names = categories.map((c) => c.categoryName).sort()
    await this.cache.set(cacheKey, names, SS_CACHE_TTL.categories)
    return names
  }

  /**
   * Probe S&S API health with a fresh brands request (TTL=0 bypasses cache).
   * Returns healthy:false on any error rather than throwing — health checks
   * should never crash the caller.
   */
  async healthCheck(): Promise<HealthStatus> {
    const start = Date.now()
    try {
      await ssGet('brands', {}, 0)
      return {
        healthy: true,
        supplier: this.supplierName,
        checkedAt: new Date(),
        latencyMs: Date.now() - start,
      }
    } catch (err) {
      return {
        healthy: false,
        supplier: this.supplierName,
        checkedAt: new Date(),
        latencyMs: Date.now() - start,
        message: Error.isError(err) ? err.message : 'Unknown error',
      }
    }
  }
}
