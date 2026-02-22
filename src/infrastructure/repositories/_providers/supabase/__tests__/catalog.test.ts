import { describe, it, expect, vi } from 'vitest'

// Mock server-only module so tests can run outside Next.js server context
vi.mock('server-only', () => ({}))

import { parseNormalizedCatalogRow } from '../catalog'

describe('parseNormalizedCatalogRow', () => {
  it('maps db row to NormalizedGarmentCatalog with defaults for empty arrays', () => {
    const row = {
      id: '00000000-0000-4000-8000-000000000001',
      source: 'ss-activewear',
      external_id: '3001',
      brand_canonical: 'Bella+Canvas',
      style_number: 'BC3001',
      name: 'Unisex Jersey Tee',
      description: null,
      category: 't-shirts',
      subcategory: null,
      piece_price: 4.25,
      colors: [],
      sizes: [],
      is_enabled: null,
      is_favorite: null,
    }
    const result = parseNormalizedCatalogRow(row)
    expect(result.brand).toBe('Bella+Canvas')
    expect(result.category).toBe('t-shirts')
    expect(result.isEnabled).toBe(true) // NULL → default true
    expect(result.isFavorite).toBe(false) // NULL → default false
  })

  it('parses colors with images through Zod validation', () => {
    const row = {
      id: '00000000-0000-4000-8000-000000000002',
      source: 'ss-activewear',
      external_id: '3002',
      brand_canonical: 'Gildan',
      style_number: 'G500',
      name: 'Heavy Cotton Tee',
      description: 'A heavy cotton tee',
      category: 'fleece',
      subcategory: null,
      piece_price: 3.5,
      colors: [
        {
          id: '00000000-0000-4000-a000-000000000010',
          name: 'Black',
          hex1: '#000000',
          hex2: null,
          images: [{ imageType: 'front', url: 'https://example.com/front.jpg' }],
        },
      ],
      sizes: [
        {
          id: '00000000-0000-4000-a000-000000000020',
          name: 'M',
          sortOrder: 1,
          priceAdjustment: 0,
        },
      ],
      is_enabled: true,
      is_favorite: true,
    }
    const result = parseNormalizedCatalogRow(row)
    expect(result.colors).toHaveLength(1)
    expect(result.colors[0].images).toHaveLength(1)
    expect(result.colors[0].hex1).toBe('#000000')
    expect(result.sizes).toHaveLength(1)
    expect(result.sizes[0].sortOrder).toBe(1)
    expect(result.isEnabled).toBe(true)
    expect(result.isFavorite).toBe(true)
  })
})
