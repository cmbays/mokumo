import { hexToRgb } from '@domain/rules/color.rules'
import type { CatalogColorSupplementRow } from '@infra/repositories/_providers/supabase/catalog'
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
// buildSupplementMaps
// ---------------------------------------------------------------------------

type SupplementMaps = {
  /** styleNumber → [{name, hex1}] — for GarmentCard swatch strip */
  styleSwatches: Record<string, Array<{ name: string; hex1: string | null }>>
  /** styleNumber → colorGroupName[] — for color group filter matching */
  styleColorGroups: Record<string, string[]>
  /** Deduplicated color groups with weighted-average hex — for filter grid UI */
  colorGroups: FilterColorGroup[]
  /** Deduplicated catalog colors — for BrandDetailDrawer favorites section */
  catalogColors: FilterColor[]
}

/**
 * Build all four client-side lookup structures from the color supplement rows.
 *
 * Replaces the individual extractUniqueColors / extractColorGroups /
 * buildStyleToColorGroupNamesMap / buildSkuToNormalizedColors functions —
 * one pass over the 30,614 supplement rows builds everything needed for initial render.
 *
 * Color group filtering (excludes S&S internal codes):
 * - ZZZ prefix  — catch-alls (ZZZ - Multi Color, ZZZ - No Match)
 * - DO NOT USE  — deprecated S&S colorways
 *
 * Color group representative hex uses weighted RGB average across all member rows —
 * same approach as the previous extractColorGroups implementation for robustness
 * against outlier hex values in supplier data.
 */
export function buildSupplementMaps(rows: CatalogColorSupplementRow[]): SupplementMaps {
  const styleSwatches: Record<string, Array<{ name: string; hex1: string | null }>> = {}
  const colorGroupSets: Record<string, Set<string>> = {}
  const rgbSums = new Map<string, { r: number; g: number; b: number; total: number }>()
  const groupMeta = new Map<string, { colorFamilyName: string | null }>()
  const seenColors = new Map<string, FilterColor>()

  for (const row of rows) {
    // Swatch strip (name + hex1 per color per style)
    if (!styleSwatches[row.styleNumber]) {
      styleSwatches[row.styleNumber] = []
    }
    styleSwatches[row.styleNumber].push({ name: row.name, hex1: row.hex1 })

    // Valid color group: non-null, not ZZZ catch-all, not DO NOT USE deprecated
    const isValidGroup =
      row.colorGroupName &&
      !row.colorGroupName.startsWith('ZZZ') &&
      !row.colorGroupName.includes('DO NOT USE')

    if (isValidGroup && row.colorGroupName) {
      // styleColorGroups — Set per style for deduplication, converted to [] at end
      if (!colorGroupSets[row.styleNumber]) {
        colorGroupSets[row.styleNumber] = new Set()
      }
      colorGroupSets[row.styleNumber].add(row.colorGroupName)

      // Weighted RGB sum for color group representative hex
      if (!groupMeta.has(row.colorGroupName)) {
        groupMeta.set(row.colorGroupName, { colorFamilyName: row.colorFamilyName ?? null })
      }
      const raw = row.hex1?.replace('#', '')
      if (raw && raw.length === 6) {
        const r = parseInt(raw.slice(0, 2), 16)
        const g = parseInt(raw.slice(2, 4), 16)
        const b = parseInt(raw.slice(4, 6), 16)
        if (!isNaN(r) && !isNaN(g) && !isNaN(b)) {
          const sums = rgbSums.get(row.colorGroupName) ?? { r: 0, g: 0, b: 0, total: 0 }
          sums.r += r
          sums.g += g
          sums.b += b
          sums.total += 1
          rgbSums.set(row.colorGroupName, sums)
        }
      }
    }

    // Deduplicated catalog colors (for BrandDetailDrawer)
    const canonicalName = normalizeColorName(row.name)
    const key = canonicalName.toLowerCase().trim()
    if (!seenColors.has(key)) {
      const hex = row.hex1 ?? '#888888'
      seenColors.set(key, {
        id: row.id,
        name: canonicalName,
        hex,
        swatchTextColor: computeSwatchTextColor(hex),
        colorFamilyName: row.colorFamilyName ?? null,
        colorGroupName: row.colorGroupName ?? null,
      })
    }
  }

  // Compute weighted-average hex per color group
  const colorGroupsResult: FilterColorGroup[] = []
  for (const [groupName, meta] of groupMeta) {
    const sums = rgbSums.get(groupName)
    let hex = '#888888'
    if (sums && sums.total > 0) {
      const r = Math.round(sums.r / sums.total).toString(16).padStart(2, '0')
      const g = Math.round(sums.g / sums.total).toString(16).padStart(2, '0')
      const b = Math.round(sums.b / sums.total).toString(16).padStart(2, '0')
      hex = `#${r}${g}${b}`
    }
    colorGroupsResult.push({
      colorGroupName: groupName,
      colorFamilyName: meta.colorFamilyName,
      hex,
      swatchTextColor: computeSwatchTextColor(hex),
    })
  }

  return {
    styleSwatches,
    styleColorGroups: Object.fromEntries(
      Object.entries(colorGroupSets).map(([k, v]) => [k, [...v]])
    ),
    colorGroups: colorGroupsResult.sort(
      (a, b) =>
        (a.colorFamilyName ?? 'ZZZ').localeCompare(b.colorFamilyName ?? 'ZZZ') ||
        a.colorGroupName.localeCompare(b.colorGroupName)
    ),
    catalogColors: [...seenColors.values()].sort((a, b) => a.name.localeCompare(b.name)),
  }
}

// ---------------------------------------------------------------------------
// hydrateCatalogPreferences
// ---------------------------------------------------------------------------

/**
 * Merges isEnabled / isFavorite values from style preference sources (NormalizedGarmentCatalog
 * or CatalogStyleMetadata) into legacy GarmentCatalog rows.
 *
 * The normalized catalog / slim metadata is the source of truth because it reflects
 * the actual preference rows in the DB. The legacy catalog table has its own is_enabled /
 * is_favorite columns that are not updated by the preference server actions.
 *
 * Garments with no matching entry in prefSources keep their existing values.
 */
export function hydrateCatalogPreferences<
  T extends { sku: string; isEnabled: boolean; isFavorite: boolean },
>(
  catalog: T[],
  prefSources: Array<{ styleNumber: string; isEnabled: boolean; isFavorite: boolean }> | undefined
): T[] {
  if (!prefSources) return catalog
  const prefsBySku = new Map(
    prefSources.map((n) => [
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
