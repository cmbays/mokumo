import { describe, it, expect } from 'vitest'
import {
  customerSchema,
  customerTagEnum,
  lifecycleStageEnum,
  healthStatusEnum,
  customerTypeTagEnum,
  paymentTermsEnum,
  pricingTierEnum,
} from '../customer'

describe('customerTagEnum', () => {
  it.each(['new', 'repeat', 'contract'])("accepts '%s'", (tag) => {
    expect(customerTagEnum.parse(tag)).toBe(tag)
  })

  it('rejects invalid tag', () => {
    expect(() => customerTagEnum.parse('vip')).toThrow()
  })
})

describe('lifecycleStageEnum', () => {
  it.each(['prospect', 'new', 'repeat', 'contract', 'vip', 'at-risk', 'archived'])(
    "accepts '%s'",
    (stage) => {
      expect(lifecycleStageEnum.parse(stage)).toBe(stage)
    }
  )

  it('rejects invalid stage', () => {
    expect(() => lifecycleStageEnum.parse('inactive')).toThrow()
  })
})

describe('healthStatusEnum', () => {
  it.each(['active', 'potentially-churning', 'churned'])("accepts '%s'", (status) => {
    expect(healthStatusEnum.parse(status)).toBe(status)
  })

  it('rejects invalid status', () => {
    expect(() => healthStatusEnum.parse('dormant')).toThrow()
  })
})

describe('customerTypeTagEnum', () => {
  it.each(['retail', 'sports-school', 'corporate', 'storefront-merch', 'wholesale'])(
    "accepts '%s'",
    (tag) => {
      expect(customerTypeTagEnum.parse(tag)).toBe(tag)
    }
  )

  it('rejects invalid type tag', () => {
    expect(() => customerTypeTagEnum.parse('premium-member')).toThrow()
  })
})

describe('paymentTermsEnum', () => {
  it.each(['cod', 'upfront', 'net-15', 'net-30', 'net-60'])("accepts '%s'", (terms) => {
    expect(paymentTermsEnum.parse(terms)).toBe(terms)
  })
})

describe('pricingTierEnum', () => {
  it.each(['standard', 'preferred', 'contract', 'wholesale'])("accepts '%s'", (tier) => {
    expect(pricingTierEnum.parse(tier)).toBe(tier)
  })
})

