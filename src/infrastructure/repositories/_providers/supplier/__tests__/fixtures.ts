import type { CanonicalStyle } from '@lib/suppliers/types'

// ---------------------------------------------------------------------------
// makeStyle — shared CanonicalStyle fixture for supplier adapter tests
// ---------------------------------------------------------------------------

/**
 * Builds a complete CanonicalStyle with sensible defaults.
 * Pass overrides to exercise edge cases without rewriting every field.
 */
export function makeStyle(overrides: Partial<CanonicalStyle> = {}): CanonicalStyle {
  return {
    supplierId: '3001',
    styleNumber: 'BC3001',
    styleName: 'Unisex Jersey Tee',
    brand: 'Bella+Canvas',
    description: 'Super soft jersey tee',
    categories: ['T-Shirts'],
    colors: [
      { name: 'Black', hex1: '#000000', hex2: null, images: [] },
      { name: 'White', hex1: '#FFFFFF', hex2: null, images: [] },
    ],
    sizes: [
      { name: 'S', sortOrder: 0, priceAdjustment: 0 },
      { name: 'M', sortOrder: 1, priceAdjustment: 0 },
      { name: 'XL', sortOrder: 3, priceAdjustment: 2 },
    ],
    pricing: { piecePrice: 4.5, dozenPrice: 3.8, casePrice: null, caseQty: null },
    gtin: null,
    supplier: 'ss-activewear',
    lastSynced: new Date('2026-02-19'),
    ...overrides,
  }
}
