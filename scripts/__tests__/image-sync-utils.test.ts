import { describe, it, expect } from 'vitest'
import {
  resolveImageUrl,
  normalizeHex,
  buildImages,
  mapSSProductToColorValue,
  ssProductSchema,
  IMAGE_FIELDS,
  SS_IMAGE_BASE,
  type SSProduct,
} from '../image-sync-utils'

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const STYLE_UUID = '00000000-0000-4000-8000-000000000001'

/** Minimal valid parsed product — all optional image fields default to '' via Zod. */
function makeProduct(overrides: Partial<SSProduct> = {}): SSProduct {
  return ssProductSchema.parse({
    sku: 'BC3001BLK-S',
    styleID: '3001',
    colorName: 'Black',
    colorCode: 'BLK',
    color1: '000000',
    color2: '',
    colorFrontImage: '/images/3001BLK_front.jpg',
    colorBackImage: '/images/3001BLK_back.jpg',
    ...overrides,
  })
}

// ---------------------------------------------------------------------------
// resolveImageUrl
// ---------------------------------------------------------------------------

describe('resolveImageUrl', () => {
  it('returns null for empty string', () => {
    expect(resolveImageUrl('')).toBeNull()
  })

  it('resolves relative path with leading slash', () => {
    expect(resolveImageUrl('/images/foo.jpg')).toBe(`${SS_IMAGE_BASE}/images/foo.jpg`)
  })

  it('resolves relative path without leading slash', () => {
    expect(resolveImageUrl('images/foo.jpg')).toBe(`${SS_IMAGE_BASE}/images/foo.jpg`)
  })

  it('passes through absolute https URL unchanged', () => {
    const url = 'https://cdn.example.com/img.jpg'
    expect(resolveImageUrl(url)).toBe(url)
  })

  it('passes through absolute http URL unchanged', () => {
    const url = 'http://cdn.example.com/img.jpg'
    expect(resolveImageUrl(url)).toBe(url)
  })

  it('does not double-slash when path already has leading slash', () => {
    const result = resolveImageUrl('/a/b/c.jpg')
    // The toBe check is sufficient — it would fail if the path produced double-slash
    expect(result).toBe(`${SS_IMAGE_BASE}/a/b/c.jpg`)
  })
})

// ---------------------------------------------------------------------------
// normalizeHex
// ---------------------------------------------------------------------------

