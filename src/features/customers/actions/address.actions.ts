'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { verifySession } from '@infra/auth/session'
import { logger } from '@shared/lib/logger'
import { ok, err } from '@infra/repositories/_shared/result'
import type { Result } from '@infra/repositories/_shared/result'
import {
  createAddress as repoCreateAddress,
  updateAddress as repoUpdateAddress,
  deleteAddress as repoDeleteAddress,
} from '@infra/repositories/customers'
import { addressInputSchema, addressRowSchema } from '@domain/ports/customer-contact.port'
import type { AddressRow } from '@domain/ports/customer-contact.port'

const log = logger.child({ domain: 'customers' })

// ─── Error type ────────────────────────────────────────────────────────────────

export type AddressError = 'UNAUTHORIZED' | 'VALIDATION' | 'NOT_FOUND' | 'UNKNOWN'

// ─── Re-export AddressRow as AddressData for action consumers ─────────────────

export type { AddressRow as AddressData }

// ─── Input schemas ────────────────────────────────────────────────────────────

const createAddressInputSchema = addressInputSchema

export type CreateAddressInput = z.infer<typeof createAddressInputSchema>

const updateAddressInputSchema = createAddressInputSchema.omit({ customerId: true }).partial()

export type UpdateAddressInput = z.infer<typeof updateAddressInputSchema>

// ─── createAddress ─────────────────────────────────────────────────────────────

/**
 * Create a new address linked to the given customer.
 */
export async function createAddress(
  rawInput: CreateAddressInput
): Promise<Result<AddressRow, AddressError>> {
  const session = await verifySession()
  if (!session) {
    log.warn('createAddress: unauthorized')
    return err('UNAUTHORIZED')
  }

  const parsed = createAddressInputSchema.safeParse(rawInput)
  if (!parsed.success) {
    log.warn('createAddress: validation failed', { errors: parsed.error.flatten() })
    return err('VALIDATION')
  }

  try {
    const row = await repoCreateAddress(parsed.data)
    log.info('Address created', { id: row.id, customerId: parsed.data.customerId })
    revalidatePath(`/customers/${parsed.data.customerId}`)
    return ok(row)
  } catch (e) {
    log.error('createAddress: repository error', { err: e })
    return err('UNKNOWN')
  }
}

// ─── updateAddress ─────────────────────────────────────────────────────────────

/**
 * Update mutable fields on an existing address.
 */
export async function updateAddress(
  id: string,
  customerId: string,
  rawInput: UpdateAddressInput
): Promise<Result<AddressRow, AddressError>> {
  const session = await verifySession()
  if (!session) {
    log.warn('updateAddress: unauthorized')
    return err('UNAUTHORIZED')
  }

  const idParsed = z.string().uuid().safeParse(id)
  const customerIdParsed = z.string().uuid().safeParse(customerId)
  if (!idParsed.success || !customerIdParsed.success) {
    log.warn('updateAddress: invalid id', { id, customerId })
    return err('VALIDATION')
  }

  const parsed = updateAddressInputSchema.safeParse(rawInput)
  if (!parsed.success) {
    log.warn('updateAddress: validation failed', { id, errors: parsed.error.flatten() })
    return err('VALIDATION')
  }

  try {
    const row = await repoUpdateAddress(id, parsed.data)
    log.info('Address updated', { id, customerId })
    revalidatePath(`/customers/${customerId}`)
    return ok(row)
  } catch (e) {
    log.error('updateAddress: repository error', { id, err: e })
    return err('UNKNOWN')
  }
}

// ─── deleteAddress ─────────────────────────────────────────────────────────────

/**
 * Permanently delete an address.
 */
export async function deleteAddress(
  id: string,
  customerId: string
): Promise<Result<void, AddressError>> {
  const session = await verifySession()
  if (!session) {
    log.warn('deleteAddress: unauthorized')
    return err('UNAUTHORIZED')
  }

  const idParsed = z.string().uuid().safeParse(id)
  const customerIdParsed = z.string().uuid().safeParse(customerId)
  if (!idParsed.success || !customerIdParsed.success) {
    log.warn('deleteAddress: invalid id', { id, customerId })
    return err('VALIDATION')
  }

  try {
    await repoDeleteAddress(id)
    log.info('Address deleted', { id, customerId })
    revalidatePath(`/customers/${customerId}`)
    return ok(undefined)
  } catch (e) {
    log.error('deleteAddress: repository error', { id, err: e })
    return err('UNKNOWN')
  }
}

// Satisfy the import — addressRowSchema used for type derivation only.
void addressRowSchema
