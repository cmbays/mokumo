/**
 * Lightweight color type used by color filter UI (ColorFilterGrid, FavoritesColorSection).
 * Structural subtype of Color — omits `family` (never used in swatch rendering).
 * Computed at page SSR time via extractUniqueColors() in garment-transforms.ts.
 */
export type FilterColor = {
  id: string
  name: string
  hex: string
  swatchTextColor: string
}
