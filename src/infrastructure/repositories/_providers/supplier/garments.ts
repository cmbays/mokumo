/**
 * Supplier garments provider — bridges SupplierAdapter ↔ IGarmentRepository.
 *
 * Maps CanonicalStyle (adapter layer) → GarmentCatalog (domain layer).
 * Active when SUPPLIER_ADAPTER is set; selected by the repository router in
 * src/infrastructure/repositories/garments.ts.
 *
 * ID semantics: S&S styleIds are numeric strings, not UUIDs. UUID validation
 * is intentionally skipped here — that constraint belongs to the mock provider.
 * Supplier IDs are validated as non-empty strings ≤ 50 chars (CLAUDE.md §9).
 *
 * Catalog pagination: S&S limits individual requests to 100 styles (max).
 * getGarmentCatalog() fetches all pages in sequence until hasMore is false.
 * This trades multiple round-trips for a complete result set, which the
 * SupplierAdapter caches at 24h TTL to amortize the cost.
 */
import { z } from 'zod'
import { getSupplierAdapter } from '@lib/suppliers/registry'
import { garmentCategoryEnum, garmentCatalogSchema } from '@domain/entities/garment'
import { logger } from '@shared/lib/logger'
import type { GarmentCatalog, GarmentCategory } from '@domain/entities/garment'
import type { CanonicalStyle } from '@lib/suppliers/types'

const supplierLogger = logger.child({ domain: 'supplier-garments' })

/**
 * S&S category → canonical domain category mapping.
 * Handles common variations: "T-Shirts", "T Shirts", "Tshirts", etc.
 * Also handles special characters and S&S subcategory strings that don't
 * normalize cleanly via simple lowercase + hyphenation.
 *
 * Keys are the lowercased-and-hyphenated form of the raw supplier string
 * (after special char normalization).
 */
const CATEGORY_MAPPING: Record<string, GarmentCategory> = {
  // T-Shirts variants
  't-shirt': 't-shirts',
  't-shirts-premium': 't-shirts',
  tshirts: 't-shirts',
  // Polos
  polo: 'polos',
  // Fleece & Hoodies
  hoodies: 'fleece',
  hoodie: 'fleece',
  sweatshirts: 'fleece',
  sweatshirt: 'fleece',
  // Knits / Layering — ampersand in name prevents direct enum match
  'knits--layering': 'knits-layering',
  'knits-&-layering': 'knits-layering',
  knits: 'knits-layering',
  layering: 'knits-layering',
  cardigans: 'knits-layering',
  sweaters: 'knits-layering',
  // Outerwear
  jackets: 'outerwear',
  coats: 'outerwear',
  // Pants
  trousers: 'pants',
  // Headwear
  hats: 'headwear',
  caps: 'headwear',
  // Activewear
  performance: 'activewear',
  // Accessories — S&S compound strings that don't normalize to enum value directly
  'bags--accessories': 'accessories',
  'bags-&-accessories': 'accessories',
  'bags-accessories': 'accessories',
  bags: 'accessories',
  // Wovens — subcategory strings
  'woven-shirts': 'wovens',
}

const CATALOG_PAGE_SIZE = 100
/** Safety ceiling: prevents unbounded pagination if the supplier misbehaves. */
const MAX_CATALOG_PAGES = 500
const FALLBACK_GARMENT_CATEGORY: GarmentCategory = 'other'

/** Zod validator for supplier style IDs (non-UUID, numeric strings like "3001"). */
const supplierIdSchema = z.string().min(1).max(50)

/**
 * Normalize a S&S category string to a domain GarmentCategory.
 *
 * S&S uses free-text values with optional subcategories (e.g., "T-Shirts - Premium",
 * "Fleece - Quarter Zip") and special characters (e.g., "Knits & Layering").
 *
 * Process:
 *   1. Extract base category (before " - " delimiter)
 *   2. Normalize: remove special chars (&, /, etc.), lowercase, hyphenate
 *   3. Look up in explicit CATEGORY_MAPPING (handles common variations)
 *   4. If found, return mapped category
 *   5. If not found, try direct enum parse as fallback
 *   6. If all fail, use 'other' and log warning
 */
