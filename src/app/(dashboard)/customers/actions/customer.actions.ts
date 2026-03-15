'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import {
  createCustomer as repoCreateCustomer,
  updateCustomer as repoUpdateCustomer,
  archiveCustomer as repoArchiveCustomer,
} from '@infra/repositories/customers'
import { verifySession } from '@infra/auth/session'
import { logger } from '@shared/lib/logger'
import { ok, err } from '@infra/repositories/_shared/result'
import { DalError } from '@infra/repositories/_shared/errors'
import type { Result } from '@infra/repositories/_shared/result'
import type { Customer } from '@domain/entities/customer'
import { activityEventService } from '@infra/repositories/activity-events'
import { brandId } from '@domain/lib/branded'
import type { ShopId, CustomerId, UserId } from '@domain/lib/branded'

const log = logger.child({ domain: 'customers' })

// ─── Error type ────────────────────────────────────────────────────────────────

export type CustomerError = 'UNAUTHORIZED' | 'VALIDATION' | 'DUPLICATE' | 'NOT_FOUND' | 'UNKNOWN'

// ─── Input schemas ─────────────────────────────────────────────────────────────

const createCustomerInputSchema = z.object({
  company: z.string().min(1, 'Company name is required').max(255),
  lifecycleStage: z
    .enum(['prospect', 'new', 'repeat', 'vip', 'at-risk', 'archived'])
    .default('prospect'),
  healthStatus: z.enum(['active', 'potentially-churning', 'churned']).default('active'),
  typeTags: z
    .array(
      z.enum([
        'retail',
        'sports-school',
        'corporate',
        'storefront-merch',
        'wholesale',
        'hospitality',
        'nonprofit',
        'sports',
        'religious',
      ])
    )
    .default([]),
  paymentTerms: z.enum(['cod', 'upfront', 'net-15', 'net-30', 'net-60']).default('net-30'),
  pricingTier: z.enum(['standard', 'preferred', 'contract', 'wholesale']).default('standard'),
  discountPercentage: z.number().min(0).max(100).optional(),
  taxExempt: z.boolean().default(false),
  taxExemptCertExpiry: z.string().datetime().optional(),
  referredByCustomerId: z.string().uuid().optional(),
  isArchived: z.boolean().default(false),
})

export type CreateCustomerInput = z.infer<typeof createCustomerInputSchema>

const updateCustomerInputSchema = createCustomerInputSchema.partial().omit({ isArchived: true })

export type UpdateCustomerInput = z.infer<typeof updateCustomerInputSchema>

// ─── createCustomer ─────────────────────────────────────────────────────────────

/**
 * Create a new customer record scoped to the authenticated shop.
 * Returns the created Customer on success, or a typed CustomerError on failure.
 */
export async function createCustomer(
  rawInput: CreateCustomerInput
): Promise<Result<Customer, CustomerError>> {
  const session = await verifySession()
  if (!session) {
    log.warn('createCustomer: unauthorized')
    return err('UNAUTHORIZED')
  }

  const parsed = createCustomerInputSchema.safeParse(rawInput)
  if (!parsed.success) {
    log.warn('createCustomer: validation failed', { errors: parsed.error.flatten() })
    return err('VALIDATION')
  }

  const input = parsed.data

  try {
    const customer = await repoCreateCustomer(session.shopId, {
      company: input.company,
      // Legacy convenience fields — populated from company until contacts exist
      name: input.company,
      email: 'unknown@placeholder.local',
      phone: '',
      address: '',
      tag: 'new',
      lifecycleStage: input.lifecycleStage,
      healthStatus: input.healthStatus,
      typeTags: input.typeTags,
      contacts: [],
      groups: [],
      billingAddress: undefined,
      shippingAddresses: [],
      paymentTerms: input.paymentTerms,
      pricingTier: input.pricingTier,
      discountPercentage: input.discountPercentage,
      taxExempt: input.taxExempt,
      taxExemptCertExpiry: input.taxExemptCertExpiry,
      referredByCustomerId: input.referredByCustomerId,
      favoriteGarments: [],
      favoriteColors: [],
      favoriteBrandNames: [],
      isArchived: input.isArchived,
    })

    log.info('Customer created', { id: customer.id, shopId: session.shopId })

    // Record audit event — fire-and-forget (non-critical path)
    activityEventService
      .record({
        shopId: brandId<ShopId>(session.shopId),
        entityType: 'customer',
        entityId: brandId<CustomerId>(customer.id),
        eventType: 'created',
        actorType: 'staff',
        actorId: brandId<UserId>(session.userId),
      })
      .catch((e) => log.warn('Activity event record failed (non-fatal)', { err: e }))

    revalidatePath('/customers')
    return ok(customer)
  } catch (e) {
    log.error('createCustomer: repository error', { err: e })
    return err('UNKNOWN')
  }
}

