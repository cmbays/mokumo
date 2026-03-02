'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { verifySession } from '@infra/auth/session'
import { logger } from '@shared/lib/logger'
import { ok, err } from '@infra/repositories/_shared/result'
import type { Result } from '@infra/repositories/_shared/result'
import {
  createContact as repoCreateContact,
  updateContact as repoUpdateContact,
  deleteContact as repoDeleteContact,
} from '@infra/repositories/customers'
import { contactInputSchema, contactRowSchema } from '@domain/ports/customer-contact.port'
import type { ContactRow } from '@domain/ports/customer-contact.port'

const log = logger.child({ domain: 'customers' })

// ─── Error type ────────────────────────────────────────────────────────────────

export type ContactError = 'UNAUTHORIZED' | 'VALIDATION' | 'NOT_FOUND' | 'UNKNOWN'

// ─── Re-export ContactRow as ContactData for action consumers ─────────────────

export type { ContactRow as ContactData }

// ─── Input schemas ────────────────────────────────────────────────────────────

const createContactInputSchema = contactInputSchema

export type CreateContactInput = z.infer<typeof createContactInputSchema>

const updateContactInputSchema = createContactInputSchema.omit({ customerId: true }).partial()

export type UpdateContactInput = z.infer<typeof updateContactInputSchema>

// ─── createContact ─────────────────────────────────────────────────────────────

/**
 * Create a new contact linked to the given customer.
 */
export async function createContact(
  rawInput: CreateContactInput
): Promise<Result<ContactRow, ContactError>> {
  const session = await verifySession()
  if (!session) {
    log.warn('createContact: unauthorized')
    return err('UNAUTHORIZED')
  }

  const parsed = createContactInputSchema.safeParse(rawInput)
  if (!parsed.success) {
    log.warn('createContact: validation failed', { errors: parsed.error.flatten() })
    return err('VALIDATION')
  }

  try {
    const row = await repoCreateContact(parsed.data)
    log.info('Contact created', { id: row.id, customerId: parsed.data.customerId })
    revalidatePath(`/customers/${parsed.data.customerId}`)
    return ok(row)
  } catch (e) {
    log.error('createContact: repository error', { err: e })
    return err('UNKNOWN')
  }
}

// ─── updateContact ─────────────────────────────────────────────────────────────

/**
 * Update mutable fields on an existing contact.
 */
export async function updateContact(
  id: string,
  customerId: string,
  rawInput: UpdateContactInput
): Promise<Result<ContactRow, ContactError>> {
  const session = await verifySession()
  if (!session) {
    log.warn('updateContact: unauthorized')
    return err('UNAUTHORIZED')
  }

  const idParsed = z.string().uuid().safeParse(id)
  const customerIdParsed = z.string().uuid().safeParse(customerId)
  if (!idParsed.success || !customerIdParsed.success) {
    log.warn('updateContact: invalid id', { id, customerId })
    return err('VALIDATION')
  }

  const parsed = updateContactInputSchema.safeParse(rawInput)
  if (!parsed.success) {
    log.warn('updateContact: validation failed', { id, errors: parsed.error.flatten() })
    return err('VALIDATION')
  }

  try {
    const row = await repoUpdateContact(id, parsed.data)
    log.info('Contact updated', { id, customerId })
    revalidatePath(`/customers/${customerId}`)
    return ok(row)
  } catch (e) {
    log.error('updateContact: repository error', { id, err: e })
    return err('UNKNOWN')
  }
}

// ─── deleteContact ─────────────────────────────────────────────────────────────

/**
 * Permanently delete a contact.
 * Note: "delete" here is a hard delete. Contacts are not archived — they are removed.
 */
export async function deleteContact(
  id: string,
  customerId: string
): Promise<Result<void, ContactError>> {
  const session = await verifySession()
  if (!session) {
    log.warn('deleteContact: unauthorized')
    return err('UNAUTHORIZED')
  }

  const idParsed = z.string().uuid().safeParse(id)
  const customerIdParsed = z.string().uuid().safeParse(customerId)
  if (!idParsed.success || !customerIdParsed.success) {
    log.warn('deleteContact: invalid id', { id, customerId })
    return err('VALIDATION')
  }

  try {
    await repoDeleteContact(id)
    log.info('Contact deleted', { id, customerId })
    revalidatePath(`/customers/${customerId}`)
    return ok(undefined)
  } catch (e) {
    log.error('deleteContact: repository error', { id, err: e })
    return err('UNKNOWN')
  }
}

// Satisfy the import — contactRowSchema used for type derivation only.
void contactRowSchema
