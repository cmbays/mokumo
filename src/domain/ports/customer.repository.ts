import type { Customer, PaymentTerms, PricingTier } from '@domain/entities/customer'
import type { Contact } from '@domain/entities/contact'
import type { Note } from '@domain/entities/note'
import type { Quote } from '@domain/entities/quote'
import type { Job } from '@domain/entities/job'
import type { Invoice } from '@domain/entities/invoice'
import type { Artwork } from '@domain/entities/artwork'
import type { Address } from '@domain/entities/address'
import type { ContactInput, ContactRow, AddressInput, AddressRow } from './customer-contact.port'
import type { ContactId, AddressId } from '@domain/lib/branded'

// ─── Filter / Sort / Pagination types ─────────────────────────────────────────

export type CustomerSortField = 'company' | 'createdAt' | 'updatedAt' | 'lifecycleStage'
export type SortDirection = 'asc' | 'desc'

export type CustomerFilters = {
  search?: string
  lifecycleStage?: string[]
  healthStatus?: string[]
  typeTags?: string[]
  isArchived?: boolean
}

export type CustomerListResult = {
  items: Customer[]
  total: number
}

export type CustomerListStats = {
  total: number
  activeCount: number
  atRiskCount: number
  newThisMonth: number
}

export type CustomerDefaults = {
  primaryShippingAddress: Address | null
  primaryBillingAddress: Address | null
  paymentTerms: PaymentTerms | null
  pricingTier: PricingTier | null
  discountPct: number
  taxExempt: boolean
}

// ─── Port interface ────────────────────────────────────────────────────────────

export type ICustomerRepository = {
  // ── Legacy methods (Phase 1 mock compatibility) ──
  getAll(): Promise<Customer[]>
  getById(id: string): Promise<Customer | null>
  getQuotes(customerId: string): Promise<Quote[]>
  getJobs(customerId: string): Promise<Job[]>
  getContacts(customerId: string): Promise<Contact[]>
  getNotes(customerId: string): Promise<Note[]>
  getArtworks(customerId: string): Promise<Artwork[]>
  getInvoices(customerId: string): Promise<Invoice[]>

  // ── Wave 0 additions ──

  /** Paginated list for the /customers page with filters and sort */
  listCustomers(
    shopId: string,
    filters: CustomerFilters,
    sort: { field: CustomerSortField; direction: SortDirection },
    page: { offset: number; limit: number }
  ): Promise<CustomerListResult>

  /** Aggregate stats for the list page header strip */
  getListStats(shopId: string): Promise<CustomerListStats>

  /** Combobox search — lightweight, returns name + id only */
  searchCustomers(shopId: string, query: string): Promise<Pick<Customer, 'id' | 'company'>[]>

  /** Load customer defaults for quote/invoice auto-fill */
  getCustomerDefaults(customerId: string): Promise<CustomerDefaults>

  /** Create a new customer record */
  createCustomer(
    shopId: string,
    input: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<Customer>

  /** Update mutable fields on a customer */
  updateCustomer(
    id: string,
    input: Partial<Omit<Customer, 'id' | 'shopId' | 'createdAt'>>
  ): Promise<Customer>

  /** Soft-delete — sets isArchived = true */
  archiveCustomer(id: string): Promise<void>

  /** Current outstanding balance (sum of unpaid invoice balanceDue) */
  getAccountBalance(customerId: string): Promise<number>

  /** All garment/color preferences for the Preferences tab */
  getPreferences(customerId: string): Promise<unknown> // typed in Wave 2 when preferences schema is stable

  // ── Wave 1a — Contact mutations ──

  /** Create a new contact linked to the given customer */
  createContact(input: ContactInput): Promise<ContactRow>

  /** Update mutable fields on an existing contact */
  updateContact(id: ContactId, input: Partial<ContactInput>): Promise<ContactRow>

  /** Permanently delete a contact */
  deleteContact(id: ContactId): Promise<void>

  // ── Wave 1a — Address mutations ──

  /** Create a new address linked to the given customer */
  createAddress(input: AddressInput): Promise<AddressRow>

  /** Update mutable fields on an existing address */
  updateAddress(id: AddressId, input: Partial<AddressInput>): Promise<AddressRow>

  /** Permanently delete an address */
  deleteAddress(id: AddressId): Promise<void>
}
