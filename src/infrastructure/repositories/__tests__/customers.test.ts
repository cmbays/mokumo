import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { brandId } from '@domain/lib/branded'
import type { ContactId, AddressId } from '@domain/lib/branded'

// Mock server-only module so tests can run in Vitest environment
vi.mock('server-only', () => ({}))

// ── Supabase mode routing — mock the Supabase provider ────────────────────────
// vi.hoisted ensures the repo object is available inside the vi.mock factory,
// which runs at hoist-time (before any imports are evaluated).
const mockSupabaseRepo = vi.hoisted(() => ({
  getAll: vi.fn().mockResolvedValue([]),
  getById: vi.fn().mockResolvedValue(null),
  getQuotes: vi.fn().mockResolvedValue([]),
  getJobs: vi.fn().mockResolvedValue([]),
  getContacts: vi.fn().mockResolvedValue([]),
  getNotes: vi.fn().mockResolvedValue([]),
  getArtworks: vi.fn().mockResolvedValue([]),
  getInvoices: vi.fn().mockResolvedValue([]),
  listCustomers: vi.fn().mockResolvedValue({ items: [], total: 0 }),
  getListStats: vi
    .fn()
    .mockResolvedValue({ total: 0, activeCount: 0, atRiskCount: 0, newThisMonth: 0 }),
  searchCustomers: vi.fn().mockResolvedValue([]),
  getCustomerDefaults: vi
    .fn()
    .mockResolvedValue({ paymentTerms: 'net-30', pricingTier: 'standard', taxExempt: false }),
  createCustomer: vi.fn().mockResolvedValue({}),
  updateCustomer: vi.fn().mockResolvedValue({}),
  archiveCustomer: vi.fn().mockResolvedValue(undefined),
  getAccountBalance: vi.fn().mockResolvedValue(0),
  getPreferences: vi.fn().mockResolvedValue({}),
  createContact: vi.fn().mockResolvedValue({}),
  updateContact: vi.fn().mockResolvedValue({}),
  deleteContact: vi.fn().mockResolvedValue(undefined),
  createAddress: vi.fn().mockResolvedValue({}),
  updateAddress: vi.fn().mockResolvedValue({}),
  deleteAddress: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('../_providers/supabase/customers', () => ({
  supabaseCustomerRepository: mockSupabaseRepo,
}))

import {
  getCustomers,
  getCustomerById,
  getCustomerQuotes,
  getCustomerJobs,
  getCustomerContacts,
  getCustomerNotes,
  getCustomerArtworks,
  getCustomerInvoices,
  listCustomers,
  getListStats,
  searchCustomers,
  getCustomerDefaults,
  createCustomer,
  updateCustomer,
  archiveCustomer,
  getAccountBalance,
  getPreferences,
  createContact,
  updateContact,
  deleteContact,
  createAddress,
  updateAddress,
  deleteAddress,
} from '@infra/repositories/customers'

// Known IDs from mock data
const RIVER_CITY_ID = 'c1a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c'
const NON_EXISTENT_UUID = '00000000-0000-4000-8000-000000000000'

describe('getCustomers()', () => {
  it('returns an array of customers', async () => {
    const customers = await getCustomers()
    expect(Array.isArray(customers)).toBe(true)
    expect(customers.length).toBeGreaterThan(0)
  })

  it('returns copies (not references)', async () => {
    const a = await getCustomers()
    const b = await getCustomers()
    expect(a).not.toBe(b)
    expect(a[0]).not.toBe(b[0])
  })

  it('each customer has required fields', async () => {
    const customers = await getCustomers()
    for (const c of customers) {
      expect(c).toHaveProperty('id')
      expect(c).toHaveProperty('company')
      expect(c).toHaveProperty('name')
      expect(c).toHaveProperty('email')
    }
  })
})

describe('getCustomerById()', () => {
  it('returns customer for valid known ID', async () => {
    const customer = await getCustomerById(RIVER_CITY_ID)
    expect(customer).not.toBeNull()
    expect(customer!.id).toBe(RIVER_CITY_ID)
    expect(customer!.company).toBe('River City Brewing Co.')
  })

  it('returns null for non-existent UUID', async () => {
    const customer = await getCustomerById(NON_EXISTENT_UUID)
    expect(customer).toBeNull()
  })

  it('returns null for invalid UUID format', async () => {
    const customer = await getCustomerById('not-a-uuid')
    expect(customer).toBeNull()
  })

  it('returns null for empty string', async () => {
    const customer = await getCustomerById('')
    expect(customer).toBeNull()
  })

  it('returns a copy (not a reference)', async () => {
    const a = await getCustomerById(RIVER_CITY_ID)
    const b = await getCustomerById(RIVER_CITY_ID)
    expect(a).not.toBe(b)
    expect(a).toEqual(b)
  })

  it('mutations to returned data do not affect source', async () => {
    const customers = await getCustomers()
    const original = customers[0]
    const originalCompany = original.company
    const originalContactsLen = original.contacts.length

    // Mutate top-level and nested properties
    original.company = 'MUTATED'
    original.contacts.push({
      id: 'fake',
      name: 'Fake',
      role: 'test',
      email: '',
      phone: '',
    } as never)

    // Re-fetch — source must be unaffected
    const fresh = await getCustomers()
    expect(fresh[0].company).toBe(originalCompany)
    expect(fresh[0].contacts).toHaveLength(originalContactsLen)
  })
})

describe('getCustomerQuotes()', () => {
  it('returns quotes for a customer with quotes', async () => {
    const quotes = await getCustomerQuotes(RIVER_CITY_ID)
    expect(Array.isArray(quotes)).toBe(true)
    for (const q of quotes) {
      expect(q.customerId).toBe(RIVER_CITY_ID)
    }
  })

  it('returns empty array for non-existent customer', async () => {
    const quotes = await getCustomerQuotes(NON_EXISTENT_UUID)
    expect(quotes).toEqual([])
  })

  it('returns empty array for invalid UUID', async () => {
    const quotes = await getCustomerQuotes('bad-id')
    expect(quotes).toEqual([])
  })
})

describe('getCustomerJobs()', () => {
  it('returns jobs for a customer with jobs', async () => {
    const jobs = await getCustomerJobs(RIVER_CITY_ID)
    expect(Array.isArray(jobs)).toBe(true)
    for (const j of jobs) {
      expect(j.customerId).toBe(RIVER_CITY_ID)
    }
  })

  it('returns empty array for invalid UUID', async () => {
    const jobs = await getCustomerJobs('bad-id')
    expect(jobs).toEqual([])
  })
})

describe('getCustomerContacts()', () => {
  it('returns contacts for a customer with contacts', async () => {
    const contacts = await getCustomerContacts(RIVER_CITY_ID)
    expect(Array.isArray(contacts)).toBe(true)
  })

  it('returns empty array for invalid UUID', async () => {
    const contacts = await getCustomerContacts('bad-id')
    expect(contacts).toEqual([])
  })
})

describe('getCustomerNotes()', () => {
  it('returns notes for a customer with notes', async () => {
    const notes = await getCustomerNotes(RIVER_CITY_ID)
    expect(Array.isArray(notes)).toBe(true)
    for (const n of notes) {
      expect(n.entityType).toBe('customer')
      expect(n.entityId).toBe(RIVER_CITY_ID)
    }
  })

  it('returns empty array for invalid UUID', async () => {
    const notes = await getCustomerNotes('bad-id')
    expect(notes).toEqual([])
  })
})

describe('getCustomerArtworks()', () => {
  it('returns artworks for a customer with artworks', async () => {
    const artworks = await getCustomerArtworks(RIVER_CITY_ID)
    expect(Array.isArray(artworks)).toBe(true)
    for (const a of artworks) {
      expect(a.customerId).toBe(RIVER_CITY_ID)
    }
  })

  it('returns empty array for invalid UUID', async () => {
    const artworks = await getCustomerArtworks('bad-id')
    expect(artworks).toEqual([])
  })
})

describe('getCustomerInvoices()', () => {
  it('returns invoices for a customer with invoices', async () => {
    const invoices = await getCustomerInvoices(RIVER_CITY_ID)
    expect(Array.isArray(invoices)).toBe(true)
    for (const inv of invoices) {
      expect(inv.customerId).toBe(RIVER_CITY_ID)
    }
  })

  it('returns empty array for invalid UUID', async () => {
    const invoices = await getCustomerInvoices('bad-id')
    expect(invoices).toEqual([])
  })
})

// ── Wave 0 port methods ────────────────────────────────────────────────────────

describe('listCustomers()', () => {
  it('returns items array and total', async () => {
    const result = await listCustomers(
      'shop_4ink',
      {},
      { field: 'company', direction: 'asc' },
      { offset: 0, limit: 20 }
    )
    expect(Array.isArray(result.items)).toBe(true)
    expect(typeof result.total).toBe('number')
    expect(result.total).toBeGreaterThan(0)
  })
})

describe('getListStats()', () => {
  it('returns stats object with required fields', async () => {
    const stats = await getListStats('shop_4ink')
    expect(typeof stats.total).toBe('number')
    expect(typeof stats.activeCount).toBe('number')
    expect(typeof stats.atRiskCount).toBe('number')
    expect(typeof stats.newThisMonth).toBe('number')
  })
})

describe('searchCustomers()', () => {
  it('returns matching customers by company name', async () => {
    const results = await searchCustomers('shop_4ink', 'river')
    expect(Array.isArray(results)).toBe(true)
    for (const r of results) {
      expect(r).toHaveProperty('id')
      expect(r).toHaveProperty('company')
    }
  })

  it('returns empty array when no matches', async () => {
    const results = await searchCustomers('shop_4ink', 'zzznomatch')
    expect(results).toEqual([])
  })
})

describe('getCustomerDefaults()', () => {
  it('returns defaults object with required fields', async () => {
    const defaults = await getCustomerDefaults(RIVER_CITY_ID)
    expect(defaults).toHaveProperty('paymentTerms')
    expect(defaults).toHaveProperty('pricingTier')
    expect(defaults).toHaveProperty('taxExempt')
  })
})

describe('getAccountBalance()', () => {
  it('returns balance as a number', async () => {
    const balance = await getAccountBalance(RIVER_CITY_ID)
    expect(typeof balance).toBe('number')
  })
})

describe('getPreferences()', () => {
  it('returns preferences object', async () => {
    const prefs = await getPreferences(RIVER_CITY_ID)
    expect(typeof prefs).toBe('object')
  })
})

// ── Wave 1 mock stubs — mutations throw in mock provider ──────────────────────

describe('createCustomer()', () => {
  it('throws in mock provider', async () => {
    await expect(createCustomer('shop_4ink', {} as never)).rejects.toThrow('not implemented')
  })
})

describe('updateCustomer()', () => {
  it('throws in mock provider', async () => {
    await expect(updateCustomer('shop_4ink', RIVER_CITY_ID, {})).rejects.toThrow('not implemented')
  })
})

describe('archiveCustomer()', () => {
  it('throws in mock provider', async () => {
    await expect(archiveCustomer('shop_4ink', RIVER_CITY_ID)).rejects.toThrow('not implemented')
  })
})

describe('createContact()', () => {
  it('throws in mock provider', async () => {
    await expect(createContact({} as never)).rejects.toThrow('not implemented')
  })
})

describe('updateContact()', () => {
  it('throws in mock provider', async () => {
    await expect(updateContact(brandId<ContactId>('contact-id'), {})).rejects.toThrow(
      'not implemented'
    )
  })
})

describe('deleteContact()', () => {
  it('throws in mock provider', async () => {
    await expect(deleteContact(brandId<ContactId>('contact-id'))).rejects.toThrow('not implemented')
  })
})

describe('createAddress()', () => {
  it('throws in mock provider', async () => {
    await expect(createAddress({} as never)).rejects.toThrow('not implemented')
  })
})

describe('updateAddress()', () => {
  it('throws in mock provider', async () => {
    await expect(updateAddress(brandId<AddressId>('address-id'), {})).rejects.toThrow(
      'not implemented'
    )
  })
})

describe('deleteAddress()', () => {
  it('throws in mock provider', async () => {
    await expect(deleteAddress(brandId<AddressId>('address-id'))).rejects.toThrow('not implemented')
  })
})

// ── Supabase mode routing ──────────────────────────────────────────────────────
// Verify that when DATA_PROVIDER='supabase' each router function delegates to
// supabaseCustomerRepository instead of the mock provider.

describe('Supabase mode routing', () => {
  beforeEach(() => {
    vi.stubEnv('DATA_PROVIDER', 'supabase')
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.clearAllMocks()
  })

  it('getCustomers() → repo.getAll()', async () => {
    await getCustomers()
    expect(mockSupabaseRepo.getAll).toHaveBeenCalledOnce()
  })

  it('getCustomerById() → repo.getById()', async () => {
    await getCustomerById(RIVER_CITY_ID)
    expect(mockSupabaseRepo.getById).toHaveBeenCalledWith(RIVER_CITY_ID)
  })

  it('getCustomerQuotes() → repo.getQuotes()', async () => {
    await getCustomerQuotes(RIVER_CITY_ID)
    expect(mockSupabaseRepo.getQuotes).toHaveBeenCalledWith(RIVER_CITY_ID)
  })

  it('getCustomerJobs() → repo.getJobs()', async () => {
    await getCustomerJobs(RIVER_CITY_ID)
    expect(mockSupabaseRepo.getJobs).toHaveBeenCalledWith(RIVER_CITY_ID)
  })

  it('getCustomerContacts() → repo.getContacts()', async () => {
    await getCustomerContacts(RIVER_CITY_ID)
    expect(mockSupabaseRepo.getContacts).toHaveBeenCalledWith(RIVER_CITY_ID)
  })

  it('getCustomerNotes() → repo.getNotes()', async () => {
    await getCustomerNotes(RIVER_CITY_ID)
    expect(mockSupabaseRepo.getNotes).toHaveBeenCalledWith(RIVER_CITY_ID)
  })

  it('getCustomerArtworks() → repo.getArtworks()', async () => {
    await getCustomerArtworks(RIVER_CITY_ID)
    expect(mockSupabaseRepo.getArtworks).toHaveBeenCalledWith(RIVER_CITY_ID)
  })

  it('getCustomerInvoices() → repo.getInvoices()', async () => {
    await getCustomerInvoices(RIVER_CITY_ID)
    expect(mockSupabaseRepo.getInvoices).toHaveBeenCalledWith(RIVER_CITY_ID)
  })

  it('listCustomers() → repo.listCustomers()', async () => {
    const sort = { field: 'company' as const, direction: 'asc' as const }
    const page = { offset: 0, limit: 20 }
    await listCustomers('shop_4ink', {}, sort, page)
    expect(mockSupabaseRepo.listCustomers).toHaveBeenCalledWith('shop_4ink', {}, sort, page)
  })

  it('getListStats() → repo.getListStats()', async () => {
    await getListStats('shop_4ink')
    expect(mockSupabaseRepo.getListStats).toHaveBeenCalledWith('shop_4ink')
  })

  it('searchCustomers() → repo.searchCustomers()', async () => {
    await searchCustomers('shop_4ink', 'river')
    expect(mockSupabaseRepo.searchCustomers).toHaveBeenCalledWith('shop_4ink', 'river')
  })

  it('getCustomerDefaults() → repo.getCustomerDefaults()', async () => {
    await getCustomerDefaults(RIVER_CITY_ID)
    expect(mockSupabaseRepo.getCustomerDefaults).toHaveBeenCalledWith(RIVER_CITY_ID)
  })

  it('createCustomer() → repo.createCustomer()', async () => {
    await createCustomer('shop_4ink', {} as never)
    expect(mockSupabaseRepo.createCustomer).toHaveBeenCalledWith('shop_4ink', {})
  })

  it('updateCustomer() → repo.updateCustomer()', async () => {
    await updateCustomer('shop_4ink', RIVER_CITY_ID, {})
    expect(mockSupabaseRepo.updateCustomer).toHaveBeenCalledWith('shop_4ink', RIVER_CITY_ID, {})
  })

  it('archiveCustomer() → repo.archiveCustomer()', async () => {
    await archiveCustomer('shop_4ink', RIVER_CITY_ID)
    expect(mockSupabaseRepo.archiveCustomer).toHaveBeenCalledWith('shop_4ink', RIVER_CITY_ID)
  })

  it('getAccountBalance() → repo.getAccountBalance()', async () => {
    await getAccountBalance(RIVER_CITY_ID)
    expect(mockSupabaseRepo.getAccountBalance).toHaveBeenCalledWith(RIVER_CITY_ID)
  })

  it('getPreferences() → repo.getPreferences()', async () => {
    await getPreferences(RIVER_CITY_ID)
    expect(mockSupabaseRepo.getPreferences).toHaveBeenCalledWith(RIVER_CITY_ID)
  })

  it('createContact() → repo.createContact()', async () => {
    await createContact({} as never)
    expect(mockSupabaseRepo.createContact).toHaveBeenCalledWith({})
  })

  it('updateContact() → repo.updateContact()', async () => {
    await updateContact(brandId<ContactId>('contact-id'), {})
    expect(mockSupabaseRepo.updateContact).toHaveBeenCalledWith(
      brandId<ContactId>('contact-id'),
      {}
    )
  })

  it('deleteContact() → repo.deleteContact()', async () => {
    await deleteContact(brandId<ContactId>('contact-id'))
    expect(mockSupabaseRepo.deleteContact).toHaveBeenCalledWith(brandId<ContactId>('contact-id'))
  })

  it('createAddress() → repo.createAddress()', async () => {
    await createAddress({} as never)
    expect(mockSupabaseRepo.createAddress).toHaveBeenCalledWith({})
  })

  it('updateAddress() → repo.updateAddress()', async () => {
    await updateAddress(brandId<AddressId>('address-id'), {})
    expect(mockSupabaseRepo.updateAddress).toHaveBeenCalledWith(
      brandId<AddressId>('address-id'),
      {}
    )
  })

  it('deleteAddress() → repo.deleteAddress()', async () => {
    await deleteAddress(brandId<AddressId>('address-id'))
    expect(mockSupabaseRepo.deleteAddress).toHaveBeenCalledWith(brandId<AddressId>('address-id'))
  })
})
