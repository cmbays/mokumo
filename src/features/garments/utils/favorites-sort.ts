/**
 * Pure sort utilities for surfacing favorited items in the garment catalog.
 * Extracted for testability — no side effects, no React imports.
 */

import type { FilterColorGroup } from '@features/garments/types'

/**
 * Returns a copy of `colorGroups` with favorited groups sorted to the front.
 * Relative order within favorited / non-favorited groups is preserved (stable).
 *
 * `favoriteNames` is a Set<colorGroupName> — the same strings stored in
 * catalog_color_group_preferences, seeded from `getColorGroupFavorites()`.
 */
export function sortColorGroupsByFavorites(
  colorGroups: FilterColorGroup[],
  favoriteNames: Set<string>
): FilterColorGroup[] {
  return [...colorGroups].sort((a, b) => {
    const aFav = favoriteNames.has(a.colorGroupName) ? 0 : 1
    const bFav = favoriteNames.has(b.colorGroupName) ? 0 : 1
    return aFav - bFav
  })
}
