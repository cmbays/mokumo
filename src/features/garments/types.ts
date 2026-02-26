/**
 * Lightweight color type used by color filter UI (ColorFilterGrid, FavoritesColorSection).
 * Carries colorFamilyName for the family-based filter tab system (Wave 3, #632).
 * Computed at page SSR time via extractUniqueColors() in garment-transforms.ts.
 */
export type FilterColor = {
  id: string
  name: string
  hex: string
  swatchTextColor: string
  colorFamilyName?: string | null
}
