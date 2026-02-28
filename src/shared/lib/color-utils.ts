/**
 * Color classification utilities for hue-bucket filtering and diverse swatch selection.
 *
 * Handles two entity shapes:
 *   - Color      (mock): { family: string; hex: string }
 *   - CatalogColor (real): { hex1: string | null } — no family until #627 backfills color_group
 *   - FilterColor (grid): { hex: string } — no family
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type HueBucket =
  | 'all'
  | 'blacks-grays'
  | 'whites-neutrals'
  | 'reds'
  | 'yellows-oranges'
  | 'greens'
  | 'blues'
  | 'purples-pinks'
  | 'browns'

/**
 * The 8 classification buckets — HueBucket minus the 'all' tab-state sentinel.
 * Use this as the return type for classification functions so callers know
 * 'all' can never come back from classifyColor / classifyColorHue.
 */
export type ColorBucket = Exclude<HueBucket, 'all'>

// ---------------------------------------------------------------------------
// Config — tab labels, display order, family strings for Color.family lookup
// ---------------------------------------------------------------------------

export const HUE_BUCKET_CONFIG: Record<
  HueBucket,
  { label: string; order: number; families: readonly string[] }
> = {
  all: { label: 'All', order: 0, families: [] },
  'blacks-grays': {
    label: 'Blacks & Grays',
    order: 1,
    families: ['black', 'gray', 'charcoal', 'heather gray', 'dark gray', 'light gray', 'slate'],
  },
  'whites-neutrals': {
    label: 'Whites & Neutrals',
    order: 2,
    families: ['white', 'natural', 'cream', 'ivory', 'pfd', 'off-white', 'ecru', 'natural heather'],
  },
  blues: {
    label: 'Blues',
    order: 3,
    families: [
      'blue',
      'navy',
      'royal',
      'royal blue',
      'carolina blue',
      'sky',
      'sky blue',
      'sapphire',
      'cobalt',
      'indigo',
      'azure',
      'steel blue',
      'teal',
      'denim',
      'cornflower',
    ],
  },
  reds: {
    label: 'Reds',
    order: 4,
    families: [
      'red',
      'cardinal',
      'maroon',
      'scarlet',
      'crimson',
      'brick',
      'garnet',
      'burgundy',
      'raspberry',
    ],
  },
  greens: {
    label: 'Greens',
    order: 5,
    families: [
      'green',
      'forest',
      'forest green',
      'kelly',
      'kelly green',
      'olive',
      'sage',
      'mint',
      'emerald',
      'lime',
      'hunter',
      'hunter green',
      'military green',
      'cactus',
    ],
  },
  'yellows-oranges': {
    label: 'Yellows & Oranges',
    order: 6,
    families: [
      'yellow',
      'gold',
      'daisy',
      'orange',
      'safety orange',
      'burnt orange',
      'amber',
      'sunflower',
      'lemon',
    ],
  },
  'purples-pinks': {
    label: 'Purples & Pinks',
    order: 7,
    families: [
      'purple',
      'violet',
      'iris',
      'plum',
      'lavender',
      'pink',
      'hot pink',
      'magenta',
      'fuchsia',
      'rose',
      'lilac',
    ],
  },
  browns: {
    label: 'Browns',
    order: 8,
    families: ['brown', 'chocolate', 'khaki', 'tan', 'coyote', 'caramel', 'taupe', 'sand', 'peat'],
  },
}

/**
 * All non-'all' buckets in display order.
 *
 * The `as ColorBucket[]` assertion is safe: Object.keys() over a
 * `Record<HueBucket, ...>` can only return HueBucket strings, and the
 * filter removes the sole non-ColorBucket member ('all').
 */
export const ORDERED_HUE_BUCKETS: ColorBucket[] = (
  Object.keys(HUE_BUCKET_CONFIG).filter((k) => k !== 'all') as ColorBucket[]
).sort((a, b) => HUE_BUCKET_CONFIG[a].order - HUE_BUCKET_CONFIG[b].order)

/** Lowercase family string → HueBucket, derived from HUE_BUCKET_CONFIG.families. */
const FAMILY_TO_BUCKET = new Map<string, Exclude<HueBucket, 'all'>>()
for (const [bucket, cfg] of Object.entries(HUE_BUCKET_CONFIG)) {
  if (bucket === 'all') continue
  for (const family of cfg.families) {
    FAMILY_TO_BUCKET.set(family.toLowerCase(), bucket as Exclude<HueBucket, 'all'>)
  }
}

// ---------------------------------------------------------------------------
// hexToHsl
// ---------------------------------------------------------------------------

/** Valid 6-digit hex color — same pattern used by hexToRgb in color.rules.ts. */
const HEX6_RE = /^#[0-9a-fA-F]{6}$/

/**
 * Convert a 6-digit hex color to HSL components.
 * Returns h in [0, 360), s in [0, 100], l in [0, 100].
 *
 * Returns { h: 0, s: 0, l: 0 } (maps to 'blacks-grays') for any non-6-digit input —
 * same safe-default strategy as hexToRgb. Callers must not pass 3-digit hex, hex without
 * '#', or color names; this guard makes invalid input explicit rather than silently
 * producing NaN (NaN comparisons always return false, causing every if-branch to be
 * skipped and colors to fall through to the 'purples-pinks' catch-all).
 */
