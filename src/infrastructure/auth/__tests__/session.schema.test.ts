import { describe, it, expect } from 'vitest'
import { sessionSchema } from '../session.schema'

const VALID_UUID_1 = '00000000-0000-4000-8000-000000000001'
const VALID_UUID_2 = '00000000-0000-4000-8000-000000004e6b'

describe('sessionSchema', () => {
  it('parses a valid session object', () => {
    const result = sessionSchema.parse({
      userId: VALID_UUID_1,
      role: 'owner',
      shopId: VALID_UUID_2,
    })
    expect(result).toEqual({ userId: VALID_UUID_1, role: 'owner', shopId: VALID_UUID_2 })
  })

  it('accepts "operator" as a valid role', () => {
    expect(() =>
      sessionSchema.parse({ userId: VALID_UUID_1, role: 'operator', shopId: VALID_UUID_2 })
    ).not.toThrow()
  })

  it('throws when userId is not a UUID', () => {
    expect(() =>
      sessionSchema.parse({ userId: 'usr_4ink_owner', role: 'owner', shopId: VALID_UUID_2 })
    ).toThrow()
  })

  it('throws when shopId is not a UUID', () => {
    expect(() =>
      sessionSchema.parse({ userId: VALID_UUID_1, role: 'owner', shopId: 'shop_4ink' })
    ).toThrow()
  })

  it('throws on a non-RFC-4122-compliant UUID (variant nibble = 0)', () => {
    expect(() =>
      sessionSchema.parse({
        userId: '00000000-0000-0000-0000-000000000001',
        role: 'owner',
        shopId: VALID_UUID_2,
      })
    ).toThrow()
  })

  it('throws when role is not in the allowed enum', () => {
    expect(() =>
      sessionSchema.parse({ userId: VALID_UUID_1, role: 'admin', shopId: VALID_UUID_2 })
    ).toThrow()
  })

  it('throws when a required field is missing', () => {
    expect(() => sessionSchema.parse({ userId: VALID_UUID_1, role: 'owner' })).toThrow()
  })
})
