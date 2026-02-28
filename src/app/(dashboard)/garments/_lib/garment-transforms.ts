import { hexToRgb } from '@domain/rules/color.rules'
import type { CatalogColor, NormalizedGarmentCatalog } from '@domain/entities/catalog-style'
import type { FilterColor, FilterColorGroup } from '@features/garments/types'

export type { FilterColor, FilterColorGroup }

// ---------------------------------------------------------------------------
// normalizeColorName
// ---------------------------------------------------------------------------

/**
 * Strips S&S measurement suffixes from catalog color names to produce canonical names.
 *
 * S&S activewear/workwear entries include inseam, waist, sleeve, and unhemmed
 * variants as separate catalog_colors rows (e.g., "Black - 28I", "Black - 30I, 50W").
 * These must resolve to the same canonical name ("Black") for deduplication and
 * name-based filter matching to work correctly.
 *
 * Handles: " - 28I", " - 30I, 50W", " - B120", " - Sleeve 32/33",
 *          " - 36 Unhemmed", " - Unhemmed", " - Size 50W",
 *          " (Long Sizes)", " (Unhemmed)"
 */
export function normalizeColorName(name: string): string {
  return name
    .replace(
      /\s*-\s*(?:\d[\d\s,/IWX]*(?:\s*Unhemmed)?|B\d+|Sleeve\s+[\d/]+|Size\s+\d+\w*|\d+\s+Unhemmed|Unhemmed)\s*$/i,
      ''
    )
    .replace(/\s*\((?:Long\s+Sizes?|Unhemmed)\)\s*$/i, '')
    .trim()
}

/** WCAG relative luminance — returns white or black text color for a hex background. */
function computeSwatchTextColor(hex: string): string {
  const { r, g, b } = hexToRgb(hex)
  // Linearize sRGB components (IEC 61966-2-1)
  const linearize = (c: number) => {
    const s = c / 255
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
  }
  const L = 0.2126 * linearize(r) + 0.7152 * linearize(g) + 0.0722 * linearize(b)
  return L > 0.179 ? '#000000' : '#FFFFFF'
}

// ---------------------------------------------------------------------------
// extractUniqueColors
// ---------------------------------------------------------------------------

/**
 * Extracts a deduplicated list of FilterColor objects from the normalized catalog.
 *
 * Deduplication is by lowercased, trimmed color name — the first CatalogColor.id
 * encountered for each unique name becomes the canonical FilterColor.id.
 * hex uses hex1 from catalog_colors (the primary swatch color).
 * Returns alphabetically sorted by name.
 */
export function extractUniqueColors(
  normalizedCatalog: NormalizedGarmentCatalog[] | undefined
): FilterColor[] {
  if (!normalizedCatalog) return []
  const seen = new Map<string, FilterColor>()

  for (const style of normalizedCatalog) {
    for (const color of style.colors) {
      const canonicalName = normalizeColorName(color.name)
      const key = canonicalName.toLowerCase().trim()
      if (seen.has(key)) continue
      const hex = color.hex1 ?? '#888888'
      // colorFamilyName is taken from the first occurrence of each canonical name.
      // S&S curates family names consistently per color name, so this is stable.
      seen.set(key, {
        id: color.id,
        name: canonicalName,
        hex,
        swatchTextColor: computeSwatchTextColor(hex),
        colorFamilyName: color.colorFamilyName ?? null,
        colorGroupName: color.colorGroupName ?? null,
      })
    }
  }

  return [...seen.values()].sort((a, b) => a.name.localeCompare(b.name))
}

// ---------------------------------------------------------------------------
// extractColorFamilies
// ---------------------------------------------------------------------------

/**
 * Extracts a sorted, deduplicated list of color family names from the normalized catalog.
 *
 * Accepts NormalizedGarmentCatalog[] (not FilterColor[]) to avoid deduplication
 * artifacts — the first occurrence of a canonical color name in extractUniqueColors()
 * may have colorFamilyName === null for pre-migration rows. Iterating all style
 * colors ensures the complete family set is captured regardless of dedup order.
 *
 * Returns alphabetically sorted array. Null/empty family names are excluded.
 */
export function extractColorFamilies(catalog: NormalizedGarmentCatalog[]): string[] {
  const families = new Set<string>()
  for (const style of catalog) {
    for (const color of style.colors) {
      if (color.colorFamilyName) families.add(color.colorFamilyName)
    }
  }
  return [...families].sort()
}

// ---------------------------------------------------------------------------
// extractColorGroups
// ---------------------------------------------------------------------------

