import 'server-only'

import { z } from 'zod'
import { eq, and, asc, ne } from 'drizzle-orm'
import { db } from '@shared/lib/supabase/db'
import {
  pricingTemplates,
  printCostMatrix,
  garmentMarkupRules,
  rushTiers,
} from '@db/schema/pricing'
import { logger } from '@shared/lib/logger'
import type { IPricingTemplateRepository } from '@domain/ports/pricing-template.repository'
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

const log = logger.child({ domain: 'pricing' })

const uuidSchema = z.string().uuid()

// ─── Helper: validate a UUID input at the DAL boundary ─────────────────────
function isValidUuid(id: string): boolean {
  return uuidSchema.safeParse(id).success
}

// ─── Internal: fetch all cells for a template ─────────────────────────────
async function fetchCells(templateId: string) {
  return db.select().from(printCostMatrix).where(eq(printCostMatrix.templateId, templateId))
}

export class SupabasePricingTemplateRepository implements IPricingTemplateRepository {
  // ─── Templates ────────────────────────────────────────────────────────────

  async getDefaultTemplate(
    shopId: string,
    serviceType: string
  ): Promise<PricingTemplateWithMatrix | null> {
    if (!isValidUuid(shopId)) {
      log.warn('getDefaultTemplate called with invalid shopId', { shopId })
      return null
    }
    try {
      const [template] = await db
        .select()
        .from(pricingTemplates)
        .where(
          and(
            eq(pricingTemplates.shopId, shopId),
            eq(pricingTemplates.serviceType, serviceType),
            eq(pricingTemplates.isDefault, true)
          )
        )
      if (!template) return null
      const cells = await fetchCells(template.id)
      return { ...template, cells }
    } catch (error) {
      log.error('getDefaultTemplate failed', { shopId, serviceType, error })
      throw error
    }
  }

  async getTemplateById(id: string): Promise<PricingTemplateWithMatrix | null> {
    if (!isValidUuid(id)) {
      log.warn('getTemplateById called with invalid id', { id })
      return null
    }
    try {
      const [template] = await db.select().from(pricingTemplates).where(eq(pricingTemplates.id, id))
      if (!template) return null
      const cells = await fetchCells(id)
      return { ...template, cells }
    } catch (error) {
      log.error('getTemplateById failed', { id, error })
      throw error
    }
  }

  async listTemplates(shopId: string, serviceType?: string): Promise<PricingTemplate[]> {
    if (!isValidUuid(shopId)) {
      log.warn('listTemplates called with invalid shopId', { shopId })
      return []
    }
    try {
      const condition = serviceType
        ? and(eq(pricingTemplates.shopId, shopId), eq(pricingTemplates.serviceType, serviceType))
        : eq(pricingTemplates.shopId, shopId)
      return db.select().from(pricingTemplates).where(condition)
    } catch (error) {
      log.error('listTemplates failed', { shopId, serviceType, error })
      throw error
    }
  }

  async upsertTemplate(data: PricingTemplateInsert): Promise<PricingTemplate> {
    if (!isValidUuid(data.shopId)) {
      log.warn('upsertTemplate called with invalid shopId', { shopId: data.shopId })
      throw new Error('upsertTemplate: invalid shopId')
    }
    if (data.id && !isValidUuid(data.id)) {
      log.warn('upsertTemplate called with invalid id', { id: data.id })
      throw new Error('upsertTemplate: invalid id')
    }
    const now = new Date()
    try {
      if (data.id) {
        // Update existing template
        const [row] = await db
          .update(pricingTemplates)
          .set({
            name: data.name,
            serviceType: data.serviceType,
            interpolationMode: data.interpolationMode,
            setupFeePerColor: data.setupFeePerColor,
            sizeUpchargeXxl: data.sizeUpchargeXxl,
            standardTurnaroundDays: data.standardTurnaroundDays,
            isDefault: data.isDefault,
            updatedAt: now,
          })
          .where(and(eq(pricingTemplates.id, data.id), eq(pricingTemplates.shopId, data.shopId)))
          .returning()
        if (!row) throw new Error(`upsertTemplate: no row returned for id=${data.id}`)
        return row
      }
      // Insert new template
      const [row] = await db
        .insert(pricingTemplates)
        .values({ ...data, createdAt: now, updatedAt: now })
        .returning()
      if (!row) throw new Error('upsertTemplate: insert returned no row')
      return row
    } catch (error) {
      log.error('upsertTemplate failed', { data, error })
      throw error
    }
  }

