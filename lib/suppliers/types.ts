// lib/suppliers/types.ts
import { z } from 'zod'

// ─── Image ────────────────────────────────────────────────────────────────────

export const canonicalImageTypeSchema = z.enum([
  'front',
  'back',
  'side',
  'on-model-front',
  'on-model-back',
  'on-model-side',
  'swatch',
  'direct-side',
])

export type CanonicalImageType = z.infer<typeof canonicalImageTypeSchema>

export const canonicalImageSchema = z.object({
  type: canonicalImageTypeSchema,
  url: z.string().url(),
  size: z.enum(['small', 'medium', 'large']).optional(),
})

// ─── Color ────────────────────────────────────────────────────────────────────

export const canonicalColorSchema = z.object({
  name: z.string().min(1),
  // Supplier hex colors — format is supplier-dependent, validated on ingestion.
  // See SSActivewearAdapter for normalization logic.
  hex1: z.string().nullable(),
  hex2: z.string().nullable(),
  images: z.array(canonicalImageSchema),
  colorFamilyName: z.string().nullable().optional(),
  colorCode: z.string().nullable().optional(),
})

// ─── Size ─────────────────────────────────────────────────────────────────────

export const canonicalSizeSchema = z.object({
  name: z.string().min(1),
  sortOrder: z.number().int().nonnegative(),
  /**
   * Price delta vs. base piecePrice — NOT for arithmetic.
   * Use big.js (lib/helpers/money.ts) whenever this value is used in calculations.
   */
  priceAdjustment: z.number().default(0),
})

// ─── Pricing ──────────────────────────────────────────────────────────────────

/**
 * Raw supplier prices — NOT for arithmetic.
 * Use big.js (lib/helpers/money.ts) whenever these values are used in calculations.
 */
export const canonicalPricingSchema = z.object({
  piecePrice: z.number().nonnegative().nullable(),
  dozenPrice: z.number().nonnegative().nullable(),
  casePrice: z.number().nonnegative().nullable(),
  caseQty: z.number().int().positive().nullable().default(null),
})

// ─── Supplier Name ────────────────────────────────────────────────────────────

export const supplierNameSchema = z.enum(['mock', 'ss-activewear', 'sanmar', 'alphabroder'])

// ─── CanonicalStyle ───────────────────────────────────────────────────────────

export const canonicalStyleSchema = z.object({
  supplierId: z.string().min(1),
  styleNumber: z.string().min(1),
  styleName: z.string().min(1),
  brand: z.string().min(1),
  description: z.string().default(''),
  categories: z.array(z.string()),
  colors: z.array(canonicalColorSchema),
  sizes: z.array(canonicalSizeSchema),
  pricing: canonicalPricingSchema,
  gtin: z.string().nullable(),
  supplier: supplierNameSchema,
  lastSynced: z.date().optional(),
})

export type CanonicalStyle = z.infer<typeof canonicalStyleSchema>
export type SupplierName = z.infer<typeof supplierNameSchema>
export type CanonicalColor = z.infer<typeof canonicalColorSchema>
export type CanonicalSize = z.infer<typeof canonicalSizeSchema>
export type CanonicalPricing = z.infer<typeof canonicalPricingSchema>

// ─── CacheStore ───────────────────────────────────────────────────────────────

export type CacheStore = {
  get<T>(key: string): Promise<T | null>
  set<T>(key: string, value: T, ttlSeconds: number): Promise<void>
  del(key: string): Promise<void>
}

// ─── SupplierAdapter ──────────────────────────────────────────────────────────

export const catalogSearchParamsSchema = z.object({
  brand: z.string().optional(),
  category: z.string().optional(),
  query: z.string().optional(),
  limit: z.number().int().positive().max(100).default(50),
  offset: z.number().int().nonnegative().default(0),
})

export type CatalogSearchParams = z.infer<typeof catalogSearchParamsSchema>

// Input type — limit/offset are optional (schema applies defaults in .parse())
export type CatalogSearchInput = z.input<typeof catalogSearchParamsSchema>

export const catalogSearchResultSchema = z.object({
  styles: z.array(canonicalStyleSchema),
  total: z.number().int().nonnegative(),
  hasMore: z.boolean(),
})

export type CatalogSearchResult = z.infer<typeof catalogSearchResultSchema>

export const healthStatusSchema = z.object({
  healthy: z.boolean(),
  supplier: supplierNameSchema,
  checkedAt: z.date(),
  latencyMs: z.number().int().nonnegative().optional(),
  message: z.string().optional(),
})

export type HealthStatus = z.infer<typeof healthStatusSchema>

export type SupplierAdapter = {
  readonly supplierName: SupplierName

  getStyle(styleId: string): Promise<CanonicalStyle | null>
  getStylesBatch(styleIds: string[]): Promise<CanonicalStyle[]>
  searchCatalog(params: CatalogSearchInput): Promise<CatalogSearchResult>
  getInventory(skuIds: string[]): Promise<Record<string, number>>
  getBrands(): Promise<string[]>
  getCategories(): Promise<string[]>
  healthCheck(): Promise<HealthStatus>
}