export function canonicalCategoryToGarmentCategory(categories: string[]): GarmentCategory {
  const categoryString = categories[0] ?? ''

  // Extract base category before " - " delimiter (handles "T-Shirts - Premium" → "T-Shirts")
  const baseCategory = categoryString.split(' - ')[0]

  // Normalize: replace special chars with space, then lowercase/hyphenate
  const normalized = baseCategory
    .replace(/[&/,]+/g, ' ') // Replace special chars with space
    .toLowerCase()
    .replace(/\s+/g, '-') // Collapse spaces to hyphens

  // Try explicit mapping first (handles "knits-layering", "t-shirts", etc.)
  const mapped = CATEGORY_MAPPING[normalized]
  if (mapped) {
    return mapped
  }

  // Fallback: try direct enum parse
  const result = garmentCategoryEnum.safeParse(normalized)
  if (result.success) {
    return result.data
  }

  // Log and use default
  supplierLogger.warn('Unknown garment category, falling back to default', {
    normalized,
    baseCategory,
    original: categoryString,
  })
  return FALLBACK_GARMENT_CATEGORY
}

/**
 * Map a CanonicalStyle to a domain GarmentCatalog.
 *
 * Returns null in one case:
 *   - garmentCatalogSchema validation fails (malformed supplier data logged, item skipped)
 *
 * Note: Styles without pricing are included. S&S browse results (/v2/styles/)
 * intentionally omit pricing to avoid N+1 API calls. Pricing is loaded on-demand
 * via getGarmentById() when full details are needed.
 *
 * Returning null rather than throwing allows the catalog pagination loop to
 * skip individual bad records without aborting the full fetch.
 */
export function canonicalStyleToGarmentCatalog(style: CanonicalStyle): GarmentCatalog | null {
  // S&S browse results (/v2/styles/) intentionally omit pricing to avoid N+1 API calls.
  // Use 0 as a placeholder when pricing isn't available — it clearly signals
  // "pricing not loaded" on the UI. Pricing is loaded on-demand via getGarmentById().
  const basePrice = style.pricing.piecePrice ?? 0

  const raw = {
    id: style.supplierId,
    brand: style.brand,
    sku: style.styleNumber,
    name: style.styleName,
    baseCategory: canonicalCategoryToGarmentCategory(style.categories),
    basePrice,
    availableColors: style.colors.map((c) => c.name),
    availableSizes: style.sizes.map((s) => ({
      name: s.name,
      order: s.sortOrder,
      priceAdjustment: s.priceAdjustment,
    })),
    isEnabled: true,
    isFavorite: false,
    updatedAt: new Date(),
  }

  const parsed = garmentCatalogSchema.safeParse(raw)
  if (!parsed.success) {
    supplierLogger.warn('Skipping garment with invalid schema from supplier', {
      styleId: style.supplierId,
      errors: parsed.error.issues,
    })
    return null
  }
  return parsed.data
}

/**
 * Fetch the full supplier catalog, paginating until hasMore is false.
 * Garments with invalid schema (empty name/brand) are silently filtered out.
 * Garments with no piecePrice are included with basePrice: 0 (browse-mode placeholder).
 */
export async function getGarmentCatalog(): Promise<GarmentCatalog[]> {
  const adapter = getSupplierAdapter()
  const all: GarmentCatalog[] = []
  let offset = 0
  let page = 0

  while (true) {
    const result = await adapter.searchCatalog({ limit: CATALOG_PAGE_SIZE, offset })

    for (const style of result.styles) {
      const garment = canonicalStyleToGarmentCatalog(style)
      if (garment) all.push(garment)
    }

    // Zero-progress guard: a supplier returning hasMore:true with an empty
    // page would loop forever without this check.
    if (result.styles.length === 0 || !result.hasMore) break

    offset += result.styles.length
    page++

    if (page >= MAX_CATALOG_PAGES) {
      supplierLogger.error('Exceeded MAX_CATALOG_PAGES — possible supplier pagination bug', {
        page,
        offset,
        totalSoFar: all.length,
      })
      break
    }
  }

  return all
}

export async function getGarmentById(id: string): Promise<GarmentCatalog | null> {
  if (!supplierIdSchema.safeParse(id).success) {
    supplierLogger.warn('getGarmentById called with invalid id', { id })
    return null
  }
  const adapter = getSupplierAdapter()
  const style = await adapter.getStyle(id)
  return style ? canonicalStyleToGarmentCatalog(style) : null
}

export async function getAvailableBrands(): Promise<string[]> {
  const adapter = getSupplierAdapter()
  return (await adapter.getBrands()).sort()
}
