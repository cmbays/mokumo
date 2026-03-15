import 'server-only'
import { z } from 'zod'
import { eq, and, ilike, inArray, sql, desc, asc } from 'drizzle-orm'
import { db } from '@shared/lib/supabase/db'
import {
  customers as customersTable,
  contacts as contactsTable,
  addresses as addressesTable,
} from '@db/schema/customers'
import { customerSchema, healthStatusEnum } from '@domain/entities/customer'
import type { HealthStatus } from '@domain/entities/customer'
import { logger } from '@shared/lib/logger'
import { validateUUID, assertValidUUID } from '@infra/repositories/_shared/validation'
import { money, toNumber } from '@domain/lib/money'
import type {
  ICustomerRepository,
  CustomerFilters,
  CustomerListResult,
  CustomerListStats,
  CustomerDefaults,
  SortDirection,
  CustomerSortField,
} from '@domain/ports/customer.repository'
import type { Customer } from '@domain/entities/customer'
import type { Contact } from '@domain/entities/contact'
import type { Quote } from '@domain/entities/quote'
import type { Job } from '@domain/entities/job'
import type { Invoice } from '@domain/entities/invoice'
import type { Artwork } from '@domain/entities/artwork'
import type { Note } from '@domain/entities/note'
import { mapContactRow, createContact, updateContact, deleteContact } from './contacts'
import { mapAddressRow, createAddress, updateAddress, deleteAddress } from './addresses'

const repoLogger = logger.child({ domain: 'supabase-customers' })

// DB lifecycle enum values — excludes 'contract' which is a legacy domain-only value.
// Extracted to module scope to avoid repetition in createCustomer / updateCustomer / listCustomers.
type DbLifecycle = 'prospect' | 'new' | 'repeat' | 'vip' | 'at-risk' | 'archived'

// ─── Row mappers ───────────────────────────────────────────────────────────────

/**
 * Map a raw customers table row to the Customer domain entity.
 * The DB schema intentionally omits legacy Phase 1 fields (name, email, phone, address)
 * that are derived from contacts. We supply safe defaults here until Wave 3 removes them.
 */
function mapCustomerRow(
  row: typeof customersTable.$inferSelect,
  contacts: Contact[] = []
): Customer {
  return customerSchema.parse({
    id: row.id,
    company: row.company,
    // Legacy flat fields — not stored in the new schema; derived from contacts in Wave 3.
    // Provide safe defaults so existing UI code doesn't break.
    name: row.company,
    email: 'unknown@placeholder.local',
    phone: '',
    address: '',
    tag: 'new',
    lifecycleStage: row.lifecycleStage,
    healthStatus: row.healthStatus,
    isArchived: row.isArchived,
    typeTags: row.typeTags,
    contacts,
    groups: [],
    billingAddress: undefined,
    shippingAddresses: [],
    // safe: DB enum values are a strict subset of domain enum; Wave 3 will add proper Zod validation
    paymentTerms: (row.paymentTerms as Customer['paymentTerms']) ?? 'net-30',
    pricingTier: (row.pricingTier as Customer['pricingTier']) ?? 'standard',
    // DB stores fraction (0.15 = 15%). Entity field is percentage (15). Use big.js to avoid IEEE 754 drift.
    discountPercentage:
      row.discountPct != null && row.discountPct !== 0
        ? toNumber(money(row.discountPct).times(100))
        : undefined,
    taxExempt: row.taxExempt,
    taxExemptCertExpiry: row.taxExemptCertExpiry
      ? new Date(row.taxExemptCertExpiry).toISOString()
      : undefined,
    // Drizzle returns numeric columns as strings — convert to number.
    creditLimit: row.creditLimit != null ? Number(row.creditLimit) : undefined,
    referredByCustomerId: row.referralByCustomerId ?? undefined,
    favoriteGarments: [],
    favoriteColors: [],
    favoriteBrandNames: [],
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  })
}

// ─── SupabaseCustomerRepository ────────────────────────────────────────────────

/**
 * Full Supabase implementation of ICustomerRepository.
 * All methods validate UUIDs via Zod before issuing queries (DAL ID validation rule).
 * Contact and address mutations are implemented in ./contacts and ./addresses respectively.
 */