/**
 * Extracts a deduplicated list of FilterColorGroup objects from the normalized catalog.
 *
 * Deduplication is by colorGroupName. The representative hex is the weighted RGB average
 * across all color rows in the group. This is more robust than picking the modal (most
 * frequent exact hex string) because supplier data often has a handful of incorrect hex
 * values that may happen to be the plurality — e.g. dark brown entries under "Texas Orange".
 * The weighted average spreads influence across the many correct-but-slightly-different
 * entries, drowning out small clusters of bad data.
 *
 * Excluded groups:
 * - ZZZ prefix — S&S internal catch-all codes (ZZZ - Multi Color, ZZZ - No Match)
 * - DO NOT USE suffix — S&S deprecated colorways
 *
 * Sorted by colorFamily then colorGroupName so the family tabs produce natural groupings.
 */
export function extractColorGroups(
  normalizedCatalog: NormalizedGarmentCatalog[] | undefined
): FilterColorGroup[] {
  if (!normalizedCatalog) return []

  // Pass 1: accumulate weighted RGB sums per group
  const rgbSums = new Map<string, { r: number; g: number; b: number; total: number }>()
  const groupMeta = new Map<string, { colorFamilyName: string | null }>()

  for (const style of normalizedCatalog) {
    for (const color of style.colors) {
      if (!color.colorGroupName) continue
      // Exclude S&S internal codes: catch-alls (ZZZ prefix) and deprecated colorways (DO NOT USE suffix)
      if (color.colorGroupName.startsWith('ZZZ') || color.colorGroupName.includes('DO NOT USE'))
        continue
      const key = color.colorGroupName
      if (!groupMeta.has(key)) {
        groupMeta.set(key, { colorFamilyName: color.colorFamilyName ?? null })
      }
      const raw = color.hex1?.replace('#', '')
      if (!raw || raw.length !== 6) continue
      const r = parseInt(raw.slice(0, 2), 16)
      const g = parseInt(raw.slice(2, 4), 16)
      const b = parseInt(raw.slice(4, 6), 16)
      if (isNaN(r) || isNaN(g) || isNaN(b)) continue
      const sums = rgbSums.get(key) ?? { r: 0, g: 0, b: 0, total: 0 }
      sums.r += r
      sums.g += g
      sums.b += b
      sums.total += 1
      rgbSums.set(key, sums)
    }
  }

  // Pass 2: compute average hex per group
  const result: FilterColorGroup[] = []
  for (const [groupName, meta] of groupMeta) {
    const sums = rgbSums.get(groupName)
    let hex = '#888888'
    if (sums && sums.total > 0) {
      const r = Math.round(sums.r / sums.total)
        .toString(16)
        .padStart(2, '0')
      const g = Math.round(sums.g / sums.total)
        .toString(16)
        .padStart(2, '0')
      const b = Math.round(sums.b / sums.total)
        .toString(16)
        .padStart(2, '0')
      hex = `#${r}${g}${b}`
    }
    result.push({
      colorGroupName: groupName,
      colorFamilyName: meta.colorFamilyName,
      hex,
      swatchTextColor: computeSwatchTextColor(hex),
    })
  }

  return result.sort(
    (a, b) =>
      (a.colorFamilyName ?? 'ZZZ').localeCompare(b.colorFamilyName ?? 'ZZZ') ||
      a.colorGroupName.localeCompare(b.colorGroupName)
  )
}

// ---------------------------------------------------------------------------
// buildStyleToColorGroupNamesMap
// ---------------------------------------------------------------------------

/**
 * Builds a lookup map from styleNumber to the Set of colorGroupName values for that style.
 * Used by the garment filter loop for group-based filtering.
 * Only includes non-null colorGroupName values.
 */
export function buildStyleToColorGroupNamesMap(
  normalizedCatalog: NormalizedGarmentCatalog[] | undefined
): Map<string, Set<string>> {
  if (!normalizedCatalog) return new Map()
  return new Map(
    normalizedCatalog.map((style) => [
      style.styleNumber,
      new Set(
        style.colors
          .map((c) => c.colorGroupName)
          .filter((g): g is string => g != null && g.length > 0)
      ),
    ])
  )
}

// ---------------------------------------------------------------------------
// buildStyleToColorNamesMap
// ---------------------------------------------------------------------------

/**
 * Builds a lookup map from styleNumber to the Set of lowercased color names for that style.
 * Used by the garment filter loop as a name-based bridge between catalog_colors UUIDs
 * and the legacy GarmentCatalog.availableColors slug IDs.
 */
export function buildStyleToColorNamesMap(
  normalizedCatalog: NormalizedGarmentCatalog[] | undefined
): Map<string, Set<string>> {
  if (!normalizedCatalog) return new Map()
  return new Map(
    normalizedCatalog.map((style) => [
      style.styleNumber,
      new Set(style.colors.map((c) => normalizeColorName(c.name).toLowerCase().trim())),
    ])
  )
}

