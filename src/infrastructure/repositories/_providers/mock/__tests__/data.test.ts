import { describe, it, expect } from 'vitest'
import { customerSchema } from '@domain/entities/customer'
import { contactSchema } from '@domain/entities/contact'
import { groupSchema } from '@domain/entities/group'
import { noteSchema } from '@domain/entities/note'
import { addressSchema } from '@domain/entities/address'
import { jobSchema } from '@domain/entities/job'
import { quoteSchema } from '@domain/entities/quote'
import { screenSchema } from '@domain/entities/screen'
import { colorSchema } from '@domain/entities/color'
import { garmentCatalogSchema } from '@domain/entities/garment'
import { artworkSchema } from '@domain/entities/artwork'
import { invoiceSchema } from '@domain/entities/invoice'
import { creditMemoSchema } from '@domain/entities/credit-memo'
import { scratchNoteSchema } from '@domain/entities/scratch-note'
import { quoteCardSchema } from '@domain/entities/board-card'
import { mockupTemplateSchema } from '@domain/entities/mockup-template'
import {
  customers,
  contacts,
  customerGroups,
  customerNotes,
  customerAddresses,
  jobs,
  quotes,
  screens,
  colors,
  garmentCatalog,
  artworks,
  invoices,
  payments,
  creditMemos,
  scratchNotes,
  quoteCards,
  mockupTemplates,
  getCustomerQuotes,
  getCustomerJobs,
  getCustomerContacts,
  getCustomerNotes,
  getCustomerArtworks,
  getCustomerInvoices,
  getInvoicePayments,
  getInvoiceCreditMemos,
  getQuoteInvoice,
  getJobsByLane,
  getJobsByServiceType,
  getJobTasks,
  getJobNotes,
} from '../data'

describe('mock data validates against schemas', () => {
  it('all customers are valid', () => {
    for (const customer of customers) {
      expect(() => customerSchema.parse(customer)).not.toThrow()
    }
  })

  it('all contacts are valid', () => {
    for (const contact of contacts) {
      expect(() => contactSchema.parse(contact)).not.toThrow()
    }
  })

  it('all groups are valid', () => {
    for (const group of customerGroups) {
      expect(() => groupSchema.parse(group)).not.toThrow()
    }
  })

  it('all notes are valid', () => {
    for (const note of customerNotes) {
      expect(() => noteSchema.parse(note)).not.toThrow()
    }
  })

  it('all addresses are valid', () => {
    for (const address of customerAddresses) {
      expect(() => addressSchema.parse(address)).not.toThrow()
    }
  })

  it('all jobs are valid', () => {
    for (const job of jobs) {
      expect(() => jobSchema.parse(job)).not.toThrow()
    }
  })

  it('all quotes are valid', () => {
    for (const quote of quotes) {
      expect(() => quoteSchema.parse(quote)).not.toThrow()
    }
  })

  it('all screens are valid', () => {
    for (const screen of screens) {
      expect(() => screenSchema.parse(screen)).not.toThrow()
    }
  })

  it('all colors are valid', () => {
    for (const color of colors) {
      expect(() => colorSchema.parse(color)).not.toThrow()
    }
  })

  it('all garment catalog entries are valid', () => {
    for (const garment of garmentCatalog) {
      expect(() => garmentCatalogSchema.parse(garment)).not.toThrow()
    }
  })

  it('all artworks are valid', () => {
    for (const artwork of artworks) {
      expect(() => artworkSchema.parse(artwork)).not.toThrow()
    }
  })

  it('all invoices are valid', () => {
    for (const invoice of invoices) {
      expect(() => invoiceSchema.parse(invoice)).not.toThrow()
    }
  })

  it('all credit memos are valid', () => {
    for (const cm of creditMemos) {
      expect(() => creditMemoSchema.parse(cm)).not.toThrow()
    }
  })

  it('all scratch notes are valid', () => {
    for (const note of scratchNotes) {
      expect(() => scratchNoteSchema.parse(note)).not.toThrow()
    }
  })

  it('all quote cards are valid', () => {
    for (const card of quoteCards) {
      expect(() => quoteCardSchema.parse(card)).not.toThrow()
    }
  })
})

