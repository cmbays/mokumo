import { describe, it, expect, expectTypeOf } from 'vitest'
import {
  brandId,
  type Brand,
  type CustomerId,
  type QuoteId,
  type JobId,
  type InvoiceId,
} from '../branded'

describe('branded types', () => {
  describe('brandId', () => {
    it('returns the raw string value unchanged at runtime', () => {
      const raw = 'abc-123'
      const branded = brandId<CustomerId>(raw)
      expect(branded).toBe(raw)
    })

    it('produces a value that satisfies string operations', () => {
      const id = brandId<QuoteId>('test-id')
      expect(id.startsWith('test')).toBe(true)
      expect(id.length).toBe(7)
    })
  })

  describe('type-level safety', () => {
    it('branded types are structurally distinct', () => {
      expectTypeOf(brandId<CustomerId>('a')).toMatchTypeOf<CustomerId>()
      expectTypeOf(brandId<QuoteId>('a')).toMatchTypeOf<QuoteId>()

      // A CustomerId is NOT assignable to QuoteId (and vice versa).
      // This is the core value proposition — if this ever passes,
      // the branding is broken.
      expectTypeOf(brandId<CustomerId>('a')).not.toMatchTypeOf<QuoteId>()
      expectTypeOf(brandId<QuoteId>('a')).not.toMatchTypeOf<CustomerId>()
    })

    it('branded IDs are assignable to string', () => {
      expectTypeOf(brandId<CustomerId>('a')).toMatchTypeOf<string>()
      expectTypeOf(brandId<JobId>('a')).toMatchTypeOf<string>()
    })

    it('plain strings are NOT assignable to branded types', () => {
      expectTypeOf('plain-string').not.toMatchTypeOf<CustomerId>()
      expectTypeOf('plain-string').not.toMatchTypeOf<InvoiceId>()
    })

    it('Brand utility creates distinct types from same base', () => {
      type A = Brand<number, 'A'>
      type B = Brand<number, 'B'>

      expectTypeOf<A>().not.toMatchTypeOf<B>()
      expectTypeOf<B>().not.toMatchTypeOf<A>()
    })
  })
})
