import { describe, it, expect } from 'vitest'
import { getStylePricing, getStylesPricing } from '../supplier-pricing'
import { structuredSupplierPricingSchema } from '@domain/entities/supplier-pricing'

describe('mock supplier-pricing provider', () => {
  describe('getStylePricing', () => {
    it('returns pricing for a known style', async () => {
      const result = await getStylePricing('3001', 'ss_activewear')
      expect(result).not.toBeNull()
      expect(result!.styleId).toBe('3001')
      expect(result!.source).toBe('ss_activewear')
    })

    it('returns null for unknown style', async () => {
      const result = await getStylePricing('unknown', 'ss_activewear')
      expect(result).toBeNull()
    })

    it('returns null for unknown source', async () => {
      const result = await getStylePricing('3001', 'unknown_supplier')
      expect(result).toBeNull()
    })

    it('fixture validates against Zod schema', async () => {
      const result = await getStylePricing('3001', 'ss_activewear')
      const validation = structuredSupplierPricingSchema.safeParse(result)
      expect(validation.success).toBe(true)
    })

    it('fixture has multiple price groups', async () => {
      const result = await getStylePricing('3001', 'ss_activewear')
      expect(result!.priceGroups.length).toBeGreaterThanOrEqual(2)
    })

    it('each tier has valid tier names', async () => {
      const result = await getStylePricing('3001', 'ss_activewear')
      for (const pg of result!.priceGroups) {
        for (const tier of pg.tiers) {
          expect(['piece', 'dozen', 'case']).toContain(tier.tierName)
        }
      }
    })

    it('tier prices decrease as quantity increases', async () => {
      const result = await getStylePricing('3001', 'ss_activewear')
      const firstGroup = result!.priceGroups[0]
      const sortedTiers = [...firstGroup.tiers].sort((a, b) => a.minQty - b.minQty)
      for (let i = 1; i < sortedTiers.length; i++) {
        expect(sortedTiers[i].unitPrice).toBeLessThan(sortedTiers[i - 1].unitPrice)
      }
    })
  })

  describe('getStylesPricing', () => {
    it('returns Map with known styles', async () => {
      const result = await getStylesPricing(['3001', '5000'], 'ss_activewear')
      expect(result.size).toBe(2)
      expect(result.has('3001')).toBe(true)
      expect(result.has('5000')).toBe(true)
    })

    it('skips unknown styles', async () => {
      const result = await getStylesPricing(['3001', 'unknown'], 'ss_activewear')
      expect(result.size).toBe(1)
      expect(result.has('3001')).toBe(true)
    })

    it('returns empty Map for empty input', async () => {
      const result = await getStylesPricing([], 'ss_activewear')
      expect(result.size).toBe(0)
    })

    it('all returned values validate against schema', async () => {
      const result = await getStylesPricing(['3001', '5000'], 'ss_activewear')
      for (const pricing of result.values()) {
        const validation = structuredSupplierPricingSchema.safeParse(pricing)
        expect(validation.success).toBe(true)
      }
    })
  })
})