describe('customerSchema', () => {
  const now = new Date().toISOString()

  const validCustomer = {
    id: 'c1a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c',
    company: 'River City Brewing Co.',
    name: 'Marcus Rivera',
    email: 'marcus@rivercitybrewing.com',
    phone: '(512) 555-0147',
    address: '1200 E 6th St, Austin, TX 78702',
    tag: 'repeat' as const,
    lifecycleStage: 'repeat' as const,
    healthStatus: 'active' as const,
    isArchived: false,
    typeTags: ['retail' as const],
    contacts: [],
    groups: [],
    shippingAddresses: [],
    paymentTerms: 'upfront' as const,
    pricingTier: 'standard' as const,
    taxExempt: false,
    createdAt: now,
    updatedAt: now,
  }

  it('accepts a valid customer', () => {
    const result = customerSchema.parse(validCustomer)
    expect(result.name).toBe('Marcus Rivera')
    expect(result.company).toBe('River City Brewing Co.')
    expect(result.lifecycleStage).toBe('repeat')
  })

  it('applies defaults for optional enum fields', () => {
    const minimal = {
      id: 'c1a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c',
      company: 'Test Co',
      name: 'Test',
      email: 'test@test.com',
      phone: '',
      address: '',
      createdAt: now,
      updatedAt: now,
    }
    const result = customerSchema.parse(minimal)
    expect(result.tag).toBe('new')
    expect(result.lifecycleStage).toBe('prospect')
    expect(result.healthStatus).toBe('active')
    expect(result.isArchived).toBe(false)
    expect(result.typeTags).toEqual([])
    expect(result.contacts).toEqual([])
    expect(result.groups).toEqual([])
    expect(result.shippingAddresses).toEqual([])
    expect(result.paymentTerms).toBe('upfront')
    expect(result.pricingTier).toBe('standard')
    expect(result.taxExempt).toBe(false)
  })

  it('accepts customer with contacts and groups', () => {
    const withContacts = {
      ...validCustomer,
      contacts: [
        {
          id: '01a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c',
          name: 'Marcus Rivera',
          email: 'marcus@example.com',
          role: ['ordering', 'primary'] as const,
          isPrimary: true,
        },
      ],
      groups: [
        {
          id: '91a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c',
          name: 'Marketing',
          customerId: 'c1a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c',
        },
      ],
    }
    const result = customerSchema.parse(withContacts)
    expect(result.contacts).toHaveLength(1)
    expect(result.groups).toHaveLength(1)
  })

  it('accepts customer with billing and shipping addresses', () => {
    const withAddresses = {
      ...validCustomer,
      billingAddress: {
        id: '31a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c',
        label: 'Main',
        street1: '1200 E 6th St',
        city: 'Austin',
        state: 'TX',
        zip: '78702',
        country: 'US',
        type: 'billing' as const,
      },
      shippingAddresses: [
        {
          id: '32b3c4d5-e6f7-4a8b-9c0d-1e2f3a4b5c6d',
          label: 'Warehouse',
          street1: '3400 Industrial Blvd',
          city: 'Austin',
          state: 'TX',
          zip: '78745',
          country: 'US',
          type: 'shipping' as const,
        },
      ],
    }
    const result = customerSchema.parse(withAddresses)
    expect(result.billingAddress?.label).toBe('Main')
    expect(result.shippingAddresses).toHaveLength(1)
  })

  it('accepts customer with financial fields', () => {
    const withFinancials = {
      ...validCustomer,
      paymentTerms: 'net-30' as const,
      pricingTier: 'contract' as const,
      discountPercentage: 10,
      taxExempt: true,
      taxExemptCertExpiry: '2027-03-31T00:00:00Z',
    }
    const result = customerSchema.parse(withFinancials)
    expect(result.paymentTerms).toBe('net-30')
    expect(result.discountPercentage).toBe(10)
    expect(result.taxExempt).toBe(true)
  })

  it('accepts customer with referral', () => {
    const withReferral = {
      ...validCustomer,
      referredByCustomerId: 'd2b3c4d5-e6f7-4a8b-9c0d-1e2f3a4b5c6d',
    }
    const result = customerSchema.parse(withReferral)
    expect(result.referredByCustomerId).toBe('d2b3c4d5-e6f7-4a8b-9c0d-1e2f3a4b5c6d')
  })

  it('rejects invalid UUID', () => {
    expect(() => customerSchema.parse({ ...validCustomer, id: 'not-a-uuid' })).toThrow()
  })

  it('rejects empty company', () => {
    expect(() => customerSchema.parse({ ...validCustomer, company: '' })).toThrow()
  })

  it('rejects empty name', () => {
    expect(() => customerSchema.parse({ ...validCustomer, name: '' })).toThrow()
  })

  it('rejects invalid email', () => {
    expect(() => customerSchema.parse({ ...validCustomer, email: 'not-an-email' })).toThrow()
  })

  it('rejects discount out of range', () => {
    expect(() => customerSchema.parse({ ...validCustomer, discountPercentage: 150 })).toThrow()
  })

  it('rejects invalid type tag', () => {
    expect(() =>
      customerSchema.parse({ ...validCustomer, typeTags: ['premium-member'] })
    ).toThrow()
  })

  it('accepts favoriteGarments field', () => {
    const result = customerSchema.parse({
      ...validCustomer,
      favoriteGarments: ['gc-001', 'gc-002'],
    })
    expect(result.favoriteGarments).toEqual(['gc-001', 'gc-002'])
  })

  it('defaults favoriteGarments to empty array', () => {
    const result = customerSchema.parse(validCustomer)
    expect(result.favoriteGarments).toEqual([])
  })

  it('accepts favoriteColors field', () => {
    const result = customerSchema.parse({
      ...validCustomer,
      favoriteColors: ['clr-black', 'clr-white'],
    })
    expect(result.favoriteColors).toEqual(['clr-black', 'clr-white'])
  })

  it('defaults favoriteColors to empty array', () => {
    const result = customerSchema.parse(validCustomer)
    expect(result.favoriteColors).toEqual([])
  })

  it('accepts favoriteBrandNames field', () => {
    const result = customerSchema.parse({
      ...validCustomer,
      favoriteBrandNames: ['Gildan', 'Bella+Canvas'],
    })
    expect(result.favoriteBrandNames).toEqual(['Gildan', 'Bella+Canvas'])
  })

  it('defaults favoriteBrandNames to empty array', () => {
    const result = customerSchema.parse(validCustomer)
    expect(result.favoriteBrandNames).toEqual([])
  })
})
