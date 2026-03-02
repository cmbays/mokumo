import { describe, it, expect, vi } from 'vitest'

// Mock server-only module so tests can run in Vitest environment
vi.mock('server-only', () => ({}))

import {
  getCustomers,
  getCustomerById,
  getCustomerQuotes,
  getCustomerJobs,
  getCustomerContacts,
  getCustomerNotes,
  getCustomerArtworks,
  getCustomerInvoices,
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
