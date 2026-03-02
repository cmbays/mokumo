import { describe, it, expect } from 'vitest'
import { addressSchema, addressTypeEnum } from '../address'

describe('addressTypeEnum', () => {
  it.each(['billing', 'shipping'])("accepts '%s'", (type) => {
    expect(addressTypeEnum.parse(type)).toBe(type)
  })

  it('rejects invalid type', () => {
    expect(() => addressTypeEnum.parse('mailing')).toThrow()
  })
})

describe('addressSchema', () => {
  const validAddress = {
    id: '31a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c',
    label: 'Main',
    street1: '1200 E 6th St',
    city: 'Austin',
    state: 'TX',
    zip: '78702',
    country: 'US',
    type: 'billing' as const,
  }

  it('accepts a valid address', () => {
    const result = addressSchema.parse(validAddress)
    expect(result.label).toBe('Main')
    expect(result.city).toBe('Austin')
    expect(result.type).toBe('billing')
  })

  it('defaults country to US', () => {
    const noCountry = { ...validAddress }
    delete (noCountry as Record<string, unknown>).country
    const result = addressSchema.parse(noCountry)
    expect(result.country).toBe('US')
  })

  it('accepts optional street2', () => {
    const withStreet2 = { ...validAddress, street2: 'Suite 200' }
    const result = addressSchema.parse(withStreet2)
    expect(result.street2).toBe('Suite 200')
  })

  it('rejects empty street1', () => {
    expect(() => addressSchema.parse({ ...validAddress, street1: '' })).toThrow()
  })

  it('rejects empty city', () => {
    expect(() => addressSchema.parse({ ...validAddress, city: '' })).toThrow()
  })

  it('rejects empty label', () => {
    expect(() => addressSchema.parse({ ...validAddress, label: '' })).toThrow()
  })

  it('rejects invalid type', () => {
    expect(() => addressSchema.parse({ ...validAddress, type: 'mailing' })).toThrow()
  })
})
