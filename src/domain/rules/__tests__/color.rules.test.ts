import { describe, it, expect } from 'vitest'
import { hexToRgb } from '../color.rules'

describe('hexToRgb', () => {
  it('converts black', () => {
    expect(hexToRgb('#000000')).toEqual({ r: 0, g: 0, b: 0 })
  })

  it('converts white', () => {
    expect(hexToRgb('#FFFFFF')).toEqual({ r: 255, g: 255, b: 255 })
  })

  it('converts Niji blue (#2ab9ff)', () => {
    expect(hexToRgb('#2ab9ff')).toEqual({ r: 42, g: 185, b: 255 })
  })

  it('handles lowercase hex', () => {
    expect(hexToRgb('#ff0000')).toEqual({ r: 255, g: 0, b: 0 })
  })

  // Review fix #1: malformed hex input
  it('returns {0,0,0} for empty string', () => {
    expect(hexToRgb('')).toEqual({ r: 0, g: 0, b: 0 })
  })

  it('returns {0,0,0} for malformed hex (too short)', () => {
    expect(hexToRgb('#FFF')).toEqual({ r: 0, g: 0, b: 0 })
  })

  it('returns {0,0,0} for non-hex characters', () => {
    expect(hexToRgb('#GGGGGG')).toEqual({ r: 0, g: 0, b: 0 })
  })

  it('returns {0,0,0} for missing hash', () => {
    expect(hexToRgb('FF0000')).toEqual({ r: 0, g: 0, b: 0 })
  })
})

