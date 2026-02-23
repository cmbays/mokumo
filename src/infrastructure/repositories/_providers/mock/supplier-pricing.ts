import type { StructuredSupplierPricing } from '@domain/entities/supplier-pricing'

/**
 * Mock supplier pricing fixtures.
 * Two styles with piece/dozen/case tiers at realistic S&S price points.
 */
const MOCK_PRICING: StructuredSupplierPricing[] = [
  {
    styleId: '3001',
    source: 'ss_activewear',
    productName: 'Bella+Canvas 3001 Unisex Jersey Short Sleeve Tee',
    brandName: 'Bella+Canvas',
    priceGroups: [
      {
        group: { colorPriceGroup: 'White', sizePriceGroup: 'S-XL' },
        tiers: [
          { tierName: 'piece', minQty: 1, maxQty: 11, unitPrice: 2.99 },
          { tierName: 'dozen', minQty: 12, maxQty: 71, unitPrice: 2.49 },
          { tierName: 'case', minQty: 72, maxQty: null, unitPrice: 1.99 },
        ],
      },
      {
        group: { colorPriceGroup: 'Colors', sizePriceGroup: 'S-XL' },
        tiers: [
          { tierName: 'piece', minQty: 1, maxQty: 11, unitPrice: 3.49 },
          { tierName: 'dozen', minQty: 12, maxQty: 71, unitPrice: 2.99 },
          { tierName: 'case', minQty: 72, maxQty: null, unitPrice: 2.49 },
        ],
      },
      {
        group: { colorPriceGroup: 'White', sizePriceGroup: '2XL' },
        tiers: [
          { tierName: 'piece', minQty: 1, maxQty: 11, unitPrice: 3.99 },
          { tierName: 'dozen', minQty: 12, maxQty: 71, unitPrice: 3.49 },
          { tierName: 'case', minQty: 72, maxQty: null, unitPrice: 2.99 },
        ],
      },
    ],
  },
  {
    styleId: '5000',
    source: 'ss_activewear',
    productName: 'Gildan 5000 Heavy Cotton Tee',
    brandName: 'Gildan',
    priceGroups: [
      {
        group: { colorPriceGroup: 'White', sizePriceGroup: 'S-XL' },
        tiers: [
          { tierName: 'piece', minQty: 1, maxQty: 11, unitPrice: 2.29 },
          { tierName: 'dozen', minQty: 12, maxQty: 143, unitPrice: 1.89 },
          { tierName: 'case', minQty: 144, maxQty: null, unitPrice: 1.49 },
        ],
      },
    ],
  },
]

export async function getStylePricing(
  styleId: string,
  source: string
): Promise<StructuredSupplierPricing | null> {
  return MOCK_PRICING.find((p) => p.styleId === styleId && p.source === source) ?? null
}

export async function getStylesPricing(
  styleIds: string[],
  source: string
): Promise<Map<string, StructuredSupplierPricing>> {
  const result = new Map<string, StructuredSupplierPricing>()
  for (const id of styleIds) {
    const pricing = MOCK_PRICING.find((p) => p.styleId === id && p.source === source)
    if (pricing) result.set(id, pricing)
  }
  return result
}
