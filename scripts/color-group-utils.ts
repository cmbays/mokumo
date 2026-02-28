/**
 * Pure utilities for color group collection in the image sync pipeline.
 * Extracted for testability — no side effects, no imports.
 */

/**
 * Extracts deduplicated (brandId, colorGroupName) pairs from a batch of
 * color values, using a styleId → brandId lookup map.
 *
 * Filters out null/empty colorGroupName entries and styleIds not present
 * in the map. Deduplication is by (brandId, colorGroupName) pair.
 */
export function collectColorGroupPairs(
  colorValues: Array<{ styleId: string; colorGroupName: string | null }>,
  brandIdByStyleId: Map<string, string>
): Array<{ brandId: string; colorGroupName: string }> {
  const seen = new Set<string>()
  const pairs: Array<{ brandId: string; colorGroupName: string }> = []
  for (const cv of colorValues) {
    if (!cv.colorGroupName) continue
    const brandId = brandIdByStyleId.get(cv.styleId)
    if (!brandId) continue
    const key = `${brandId}::${cv.colorGroupName}`
    if (!seen.has(key)) {
      seen.add(key)
      pairs.push({ brandId, colorGroupName: cv.colorGroupName })
    }
  }
  return pairs
}
