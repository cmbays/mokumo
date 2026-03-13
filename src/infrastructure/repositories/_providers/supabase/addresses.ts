import 'server-only'
import { eq } from 'drizzle-orm'
import { db } from '@shared/lib/supabase/db'
import { addresses as addressesTable } from '@db/schema/customers'
import { addressSchema } from '@domain/entities/address'
import { addressRowSchema } from '@domain/ports/customer-contact.port'
import { logger } from '@shared/lib/logger'
import { validateUUID } from '@infra/repositories/_shared/validation'
import type { AddressInput, AddressRow } from '@domain/ports/customer-contact.port'
import type { Address } from '@domain/entities/address'

const repoLogger = logger.child({ domain: 'supabase-addresses' })

function assertValidUUID(id: string, context: string): void {
  if (!validateUUID(id)) {
    throw new Error(`${context}: invalid UUID "${id}"`)
  }
}

// ─── Row mappers ────────────────────────────────────────────────────────────────

/**
 * Map a raw addresses table row to the Address domain entity.
 */
export function mapAddressRow(row: typeof addressesTable.$inferSelect): Address {
  return addressSchema.parse({
    id: row.id,
    label: row.label,
    type: row.type,
    street1: row.street1,
    street2: row.street2 ?? undefined,
    city: row.city,
    state: row.state,
    zip: row.zip,
    country: row.country,
    attentionTo: row.attentionTo ?? undefined,
    isPrimaryBilling: row.isPrimaryBilling,
    isPrimaryShipping: row.isPrimaryShipping,
  })
}

/**
 * Map a raw addresses row to AddressRow (the mutation return type).
 * Runs addressRowSchema.parse() to catch any DB schema drift at runtime.
 */
function mapToAddressRow(row: typeof addressesTable.$inferSelect): AddressRow {
  return addressRowSchema.parse({
    id: row.id,
    customerId: row.customerId,
    label: row.label,
    type: row.type,
    street1: row.street1,
    street2: row.street2 ?? null,
    city: row.city,
    state: row.state,
    zip: row.zip,
    country: row.country,
    attentionTo: row.attentionTo ?? null,
    isPrimaryBilling: row.isPrimaryBilling,
    isPrimaryShipping: row.isPrimaryShipping,
    createdAt: row.createdAt.toISOString(),
  })
}

// ─── Address mutations ──────────────────────────────────────────────────────────

export async function createAddress(input: AddressInput): Promise<AddressRow> {
  assertValidUUID(input.customerId, 'createAddress')

  try {
    const inserted = await db
      .insert(addressesTable)
      .values({
        customerId: input.customerId,
        label: input.label,
        type: input.type,
        street1: input.street1,
        street2: input.street2 ?? null,
        city: input.city,
        state: input.state,
        zip: input.zip,
        country: input.country,
        attentionTo: input.attentionTo ?? null,
        isPrimaryBilling: input.isPrimaryBilling,
        isPrimaryShipping: input.isPrimaryShipping,
      })
      .returning()

    const row = inserted[0]
    if (!row) throw new Error('createAddress: insert returned no rows')

    repoLogger.info('Address created', { id: row.id, customerId: input.customerId })
    return mapToAddressRow(row)
  } catch (err) {
    repoLogger.error('createAddress failed', { customerId: input.customerId, err })
    throw err
  }
}

export async function updateAddress(id: string, input: Partial<AddressInput>): Promise<AddressRow> {
  assertValidUUID(id, 'updateAddress')

  const updateFields: Partial<typeof addressesTable.$inferInsert> = {}

  if (input.label !== undefined) updateFields.label = input.label
  if (input.type !== undefined) updateFields.type = input.type
  if (input.street1 !== undefined) updateFields.street1 = input.street1
  if (input.street2 !== undefined) updateFields.street2 = input.street2 ?? null
  if (input.city !== undefined) updateFields.city = input.city
  if (input.state !== undefined) updateFields.state = input.state
  if (input.zip !== undefined) updateFields.zip = input.zip
  if (input.country !== undefined) updateFields.country = input.country
  if (input.attentionTo !== undefined) updateFields.attentionTo = input.attentionTo ?? null
  if (input.isPrimaryBilling !== undefined) updateFields.isPrimaryBilling = input.isPrimaryBilling
  if (input.isPrimaryShipping !== undefined)
    updateFields.isPrimaryShipping = input.isPrimaryShipping

  try {
    const updated = await db
      .update(addressesTable)
      .set(updateFields)
      .where(eq(addressesTable.id, id))
      .returning()

    const row = updated[0]
    if (!row) throw new Error(`updateAddress: no address found for id ${id}`)

    repoLogger.info('Address updated', { id })
    return mapToAddressRow(row)
  } catch (err) {
    repoLogger.error('updateAddress failed', { id, err })
    throw err
  }
}

export async function deleteAddress(id: string): Promise<void> {
  assertValidUUID(id, 'deleteAddress')

  try {
    await db.delete(addressesTable).where(eq(addressesTable.id, id))
    repoLogger.info('Address deleted', { id })
  } catch (err) {
    repoLogger.error('deleteAddress failed', { id, err })
    throw err
  }
}