describe('normalizeHex', () => {
  it('returns null for empty string', () => {
    expect(normalizeHex('')).toBeNull()
  })

  it('returns null for non-hex values like "DROPPED"', () => {
    expect(normalizeHex('DROPPED')).toBeNull()
  })

  it('returns null for short hex (3 digits)', () => {
    expect(normalizeHex('FFF')).toBeNull()
  })

  it('returns null for long hex (7 hex digits without #)', () => {
    expect(normalizeHex('0000000')).toBeNull()
  })

  it('adds # to valid 6-char hex without it', () => {
    expect(normalizeHex('000000')).toBe('#000000')
  })

  it('passes through valid 6-char hex that already has #', () => {
    expect(normalizeHex('#FFFFFF')).toBe('#FFFFFF')
  })

  it('trims surrounding whitespace before validation', () => {
    expect(normalizeHex('  AABBCC  ')).toBe('#AABBCC')
  })

  it('accepts uppercase hex digits', () => {
    expect(normalizeHex('1A2B3C')).toBe('#1A2B3C')
  })

  it('accepts lowercase hex digits', () => {
    expect(normalizeHex('1a2b3c')).toBe('#1a2b3c')
  })

  it('returns null for hex with # but only 5 digits', () => {
    expect(normalizeHex('#12345')).toBeNull()
  })

  it('returns null for hex with special characters', () => {
    expect(normalizeHex('#GG0000')).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// buildImages
// ---------------------------------------------------------------------------

describe('buildImages', () => {
  it('returns one record per non-empty image field', () => {
    const product = makeProduct({
      colorFrontImage: '/img/front.jpg',
      colorBackImage: '/img/back.jpg',
      colorSideImage: '',
      colorDirectSideImage: '',
      colorOnModelFrontImage: '',
      colorOnModelBackImage: '',
      colorOnModelSideImage: '',
      colorSwatchImage: '',
    })
    const result = buildImages(product)
    expect(result).toHaveLength(2)
    expect(result.map((r) => r.type)).toEqual(['front', 'back'])
  })

  it('returns empty array when all image fields are empty', () => {
    const product = makeProduct({
      colorFrontImage: '',
      colorBackImage: '',
      colorSideImage: '',
      colorDirectSideImage: '',
      colorOnModelFrontImage: '',
      colorOnModelBackImage: '',
      colorOnModelSideImage: '',
      colorSwatchImage: '',
    })
    expect(buildImages(product)).toEqual([])
  })

  it('resolves relative paths to full S&S URLs', () => {
    const product = makeProduct({ colorFrontImage: '/images/front.jpg' })
    const result = buildImages(product)
    const frontRecord = result.find((r) => r.type === 'front')
    expect(frontRecord?.url).toBe(`${SS_IMAGE_BASE}/images/front.jpg`)
  })

  it('passes through absolute URLs unchanged', () => {
    const absoluteUrl = 'https://cdn.ssactivewear.com/images/front.jpg'
    const product = makeProduct({ colorFrontImage: absoluteUrl })
    const result = buildImages(product)
    const frontRecord = result.find((r) => r.type === 'front')
    expect(frontRecord?.url).toBe(absoluteUrl)
  })

  it('produces all 8 records when all image fields are populated', () => {
    const product = makeProduct({
      colorFrontImage: '/img/front.jpg',
      colorBackImage: '/img/back.jpg',
      colorSideImage: '/img/side.jpg',
      colorDirectSideImage: '/img/direct-side.jpg',
      colorOnModelFrontImage: '/img/on-model-front.jpg',
      colorOnModelBackImage: '/img/on-model-back.jpg',
      colorOnModelSideImage: '/img/on-model-side.jpg',
      colorSwatchImage: '/img/swatch.jpg',
    })
    const result = buildImages(product)
    expect(result).toHaveLength(8)
  })

  it('uses the correct type labels for each field', () => {
    const product = makeProduct({
      colorFrontImage: '/img/front.jpg',
      colorBackImage: '/img/back.jpg',
      colorSideImage: '/img/side.jpg',
      colorDirectSideImage: '/img/direct-side.jpg',
      colorOnModelFrontImage: '/img/on-model-front.jpg',
      colorOnModelBackImage: '/img/on-model-back.jpg',
      colorOnModelSideImage: '/img/on-model-side.jpg',
      colorSwatchImage: '/img/swatch.jpg',
    })
    const types = buildImages(product).map((r) => r.type)
    const expectedTypes = IMAGE_FIELDS.map((f) => f.type)
    expect(types).toEqual(expectedTypes)
  })
})

// ---------------------------------------------------------------------------
// mapSSProductToColorValue
// ---------------------------------------------------------------------------

describe('mapSSProductToColorValue', () => {
  it('maps colorName to name', () => {
    const result = mapSSProductToColorValue(makeProduct({ colorName: 'Navy' }), STYLE_UUID)
    expect(result.name).toBe('Navy')
  })

  it('maps styleId correctly', () => {
    const result = mapSSProductToColorValue(makeProduct(), STYLE_UUID)
    expect(result.styleId).toBe(STYLE_UUID)
  })

  it('normalizes color1 hex to #RRGGBB', () => {
    const result = mapSSProductToColorValue(makeProduct({ color1: 'AABBCC' }), STYLE_UUID)
    expect(result.hex1).toBe('#AABBCC')
  })

  it('sets hex1 to null for invalid color1 like "DROPPED"', () => {
    const result = mapSSProductToColorValue(makeProduct({ color1: 'DROPPED' }), STYLE_UUID)
    expect(result.hex1).toBeNull()
  })

  it('sets hex2 to null when color2 is empty', () => {
    const result = mapSSProductToColorValue(makeProduct({ color2: '' }), STYLE_UUID)
    expect(result.hex2).toBeNull()
  })

  it('normalizes color2 hex when valid', () => {
    const result = mapSSProductToColorValue(makeProduct({ color2: 'FFFFFF' }), STYLE_UUID)
    expect(result.hex2).toBe('#FFFFFF')
  })

  it('sets colorFamilyName to null when colorFamily is undefined', () => {
    const result = mapSSProductToColorValue(
      makeProduct({ colorFamily: undefined }),
      STYLE_UUID
    )
    expect(result.colorFamilyName).toBeNull()
  })

  it('sets colorFamilyName to null when colorFamily is empty string (falsy coercion)', () => {
    // S&S returns "" for missing colorFamily — must become null, not ""
    const result = mapSSProductToColorValue(
      makeProduct({ colorFamily: '' }),
      STYLE_UUID
    )
    expect(result.colorFamilyName).toBeNull()
  })

  it('sets colorFamilyName to null when colorFamily is whitespace-only', () => {
    const result = mapSSProductToColorValue(
      makeProduct({ colorFamily: '   ' }),
      STYLE_UUID
    )
    expect(result.colorFamilyName).toBeNull()
  })

  it('trims whitespace from colorFamily', () => {
    const result = mapSSProductToColorValue(
      makeProduct({ colorFamily: '  Blues  ' }),
      STYLE_UUID
    )
    expect(result.colorFamilyName).toBe('Blues')
  })

  it('trims whitespace from colorGroupName', () => {
    const result = mapSSProductToColorValue(
      makeProduct({ colorGroupName: '  Navy  ' }),
      STYLE_UUID
    )
    expect(result.colorGroupName).toBe('Navy')
  })

  it('sets colorGroupName to null when undefined', () => {
    const result = mapSSProductToColorValue(
      makeProduct({ colorGroupName: undefined }),
      STYLE_UUID
    )
    expect(result.colorGroupName).toBeNull()
  })

  it('trims whitespace from colorCode', () => {
    const result = mapSSProductToColorValue(makeProduct({ colorCode: '  BLK  ' }), STYLE_UUID)
    expect(result.colorCode).toBe('BLK')
  })

  it('sets colorCode to null when empty', () => {
    const result = mapSSProductToColorValue(makeProduct({ colorCode: '' }), STYLE_UUID)
    expect(result.colorCode).toBeNull()
  })

  it('includes updatedAt as a Date', () => {
    const before = new Date()
    const result = mapSSProductToColorValue(makeProduct(), STYLE_UUID)
    const after = new Date()
    expect(result.updatedAt).toBeInstanceOf(Date)
    expect(result.updatedAt.getTime()).toBeGreaterThanOrEqual(before.getTime())
    expect(result.updatedAt.getTime()).toBeLessThanOrEqual(after.getTime())
  })
})

// ---------------------------------------------------------------------------
// ssProductSchema — API response shape validation
// (Regression guard for Undici v7 stricter fetch compliance)
// ---------------------------------------------------------------------------

describe('ssProductSchema', () => {
  it('parses a valid minimal product row', () => {
    const input = {
      sku: 'BC3001BLK-S',
      styleID: '3001',
      colorName: 'Black',
    }
    const result = ssProductSchema.safeParse(input)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.styleID).toBe('3001')
      expect(result.data.colorName).toBe('Black')
    }
  })

  it('stringifies numeric styleID', () => {
    const result = ssProductSchema.safeParse({
      sku: 'BC3001BLK-S',
      styleID: 3001, // number, not string
      colorName: 'Black',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.styleID).toBe('3001')
      expect(typeof result.data.styleID).toBe('string')
    }
  })

  it('defaults missing optional string fields to empty string', () => {
    const result = ssProductSchema.safeParse({
      sku: 'X1-S',
      styleID: '99',
      colorName: 'White',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.colorFrontImage).toBe('')
      expect(result.data.color1).toBe('')
      expect(result.data.colorCode).toBe('')
    }
  })

  it('passes unknown extra fields through (passthrough mode)', () => {
    const result = ssProductSchema.safeParse({
      sku: 'X1-S',
      styleID: '99',
      colorName: 'White',
      someFutureField: 'extra data', // unknown field
    })
    expect(result.success).toBe(true)
    if (result.success) {
      // passthrough preserves unknown fields at runtime even though the type doesn't include them
      expect((result.data as Record<string, unknown>).someFutureField).toBe('extra data')
    }
  })

  it('fails when required sku is missing', () => {
    const result = ssProductSchema.safeParse({
      styleID: '99',
      colorName: 'White',
    })
    expect(result.success).toBe(false)
  })

  it('fails when required colorName is missing', () => {
    const result = ssProductSchema.safeParse({
      sku: 'X1-S',
      styleID: '99',
    })
    expect(result.success).toBe(false)
  })

  it('validates full product array (S&S response shape)', () => {
    const fixturePayload = [
      {
        sku: 'BC3001BLK-S',
        styleID: 3001,
        colorName: 'Black',
        colorCode: 'BLK',
        colorFamily: 'Black',
        colorGroupName: 'Blacks & Grays',
        color1: '000000',
        color2: '',
        colorFrontImage: '/images/3001BLK_front.jpg',
        colorBackImage: '/images/3001BLK_back.jpg',
        colorSideImage: '',
        colorDirectSideImage: '',
        colorOnModelFrontImage: '/images/3001BLK_model_front.jpg',
        colorOnModelBackImage: '',
        colorOnModelSideImage: '',
        colorSwatchImage: '/images/3001BLK_swatch.jpg',
      },
      {
        sku: 'BC3001WHT-S',
        styleID: 3001,
        colorName: 'White',
        colorCode: 'WHT',
        color1: 'FFFFFF',
        color2: '',
        // Intentionally omit all image fields to test defaults
      },
    ]
    const result = ssProductSchema.array().safeParse(fixturePayload)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toHaveLength(2)
      expect(result.data[0].styleID).toBe('3001') // numeric → string
      expect(result.data[1].colorFrontImage).toBe('') // default applied
    }
  })

  it('rejects non-array API response (e.g. error object from S&S)', () => {
    // Undici v7 regression guard: if S&S returns {"error": "..."} instead of an array
    const result = ssProductSchema.array().safeParse({ error: 'Unauthorized' })
    expect(result.success).toBe(false)
  })

  it('rejects null API response', () => {
    const result = ssProductSchema.array().safeParse(null)
    expect(result.success).toBe(false)
  })

  it('accepts empty array (zero products)', () => {
    const result = ssProductSchema.array().safeParse([])
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toHaveLength(0)
    }
  })
})
