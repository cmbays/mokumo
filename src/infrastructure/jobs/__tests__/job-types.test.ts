import { describe, it, expect } from 'vitest'
import { jobTypeSchema, jobPayloadSchema, DEFAULT_RETRY_POLICY } from '../job-types'

describe('jobTypeSchema', () => {
  it('accepts all valid job types', () => {
    for (const type of ['inventory-refresh', 'cache-warm', 'garment-sync'] as const) {
      expect(() => jobTypeSchema.parse(type)).not.toThrow()
      expect(jobTypeSchema.parse(type)).toBe(type)
    }
  })

  it('rejects unknown job types', () => {
    expect(() => jobTypeSchema.parse('unknown-job')).toThrow()
    expect(() => jobTypeSchema.parse('')).toThrow()
    expect(() => jobTypeSchema.parse(null)).toThrow()
  })
})

describe('jobPayloadSchema', () => {
  const validPayload = {
    jobType: 'inventory-refresh',
    dispatchedAt: new Date().toISOString(),
    data: { foo: 'bar' },
  }

  it('accepts a valid payload', () => {
    const result = jobPayloadSchema.safeParse(validPayload)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.jobType).toBe('inventory-refresh')
    }
  })

  it('accepts payload without data', () => {
    const { data: _data, ...noData } = validPayload
    const result = jobPayloadSchema.safeParse(noData)
    expect(result.success).toBe(true)
  })

  it('rejects invalid dispatchedAt', () => {
    const result = jobPayloadSchema.safeParse({ ...validPayload, dispatchedAt: 'not-a-date' })
    expect(result.success).toBe(false)
  })

  it('rejects invalid job type', () => {
    const result = jobPayloadSchema.safeParse({ ...validPayload, jobType: 'not-a-job' })
    expect(result.success).toBe(false)
  })
})

describe('DEFAULT_RETRY_POLICY', () => {
  it('has 3 retries', () => {
    expect(DEFAULT_RETRY_POLICY.retries).toBe(3)
  })
})
