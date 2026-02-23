import type { StructuredSupplierPricing } from '@domain/entities/supplier-pricing'

export type ISupplierPricingRepository = {
  getStylePricing(styleId: string, source: string): Promise<StructuredSupplierPricing | null>
  getStylesPricing(
    styleIds: string[],
    source: string
  ): Promise<Map<string, StructuredSupplierPricing>>
}
