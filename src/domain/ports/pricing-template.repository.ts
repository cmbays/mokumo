import type {
  PricingTemplate,
  PricingTemplateWithMatrix,
  PricingTemplateInsert,
  PrintCostMatrixCellInsert,
  GarmentMarkupRule,
  GarmentMarkupRuleInsert,
  RushTier,
  RushTierInsert,
} from '@domain/entities/pricing-template'

export type { PricingTemplate, PricingTemplateWithMatrix }

// ─── Port interface ────────────────────────────────────────────────────────────

export type IPricingTemplateRepository = {
  /** Returns the default template for a shop + service type, including all matrix cells. */
  getDefaultTemplate(
    shopId: string,
    serviceType: string
  ): Promise<PricingTemplateWithMatrix | null>

  /** Returns a specific template by ID, including all matrix cells. */
  getTemplateById(id: string): Promise<PricingTemplateWithMatrix | null>

  /** Lists all template headers (no cells) for a shop — used on the pricing editor list screen. */
  listTemplates(shopId: string): Promise<PricingTemplate[]>

  /** Creates or updates a pricing template. Pass id to update; omit id to create. */
  upsertTemplate(data: PricingTemplateInsert): Promise<PricingTemplate>

  /**
   * Replaces all matrix cells for a template in a single transaction.
   * Deletes existing cells then inserts the new set — call with the complete desired state.
   */
  upsertMatrixCells(templateId: string, cells: PrintCostMatrixCellInsert[]): Promise<void>

  /** Returns all garment markup rules for a shop. */
  getMarkupRules(shopId: string): Promise<GarmentMarkupRule[]>

  /** Replaces markup rules for a shop. Deletes existing, inserts new set. */
  upsertMarkupRules(shopId: string, rules: GarmentMarkupRuleInsert[]): Promise<void>

  /** Returns all rush tiers for a shop, ordered by display_order. */
  getRushTiers(shopId: string): Promise<RushTier[]>

  /** Replaces rush tiers for a shop. Deletes existing, inserts new set. */
  upsertRushTiers(shopId: string, tiers: RushTierInsert[]): Promise<void>
}
