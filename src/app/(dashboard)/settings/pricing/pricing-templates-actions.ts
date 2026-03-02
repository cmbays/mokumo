'use server'

import { z } from 'zod'
import { verifySession } from '@infra/auth/session'
import {
  listTemplates,
  getDefaultTemplate,
  getTemplateById,
  upsertTemplate,
  upsertMatrixCells,
  getMarkupRules as fetchMarkupRules,
  upsertMarkupRules,
  getRushTiers as fetchRushTiers,
  upsertRushTiers,
  deleteTemplate,
  setDefaultTemplate,
} from '@infra/repositories/pricing-templates'
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
import { logger } from '@shared/lib/logger'

const log = logger.child({ domain: 'pricing' })

const uuidSchema = z.string().uuid()

// ─── Result type ─────────────────────────────────────────────────────────────

type Ok<T> = { data: T; error: null }
type Err = { data: null; error: string }
type ActionResult<T> = Ok<T> | Err

function ok<T>(data: T): Ok<T> {
  return { data, error: null }
}

function err(message: string): Err {
  return { data: null, error: message }
}

// ─── listPricingTemplates ─────────────────────────────────────────────────────

/**
 * Lists all template headers for the authenticated shop.
 * Optionally filters by serviceType (e.g. 'screen_print', 'dtf').
 */
export async function listPricingTemplates(
  serviceType?: string
): Promise<ActionResult<PricingTemplate[]>> {
  const session = await verifySession()
  if (!session) return err('Unauthorized')

  try {
    const data = await listTemplates(session.shopId, serviceType)
    return ok(data)
  } catch (error) {
    log.error('listPricingTemplates failed', { error })
    return err('Failed to load pricing templates')
  }
}

// ─── getPricingTemplate ───────────────────────────────────────────────────────

/**
 * Returns a single template with all matrix cells by ID.
 */
export async function getPricingTemplate(
  id: string
): Promise<ActionResult<PricingTemplateWithMatrix | null>> {
  if (!uuidSchema.safeParse(id).success) return err('Invalid template ID')

  const session = await verifySession()
  if (!session) return err('Unauthorized')

  try {
    const data = await getTemplateById(id)
    if (data && data.shopId !== session.shopId) return err('Template not found')
    return ok(data)
  } catch (error) {
    log.error('getPricingTemplate failed', { id, error })
    return err('Failed to load pricing template')
  }
}

// ─── createPricingTemplate ────────────────────────────────────────────────────

/**
 * Creates a new pricing template for the authenticated shop.
 * shopId is always taken from the session — never from the caller.
 */
export async function createPricingTemplate(
  data: Omit<PricingTemplateInsert, 'shopId'>
): Promise<ActionResult<PricingTemplate>> {
  const session = await verifySession()
  if (!session) return err('Unauthorized')

  try {
    const template = await upsertTemplate({ ...data, shopId: session.shopId })
    return ok(template)
  } catch (error) {
    log.error('createPricingTemplate failed', { error })
    return err('Failed to create pricing template')
  }
}

// ─── updatePricingTemplate ────────────────────────────────────────────────────

/**
 * Updates an existing pricing template by ID.
 */
export async function updatePricingTemplate(
  id: string,
  data: Omit<PricingTemplateInsert, 'id' | 'shopId'>
): Promise<ActionResult<PricingTemplate>> {
  if (!uuidSchema.safeParse(id).success) return err('Invalid template ID')

  const session = await verifySession()
  if (!session) return err('Unauthorized')

  try {
    const template = await upsertTemplate({ ...data, id, shopId: session.shopId })
    return ok(template)
  } catch (error) {
    log.error('updatePricingTemplate failed', { id, error })
    return err('Failed to update pricing template')
  }
}

// ─── deletePricingTemplate ────────────────────────────────────────────────────

/**
 * Deletes a pricing template. shopId from session ensures shop scope guard.
 */
export async function deletePricingTemplate(id: string): Promise<ActionResult<null>> {
  if (!uuidSchema.safeParse(id).success) return err('Invalid template ID')

  const session = await verifySession()
  if (!session) return err('Unauthorized')

  try {
    await deleteTemplate(id, session.shopId)
    return ok(null)
  } catch (error) {
    log.error('deletePricingTemplate failed', { id, error })
    return err('Failed to delete pricing template')
  }
}