describe('referential integrity', () => {
  it('all job customerIds reference existing customers', () => {
    const customerIds = new Set(customers.map((c) => c.id))
    for (const job of jobs) {
      expect(customerIds.has(job.customerId)).toBe(true)
    }
  })

  it('all quote customerIds reference existing customers', () => {
    const customerIds = new Set(customers.map((c) => c.id))
    for (const quote of quotes) {
      expect(customerIds.has(quote.customerId)).toBe(true)
    }
  })

  it('all screen jobIds reference existing jobs', () => {
    const jobIds = new Set(jobs.map((j) => j.id))
    for (const screen of screens) {
      expect(jobIds.has(screen.jobId)).toBe(true)
    }
  })

  it('all quote line item garmentIds reference existing catalog entries', () => {
    const garmentIds = new Set(garmentCatalog.map((g) => g.id))
    for (const quote of quotes) {
      for (const item of quote.lineItems) {
        expect(garmentIds.has(item.garmentId)).toBe(true)
      }
    }
  })

  it('all quote line item colorIds reference existing colors', () => {
    const colorIds = new Set(colors.map((c) => c.id))
    for (const quote of quotes) {
      for (const item of quote.lineItems) {
        expect(colorIds.has(item.colorId)).toBe(true)
      }
    }
  })

  it('all garment catalog availableColors reference existing colors', () => {
    const colorIds = new Set(colors.map((c) => c.id))
    for (const garment of garmentCatalog) {
      for (const colorId of garment.availableColors) {
        expect(colorIds.has(colorId)).toBe(true)
      }
    }
  })

  it('all artwork customerIds reference existing customers', () => {
    const customerIds = new Set(customers.map((c) => c.id))
    for (const artwork of artworks) {
      expect(customerIds.has(artwork.customerId)).toBe(true)
    }
  })

  it('all quote artworkIds reference existing artworks', () => {
    const artworkIds = new Set(artworks.map((a) => a.id))
    for (const quote of quotes) {
      for (const artworkId of quote.artworkIds) {
        expect(artworkIds.has(artworkId)).toBe(true)
      }
    }
  })

  it('all line item artworkIds reference existing artworks', () => {
    const artworkIds = new Set(artworks.map((a) => a.id))
    for (const quote of quotes) {
      for (const item of quote.lineItems) {
        for (const detail of item.printLocationDetails) {
          if (detail.artworkId) {
            expect(artworkIds.has(detail.artworkId)).toBe(true)
          }
        }
      }
    }
  })

  it('all group customerIds reference existing customers', () => {
    const customerIds = new Set(customers.map((c) => c.id))
    for (const group of customerGroups) {
      expect(customerIds.has(group.customerId)).toBe(true)
    }
  })

  it('all note entityIds reference existing entities', () => {
    const customerIds = new Set(customers.map((c) => c.id))
    const quoteIds = new Set(quotes.map((q) => q.id))
    const artworkIds = new Set(artworks.map((a) => a.id))
    const jobIds = new Set(jobs.map((j) => j.id))

    for (const note of customerNotes) {
      switch (note.entityType) {
        case 'customer':
          expect(customerIds.has(note.entityId)).toBe(true)
          break
        case 'quote':
          expect(quoteIds.has(note.entityId)).toBe(true)
          break
        case 'artwork':
          expect(artworkIds.has(note.entityId)).toBe(true)
          break
        case 'job':
          expect(jobIds.has(note.entityId)).toBe(true)
          break
      }
    }
  })

  it('all referredByCustomerIds reference existing customers', () => {
    const customerIds = new Set(customers.map((c) => c.id))
    for (const customer of customers) {
      if (customer.referredByCustomerId) {
        expect(customerIds.has(customer.referredByCustomerId)).toBe(true)
      }
    }
  })

  it('all contact groupIds reference existing groups', () => {
    const groupIds = new Set(customerGroups.map((g) => g.id))
    for (const contact of contacts) {
      if (contact.groupId) {
        expect(groupIds.has(contact.groupId)).toBe(true)
      }
    }
  })

  it('embedded customer.contacts match standalone contacts array', () => {
    for (const customer of customers) {
      for (const embedded of customer.contacts) {
        const standalone = contacts.find((c) => c.id === embedded.id)
        expect(standalone).toBeDefined()
        expect(standalone?.name).toBe(embedded.name)
        expect(standalone?.role).toBe(embedded.role)
      }
    }
  })

  it('all addresses are embedded in a customer record', () => {
    for (const address of customerAddresses) {
      const ownerExists = customers.some(
        (c) =>
          c.billingAddress?.id === address.id ||
          c.shippingAddresses.some((sa) => sa.id === address.id)
      )
      expect(ownerExists).toBe(true)
    }
  })

  it('all job sourceQuoteIds reference existing quotes', () => {
    const quoteIds = new Set(quotes.map((q) => q.id))
    for (const job of jobs) {
      if (job.sourceQuoteId) {
        expect(quoteIds.has(job.sourceQuoteId)).toBe(true)
      }
    }
  })

  it('all job invoiceIds reference existing invoices', () => {
    const invoiceIds = new Set(invoices.map((inv) => inv.id))
    for (const job of jobs) {
      if (job.invoiceId) {
        expect(invoiceIds.has(job.invoiceId)).toBe(true)
      }
    }
  })

  // Invoice referential integrity
  it('all invoice customerIds reference existing customers', () => {
    const customerIds = new Set(customers.map((c) => c.id))
    for (const invoice of invoices) {
      expect(customerIds.has(invoice.customerId)).toBe(true)
    }
  })

  it('all invoice quoteIds reference existing quotes', () => {
    const quoteIds = new Set(quotes.map((q) => q.id))
    for (const invoice of invoices) {
      if (invoice.quoteId) {
        expect(quoteIds.has(invoice.quoteId)).toBe(true)
      }
    }
  })

  it('all payment invoiceIds reference existing invoices', () => {
    const invoiceIds = new Set(invoices.map((inv) => inv.id))
    for (const payment of payments) {
      expect(invoiceIds.has(payment.invoiceId)).toBe(true)
    }
  })

  it('all credit memo invoiceIds reference existing invoices', () => {
    const invoiceIds = new Set(invoices.map((inv) => inv.id))
    for (const cm of creditMemos) {
      expect(invoiceIds.has(cm.invoiceId)).toBe(true)
    }
  })

  it('all credit memo customerIds reference existing customers', () => {
    const customerIds = new Set(customers.map((c) => c.id))
    for (const cm of creditMemos) {
      expect(customerIds.has(cm.customerId)).toBe(true)
    }
  })

  it('invoice numbers are unique', () => {
    const numbers = invoices.map((inv) => inv.invoiceNumber)
    expect(new Set(numbers).size).toBe(numbers.length)
  })

  it('credit memo numbers are unique', () => {
    const numbers = creditMemos.map((cm) => cm.creditMemoNumber)
    expect(new Set(numbers).size).toBe(numbers.length)
  })

  it('invoice amountPaid matches sum of payments', () => {
    for (const invoice of invoices) {
      const totalPaid = payments
        .filter((p) => p.invoiceId === invoice.id)
        .reduce((sum, p) => sum + p.amount, 0)
      expect(Math.abs(invoice.amountPaid - totalPaid)).toBeLessThan(0.01)
    }
  })
})

