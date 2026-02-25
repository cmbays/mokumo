import type { NormalizedGarmentCatalog } from '@domain/entities/catalog-style'

// ---------------------------------------------------------------------------
// buildSkuToFrontImageUrl
// ---------------------------------------------------------------------------

const SS_CDN_BASE = 'https://www.ssactivewear.com'

/**
 * Builds a lookup map from S&S style number to a front image URL.
 *
 * Primary: uses stored URL from catalog_images (populated by full sync with getStyle()).
 * Fallback: constructs CDN URL from externalId (S&S numeric styleID) when catalog_images
 * is empty — e.g. when only searchCatalog was run (no per-style getStyle() calls).
 * CDN pattern: https://www.ssactivewear.com/images/style/{externalId}/{externalId}_fm.jpg
 */
export function buildSkuToFrontImageUrl(
  normalizedCatalog: NormalizedGarmentCatalog[] | undefined
): Map<string, string> {
  if (!normalizedCatalog) return new Map()
  const map = new Map<string, string>()
  for (const n of normalizedCatalog) {
    // Primary: stored URL from catalog_images
    for (const color of n.colors) {
      const front = color.images.find((i) => i.imageType === 'front')
      if (front) {
        map.set(n.styleNumber, front.url)
        break
      }
    }
    // Fallback: construct from S&S numeric externalId
    if (!map.has(n.styleNumber) && n.externalId) {
      map.set(n.styleNumber, `${SS_CDN_BASE}/images/style/${n.externalId}/${n.externalId}_fm.jpg`)
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
