import { describe, it, expect } from 'vitest'
import {
  hexToHsl,
  classifyColorHue,
  classifyColor,
  selectRepresentativeColors,
} from '../color-utils'

// ---------------------------------------------------------------------------
// hexToHsl
// ---------------------------------------------------------------------------

describe('hexToHsl', () => {
  it('converts pure red (#ff0000) → h=0, s=100, l=50', () => {
    const { h, s, l } = hexToHsl('#ff0000')
    expect(h).toBe(0)
    expect(s).toBeCloseTo(100, 0)
    expect(l).toBeCloseTo(50, 0)
  })

  it('converts pure green (#00ff00) → h=120', () => {
    const { h } = hexToHsl('#00ff00')
    expect(h).toBe(120)
  })

  it('converts pure blue (#0000ff) → h=240', () => {
    const { h, s, l } = hexToHsl('#0000ff')
    expect(h).toBe(240)
    expect(s).toBeCloseTo(100, 0)
    expect(l).toBeCloseTo(50, 0)
  })

  it('converts black (#000000) → s=0, l=0', () => {
    const { s, l } = hexToHsl('#000000')
    expect(s).toBe(0)
    expect(l).toBe(0)
  })

  it('converts white (#ffffff) → s=0, l≈100', () => {
    const { s, l } = hexToHsl('#ffffff')
    expect(s).toBe(0)
    expect(l).toBeCloseTo(100, 0)
  })

  it('converts dark gray (#555555) → s=0, l≈33', () => {
    const { s, l } = hexToHsl('#555555')
    expect(s).toBe(0)
    expect(l).toBeCloseTo(33, 0)
  })

  it('converts magenta (#ff00ff) → h=300', () => {
    const { h } = hexToHsl('#ff00ff')
    expect(h).toBe(300)
  })
})

// ---------------------------------------------------------------------------
// classifyColorHue
// ---------------------------------------------------------------------------

describe('classifyColorHue', () => {
  it('returns blacks-grays for null input (safe default)', () => {
    expect(classifyColorHue(null)).toBe('blacks-grays')
  })

  it('classifies pure black (#000000) as blacks-grays', () => {
    expect(classifyColorHue('#000000')).toBe('blacks-grays')
  })

  it('classifies dark gray (#555555) as blacks-grays', () => {
    expect(classifyColorHue('#555555')).toBe('blacks-grays')
  })

  it('classifies pure white (#ffffff) as whites-neutrals', () => {
    expect(classifyColorHue('#ffffff')).toBe('whites-neutrals')
  })

  it('classifies light gray (#cccccc) as whites-neutrals (L > 50)', () => {
    expect(classifyColorHue('#cccccc')).toBe('whites-neutrals')
  })

  it('classifies pure red (#ff0000) as reds', () => {
    expect(classifyColorHue('#ff0000')).toBe('reds')
  })

  it('classifies dark red / maroon (#800000) as reds', () => {
    expect(classifyColorHue('#800000')).toBe('reds')
  })

  it('classifies crimson (#dc143c, hue≈348) as reds (h >= 346)', () => {
    expect(classifyColorHue('#dc143c')).toBe('reds')
  })

  it('classifies magenta (#ff00ff, hue=300) as purples-pinks', () => {
    expect(classifyColorHue('#ff00ff')).toBe('purples-pinks')
  })

  it('classifies purple (#800080) as purples-pinks', () => {
    expect(classifyColorHue('#800080')).toBe('purples-pinks')
  })

  it('classifies pure blue (#0000ff, hue=240) as blues', () => {
    expect(classifyColorHue('#0000ff')).toBe('blues')
  })

  it('classifies navy (#000080) as blues', () => {
    expect(classifyColorHue('#000080')).toBe('blues')
  })

  it('classifies pure green (#00ff00, hue=120) as greens', () => {
    expect(classifyColorHue('#00ff00')).toBe('greens')
  })

  it('classifies forest green (#228b22) as greens', () => {
    expect(classifyColorHue('#228b22')).toBe('greens')
  })

  it('classifies gold (#ffd700, hue≈51) as yellows-oranges (not brown — L≈50%)', () => {
    expect(classifyColorHue('#ffd700')).toBe('yellows-oranges')
  })

  it('classifies bright orange (#ff8c00, hue≈33, L≈50%) as yellows-oranges — not brown', () => {
    // L≈50% → fails brown check (L < 45 required) → falls through to yellows-oranges
    expect(classifyColorHue('#ff8c00')).toBe('yellows-oranges')
  })

  it('classifies saddlebrown (#8b4513, hue≈25, L≈31%) as browns', () => {
    // h=25 (in 16-45), s high, l<45% → brown before orange-yellow range
    expect(classifyColorHue('#8b4513')).toBe('browns')
  })

  it('classifies sienna (#a0522d, hue≈19, L≈40%) as browns', () => {
    expect(classifyColorHue('#a0522d')).toBe('browns')
  })
})

// ---------------------------------------------------------------------------
// classifyColor
// ---------------------------------------------------------------------------