// ---------------------------------------------------------------------------
// buildSkuToFrontImageUrl
// ---------------------------------------------------------------------------

/**
 * Preference order for the card's representative image.
 * 'front' flat-lay is best for print visualization; the remaining types act as
 * graceful fallbacks for brands (e.g. Bayside, Threadfast) whose catalog_images
 * rows have no 'front' entry.
 */
const CARD_IMAGE_PREFERENCE = [
  'front',
  'on-model-front',
  'back',
  'side',
  'direct-side',
  'on-model-back',
  'on-model-side',
  'swatch',
] as const satisfies Array<import('@domain/entities/catalog-style').CatalogImage['imageType']>

/**
 * Builds a lookup map from S&S style number to a card-representative image URL.
 *
 * Scans colors for each image type in CARD_IMAGE_PREFERENCE order so that:
 *  - Brands with 'front' flat-lay photos (Bella+Canvas etc.) use them as before.
 *  - Brands with only on-model or other types show a real photo instead of
 *    falling back to the GarmentMockup SVG.
 *
 * Uses stored URLs from catalog_images, populated by run-image-sync.ts.
 * Returns no entry only when the style has no synced images at all.
 */
export function buildSkuToFrontImageUrl(
  normalizedCatalog: NormalizedGarmentCatalog[] | undefined
): Map<string, string> {
  if (!normalizedCatalog) return new Map()
  const map = new Map<string, string>()
  styleLoop: for (const n of normalizedCatalog) {
    for (const preferredType of CARD_IMAGE_PREFERENCE) {
      for (const color of n.colors) {
        const img = color.images.find((i) => i.imageType === preferredType)
        if (img) {
          map.set(n.styleNumber, img.url)
          continue styleLoop
        }
      }
    }
  }
  return map
}

// ---------------------------------------------------------------------------
// buildSkuToStyleIdMap
// ---------------------------------------------------------------------------

/**
 * Builds a lookup map from S&S style number to the catalog_styles UUID.
 *
 * The server actions toggleStyleEnabled / toggleStyleFavorite require the
 * catalog_styles primary key (UUID), but the legacy GarmentCatalog rows are
 * keyed by the S&S style number string (catalog_archived.sku = catalog_styles.style_number).
 */
export function buildSkuToStyleIdMap(
  normalizedCatalog: NormalizedGarmentCatalog[] | undefined
): Map<string, string> {
  if (!normalizedCatalog) return new Map()
  // catalog_archived.sku matches catalog_styles.style_number, not externalId (supplierId)
  return new Map(normalizedCatalog.map((n) => [n.styleNumber, n.id]))
}

// ---------------------------------------------------------------------------
// buildSkuToNormalizedColors
// ---------------------------------------------------------------------------

/**
 * Builds a lookup map from S&S style number to its CatalogColor array.
 *
 * Passed to GarmentCard so the color strip can render real S&S hex swatches
 * even though GarmentCatalog.availableColors is empty in supabase-catalog mode.
 */
export function buildSkuToNormalizedColors(
  normalizedCatalog: NormalizedGarmentCatalog[] | undefined
): Map<string, CatalogColor[]> {
  if (!normalizedCatalog) return new Map()
  return new Map(normalizedCatalog.map((n) => [n.styleNumber, n.colors]))
}

// ---------------------------------------------------------------------------
// hydrateCatalogPreferences
// ---------------------------------------------------------------------------

/**
 * Merges isEnabled / isFavorite values from the normalized catalog
 * (catalog_style_preferences JOIN) into the legacy GarmentCatalog rows.
 *
 * The normalized catalog is the source of truth because it reflects the actual
 * preference rows in the DB.  The legacy catalog table has its own is_enabled /
 * is_favorite columns that are not updated by the preference server actions.
 *
 * Garments with no matching entry in normalizedCatalog keep their existing values.
 */
export function hydrateCatalogPreferences<
  T extends { sku: string; isEnabled: boolean; isFavorite: boolean },
>(catalog: T[], normalizedCatalog: NormalizedGarmentCatalog[] | undefined): T[] {
  if (!normalizedCatalog) return catalog
  const prefsBySku = new Map(
    normalizedCatalog.map((n) => [
      // catalog_archived.sku matches catalog_styles.style_number, not externalId (supplierId)
      n.styleNumber,
      { isEnabled: n.isEnabled, isFavorite: n.isFavorite },
    ])
  )
  return catalog.map((g) => {
    const prefs = prefsBySku.get(g.sku)
    return prefs ? { ...g, isEnabled: prefs.isEnabled, isFavorite: prefs.isFavorite } : g
  })
}
