import 'server-only'
import { eq } from 'drizzle-orm'
import { db } from '@shared/lib/supabase/db'
import { contacts as contactsTable } from '@db/schema/customers'
import { contactSchema } from '@domain/entities/contact'
import { contactRowSchema } from '@domain/ports/customer-contact.port'
import { logger } from '@shared/lib/logger'
import { validateUUID } from '@infra/repositories/_shared/validation'
import type { ContactInput, ContactRow } from '@domain/ports/customer-contact.port'
import type { Contact } from '@domain/entities/contact'

const repoLogger = logger.child({ domain: 'supabase-contacts' })

function assertValidUUID(id: string, context: string): void {
  if (!validateUUID(id)) {
    throw new Error(`${context}: invalid UUID "${id}"`)
  }
}

// ─── Row mappers ────────────────────────────────────────────────────────────────

/**
 * Map a raw contacts table row to the Contact domain entity.
 * The DB stores firstName + lastName separately; the domain entity uses a single `name`.
 */
export function mapContactRow(row: typeof contactsTable.$inferSelect): Contact {
  return contactSchema.parse({
    id: row.id,
    name: [row.firstName, row.lastName].filter(Boolean).join(' '),
    email: row.email ?? undefined,
    phone: row.phone ?? undefined,
    role: row.role,
    isPrimary: row.isPrimary,
    notes: undefined,
    groupId: undefined,
  })
}

/**
 * Map a raw contacts row to ContactRow (the mutation return type).
 * Runs contactRowSchema.parse() to catch any DB schema drift at runtime.
 */
function mapToContactRow(row: typeof contactsTable.$inferSelect): ContactRow {
  return contactRowSchema.parse({
    id: row.id,
    customerId: row.customerId,
    firstName: row.firstName,
    lastName: row.lastName,
    email: row.email ?? null,
    phone: row.phone ?? null,
    title: row.title ?? null,
    role: row.role,
    isPrimary: row.isPrimary,
    portalAccess: row.portalAccess,
    canApproveProofs: row.canApproveProofs,
    canPlaceOrders: row.canPlaceOrders,
    createdAt: row.createdAt.toISOString(),
  })
}

// ─── Contact mutations ──────────────────────────────────────────────────────────

export async function createContact(input: ContactInput): Promise<ContactRow> {
  assertValidUUID(input.customerId, 'createContact')

  try {
    const inserted = await db
      .insert(contactsTable)
      .values({
        customerId: input.customerId,
        firstName: input.firstName,
        lastName: input.lastName,
        email: input.email && input.email.length > 0 ? input.email : null,
        phone: input.phone ?? null,
        title: input.title ?? null,
        role: input.role,
        isPrimary: input.isPrimary,
        portalAccess: input.portalAccess,
        canApproveProofs: input.canApproveProofs,
        canPlaceOrders: input.canPlaceOrders,
      })
      .returning()

    const row = inserted[0]
    if (!row) throw new Error('createContact: insert returned no rows')

    repoLogger.info('Contact created', { id: row.id, customerId: input.customerId })
    return mapToContactRow(row)
  } catch (err) {
    repoLogger.error('createContact failed', { customerId: input.customerId, err })
    throw err
  }
}

export async function updateContact(id: string, input: Partial<ContactInput>): Promise<ContactRow> {
  assertValidUUID(id, 'updateContact')

  const updateFields: Partial<typeof contactsTable.$inferInsert> = {}

  if (input.firstName !== undefined) updateFields.firstName = input.firstName
  if (input.lastName !== undefined) updateFields.lastName = input.lastName
  if (input.email !== undefined)
    updateFields.email = input.email && input.email.length > 0 ? input.email : null
  if (input.phone !== undefined) updateFields.phone = input.phone ?? null
  if (input.title !== undefined) updateFields.title = input.title ?? null
  if (input.role !== undefined) updateFields.role = input.role
  if (input.isPrimary !== undefined) updateFields.isPrimary = input.isPrimary
  if (input.portalAccess !== undefined) updateFields.portalAccess = input.portalAccess
  if (input.canApproveProofs !== undefined) updateFields.canApproveProofs = input.canApproveProofs
  if (input.canPlaceOrders !== undefined) updateFields.canPlaceOrders = input.canPlaceOrders
  updateFields.updatedAt = new Date()

  try {
    const updated = await db
      .update(contactsTable)
      .set(updateFields)
      .where(eq(contactsTable.id, id))
      .returning()

    const row = updated[0]
    if (!row) throw new Error(`updateContact: no contact found for id ${id}`)

    repoLogger.info('Contact updated', { id })
    return mapToContactRow(row)
  } catch (err) {
    repoLogger.error('updateContact failed', { id, err })
    throw err
  }
}

export async function deleteContact(id: string): Promise<void> {
  assertValidUUID(id, 'deleteContact')

  try {
    await db.delete(contactsTable).where(eq(contactsTable.id, id))
    repoLogger.info('Contact deleted', { id })
  } catch (err) {
    repoLogger.error('deleteContact failed', { id, err })
    throw err
  }
}
