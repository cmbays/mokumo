/**
 * Canonical apparel size ordering.
 *
 * Used as fallback when catalog_sizes.sort_order is 0 or uniform — S&S Activewear's
 * `/v2/products/` endpoint does not reliably return a non-zero sizeIndex value.
 *
 * Order matches the industry-standard size run used by S&S, SanMar, and alphabroder:
 * infant → toddler → youth → adult standard → adult extended → one-size → numeric.
 */
const CANONICAL_SIZE_ORDER: Record<string, number> = {
  // Infant
  '6M': 0,
  '12M': 1,
  '18M': 2,
  '24M': 3,
  // Toddler
  '2T': 10,
  '3T': 11,
  '4T': 12,
  '5T': 13,
  '6T': 14,
  // Youth combined
  '6/8': 20,
  '10/12': 21,
  '14/16': 22,
  '1 - 14/16': 22,
  // Youth labeled
  'YXS': 23,
  'YS': 24,
  'YM': 25,
  'YL': 26,
  'YXL': 27,
  'YXOS': 28,
  // Adult standard
  'XS': 30,
  'S': 31,
  'S/M': 32,
  'M': 33,
  'M/L': 34,
  'L': 35,
  'L/XL': 36,
  'XL': 37,
  '2XL': 38,
  'XXL': 38,
  '3XL': 39,
  'XXXL': 39,
  '4XL': 40,
  '5XL': 41,
  '6XL': 42,
  // One-size
  'OSFA': 50,
  'OS': 50,
  'ONE SIZE': 50,
  'ONE SIZE FITS ALL': 50,
  // Numeric waist (pants/shorts)
  '26': 60,
  '28': 61,
  '30': 62,
  '32': 63,
  '34': 64,
  '36': 65,
  '38': 66,
  '40': 67,
  '42': 68,
  '44': 69,
  '46': 70,
  '48': 71,
  '50': 72,
  '52': 73,
}

export function getCanonicalSizeOrder(sizeName: string): number {
  return CANONICAL_SIZE_ORDER[sizeName.toUpperCase().trim()] ?? 999
}

/**
 * Sort an array of sized items using catalog sortOrder when meaningful (non-uniform),
 * falling back to canonical apparel order when all sortOrders are 0.
 *
 * "All zero" is the signal that S&S did not provide sizeIndex — canonical ordering
 * gives a human-readable XS→S→M→L→XL→2XL run even without supplier data.
 */
export function sortByAppropriateOrder<T extends { name: string; sortOrder: number }>(
  sizes: T[]
): T[] {
  if (sizes.length === 0) return sizes
  const allZero = sizes.every((s) => s.sortOrder === 0)
  if (allZero) {
    return [...sizes].sort((a, b) => getCanonicalSizeOrder(a.name) - getCanonicalSizeOrder(b.name))
  }
  return [...sizes].sort((a, b) => a.sortOrder - b.sortOrder)
}