// ─── savePricingMatrix ────────────────────────────────────────────────────────

/**
 * Replaces all matrix cells for a template.
 * Passes the complete desired state — existing cells are deleted and replaced.
 */
export async function savePricingMatrix(
  templateId: string,
  cells: PrintCostMatrixCellInsert[]
): Promise<ActionResult<null>> {
  if (!uuidSchema.safeParse(templateId).success) return err('Invalid template ID')

  const session = await verifySession()
  if (!session) return err('Unauthorized')

  try {
    const template = await getTemplateById(templateId)
    if (!template || template.shopId !== session.shopId) return err('Template not found')
    await upsertMatrixCells(templateId, cells)
    return ok(null)
  } catch (error) {
    log.error('savePricingMatrix failed', { templateId, error })
    return err('Failed to save pricing matrix')
  }
}

// ─── setDefaultPricingTemplate ────────────────────────────────────────────────

/**
 * Marks a template as the default for its service type within the shop.
 * shopId is always taken from the session.
 */
export async function setDefaultPricingTemplate(
  id: string,
  serviceType: string
): Promise<ActionResult<null>> {
  if (!uuidSchema.safeParse(id).success) return err('Invalid template ID')

  const session = await verifySession()
  if (!session) return err('Unauthorized')

  try {
    await setDefaultTemplate(session.shopId, id, serviceType)
    return ok(null)
  } catch (error) {
    log.error('setDefaultPricingTemplate failed', { id, serviceType, error })
    return err('Failed to set default template')
  }
}

// ─── getDefaultPricingTemplate ────────────────────────────────────────────────

/**
 * Returns the default template for a given service type, with all matrix cells.
 * This is the primary read path for the pricing editor — called on first load.
 */
export async function getDefaultPricingTemplate(
  serviceType: string
): Promise<ActionResult<PricingTemplateWithMatrix | null>> {
  if (!serviceType || serviceType.trim().length === 0) return err('Invalid service type')

  const session = await verifySession()
  if (!session) return err('Unauthorized')

  try {
    const data = await getDefaultTemplate(session.shopId, serviceType)
    return ok(data)
  } catch (error) {
    log.error('getDefaultPricingTemplate failed', { serviceType, error })
    return err('Failed to load default pricing template')
  }
}

// ─── getMarkupRules ───────────────────────────────────────────────────────────

/**
 * Returns all garment markup rules for the authenticated shop.
 */
export async function getMarkupRules(): Promise<ActionResult<GarmentMarkupRule[]>> {
  const session = await verifySession()
  if (!session) return err('Unauthorized')

  try {
    const data = await fetchMarkupRules(session.shopId)
    return ok(data)
  } catch (error) {
    log.error('getMarkupRules failed', { error })
    return err('Failed to load markup rules')
  }
}

// ─── saveMarkupRules ──────────────────────────────────────────────────────────

/**
 * Replaces all markup rules for the authenticated shop.
 */
export async function saveMarkupRules(
  rules: GarmentMarkupRuleInsert[]
): Promise<ActionResult<null>> {
  const session = await verifySession()
  if (!session) return err('Unauthorized')

  try {
    await upsertMarkupRules(session.shopId, rules)
    return ok(null)
  } catch (error) {
    log.error('saveMarkupRules failed', { error })
    return err('Failed to save markup rules')
  }
}

// ─── getRushTiers ─────────────────────────────────────────────────────────────

/**
 * Returns all rush tiers for the authenticated shop, ordered by displayOrder.
 */
export async function getRushTiers(): Promise<ActionResult<RushTier[]>> {
  const session = await verifySession()
  if (!session) return err('Unauthorized')

  try {
    const data = await fetchRushTiers(session.shopId)
    return ok(data)
  } catch (error) {
    log.error('getRushTiers failed', { error })
    return err('Failed to load rush tiers')
  }
}

// ─── saveRushTiers ────────────────────────────────────────────────────────────

/**
 * Replaces all rush tiers for the authenticated shop.
 */
export async function saveRushTiers(tiers: RushTierInsert[]): Promise<ActionResult<null>> {
  const session = await verifySession()
  if (!session) return err('Unauthorized')

  try {
    await upsertRushTiers(session.shopId, tiers)
    return ok(null)
  } catch (error) {
    log.error('saveRushTiers failed', { error })
    return err('Failed to save rush tiers')
  }
}