describe('data coverage', () => {
  it('has at least 10 customers', () => {
    expect(customers.length).toBeGreaterThanOrEqual(10)
  })

  it('has at least 6 quotes', () => {
    expect(quotes.length).toBeGreaterThanOrEqual(6)
  })

  it('has at least 30 colors', () => {
    expect(colors.length).toBeGreaterThanOrEqual(30)
  })

  it('has at least 5 garment catalog entries', () => {
    expect(garmentCatalog.length).toBeGreaterThanOrEqual(5)
  })

  it('has at least 8 artworks', () => {
    expect(artworks.length).toBeGreaterThanOrEqual(8)
  })

  it('covers all quote statuses', () => {
    const statuses = new Set(quotes.map((q) => q.status))
    expect(statuses).toContain('draft')
    expect(statuses).toContain('sent')
    expect(statuses).toContain('accepted')
    expect(statuses).toContain('declined')
    expect(statuses).toContain('revised')
  })

  it('has favorite colors marked', () => {
    const favorites = colors.filter((c) => c.isFavorite)
    expect(favorites.length).toBeGreaterThanOrEqual(3)
  })

  it('has quotes with discounts', () => {
    const withDiscounts = quotes.filter((q) => q.discounts.length > 0)
    expect(withDiscounts.length).toBeGreaterThanOrEqual(2)
  })

  it('covers all customer tags', () => {
    const tags = new Set(customers.map((c) => c.tag))
    expect(tags).toContain('new')
    expect(tags).toContain('repeat')
    expect(tags).toContain('contract')
  })

  it('covers all discount types', () => {
    const types = new Set(quotes.flatMap((q) => q.discounts.map((d) => d.type)))
    expect(types).toContain('manual')
    expect(types).toContain('contract')
    expect(types).toContain('volume')
  })

  // Customer Management data coverage
  it('covers all lifecycle stages', () => {
    const stages = new Set(customers.map((c) => c.lifecycleStage))
    expect(stages).toContain('prospect')
    expect(stages).toContain('new')
    expect(stages).toContain('repeat')
    expect(stages).toContain('contract')
  })

  it('has at least 1 potentially-churning customer', () => {
    const churning = customers.filter((c) => c.healthStatus === 'potentially-churning')
    expect(churning.length).toBeGreaterThanOrEqual(1)
  })

  it('has at least 2 referral chains', () => {
    const referred = customers.filter((c) => c.referredByCustomerId)
    expect(referred.length).toBeGreaterThanOrEqual(2)
  })

  it('has at least 1 pinned note per customer', () => {
    const customerIds = new Set(customers.map((c) => c.id))
    for (const customerId of customerIds) {
      const pinned = customerNotes.filter(
        (n) => n.entityType === 'customer' && n.entityId === customerId && n.isPinned
      )
      expect(pinned.length).toBeGreaterThanOrEqual(1)
    }
  })

  it('has at least 2 notes per customer', () => {
    const customerIds = new Set(customers.map((c) => c.id))
    for (const customerId of customerIds) {
      const notes = customerNotes.filter(
        (n) => n.entityType === 'customer' && n.entityId === customerId
      )
      expect(notes.length).toBeGreaterThanOrEqual(2)
    }
  })

  it('has contacts with various roles', () => {
    const roles = new Set(contacts.map((c) => c.role))
    expect(roles).toContain('ordering')
    expect(roles).toContain('art-approver')
    expect(roles).toContain('billing')
    expect(roles).toContain('owner')
  })

  it('has tax exempt customers', () => {
    const exempt = customers.filter((c) => c.taxExempt)
    expect(exempt.length).toBeGreaterThanOrEqual(2)
  })

  it('has customers with multiple type tags', () => {
    const multiTag = customers.filter((c) => c.typeTags.length > 1)
    expect(multiTag.length).toBeGreaterThanOrEqual(1)
  })

  it('covers various type tags', () => {
    const allTags = new Set(customers.flatMap((c) => c.typeTags))
    expect(allTags).toContain('retail')
    expect(allTags).toContain('sports-school')
    expect(allTags).toContain('corporate')
    expect(allTags).toContain('storefront-merch')
    expect(allTags).toContain('wholesale')
  })

  // Invoice data coverage
  it('has at least 8 invoices', () => {
    expect(invoices.length).toBeGreaterThanOrEqual(8)
  })

  it('has at least 11 payments', () => {
    expect(payments.length).toBeGreaterThanOrEqual(11)
  })

  it('has at least 2 credit memos', () => {
    expect(creditMemos.length).toBeGreaterThanOrEqual(2)
  })

  it('covers all invoice statuses', () => {
    const statuses = new Set(invoices.map((inv) => inv.status))
    expect(statuses).toContain('draft')
    expect(statuses).toContain('sent')
    expect(statuses).toContain('partial')
    expect(statuses).toContain('paid')
    expect(statuses).toContain('void')
  })

  it('has invoices with quote links', () => {
    const withQuotes = invoices.filter((inv) => inv.quoteId)
    expect(withQuotes.length).toBeGreaterThanOrEqual(2)
  })

  it('covers various payment methods', () => {
    const methods = new Set(payments.map((p) => p.method))
    expect(methods).toContain('check')
    expect(methods).toContain('cash')
    expect(methods).toContain('square')
    expect(methods).toContain('venmo')
    expect(methods).toContain('zelle')
    expect(methods).toContain('ach')
    expect(methods).toContain('credit_card')
  })

  // Job data coverage
  it('covers all lanes', () => {
    const lanes = new Set(jobs.map((j) => j.lane))
    expect(lanes).toContain('ready')
    expect(lanes).toContain('in_progress')
    expect(lanes).toContain('review')
    expect(lanes).toContain('blocked')
    expect(lanes).toContain('done')
  })

  it('covers all service types', () => {
    const types = new Set(jobs.map((j) => j.serviceType))
    expect(types).toContain('screen-print')
    expect(types).toContain('dtf')
    expect(types).toContain('embroidery')
  })

  it('covers all risk levels', () => {
    const levels = new Set(jobs.map((j) => j.riskLevel))
    expect(levels).toContain('on_track')
    expect(levels).toContain('getting_tight')
    expect(levels).toContain('at_risk')
  })

  it('covers all priorities', () => {
    const priorities = new Set(jobs.map((j) => j.priority))
    expect(priorities).toContain('low')
    expect(priorities).toContain('medium')
    expect(priorities).toContain('high')
    expect(priorities).toContain('rush')
  })

  it('has blocked jobs with blockReason', () => {
    const blocked = jobs.filter((j) => j.lane === 'blocked')
    expect(blocked.length).toBeGreaterThanOrEqual(1)
    for (const job of blocked) {
      expect(job.blockReason).toBeTruthy()
    }
  })

  it('has done jobs with completedAt', () => {
    const done = jobs.filter((j) => j.lane === 'done')
    expect(done.length).toBeGreaterThanOrEqual(1)
    for (const job of done) {
      expect(job.completedAt).toBeTruthy()
    }
  })

  it('all mockup templates are valid', () => {
    expect(mockupTemplates.length).toBeGreaterThanOrEqual(1)
    for (const template of mockupTemplates) {
      expect(() => mockupTemplateSchema.parse(template)).not.toThrow()
    }
  })
})