describe('classifyColor', () => {
  it('uses family field when present — mock Color path', () => {
    expect(classifyColor({ family: 'Black' })).toBe('blacks-grays')
    expect(classifyColor({ family: 'Gray' })).toBe('blacks-grays')
    expect(classifyColor({ family: 'White' })).toBe('whites-neutrals')
    expect(classifyColor({ family: 'Blue' })).toBe('blues')
    expect(classifyColor({ family: 'Red' })).toBe('reds')
    expect(classifyColor({ family: 'Green' })).toBe('greens')
    expect(classifyColor({ family: 'Yellow' })).toBe('yellows-oranges')
    expect(classifyColor({ family: 'Orange' })).toBe('yellows-oranges')
    expect(classifyColor({ family: 'Purple' })).toBe('purples-pinks')
    expect(classifyColor({ family: 'Pink' })).toBe('purples-pinks')
    expect(classifyColor({ family: 'Brown' })).toBe('browns')
  })

  it('family lookup is case-insensitive', () => {
    expect(classifyColor({ family: 'BLUE' })).toBe('blues')
    expect(classifyColor({ family: 'red' })).toBe('reds')
    expect(classifyColor({ family: 'Navy' })).toBe('blues')
  })

  it('prefers family over hex when both present', () => {
    // family="Blue" wins even though hex is pure red
    expect(classifyColor({ family: 'Blue', hex: '#ff0000' })).toBe('blues')
  })

  it('falls back to hex when family is unknown', () => {
    expect(classifyColor({ family: 'UnknownColorName', hex: '#0000ff' })).toBe('blues')
  })

  it('uses hex1 when hex is absent — CatalogColor path', () => {
    expect(classifyColor({ hex1: '#ff0000' })).toBe('reds')
    expect(classifyColor({ hex1: '#0000ff' })).toBe('blues')
    expect(classifyColor({ hex1: '#228b22' })).toBe('greens')
  })

  it('prefers hex over hex1 when both present', () => {
    // hex=#ff0000 (red) wins over hex1=#0000ff (blue)
    expect(classifyColor({ hex: '#ff0000', hex1: '#0000ff' })).toBe('reds')
  })

  it('returns blacks-grays when all fields are absent or null', () => {
    expect(classifyColor({})).toBe('blacks-grays')
    expect(classifyColor({ hex: null, hex1: null })).toBe('blacks-grays')
    expect(classifyColor({ family: undefined, hex: null })).toBe('blacks-grays')
  })
})

// ---------------------------------------------------------------------------
// selectRepresentativeColors
// ---------------------------------------------------------------------------

describe('selectRepresentativeColors', () => {
  it('returns [] for empty input', () => {
    expect(selectRepresentativeColors([])).toEqual([])
  })

  it('returns all indices when colors ≤ maxCount', () => {
    const colors = [{ hex: '#ff0000' }, { hex: '#0000ff' }, { hex: '#00ff00' }]
    expect(selectRepresentativeColors(colors, 8)).toEqual([0, 1, 2])
  })

  it('returns exactly maxCount indices when more colors exist', () => {
    const colors = Array(10).fill({ hex: '#ff0000' })
    expect(selectRepresentativeColors(colors, 8)).toHaveLength(8)
  })

  it('picks diverse hue families first (round-robin)', () => {
    const colors = [
      { hex: '#ff0000' }, // red — index 0
      { hex: '#0000ff' }, // blue — index 1
      { hex: '#00ff00' }, // green — index 2
      { hex: '#ff0001' }, // red — index 3
      { hex: '#0000fe' }, // blue — index 4
    ]
    const result = selectRepresentativeColors(colors, 3)
    expect(result).toHaveLength(3)
    // First pass picks one from each bucket: red(0), blue(1), green(2)
    expect(result).toContain(0)
    expect(result).toContain(1)
    expect(result).toContain(2)
  })

  it('returns indices in ascending order (preserves catalog order)', () => {
    const colors = [
      { hex: '#ff0000' }, // red 0
      { hex: '#0000ff' }, // blue 1
      { hex: '#00ff00' }, // green 2
      { hex: '#ff0001' }, // red 3
      { hex: '#0000fe' }, // blue 4
    ]
    const result = selectRepresentativeColors(colors, 4)
    expect(result).toEqual([...result].sort((a, b) => a - b))
  })

  it('fills remaining slots from largest bucket when hue count < maxCount', () => {
    // Only reds — round-robin stays in one bucket, picks first 4
    const colors = Array(10).fill({ hex: '#ff0000' })
    const result = selectRepresentativeColors(colors, 4)
    expect(result).toEqual([0, 1, 2, 3])
  })

  it('handles null hex gracefully (classified as blacks-grays)', () => {
    const colors = [{ hex: null }, { hex: '#0000ff' }]
    const result = selectRepresentativeColors(colors, 8)
    expect(result).toEqual([0, 1])
  })

  it('handles CatalogColor shape (hex1 only)', () => {
    const colors = [{ hex1: '#ff0000' }, { hex1: '#0000ff' }]
    const result = selectRepresentativeColors(colors, 8)
    expect(result).toEqual([0, 1])
  })

  it('handles mixed null/valid hex — null counts as blacks-grays bucket', () => {
    const colors = [
      { hex: null }, // blacks-grays — index 0
      { hex: '#ff0000' }, // reds — index 1
      { hex: null }, // blacks-grays — index 2
      { hex: '#0000ff' }, // blues — index 3
    ]
    const result = selectRepresentativeColors(colors, 3)
    // Round-robin: picks first from each bucket
    // Bucket order depends on Map insertion order: blacks-grays(0,2), reds(1), blues(3)
    expect(result).toHaveLength(3)
    expect(result).toContain(0) // first blacks-grays
    expect(result).toContain(1) // first red
    expect(result).toContain(3) // first blue
  })
})
