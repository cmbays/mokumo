import type { PrintZone, MockupView } from '@domain/entities/mockup-template'
import type { GarmentCategory } from '@domain/entities/garment'

/**
 * Human-readable labels for print positions.
 */
export const PRINT_POSITION_LABELS: Record<string, string> = {
  'front-chest': 'Front Chest',
  'left-chest': 'Left Chest',
  'right-chest': 'Right Chest',
  'full-front': 'Full Front',
  'full-back': 'Full Back',
  'upper-back': 'Upper Back',
  nape: 'Nape',
  'left-sleeve': 'Left Sleeve',
  'right-sleeve': 'Right Sleeve',
  'left-leg': 'Left Leg',
  'front-panel': 'Front Panel',
  'back-panel': 'Back Panel',
}

/**
 * Alias map: normalizes freeform location strings (from quote/job mock data)
 * to canonical kebab-case position IDs used by the mockup engine.
 *
 * BREADBOARD GAP #1: Quote data uses "Front", "Back", "Left Sleeve".
 * Job data uses "Front Center", "Back Full", "Left Chest".
 * Mockup engine expects "front-chest", "full-back", etc.
 */
export const PRINT_POSITION_ALIASES: Record<string, string> = {
  // Quote-style short names
  Front: 'front-chest',
  Back: 'full-back',
  'Left Sleeve': 'left-sleeve',
  'Right Sleeve': 'right-sleeve',
  // Job-style descriptive names
  'Front Center': 'front-chest',
  'Front Left Chest': 'left-chest',
  'Left Chest': 'left-chest',
  'Right Chest': 'right-chest',
  'Back Full': 'full-back',
  'Back Number': 'upper-back',
  'Full Front': 'full-front',
  'Full Back': 'full-back',
  'Upper Back': 'upper-back',
  Nape: 'nape',
}

/**
 * Normalize a freeform location/position string to a canonical position ID.
 * Returns the alias match if found. For unknown input, logs a warning and
 * falls back to kebab-case conversion.
 */
export function normalizePosition(input: string): string {
  const trimmed = input.trim()
  if (!trimmed) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[mockup] normalizePosition called with empty input')
    }
    return 'unknown'
  }

  // Try exact match first (fast path)
  const aliased = PRINT_POSITION_ALIASES[trimmed]
  if (aliased) return aliased

  // Try case-insensitive match
  const inputLower = trimmed.toLowerCase()
  for (const [key, value] of Object.entries(PRINT_POSITION_ALIASES)) {
    if (key.toLowerCase() === inputLower) return value
  }

  // Check if already a canonical position
  if (PRINT_POSITION_LABELS[trimmed]) return trimmed

  // Unknown input — warn and fall back to kebab-case
  const kebab = inputLower.replace(/\s+/g, '-')
  if (process.env.NODE_ENV !== 'production') {
    console.warn(
      `[mockup] Unknown print position "${trimmed}", falling back to "${kebab}". ` +
        `Consider adding it to PRINT_POSITION_ALIASES.`
    )
  }
  return kebab
}

/**
 * Print zone geometry per garment category and view.
 * Coordinates are percentages of the template viewBox.
 */
export const PRINT_ZONES: Record<GarmentCategory, Partial<Record<MockupView, PrintZone[]>>> = {
  't-shirts': {
    front: [
      { position: 'front-chest', x: 28, y: 30, width: 44, height: 28 },
      { position: 'left-chest', x: 54, y: 30, width: 16, height: 15 },
      { position: 'right-chest', x: 30, y: 30, width: 16, height: 15 },
      { position: 'full-front', x: 25, y: 26, width: 50, height: 47 },
    ],
    back: [
      { position: 'full-back', x: 25, y: 28, width: 50, height: 45 },
      { position: 'upper-back', x: 28, y: 27, width: 44, height: 13 },
      { position: 'nape', x: 42, y: 22, width: 16, height: 9 },
    ],
  },
  fleece: {
    front: [
      { position: 'front-chest', x: 26, y: 22, width: 48, height: 32 },
      { position: 'left-chest', x: 52, y: 22, width: 16, height: 16 },
    ],
    back: [{ position: 'full-back', x: 20, y: 22, width: 60, height: 45 }],
  },
  outerwear: {
    front: [
      { position: 'left-chest', x: 52, y: 22, width: 16, height: 16 },
      { position: 'front-chest', x: 28, y: 22, width: 44, height: 30 },
    ],
    back: [{ position: 'full-back', x: 20, y: 20, width: 60, height: 48 }],
  },
  pants: {
    front: [{ position: 'left-leg', x: 30, y: 35, width: 20, height: 25 }],
    back: [],
  },
  headwear: {
    front: [{ position: 'front-panel', x: 20, y: 25, width: 60, height: 40 }],
    back: [{ position: 'back-panel', x: 20, y: 25, width: 60, height: 40 }],
  },
  polos: {
    front: [
      { position: 'front-chest', x: 28, y: 30, width: 44, height: 28 },
      { position: 'left-chest', x: 54, y: 30, width: 16, height: 15 },
    ],
    back: [{ position: 'full-back', x: 25, y: 28, width: 50, height: 45 }],
  },
  'knits-layering': {
    front: [{ position: 'front-chest', x: 26, y: 22, width: 48, height: 32 }],
    back: [{ position: 'full-back', x: 20, y: 22, width: 60, height: 45 }],
  },
  shorts: {
    front: [{ position: 'left-leg', x: 30, y: 35, width: 20, height: 20 }],
    back: [],
  },
  activewear: {
    front: [
      { position: 'front-chest', x: 28, y: 22, width: 44, height: 30 },
      { position: 'left-chest', x: 52, y: 22, width: 16, height: 16 },
    ],
    back: [{ position: 'full-back', x: 20, y: 20, width: 60, height: 48 }],
  },
  accessories: {
    front: [],
    back: [],
  },
  wovens: {
    front: [
      { position: 'left-chest', x: 52, y: 28, width: 16, height: 15 },
      { position: 'front-chest', x: 28, y: 28, width: 44, height: 28 },
    ],
    back: [{ position: 'full-back', x: 25, y: 28, width: 50, height: 45 }],
  },
  other: {
    front: [],
    back: [],
  },
}

/** Get all print zones for a garment category and view. */
export function getZonesForCategory(category: GarmentCategory, view: MockupView): PrintZone[] {
  return PRINT_ZONES[category]?.[view] ?? []
}

/** Get a specific zone by position within a category and view. */
export function getZoneForPosition(
  category: GarmentCategory,
  view: MockupView,
  position: string
): PrintZone | undefined {
  return getZonesForCategory(category, view).find((z) => z.position === position)
}
