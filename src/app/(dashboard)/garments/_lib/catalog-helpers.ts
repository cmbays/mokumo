import type { NormalizedGarmentCatalog } from '@domain/entities/catalog-style'

// ---------------------------------------------------------------------------
// buildSkuToStyleIdMap
// ---------------------------------------------------------------------------

/**
 * Builds a lookup map from S&S SKU (= externalId) to the catalog_styles UUID.
 *
 * The server actions toggleStyleEnabled / toggleStyleFavorite require the
 * catalog_styles primary key (UUID), but the legacy GarmentCatalog rows are
 * keyed by the S&S style number string.  This map bridges the two systems.
 */
export function buildSkuToStyleIdMap(
  normalizedCatalog: NormalizedGarmentCatalog[] | undefined
): Map<string, string> {
  if (!normalizedCatalog) return new Map()
  return new Map(normalizedCatalog.map((n) => [n.externalId, n.id]))
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
    normalizedCatalog.map((n) => [n.externalId, { isEnabled: n.isEnabled, isFavorite: n.isFavorite }])
  )
  return catalog.map((g) => {
    const prefs = prefsBySku.get(g.sku)
    return prefs ? { ...g, isEnabled: prefs.isEnabled, isFavorite: prefs.isFavorite } : g
  })
}