describe('data lookup helpers', () => {
  const firstCustomer = customers[0]
  const firstCustomerId = firstCustomer.id

  it('getCustomerQuotes returns quotes for the customer', () => {
    const result = getCustomerQuotes(firstCustomerId)
    expect(Array.isArray(result)).toBe(true)
    for (const q of result) {
      expect(q.customerId).toBe(firstCustomerId)
    }
  })

  it('getCustomerQuotes returns empty array for unknown customer', () => {
    expect(getCustomerQuotes('unknown-id')).toEqual([])
  })

  it('getCustomerJobs returns jobs for the customer', () => {
    const result = getCustomerJobs(firstCustomerId)
    expect(Array.isArray(result)).toBe(true)
    for (const j of result) {
      expect(j.customerId).toBe(firstCustomerId)
    }
  })

  it('getCustomerJobs returns empty array for unknown customer', () => {
    expect(getCustomerJobs('unknown-id')).toEqual([])
  })

  it('getCustomerContacts returns contacts for the customer', () => {
    const result = getCustomerContacts(firstCustomerId)
    expect(result.length).toBeGreaterThan(0)
    for (const c of result) {
      expect(typeof c.id).toBe('string')
    }
  })

  it('getCustomerContacts returns empty array for unknown customer', () => {
    expect(getCustomerContacts('unknown-id')).toEqual([])
  })

  it('getCustomerNotes returns customer-scoped notes', () => {
    const result = getCustomerNotes(firstCustomerId)
    expect(Array.isArray(result)).toBe(true)
    for (const n of result) {
      expect(n.entityType).toBe('customer')
      expect(n.entityId).toBe(firstCustomerId)
    }
  })

  it('getCustomerNotes returns empty array for unknown customer', () => {
    expect(getCustomerNotes('unknown-id')).toEqual([])
  })

  it('getCustomerArtworks returns artworks for the customer', () => {
    const result = getCustomerArtworks(firstCustomerId)
    expect(Array.isArray(result)).toBe(true)
    for (const a of result) {
      expect(a.customerId).toBe(firstCustomerId)
    }
  })

  it('getCustomerArtworks returns empty array for unknown customer', () => {
    expect(getCustomerArtworks('unknown-id')).toEqual([])
  })

  it('getCustomerInvoices returns invoices for the customer', () => {
    const result = getCustomerInvoices(firstCustomerId)
    expect(Array.isArray(result)).toBe(true)
    for (const inv of result) {
      expect(inv.customerId).toBe(firstCustomerId)
    }
  })

  it('getCustomerInvoices returns empty array for unknown customer', () => {
    expect(getCustomerInvoices('unknown-id')).toEqual([])
  })

  it('getInvoicePayments returns payments for an invoice', () => {
    const invoice = invoices[0]
    const result = getInvoicePayments(invoice.id)
    expect(Array.isArray(result)).toBe(true)
    for (const p of result) {
      expect(p.invoiceId).toBe(invoice.id)
    }
  })

  it('getInvoicePayments returns empty array for unknown invoice', () => {
    expect(getInvoicePayments('unknown-id')).toEqual([])
  })

  it('getInvoiceCreditMemos returns credit memos for an invoice', () => {
    const invoice = invoices.find((inv) => creditMemos.some((cm) => cm.invoiceId === inv.id))
    expect(invoice).toBeDefined()
    const result = getInvoiceCreditMemos(invoice!.id)
    expect(result.length).toBeGreaterThan(0)
    for (const cm of result) {
      expect(cm.invoiceId).toBe(invoice!.id)
    }
    expect(getInvoiceCreditMemos('unknown-id')).toEqual([])
  })

  it('getQuoteInvoice returns the invoice for a quote', () => {
    const invoiceWithQuote = invoices.find((inv) => inv.quoteId)
    expect(invoiceWithQuote).toBeDefined()
    const result = getQuoteInvoice(invoiceWithQuote!.quoteId!)
    expect(result).toBeDefined()
    expect(result!.id).toBe(invoiceWithQuote!.id)
    expect(getQuoteInvoice('unknown-quote-id')).toBeUndefined()
  })

  it('getJobsByLane returns only jobs in the specified lane', () => {
    const readyJobs = getJobsByLane('ready')
    expect(Array.isArray(readyJobs)).toBe(true)
    for (const j of readyJobs) {
      expect(j.lane).toBe('ready')
    }
  })

  it('getJobsByServiceType returns only jobs of the specified type', () => {
    const screenPrintJobs = getJobsByServiceType('screen-print')
    expect(Array.isArray(screenPrintJobs)).toBe(true)
    for (const j of screenPrintJobs) {
      expect(j.serviceType).toBe('screen-print')
    }
  })

  it('getJobTasks returns tasks for a known job', () => {
    const job = jobs.find((j) => j.tasks.length > 0)
    expect(job).toBeDefined()
    const result = getJobTasks(job!.id)
    expect(result).toEqual(job!.tasks)
    expect(getJobTasks('unknown-id')).toEqual([])
  })

  it('getJobNotes returns notes for a known job', () => {
    const job = jobs[0]
    const result = getJobNotes(job.id)
    expect(Array.isArray(result)).toBe(true)
    expect(getJobNotes('unknown-id')).toEqual([])
  })
})
