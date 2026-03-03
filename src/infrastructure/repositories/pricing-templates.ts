import 'server-only'

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
import { SupabasePricingTemplateRepository } from './pricing/supabase-pricing-template.repository'

const repo = new SupabasePricingTemplateRepository()

export async function getDefaultTemplate(
  shopId: string,
  serviceType: string
): Promise<PricingTemplateWithMatrix | null> {
  return repo.getDefaultTemplate(shopId, serviceType)
}

export async function getTemplateById(id: string): Promise<PricingTemplateWithMatrix | null> {
  return repo.getTemplateById(id)
}

export async function listTemplates(
  shopId: string,
  serviceType?: string
): Promise<PricingTemplate[]> {
  return repo.listTemplates(shopId, serviceType)
}

export async function upsertTemplate(data: PricingTemplateInsert): Promise<PricingTemplate> {
  return repo.upsertTemplate(data)
}

export async function upsertMatrixCells(
  templateId: string,
  cells: PrintCostMatrixCellInsert[]
): Promise<void> {
  return repo.upsertMatrixCells(templateId, cells)
}

export async function getMarkupRules(shopId: string): Promise<GarmentMarkupRule[]> {
  return repo.getMarkupRules(shopId)
}

export async function upsertMarkupRules(
  shopId: string,
  rules: GarmentMarkupRuleInsert[]
): Promise<void> {
  return repo.upsertMarkupRules(shopId, rules)
}

export async function getRushTiers(shopId: string): Promise<RushTier[]> {
  return repo.getRushTiers(shopId)
}

export async function upsertRushTiers(shopId: string, tiers: RushTierInsert[]): Promise<void> {
  return repo.upsertRushTiers(shopId, tiers)
}

export async function deleteTemplate(id: string, shopId: string): Promise<void> {
  return repo.deleteTemplate(id, shopId)
}

export async function setDefaultTemplate(
  shopId: string,
  id: string,
  serviceType: string
): Promise<void> {
  return repo.setDefaultTemplate(shopId, id, serviceType)
}
