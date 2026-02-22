import 'server-only'
import type { CanonicalStyle, CanonicalImageType } from '@lib/suppliers/types'
import type { GarmentCategory } from '@domain/entities/garment'
import { canonicalCategoryToGarmentCategory } from '@infra/repositories/_providers/supplier/garments'

/** Extract the raw subcategory string after " - " delimiter. Returns null if absent. */
export function extractSubcategory(category: string): string | null {
  const parts = category.split(' - ')
  return parts.length > 1 ? (parts[1]?.trim() ?? null) : null
}

/** Extract the base category string before " - " delimiter. */
export function extractBaseCategory(category: string): string {
  return category.split(' - ')[0] ?? category
}

/** Build the value object for a brand upsert. */
export function buildBrandUpsertValue(canonicalName: string): {
  canonicalName: string
  isActive: boolean
  updatedAt: Date
} {
  return {
    canonicalName,
    isActive: true,
    updatedAt: new Date(),
  }
}

/** Build the value object for a style upsert. */
export function buildStyleUpsertValue(
  style: CanonicalStyle,
  brandId: string,
  source: string
): {
  source: string
  externalId: string
  brandId: string
  styleNumber: string
  name: string
  description: string | null
  category: GarmentCategory
  subcategory: string | null
  gtin: string | null
  piecePrice: number | null
  dozenPrice: number | null
  casePrice: number | null
  lastSyncedAt: Date
  updatedAt: Date
} {
  const primaryCategory = style.categories[0] ?? ''
  const subcategory = extractSubcategory(primaryCategory)
  // Strip subcategory suffix before normalizing to enum — "T-Shirts - Premium" → "T-Shirts"
  const baseCategory = extractBaseCategory(primaryCategory)

  return {
    source,
    externalId: style.supplierId,
    brandId,
    styleNumber: style.styleNumber,
    name: style.styleName,
    description: style.description || null,
    category: canonicalCategoryToGarmentCategory([baseCategory]),
    subcategory,
    gtin: style.gtin,
    piecePrice: style.pricing.piecePrice ?? null,
    dozenPrice: style.pricing.dozenPrice ?? null,
    casePrice: style.pricing.casePrice ?? null,
    lastSyncedAt: new Date(),
    updatedAt: new Date(),
  }
}

/** Build color upsert value for catalog_colors. */
export function buildColorUpsertValue(
  styleId: string,
  color: CanonicalStyle['colors'][number]
): {
  styleId: string
  name: string
  hex1: string | null
  hex2: string | null
  updatedAt: Date
} {
  return {
    styleId,
    name: color.name,
    hex1: color.hex1,
    hex2: color.hex2,
    updatedAt: new Date(),
  }
}

/** Build image upsert value for catalog_images. */
export function buildImageUpsertValue(
  colorId: string,
  image: CanonicalStyle['colors'][number]['images'][number]
): {
  colorId: string
  imageType: CanonicalImageType
  url: string
  updatedAt: Date
} {
  return {
    colorId,
    imageType: image.type,
    url: image.url,
    updatedAt: new Date(),
  }
}

/** Build size upsert value for catalog_sizes. */
export function buildSizeUpsertValue(
  styleId: string,
  size: CanonicalStyle['sizes'][number]
): {
  styleId: string
  name: string
  sortOrder: number
  priceAdjustment: number
  updatedAt: Date
} {
  return {
    styleId,
    name: size.name,
    sortOrder: size.sortOrder,
    priceAdjustment: size.priceAdjustment,
    updatedAt: new Date(),
  }
}
