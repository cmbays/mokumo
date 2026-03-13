import { customers, contacts, customerNotes, quotes, jobs, invoices, artworks } from './data'
import { validateUUID } from '@infra/repositories/_shared/validation'
import type { Customer } from '@domain/entities/customer'
import type { Contact } from '@domain/entities/contact'
import type { Note } from '@domain/entities/note'
import type { Quote } from '@domain/entities/quote'
import type { Job } from '@domain/entities/job'
import type { Invoice } from '@domain/entities/invoice'
import type { Artwork } from '@domain/entities/artwork'
import type {
  CustomerFilters,
  CustomerListResult,
  CustomerListStats,
  CustomerDefaults,
  SortDirection,
  CustomerSortField,
} from '@domain/ports/customer.repository'
import type {
  ContactInput,
  ContactRow,
  AddressInput,
  AddressRow,
} from '@domain/ports/customer-contact.port'
import type { ContactId, AddressId } from '@domain/lib/branded'

export async function getCustomers(): Promise<Customer[]> {
  return customers.map((c) => structuredClone(c))
}

export async function getCustomerById(id: string): Promise<Customer | null> {
  if (!validateUUID(id)) return null
  const customer = customers.find((c) => c.id === id)
  return customer ? structuredClone(customer) : null
}

export async function getCustomerQuotes(customerId: string): Promise<Quote[]> {
  if (!validateUUID(customerId)) return []
  return quotes.filter((q) => q.customerId === customerId).map((q) => structuredClone(q))
}

export async function getCustomerJobs(customerId: string): Promise<Job[]> {
  if (!validateUUID(customerId)) return []
  return jobs.filter((j) => j.customerId === customerId).map((j) => structuredClone(j))
}

export async function getCustomerContacts(customerId: string): Promise<Contact[]> {
  if (!validateUUID(customerId)) return []
  const customer = customers.find((cust) => cust.id === customerId)
  if (!customer) return []
  return contacts
    .filter((c) => customer.contacts.some((ec) => ec.id === c.id))
    .map((c) => structuredClone(c))
}

export async function getCustomerNotes(customerId: string): Promise<Note[]> {
  if (!validateUUID(customerId)) return []
  return customerNotes
    .filter((n) => n.entityType === 'customer' && n.entityId === customerId)
    .map((n) => structuredClone(n))
}

export async function getCustomerArtworks(customerId: string): Promise<Artwork[]> {
  if (!validateUUID(customerId)) return []
  return artworks.filter((a) => a.customerId === customerId).map((a) => structuredClone(a))
}

export async function getCustomerInvoices(customerId: string): Promise<Invoice[]> {
  if (!validateUUID(customerId)) return []
  return invoices.filter((inv) => inv.customerId === customerId).map((inv) => structuredClone(inv))
}

/** Phase 1 only: returns raw mutable arrays for in-place mock data mutations. */
export function getCustomersMutable(): Customer[] {
  return customers
}

// ── Wave 0 port stubs — Phase 1 mock provider does not implement these ────────
// These satisfy ICustomerRepository at compile-time; Supabase implements them in Wave 1.

export async function listCustomers(
  _shopId: string,
  _filters: CustomerFilters,
  _sort: { field: CustomerSortField; direction: SortDirection },
  _page: { offset: number; limit: number }
): Promise<CustomerListResult> {
  return { items: customers.map((c) => structuredClone(c)), total: customers.length }
}

export async function getListStats(_shopId: string): Promise<CustomerListStats> {
  return { total: customers.length, activeCount: customers.length, atRiskCount: 0, newThisMonth: 0 }
}

export async function searchCustomers(
  _shopId: string,
  query: string
): Promise<Pick<Customer, 'id' | 'company'>[]> {
  const q = query.toLowerCase()
  return customers
    .filter((c) => c.company.toLowerCase().includes(q))
    .map(({ id, company }) => ({ id, company }))
}

export async function getCustomerDefaults(_customerId: string): Promise<CustomerDefaults> {
  return {
    primaryShippingAddress: null,
    primaryBillingAddress: null,
    paymentTerms: 'net-30',
    pricingTier: 'standard',
    discountPct: 0,
    taxExempt: false,
  }
}

export async function createCustomer(
  _shopId: string,
  _input: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>
): Promise<Customer> {
  throw new Error('createCustomer: not implemented in mock provider')
}

export async function updateCustomer(
  _id: string,
  _input: Partial<Omit<Customer, 'id' | 'shopId' | 'createdAt'>>
): Promise<Customer> {
  throw new Error('updateCustomer: not implemented in mock provider')
}

export async function archiveCustomer(_id: string): Promise<void> {
  throw new Error('archiveCustomer: not implemented in mock provider')
}

export async function getAccountBalance(_customerId: string): Promise<number> {
  return 0
}

export async function getPreferences(_customerId: string): Promise<unknown> {
  return {}
}

// ── Wave 1a stubs — Contact / Address mutations ───────────────────────────────

export async function createContact(_input: ContactInput): Promise<ContactRow> {
  throw new Error('createContact: not implemented in mock provider')
}

export async function updateContact(
  _id: ContactId,
  _input: Partial<ContactInput>
): Promise<ContactRow> {
  throw new Error('updateContact: not implemented in mock provider')
}

export async function deleteContact(_id: ContactId): Promise<void> {
  throw new Error('deleteContact: not implemented in mock provider')
}

export async function createAddress(_input: AddressInput): Promise<AddressRow> {
  throw new Error('createAddress: not implemented in mock provider')
}

export async function updateAddress(
  _id: AddressId,
  _input: Partial<AddressInput>
): Promise<AddressRow> {
  throw new Error('updateAddress: not implemented in mock provider')
}

export async function deleteAddress(_id: AddressId): Promise<void> {
  throw new Error('deleteAddress: not implemented in mock provider')
}
