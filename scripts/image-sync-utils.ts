/**
 * Pure utilities for the image sync pipeline.
 * Extracted for testability — no side effects, no imports outside zod.
 */
import { z } from 'zod'

export const SS_IMAGE_BASE = 'https://www.ssactivewear.com'

// ---------------------------------------------------------------------------
// S&S product schema
// ---------------------------------------------------------------------------

export const ssProductSchema = z
  .object({
    sku: z.string(),
    styleID: z.union([z.number(), z.string()]).transform(String),
    colorName: z.string(),
    colorCode: z.string().optional().default(''),
    // S&S returns "colorFamily" (not "colorFamilyName") — the DB column is named color_family_name
    colorFamily: z.string().optional(),
    colorGroupName: z.string().optional(),
    color1: z.string().optional().default(''),
    color2: z.string().optional().default(''),
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

// ---------------------------------------------------------------------------
// URL helpers
// ---------------------------------------------------------------------------

/**
 * Resolves a raw S&S image path to an absolute URL.
 * Absolute URLs are passed through unchanged.
 * Returns null for empty/falsy paths.
 */
export function resolveImageUrl(path: string): string | null {
  if (!path) return null
  if (path.startsWith('http')) return path
  return `${SS_IMAGE_BASE}${path.startsWith('/') ? '' : '/'}${path}`
}

// ---------------------------------------------------------------------------
// Color helpers
// ---------------------------------------------------------------------------

/**
 * Normalize a raw hex string to #RRGGBB.
 * Returns null for invalid or non-color values (e.g. "DROPPED", "").
 */
export function normalizeHex(raw: string): string | null {
  const hex = raw.trim()
  if (!hex) return null
  const withHash = hex.startsWith('#') ? hex : `#${hex}`
  return /^#[0-9a-fA-F]{6}$/.test(withHash) ? withHash : null
}

// ---------------------------------------------------------------------------
// Image record builder
// ---------------------------------------------------------------------------

export const IMAGE_FIELDS = [
  { field: 'colorFrontImage', type: 'front' },
  { field: 'colorBackImage', type: 'back' },
  { field: 'colorSideImage', type: 'side' },
  { field: 'colorDirectSideImage', type: 'direct-side' },
  { field: 'colorOnModelFrontImage', type: 'on-model-front' },
  { field: 'colorOnModelBackImage', type: 'on-model-back' },
  { field: 'colorOnModelSideImage', type: 'on-model-side' },
  { field: 'colorSwatchImage', type: 'swatch' },
] as const satisfies ReadonlyArray<{ field: keyof SSProduct; type: string }>

/** Union of all valid catalog image type strings, derived from IMAGE_FIELDS. */
export type CatalogImageType = (typeof IMAGE_FIELDS)[number]['type']

/** Extracts all non-empty image records from a single product row. */
export function buildImages(product: SSProduct): Array<{ type: CatalogImageType; url: string }> {
  return IMAGE_FIELDS.flatMap(({ field, type }) => {
    const url = resolveImageUrl(product[field] as string)
    return url ? [{ type, url }] : []
  })
}

// ---------------------------------------------------------------------------
// DB value mapper
// ---------------------------------------------------------------------------

/** Shape written to catalog_colors via Drizzle insert/upsert. */
export type ColorInsertValue = {
  styleId: string
  name: string
  hex1: string | null
  hex2: string | null
  colorFamilyName: string | null
  colorGroupName: string | null
  colorCode: string | null
  updatedAt: Date
}

/**
 * Maps a single S&S product row to the shape expected by catalog_colors.
 *
 * colorFamily uses `|| null` (falsy coercion) rather than `?? null` because
 * S&S returns "" for missing fields — nullish would pass empty strings through.
 */
export function mapSSProductToColorValue(p: SSProduct, styleId: string): ColorInsertValue {
  return {
    styleId,
    name: p.colorName,
    hex1: normalizeHex(p.color1),
    hex2: normalizeHex(p.color2),
    colorFamilyName: p.colorFamily?.trim() || null,
    colorGroupName: p.colorGroupName?.trim() || null,
    colorCode: p.colorCode?.trim() || null,
    updatedAt: new Date(),
  }
}