export const supabaseCustomerRepository: ICustomerRepository = {
  // ── Legacy methods ──────────────────────────────────────────────────────────

  async getAll(): Promise<Customer[]> {
    try {
      const rows = await db
        .select()
        .from(customersTable)
        .where(eq(customersTable.isArchived, false))
        .orderBy(asc(customersTable.company))

      const customers: Customer[] = []
      for (const row of rows) {
        try {
          customers.push(mapCustomerRow(row))
        } catch (err) {
          repoLogger.warn('mapCustomerRow failed — skipping row', { id: row.id, err })
        }
      }
      repoLogger.info('getAll customers', { count: customers.length })
      return customers
    } catch (err) {
      repoLogger.error('getAll failed', { err })
      throw err
    }
  },

  async getById(id: string): Promise<Customer | null> {
    if (!validateUUID(id)) {
      repoLogger.warn('getById: invalid UUID', { id })
      return null
    }
    try {
      const [rows, contactRows] = await Promise.all([
        db.select().from(customersTable).where(eq(customersTable.id, id)).limit(1),
        db
          .select()
          .from(contactsTable)
          .where(eq(contactsTable.customerId, id))
          .orderBy(desc(contactsTable.isPrimary), asc(contactsTable.firstName)),
      ])
      if (rows.length === 0) return null
      return mapCustomerRow(rows[0], contactRows.map(mapContactRow))
    } catch (err) {
      repoLogger.error('getById failed', { id, err })
      throw err
    }
  },

  async getQuotes(_customerId: string): Promise<Quote[]> {
    // Cross-vertical join deferred to Wave 3 — quotes repo not yet wired to customerId
    return []
  },

  async getJobs(_customerId: string): Promise<Job[]> {
    // Cross-vertical join deferred to Wave 3
    return []
  },

  async getContacts(customerId: string): Promise<Contact[]> {
    if (!validateUUID(customerId)) return []
    try {
      const rows = await db
        .select()
        .from(contactsTable)
        .where(eq(contactsTable.customerId, customerId))
        .orderBy(desc(contactsTable.isPrimary), asc(contactsTable.firstName))

      return rows.map(mapContactRow)
    } catch (err) {
      repoLogger.error('getContacts failed', { customerId, err })
      throw err
    }
  },

  async getNotes(_customerId: string): Promise<Note[]> {
    // Notes are in customer_activities in the new schema — deferred to Wave 1b
    return []
  },

  async getArtworks(_customerId: string): Promise<Artwork[]> {
    // Cross-vertical join deferred to artwork vertical build
    return []
  },

  async getInvoices(_customerId: string): Promise<Invoice[]> {
    // Cross-vertical join deferred to Wave 3
    return []
  },

  // ── Wave 0 port methods ─────────────────────────────────────────────────────

  async listCustomers(
    shopId: string,
    filters: CustomerFilters,
    sort: { field: CustomerSortField; direction: SortDirection },
    page: { offset: number; limit: number }
  ): Promise<CustomerListResult> {
    assertValidUUID(shopId, 'listCustomers')

    const conditions = [eq(customersTable.shopId, shopId)]

    // isArchived filter — default: exclude archived
    if (!filters.isArchived) {
      conditions.push(eq(customersTable.isArchived, false))
    }

    // Search — ilike on company name
    if (filters.search && filters.search.length > 0) {
      conditions.push(ilike(customersTable.company, `%${filters.search}%`))
    }

    // Lifecycle stage filter
    // Note: domain entity has 'contract' for backward compat with quoting code;
    // the DB enum does NOT include 'contract'. Filter it out before querying.
    if (filters.lifecycleStage && filters.lifecycleStage.length > 0) {
      const dbValidValues = ['prospect', 'new', 'repeat', 'vip', 'at-risk', 'archived'] as const
      const parsed = filters.lifecycleStage.filter((s): s is DbLifecycle =>
        (dbValidValues as readonly string[]).includes(s)
      )
      if (parsed.length > 0) {
        conditions.push(inArray(customersTable.lifecycleStage, parsed))
      }
    }

    // Health status filter
    if (filters.healthStatus && filters.healthStatus.length > 0) {
      const parsed = filters.healthStatus
        .map((s) => healthStatusEnum.safeParse(s))
        .filter((r): r is { success: true; data: HealthStatus } => r.success)
        .map((r) => r.data)
      if (parsed.length > 0) {
        conditions.push(inArray(customersTable.healthStatus, parsed))
      }
    }

    // Sort column mapping
    const sortColumn = (() => {
      switch (sort.field) {
        case 'company':
          return customersTable.company
        case 'createdAt':
          return customersTable.createdAt
        case 'updatedAt':
          return customersTable.updatedAt
        case 'lifecycleStage':
          return customersTable.lifecycleStage
        default:
          return customersTable.company
      }
    })()

    const orderExpr = sort.direction === 'asc' ? asc(sortColumn) : desc(sortColumn)

    try {
      const where = and(...conditions)

      // Total count
      const countResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(customersTable)
        .where(where)

      const total = Number(countResult[0]?.count ?? 0)

      // Paginated rows
      const rows = await db
        .select()
        .from(customersTable)
        .where(where)
        .orderBy(orderExpr)
        .limit(page.limit)
        .offset(page.offset)

      const items: Customer[] = []
      for (const row of rows) {
        try {
          items.push(mapCustomerRow(row))
        } catch (err) {
          repoLogger.warn('listCustomers: mapCustomerRow failed — skipping', { id: row.id, err })
        }
      }

      return { items, total }
    } catch (err) {
      repoLogger.error('listCustomers failed', { shopId, err })
      throw err
    }
  },

  async getListStats(shopId: string): Promise<CustomerListStats> {
    assertValidUUID(shopId, 'getListStats')

    try {
      const result = await db
        .select({
          total: sql<number>`count(*)`,
          activeCount: sql<number>`count(*) filter (where health_status = 'active')`,
          atRiskCount: sql<number>`count(*) filter (where health_status = 'potentially-churning' or health_status = 'churned')`,
          newThisMonth: sql<number>`count(*) filter (where created_at >= date_trunc('month', now()))`,
        })
        .from(customersTable)
        .where(and(eq(customersTable.shopId, shopId), eq(customersTable.isArchived, false)))

      const row = result[0]
      return {
        total: Number(row?.total ?? 0),
        activeCount: Number(row?.activeCount ?? 0),
        atRiskCount: Number(row?.atRiskCount ?? 0),
        newThisMonth: Number(row?.newThisMonth ?? 0),
      }
    } catch (err) {
      repoLogger.error('getListStats failed', { shopId, err })
      throw err
    }
  },

  async searchCustomers(
    shopId: string,
    query: string
  ): Promise<Pick<Customer, 'id' | 'company'>[]> {
    assertValidUUID(shopId, 'searchCustomers')

    if (!query || query.trim().length === 0) return []

    try {
      const rows = await db
        .select({ id: customersTable.id, company: customersTable.company })
        .from(customersTable)
        .where(
          and(
            eq(customersTable.shopId, shopId),
            eq(customersTable.isArchived, false),
            ilike(customersTable.company, `%${query.trim()}%`)
          )
        )
        .orderBy(asc(customersTable.company))
        .limit(20)

      return rows
    } catch (err) {
      repoLogger.error('searchCustomers failed', { shopId, err })
      throw err
    }
  },

  async getCustomerDefaults(customerId: string): Promise<CustomerDefaults> {
    assertValidUUID(customerId, 'getCustomerDefaults')

    try {
      const [customerRows, addressRows] = await Promise.all([
        db
          .select({
            paymentTerms: customersTable.paymentTerms,
            pricingTier: customersTable.pricingTier,
            discountPct: customersTable.discountPct,
            taxExempt: customersTable.taxExempt,
          })
          .from(customersTable)
          .where(eq(customersTable.id, customerId))
          .limit(1),
        db
          .select()
          .from(addressesTable)
          .where(eq(addressesTable.customerId, customerId))
          .orderBy(desc(addressesTable.isPrimaryShipping), desc(addressesTable.isPrimaryBilling)),
      ])

      const customer = customerRows[0]
      const mappedAddresses = addressRows.map(mapAddressRow)

      const primaryShippingAddress =
        mappedAddresses.find((a) => a.isPrimaryShipping) ??
        mappedAddresses.find((a) => a.type === 'shipping' || a.type === 'both') ??
        null

      const primaryBillingAddress =
        mappedAddresses.find((a) => a.isPrimaryBilling) ??
        mappedAddresses.find((a) => a.type === 'billing' || a.type === 'both') ??
        null

      return {
        primaryShippingAddress,
        primaryBillingAddress,
        // safe: DB enum values are a strict subset of domain enum; Wave 3 will add proper Zod validation
        paymentTerms: (customer?.paymentTerms as Customer['paymentTerms']) ?? 'net-30',
        pricingTier: (customer?.pricingTier as Customer['pricingTier']) ?? 'standard',
        discountPct:
          customer?.discountPct != null && customer.discountPct !== 0
            ? toNumber(money(customer.discountPct).times(100))
            : 0,
        taxExempt: customer?.taxExempt ?? false,
      }
    } catch (err) {
      repoLogger.error('getCustomerDefaults failed', { customerId, err })
      throw err
    }
  },

  async createCustomer(
    shopId: string,
    input: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<Customer> {
    assertValidUUID(shopId, 'createCustomer')

    try {
      // Map 'contract' (legacy domain value) to 'repeat' in the DB — 'contract' is not a valid DB enum value.
      // This is a temporary shim until Wave 3 removes the legacy 'contract' from the domain enum.
      const dbLifecycle: DbLifecycle =
        input.lifecycleStage === 'contract' ? 'repeat' : (input.lifecycleStage as DbLifecycle)

      const inserted = await db
        .insert(customersTable)
        .values({
          shopId,
          company: input.company,
          lifecycleStage: dbLifecycle,
          healthStatus: input.healthStatus,
          typeTags: input.typeTags,
          paymentTerms: input.paymentTerms,
          pricingTier: input.pricingTier,
          discountPct: input.discountPercentage
            ? toNumber(money(input.discountPercentage).div(100))
            : 0,
          taxExempt: input.taxExempt,
          taxExemptCertExpiry: input.taxExemptCertExpiry
            ? new Date(input.taxExemptCertExpiry).toISOString().split('T')[0]
            : null,
          referralByCustomerId: input.referredByCustomerId ?? null,
          isArchived: input.isArchived,
        })
        .returning()

      const row = inserted[0]
      if (!row) throw new Error('createCustomer: insert returned no rows')

      repoLogger.info('Customer created', { id: row.id, shopId })
      return mapCustomerRow(row)
    } catch (err) {
      repoLogger.error('createCustomer failed', { shopId, err })
      throw err
    }
  },

  async updateCustomer(
    id: string,
    input: Partial<Omit<Customer, 'id' | 'shopId' | 'createdAt'>>
  ): Promise<Customer> {
    assertValidUUID(id, 'updateCustomer')

    const updateFields: Partial<typeof customersTable.$inferInsert> = {}

    if (input.company !== undefined) updateFields.company = input.company
    if (input.lifecycleStage !== undefined) {
      // Map 'contract' (legacy domain value) to 'repeat' — not a valid DB enum value.
      updateFields.lifecycleStage =
        input.lifecycleStage === 'contract' ? 'repeat' : (input.lifecycleStage as DbLifecycle)
    }
    if (input.healthStatus !== undefined) updateFields.healthStatus = input.healthStatus
    if (input.typeTags !== undefined) updateFields.typeTags = input.typeTags
    if (input.paymentTerms !== undefined) updateFields.paymentTerms = input.paymentTerms
    if (input.pricingTier !== undefined) updateFields.pricingTier = input.pricingTier
    if (input.discountPercentage !== undefined)
      updateFields.discountPct = toNumber(money(input.discountPercentage).div(100))
    if (input.taxExempt !== undefined) updateFields.taxExempt = input.taxExempt
    if (input.taxExemptCertExpiry !== undefined)
      updateFields.taxExemptCertExpiry = input.taxExemptCertExpiry
        ? new Date(input.taxExemptCertExpiry).toISOString().split('T')[0]
        : null
    if (input.referredByCustomerId !== undefined)
      updateFields.referralByCustomerId = input.referredByCustomerId ?? null
    if (input.isArchived !== undefined) updateFields.isArchived = input.isArchived

    // Always update updatedAt
    updateFields.updatedAt = new Date()

    try {
      const updated = await db
        .update(customersTable)
        .set(updateFields)
        .where(eq(customersTable.id, id))
        .returning()

      const row = updated[0]
      if (!row) throw new Error(`updateCustomer: no customer found for id ${id}`)

      repoLogger.info('Customer updated', { id })
      return mapCustomerRow(row)
    } catch (err) {
      repoLogger.error('updateCustomer failed', { id, err })
      throw err
    }
  },

  async archiveCustomer(id: string): Promise<void> {
    assertValidUUID(id, 'archiveCustomer')

    try {
      await db
        .update(customersTable)
        .set({ isArchived: true, updatedAt: new Date() })
        .where(eq(customersTable.id, id))

      repoLogger.info('Customer archived', { id })
    } catch (err) {
      repoLogger.error('archiveCustomer failed', { id, err })
      throw err
    }
  },

  async getAccountBalance(customerId: string): Promise<number> {
    assertValidUUID(customerId, 'getAccountBalance')

    // Returns sum of unpaid invoice balance_due. Cross-vertical join deferred to Wave 2a
    // (invoices table not yet wired to customers). Return 0 until then.
    repoLogger.info('getAccountBalance: invoices cross-join deferred to Wave 2a', { customerId })
    return 0
  },

  async getPreferences(_customerId: string): Promise<unknown> {
    // Preferences CRUD deferred to Wave 2b (customer-intelligence)
    return {}
  },

  // ── Contact & address mutations — implemented in sibling modules ─────────────

  createContact,
  updateContact,
  deleteContact,
  createAddress,
  updateAddress,
  deleteAddress,
}