  async upsertMatrixCells(templateId: string, cells: PrintCostMatrixCellInsert[]): Promise<void> {
    if (!isValidUuid(templateId)) {
      log.warn('upsertMatrixCells called with invalid templateId', { templateId })
      return
    }
    try {
      await db.transaction(async (tx) => {
        await tx.delete(printCostMatrix).where(eq(printCostMatrix.templateId, templateId))
        if (cells.length > 0) {
          await tx.insert(printCostMatrix).values(cells.map((c) => ({ ...c, templateId })))
        }
      })
    } catch (error) {
      log.error('upsertMatrixCells failed', { templateId, cellCount: cells.length, error })
      throw error
    }
  }

  // ─── Markup rules ──────────────────────────────────────────────────────────

  async getMarkupRules(shopId: string): Promise<GarmentMarkupRule[]> {
    if (!isValidUuid(shopId)) {
      log.warn('getMarkupRules called with invalid shopId', { shopId })
      return []
    }
    try {
      return db.select().from(garmentMarkupRules).where(eq(garmentMarkupRules.shopId, shopId))
    } catch (error) {
      log.error('getMarkupRules failed', { shopId, error })
      throw error
    }
  }

  async upsertMarkupRules(shopId: string, rules: GarmentMarkupRuleInsert[]): Promise<void> {
    if (!isValidUuid(shopId)) {
      log.warn('upsertMarkupRules called with invalid shopId', { shopId })
      return
    }
    try {
      await db.transaction(async (tx) => {
        await tx.delete(garmentMarkupRules).where(eq(garmentMarkupRules.shopId, shopId))
        if (rules.length > 0) {
          await tx.insert(garmentMarkupRules).values(rules.map((r) => ({ ...r, shopId })))
        }
      })
    } catch (error) {
      log.error('upsertMarkupRules failed', { shopId, ruleCount: rules.length, error })
      throw error
    }
  }

  // ─── Rush tiers ────────────────────────────────────────────────────────────

  async getRushTiers(shopId: string): Promise<RushTier[]> {
    if (!isValidUuid(shopId)) {
      log.warn('getRushTiers called with invalid shopId', { shopId })
      return []
    }
    try {
      return db
        .select()
        .from(rushTiers)
        .where(eq(rushTiers.shopId, shopId))
        .orderBy(asc(rushTiers.displayOrder))
    } catch (error) {
      log.error('getRushTiers failed', { shopId, error })
      throw error
    }
  }

  async upsertRushTiers(shopId: string, tiers: RushTierInsert[]): Promise<void> {
    if (!isValidUuid(shopId)) {
      log.warn('upsertRushTiers called with invalid shopId', { shopId })
      return
    }
    try {
      await db.transaction(async (tx) => {
        await tx.delete(rushTiers).where(eq(rushTiers.shopId, shopId))
        if (tiers.length > 0) {
          await tx.insert(rushTiers).values(tiers.map((t) => ({ ...t, shopId })))
        }
      })
    } catch (error) {
      log.error('upsertRushTiers failed', { shopId, tierCount: tiers.length, error })
      throw error
    }
  }

  // ─── Delete template ────────────────────────────────────────────────────────

  async deleteTemplate(id: string, shopId: string): Promise<void> {
    if (!isValidUuid(id) || !isValidUuid(shopId)) {
      log.warn('deleteTemplate called with invalid id or shopId', { id, shopId })
      return
    }
    try {
      await db
        .delete(pricingTemplates)
        .where(and(eq(pricingTemplates.id, id), eq(pricingTemplates.shopId, shopId)))
    } catch (error) {
      log.error('deleteTemplate failed', { id, shopId, error })
      throw error
    }
  }

  // ─── Set default template ───────────────────────────────────────────────────

  async setDefaultTemplate(shopId: string, id: string, serviceType: string): Promise<void> {
    if (!isValidUuid(shopId) || !isValidUuid(id)) {
      log.warn('setDefaultTemplate called with invalid shopId or id', { shopId, id })
      return
    }
    try {
      await db.transaction(async (tx) => {
        // Clear all existing defaults for this shop + service type
        await tx
          .update(pricingTemplates)
          .set({ isDefault: false })
          .where(
            and(
              eq(pricingTemplates.shopId, shopId),
              eq(pricingTemplates.serviceType, serviceType),
              ne(pricingTemplates.id, id)
            )
          )
        // Set the target template as default — include shopId to prevent cross-tenant mutation
        await tx
          .update(pricingTemplates)
          .set({ isDefault: true })
          .where(and(eq(pricingTemplates.id, id), eq(pricingTemplates.shopId, shopId)))
      })
    } catch (error) {
      log.error('setDefaultTemplate failed', { shopId, id, serviceType, error })
      throw error
    }
  }
}
