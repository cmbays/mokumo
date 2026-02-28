import { describe, it, expect } from 'vitest'
import { PRINT_ZONES, PRINT_POSITION_LABELS } from '@domain/constants/print-zones'

// ---------------------------------------------------------------------------
// VIEW_POSITION_MAP logic (extracted from GarmentMockupCard)
// ---------------------------------------------------------------------------

const VIEW_POSITION_MAP: Record<string, string[]> = {
  front: ['front-chest', 'left-chest', 'right-chest', 'full-front', 'front-panel'],
  back: ['full-back', 'upper-back', 'nape', 'back-panel'],
  'left-sleeve': ['left-sleeve'],
  'right-sleeve': ['right-sleeve'],
}

function viewHasArtwork(view: string, placements: { position: string }[]): boolean {
  const positions = VIEW_POSITION_MAP[view] ?? []
  return placements.some((p) => positions.includes(p.position))
}

describe('viewHasArtwork', () => {
  it('returns true when front-chest artwork is in front view', () => {
    expect(viewHasArtwork('front', [{ position: 'front-chest' }])).toBe(true)
  })

  it('returns true when left-chest artwork is in front view', () => {
    expect(viewHasArtwork('front', [{ position: 'left-chest' }])).toBe(true)
  })

  it('returns false when front-chest artwork is checked against back view', () => {
    expect(viewHasArtwork('back', [{ position: 'front-chest' }])).toBe(false)
  })

  it('returns true when full-back artwork is in back view', () => {
    expect(viewHasArtwork('back', [{ position: 'full-back' }])).toBe(true)
  })

  it('returns false for empty placements', () => {
    expect(viewHasArtwork('front', [])).toBe(false)
  })

  it('returns false for unknown view', () => {
    expect(viewHasArtwork('top', [{ position: 'front-chest' }])).toBe(false)
  })

  it('returns true for front-panel (headwear) in front view', () => {
    expect(viewHasArtwork('front', [{ position: 'front-panel' }])).toBe(true)
  })

  it('returns true for back-panel in back view', () => {
    expect(viewHasArtwork('back', [{ position: 'back-panel' }])).toBe(true)
  })

  it('handles multiple placements across views', () => {
    const placements = [{ position: 'front-chest' }, { position: 'full-back' }]
    expect(viewHasArtwork('front', placements)).toBe(true)
    expect(viewHasArtwork('back', placements)).toBe(true)
    expect(viewHasArtwork('left-sleeve', placements)).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// Coordinate math (extracted from GarmentMockup)
// ---------------------------------------------------------------------------

function computeArtworkRect(
  zone: { x: number; y: number; width: number; height: number },
  viewBoxWidth: number,
  viewBoxHeight: number,
  scale = 1,
  offsetX = 0,
  offsetY = 0
) {
  const zx = (zone.x / 100) * viewBoxWidth
  const zy = (zone.y / 100) * viewBoxHeight
  const zw = (zone.width / 100) * viewBoxWidth
  const zh = (zone.height / 100) * viewBoxHeight

  const scaledW = zw * scale
  const scaledH = zh * scale
  const cx = zx + zw / 2 + (offsetX / 100) * zw
  const cy = zy + zh / 2 + (offsetY / 100) * zh
  const ax = cx - scaledW / 2
  const ay = cy - scaledH / 2

  return { ax, ay, scaledW, scaledH, zx, zy, zw, zh }
}

describe('computeArtworkRect', () => {
  const frontChest = { x: 28, y: 18, width: 44, height: 35 }
  const viewBox = { w: 400, h: 480 }

  it('converts percentage coordinates to viewBox units', () => {
    const result = computeArtworkRect(frontChest, viewBox.w, viewBox.h)
    expect(result.zx).toBeCloseTo(112) // 28% of 400
    expect(result.zy).toBeCloseTo(86.4) // 18% of 480
    expect(result.zw).toBeCloseTo(176) // 44% of 400
    expect(result.zh).toBeCloseTo(168) // 35% of 480
  })

  it('centers artwork at scale=1 with no offset', () => {
    const result = computeArtworkRect(frontChest, viewBox.w, viewBox.h, 1, 0, 0)
    // Center of zone = zx + zw/2 = 112 + 88 = 200
    // Artwork x = center - scaledW/2 = 200 - 88 = 112 (same as zone x)
    expect(result.ax).toBeCloseTo(result.zx)
    expect(result.ay).toBeCloseTo(result.zy)
    expect(result.scaledW).toBeCloseTo(result.zw)
    expect(result.scaledH).toBeCloseTo(result.zh)
  })

  it('scales artwork down to 50%', () => {
    const result = computeArtworkRect(frontChest, viewBox.w, viewBox.h, 0.5)
    expect(result.scaledW).toBe(88) // 176 * 0.5
    expect(result.scaledH).toBe(84) // 168 * 0.5
    // Artwork should be centered within zone
    const centerX = result.zx + result.zw / 2
    expect(result.ax).toBeCloseTo(centerX - result.scaledW / 2)
  })

  it('applies offset as percentage of zone dimensions', () => {
    const result = computeArtworkRect(frontChest, viewBox.w, viewBox.h, 1, 50, 0)
    // offsetX of 50 means shift center by 50% of zone width
    const zw = 176
    const expectedCx = 112 + zw / 2 + (50 / 100) * zw // 112 + 88 + 88 = 288
    expect(result.ax).toBeCloseTo(expectedCx - result.scaledW / 2)
  })

  it('handles edge case: zone at origin with full viewBox', () => {
    const fullZone = { x: 0, y: 0, width: 100, height: 100 }
    const result = computeArtworkRect(fullZone, 400, 480)
    expect(result.zx).toBe(0)
    expect(result.zy).toBe(0)
    expect(result.zw).toBe(400)
    expect(result.zh).toBe(480)
    expect(result.ax).toBe(0)
    expect(result.ay).toBe(0)
  })
})

// ---------------------------------------------------------------------------
// Every position in PRINT_ZONES maps to a VIEW_POSITION_MAP view
// ---------------------------------------------------------------------------

describe('VIEW_POSITION_MAP covers all PRINT_ZONES positions', () => {
  const allMappedPositions = new Set(Object.values(VIEW_POSITION_MAP).flat())

  // Positions intentionally excluded from VIEW_POSITION_MAP because
  // GarmentMockupCard doesn't render views for their garment categories yet.
  // When pants/headwear get dedicated views, add them here.
  const KNOWN_UNMAPPED = new Set(['left-leg'])

  it('every position in PRINT_ZONES has a corresponding view mapping (or is known-unmapped)', () => {
    const unmapped: string[] = []
    for (const [, views] of Object.entries(PRINT_ZONES)) {
      for (const [, zones] of Object.entries(views)) {
        for (const zone of zones ?? []) {
          if (!allMappedPositions.has(zone.position) && !KNOWN_UNMAPPED.has(zone.position)) {
            unmapped.push(zone.position)
          }
        }
      }
    }
    expect(unmapped).toEqual([])
  })

  it('every position in PRINT_POSITION_LABELS has a view mapping (or is known-unmapped)', () => {
    const unmapped: string[] = []
    for (const position of Object.keys(PRINT_POSITION_LABELS)) {
      if (!allMappedPositions.has(position) && !KNOWN_UNMAPPED.has(position)) {
        unmapped.push(position)
      }
    }
    expect(unmapped).toEqual([])
  })
})