export function hexToHsl(hex: string): { h: number; s: number; l: number } {
  if (!HEX6_RE.test(hex)) return { h: 0, s: 0, l: 0 }

  const r = parseInt(hex.slice(1, 3), 16) / 255
  const g = parseInt(hex.slice(3, 5), 16) / 255
  const b = parseInt(hex.slice(5, 7), 16) / 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const delta = max - min

  let h = 0
  if (delta !== 0) {
    if (max === r) h = ((g - b) / delta + 6) % 6
    else if (max === g) h = (b - r) / delta + 2
    else h = (r - g) / delta + 4
    h *= 60
  }

  const l = (max + min) / 2
  const s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1))

  return { h: Math.round(h), s: s * 100, l: l * 100 }
}

// ---------------------------------------------------------------------------
// classifyColorHue
// ---------------------------------------------------------------------------

/**
 * Classify a hex color string into a ColorBucket via HSL decomposition.
 * Returns 'blacks-grays' for null/empty input AND for any invalid hex string
 * (hexToHsl returns { h:0, s:0, l:0 } for non-6-digit input, which maps to
 * 'blacks-grays' via the achromatic S<10% branch).
 *
 * Evaluation order (specialize-first to prevent range overlap):
 * 1. Achromatic (S < 10%) → blacks-grays / whites-neutrals by lightness
 * 2. Browns: hue 16–45, S > 10%, L < 45%  ← must precede oranges-yellows
 * 3. Reds: hue 0–15 or 346–360
 * 4. Oranges-yellows: hue 16–65
 * 5. Greens: hue 66–170
 * 6. Blues: hue 171–260
 * 7. Purples-pinks: hue 261–345
 */
export function classifyColorHue(hex: string | null): ColorBucket {
  if (!hex) return 'blacks-grays'

  const { h, s, l } = hexToHsl(hex)

  // 1. Achromatic — no dominant hue
  if (s < 10) return l < 50 ? 'blacks-grays' : 'whites-neutrals'

  // 2. Browns before oranges-yellows (same hue range, discriminated by lightness)
  if (h >= 16 && h <= 45 && l < 45) return 'browns'

  // 3. Reds
  if (h <= 15 || h >= 346) return 'reds'

  // 4. Oranges-yellows
  if (h <= 65) return 'yellows-oranges'

  // 5. Greens
  if (h <= 170) return 'greens'

  // 6. Blues
  if (h <= 260) return 'blues'

  // 7. Purples-pinks (261–345)
  return 'purples-pinks'
}

// ---------------------------------------------------------------------------
// classifyColor
// ---------------------------------------------------------------------------

/**
 * Classify a color into a HueBucket.
 * Handles all three entity shapes in the codebase:
 *   - mock Color:   { family: string; hex: string }
 *   - CatalogColor: { hex1: string | null }
 *   - FilterColor:  { hex: string }
 *
 * Checks `.family` via FAMILY_TO_BUCKET first; falls back to HSL classification.
 */
export function classifyColor(color: {
  family?: string
  hex?: string | null
  hex1?: string | null
}): ColorBucket {
  if (color.family) {
    const bucket = FAMILY_TO_BUCKET.get(color.family.toLowerCase())
    if (bucket) return bucket
  }
  return classifyColorHue(color.hex ?? color.hex1 ?? null)
}

// ---------------------------------------------------------------------------
// selectRepresentativeColors
// ---------------------------------------------------------------------------

/**
 * Minimal color shape accepted by selectRepresentativeColors and ColorSwatchStrip.
 * Handles all three entity forms coexisting during the catalog migration:
 *   - mock Color:   { name, hex, family }
 *   - CatalogColor: { name, hex1 }
 *   - FilterColor:  { name, hex }
 *
 * `name` is required only for ColorSwatchStrip (tooltip label + aria-label).
 * The classification functions only require the hex/family fields.
 */
export type SwatchColorInput = {
  name: string
  hex?: string | null
  hex1?: string | null
  family?: string
}

/**
 * Select up to `maxCount` indices from a color array using round-robin across
 * hue buckets, ensuring color-family diversity in the output.
 *
 * Returns indices into the original array sorted ascending (preserves catalog order).
 *
 * Algorithm:
 *   1. Classify all colors into hue buckets
 *   2. Round-robin: one index from each non-empty bucket per pass
 *   3. Stop when maxCount reached or all colors exhausted
 */
export function selectRepresentativeColors(
  colors: Array<Omit<SwatchColorInput, 'name'>>,
  maxCount = 8
): number[] {
  if (colors.length === 0) return []
  if (colors.length <= maxCount) return colors.map((_, i) => i)

  // Group original indices by hue bucket
  const byBucket = new Map<ColorBucket, number[]>()
  for (let i = 0; i < colors.length; i++) {
    const bucket = classifyColor(colors[i])
    const group = byBucket.get(bucket)
    if (group) {
      group.push(i)
    } else {
      byBucket.set(bucket, [i])
    }
  }

  // Round-robin across non-empty buckets
  const bucketArrays = [...byBucket.values()]
  const selected: number[] = []
  let pass = 0

  outer: while (selected.length < maxCount) {
    let added = false
    for (const bucket of bucketArrays) {
      if (pass < bucket.length) {
        selected.push(bucket[pass])
        added = true
        if (selected.length >= maxCount) break outer
      }
    }
    if (!added) break
    pass++
  }

  // Sort to restore catalog order in the rendered output
  return selected.sort((a, b) => a - b)
}
