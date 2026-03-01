import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('server-only', () => ({}))
vi.mock('@shared/lib/logger', () => ({
  logger: {
    child: () => ({ warn: vi.fn(), error: vi.fn(), info: vi.fn() }),
  },
}))

import { SupabaseInventoryRepository } from '../supabase-inventory.repository'

const VALID_UUID = '00000000-0000-4000-8000-000000000001'
const VALID_UUID_2 = '00000000-0000-4000-8000-000000000002'

describe('SupabaseInventoryRepository (Wave 2 stub)', () => {
  let repo: SupabaseInventoryRepository

  beforeEach(() => {
    repo = new SupabaseInventoryRepository()
  })

  describe('getForStyle', () => {
    it('returns null for a valid styleId — stub pending Wave 2 (#670)', async () => {
      const result = await repo.getForStyle(VALID_UUID)
      expect(result).toBeNull()
    })

    it('returns null for an invalid styleId — DAL validation', async () => {
      const result = await repo.getForStyle('not-a-uuid')
      expect(result).toBeNull()
    })

    it('returns null for an empty string styleId', async () => {
      const result = await repo.getForStyle('')
      expect(result).toBeNull()
    })
  })

  describe('getForStyles', () => {
    it('returns an empty Map for valid styleIds — stub pending Wave 2 (#670)', async () => {
      const result = await repo.getForStyles([VALID_UUID, VALID_UUID_2])
      expect(result).toBeInstanceOf(Map)
      expect(result.size).toBe(0)
    })

    it('returns an empty Map for an empty input array', async () => {
      const result = await repo.getForStyles([])
      expect(result).toBeInstanceOf(Map)
      expect(result.size).toBe(0)
    })

    it('returns an empty Map when all styleIds are invalid — DAL validation', async () => {
      const result = await repo.getForStyles(['not-a-uuid', '', 'also-bad'])
      expect(result).toBeInstanceOf(Map)
      expect(result.size).toBe(0)
    })

    it('returns an empty Map for mixed valid and invalid styleIds — stub filters invalid', async () => {
      const result = await repo.getForStyles([VALID_UUID, 'not-a-uuid'])
      expect(result).toBeInstanceOf(Map)
      expect(result.size).toBe(0)
    })
  })

  describe('getForColor', () => {
    it('returns an empty array for a valid colorId — stub pending Wave 2 (#670)', async () => {
      const result = await repo.getForColor(VALID_UUID)
      expect(result).toEqual([])
    })

    it('returns an empty array for an invalid colorId — DAL validation', async () => {
      const result = await repo.getForColor('not-a-uuid')
      expect(result).toEqual([])
    })

    it('returns an empty array for an empty string colorId', async () => {
      const result = await repo.getForColor('')
      expect(result).toEqual([])
    })
  })
})