// ─── updateCustomer ─────────────────────────────────────────────────────────────

/**
 * Update mutable fields on an existing customer.
 * Returns the updated Customer on success, or a typed CustomerError on failure.
 */
export async function updateCustomer(
  id: string,
  rawInput: UpdateCustomerInput
): Promise<Result<Customer, CustomerError>> {
  const session = await verifySession()
  if (!session) {
    log.warn('updateCustomer: unauthorized')
    return err('UNAUTHORIZED')
  }

  const idParsed = z.string().uuid().safeParse(id)
  if (!idParsed.success) {
    log.warn('updateCustomer: invalid id', { id })
    return err('VALIDATION')
  }

  const parsed = updateCustomerInputSchema.safeParse(rawInput)
  if (!parsed.success) {
    log.warn('updateCustomer: validation failed', { id, errors: parsed.error.flatten() })
    return err('VALIDATION')
  }

  try {
    const customer = await repoUpdateCustomer(
      brandId<ShopId>(session.shopId),
      brandId<CustomerId>(id),
      parsed.data
    )
    log.info('Customer updated', { id, shopId: session.shopId })

    // Record audit event — fire-and-forget (non-critical path)
    activityEventService
      .record({
        shopId: brandId<ShopId>(session.shopId),
        entityType: 'customer',
        entityId: brandId<CustomerId>(id),
        eventType: 'updated',
        actorType: 'staff',
        actorId: brandId<UserId>(session.userId),
        metadata: { fields: Object.keys(parsed.data) },
      })
      .catch((e) => log.warn('Activity event record failed (non-fatal)', { err: e }))

    revalidatePath('/customers')
    revalidatePath(`/customers/${id}`)
    return ok(customer)
  } catch (e) {
    if (e instanceof DalError && e.code === 'NOT_FOUND') {
      log.warn('updateCustomer: not found (possible cross-tenant attempt)', {
        id,
        shopId: session.shopId,
      })
      return err('NOT_FOUND')
    }
    log.error('updateCustomer: repository error', { id, err: e })
    return err('UNKNOWN')
  }
}

// ─── archiveCustomer ────────────────────────────────────────────────────────────

/**
 * Soft-delete a customer by setting isArchived = true.
 * Returns void on success, or a typed CustomerError on failure.
 */
export async function archiveCustomer(id: string): Promise<Result<void, CustomerError>> {
  const session = await verifySession()
  if (!session) {
    log.warn('archiveCustomer: unauthorized')
    return err('UNAUTHORIZED')
  }

  const idParsed = z.string().uuid().safeParse(id)
  if (!idParsed.success) {
    log.warn('archiveCustomer: invalid id', { id })
    return err('VALIDATION')
  }

  try {
    await repoArchiveCustomer(brandId<ShopId>(session.shopId), brandId<CustomerId>(id))
    log.info('Customer archived', { id, shopId: session.shopId })

    // Record audit event — fire-and-forget (non-critical path)
    activityEventService
      .record({
        shopId: brandId<ShopId>(session.shopId),
        entityType: 'customer',
        entityId: brandId<CustomerId>(id),
        eventType: 'archived',
        actorType: 'staff',
        actorId: brandId<UserId>(session.userId),
      })
      .catch((e) => log.warn('Activity event record failed (non-fatal)', { err: e }))

    revalidatePath('/customers')
    revalidatePath(`/customers/${id}`)
    return ok(undefined)
  } catch (e) {
    if (e instanceof DalError && e.code === 'NOT_FOUND') {
      log.warn('archiveCustomer: not found (possible cross-tenant attempt)', {
        id,
        shopId: session.shopId,
      })
      return err('NOT_FOUND')
    }
    log.error('archiveCustomer: repository error', { id, err: e })
    return err('UNKNOWN')
  }
}
