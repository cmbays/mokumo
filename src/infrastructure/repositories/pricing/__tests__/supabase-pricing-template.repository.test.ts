import { describe, it, expect, vi, beforeEach } from 'vitest'

// vi.hoisted ensures mock functions are available inside vi.mock() factories,
// which Vitest hoists to the top of the file before const declarations resolve.
const {
  mockWhere,
  mockAnd,
  mockFrom,
  mockSelect,
  mockSet,
  mockUpdateWhere,
  mockUpdateReturning,
  mockUpdate,
  mockInsertValues,
  mockInsertReturning,
  mockInsert,
  mockDeleteWhere,
  mockDelete,
  mockOrderBy,
  mockTransaction,
} = vi.hoisted(() => {
  const mockUpdateReturning = vi.fn()
  const mockUpdateWhere = vi.fn(() => ({ returning: mockUpdateReturning }))
  const mockSet = vi.fn(() => ({ where: mockUpdateWhere }))
  const mockUpdate = vi.fn(() => ({ set: mockSet }))

  const mockInsertReturning = vi.fn()
  const mockInsertValues = vi.fn(() => ({ returning: mockInsertReturning }))
  const mockInsert = vi.fn(() => ({ values: mockInsertValues }))

  const mockDeleteWhere = vi.fn()
  const mockDelete = vi.fn(() => ({ where: mockDeleteWhere }))

  // mockWhere is untyped (vi.fn() with no default return) so mockResolvedValueOnce
  // can be called with any value (array for terminal queries, object for chained queries).
  // getRushTiers chains .where().orderBy() — call mockWhere.mockReturnValueOnce({ orderBy: mockOrderBy })
  // then mockOrderBy.mockResolvedValueOnce(arr) in that test only.
  const mockOrderBy = vi.fn()
  const mockWhere = vi.fn()
  const mockFrom = vi.fn(() => ({ where: mockWhere }))
  const mockSelect = vi.fn(() => ({ from: mockFrom }))
  const mockAnd = vi.fn((a: unknown, b: unknown, c: unknown) => ({ a, b, c }))

  // Transaction mock: immediately calls the callback with a tx object that has the same methods
  type MockTx = { delete: typeof mockDelete; insert: typeof mockInsert; update: typeof mockUpdate }
  const mockTransaction = vi.fn(async (callback: (tx: MockTx) => Promise<void>) => {
    const tx: MockTx = {
      delete: mockDelete,
      insert: mockInsert,
      update: mockUpdate,
    }
    await callback(tx)
  })

  return {
    mockWhere,
    mockAnd,
    mockFrom,
    mockSelect,
    mockSet,
    mockUpdateWhere,
    mockUpdateReturning,
    mockUpdate,
    mockInsertValues,
    mockInsertReturning,
    mockInsert,
    mockDeleteWhere,
    mockDelete,
    mockOrderBy,
    mockTransaction,
  }
})

vi.mock('server-only', () => ({}))
vi.mock('@shared/lib/logger', () => ({
  logger: {
    child: () => ({ warn: vi.fn(), error: vi.fn(), info: vi.fn() }),
  },
}))
vi.mock('drizzle-orm', async (importOriginal) => {
  const actual = await importOriginal<typeof import('drizzle-orm')>()
  return { ...actual, and: mockAnd, ne: vi.fn((col: unknown, val: unknown) => ({ col, val, op: 'ne' })) }
})
vi.mock('@shared/lib/supabase/db', () => ({
  db: {
    select: mockSelect,
    update: mockUpdate,
    insert: mockInsert,
    delete: mockDelete,
    transaction: mockTransaction,
  },
}))

import { SupabasePricingTemplateRepository } from '../supabase-pricing-template.repository'

// ─── Test UUIDs ───────────────────────────────────────────────────────────────

const SHOP_UUID = '00000000-0000-4000-8000-000000004e6b'
const TEMPLATE_UUID = '00000000-0000-4000-8000-000000000001'

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const TEMPLATE_ROW = {
  id: TEMPLATE_UUID,
  shopId: SHOP_UUID,
  name: 'Standard Screen Print',
  serviceType: 'screen-print',
  interpolationMode: 'linear' as const,
  setupFeePerColor: 15,
  sizeUpchargeXxl: 2,
  standardTurnaroundDays: 7,
  isDefault: true,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
}

const CELL_ROW = {
  id: '00000000-0000-4000-8000-000000000002',
  templateId: TEMPLATE_UUID,
  qtyAnchor: 24,
  colorCount: 2,
  costPerPiece: 5.5,
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('SupabasePricingTemplateRepository', () => {
  let repo: SupabasePricingTemplateRepository

  beforeEach(() => {
    vi.clearAllMocks()
    repo = new SupabasePricingTemplateRepository()
  })

  // ─── getDefaultTemplate ───────────────────────────────────────────────────

  describe('getDefaultTemplate', () => {
    it('returns null for an invalid shopId', async () => {
      const result = await repo.getDefaultTemplate('not-a-uuid', 'screen-print')
      expect(result).toBeNull()
      expect(mockSelect).not.toHaveBeenCalled()
    })

    it('returns null when no default template exists', async () => {
      mockWhere.mockResolvedValueOnce([]) // template query returns empty
      const result = await repo.getDefaultTemplate(SHOP_UUID, 'screen-print')
      expect(result).toBeNull()
    })

    it('returns template with cells when default template exists', async () => {
      mockWhere
        .mockResolvedValueOnce([TEMPLATE_ROW]) // template query
        .mockResolvedValueOnce([CELL_ROW]) // cells query
      const result = await repo.getDefaultTemplate(SHOP_UUID, 'screen-print')
      expect(result).not.toBeNull()
      expect(result?.id).toBe(TEMPLATE_UUID)
      expect(result?.cells).toHaveLength(1)
      expect(result?.cells[0]?.qtyAnchor).toBe(24)
    })

    it('throws when the DB query fails', async () => {
      mockWhere.mockRejectedValueOnce(new Error('DB error'))
      await expect(repo.getDefaultTemplate(SHOP_UUID, 'screen-print')).rejects.toThrow('DB error')
    })
  })

  // ─── getTemplateById ──────────────────────────────────────────────────────

  describe('getTemplateById', () => {
    it('returns null for an invalid id', async () => {
      const result = await repo.getTemplateById('bad-id')
      expect(result).toBeNull()
    })

    it('returns null when template does not exist', async () => {
      mockWhere.mockResolvedValueOnce([])
      const result = await repo.getTemplateById(TEMPLATE_UUID)
      expect(result).toBeNull()
    })

    it('returns template with empty cells array when no cells exist', async () => {
      mockWhere
        .mockResolvedValueOnce([TEMPLATE_ROW]) // template query
        .mockResolvedValueOnce([]) // cells query — empty
      const result = await repo.getTemplateById(TEMPLATE_UUID)
      expect(result?.cells).toHaveLength(0)
    })

    it('returns template with cells', async () => {
      mockWhere
        .mockResolvedValueOnce([TEMPLATE_ROW])
        .mockResolvedValueOnce([CELL_ROW, { ...CELL_ROW, id: 'cell-2', colorCount: 1 }])
      const result = await repo.getTemplateById(TEMPLATE_UUID)
      expect(result?.cells).toHaveLength(2)
    })
  })

  // ─── listTemplates ────────────────────────────────────────────────────────

  describe('listTemplates', () => {
    it('returns empty array for an invalid shopId', async () => {
      const result = await repo.listTemplates('not-a-uuid')
      expect(result).toEqual([])
    })

    it('returns template rows for a valid shopId', async () => {
      mockWhere.mockResolvedValueOnce([TEMPLATE_ROW])
      const result = await repo.listTemplates(SHOP_UUID)
      expect(result).toHaveLength(1)
    })
  })

  // ─── upsertTemplate ───────────────────────────────────────────────────────

  describe('upsertTemplate', () => {
    it('inserts a new template when no id is provided', async () => {
      mockInsertReturning.mockResolvedValueOnce([TEMPLATE_ROW])
      const { id: _id, createdAt: _c, updatedAt: _u, ...insertData } = TEMPLATE_ROW
      const result = await repo.upsertTemplate(insertData)
      expect(mockInsert).toHaveBeenCalled()
      expect(result.name).toBe('Standard Screen Print')
    })

    it('updates an existing template when id is provided', async () => {
      mockUpdateReturning.mockResolvedValueOnce([TEMPLATE_ROW])
      const result = await repo.upsertTemplate(TEMPLATE_ROW)
      expect(mockUpdate).toHaveBeenCalled()
      expect(result.id).toBe(TEMPLATE_UUID)
    })

    it('throws when update returns no row', async () => {
      mockUpdateReturning.mockResolvedValueOnce([])
      await expect(repo.upsertTemplate(TEMPLATE_ROW)).rejects.toThrow('no row returned')
    })

    it('throws when insert returns no row', async () => {
      mockInsertReturning.mockResolvedValueOnce([])
      const { id: _id, createdAt: _c, updatedAt: _u, ...insertData } = TEMPLATE_ROW
      await expect(repo.upsertTemplate(insertData)).rejects.toThrow('insert returned no row')
    })
  })

  // ─── upsertMatrixCells ────────────────────────────────────────────────────

  describe('upsertMatrixCells', () => {
    it('returns early for an invalid templateId without calling DB', async () => {
      await repo.upsertMatrixCells('bad-id', [])
      expect(mockTransaction).not.toHaveBeenCalled()
    })

    it('deletes existing cells and inserts new ones in a transaction', async () => {
      const cells = [{ templateId: TEMPLATE_UUID, qtyAnchor: 24, colorCount: 2, costPerPiece: 5.5 }]
      await repo.upsertMatrixCells(TEMPLATE_UUID, cells)
      expect(mockTransaction).toHaveBeenCalled()
      expect(mockDelete).toHaveBeenCalled()
      expect(mockInsert).toHaveBeenCalled()
    })

    it('only deletes (no insert) when cells array is empty', async () => {
      await repo.upsertMatrixCells(TEMPLATE_UUID, [])
      expect(mockTransaction).toHaveBeenCalled()
      expect(mockDelete).toHaveBeenCalled()
      expect(mockInsert).not.toHaveBeenCalled()
    })
  })

  // ─── getMarkupRules ───────────────────────────────────────────────────────

  describe('getMarkupRules', () => {
    it('returns empty array for an invalid shopId', async () => {
      const result = await repo.getMarkupRules('not-a-uuid')
      expect(result).toEqual([])
    })

    it('returns markup rules for a valid shopId', async () => {
      const rule = { id: 'r1', shopId: SHOP_UUID, garmentCategory: 'tshirt', markupMultiplier: 2.0 }
      mockWhere.mockResolvedValueOnce([rule])
      const result = await repo.getMarkupRules(SHOP_UUID)
      expect(result).toHaveLength(1)
      expect(result[0]?.garmentCategory).toBe('tshirt')
    })
  })

  // ─── upsertMarkupRules ────────────────────────────────────────────────────

  describe('upsertMarkupRules', () => {
    it('returns early for an invalid shopId', async () => {
      await repo.upsertMarkupRules('bad-id', [])
      expect(mockTransaction).not.toHaveBeenCalled()
    })

    it('replaces all markup rules in a transaction', async () => {
      const rules = [{ shopId: SHOP_UUID, garmentCategory: 'tshirt', markupMultiplier: 2.0 }]
      await repo.upsertMarkupRules(SHOP_UUID, rules)
      expect(mockTransaction).toHaveBeenCalled()
      expect(mockDelete).toHaveBeenCalled()
      expect(mockInsert).toHaveBeenCalled()
    })
  })

  // ─── getRushTiers ─────────────────────────────────────────────────────────

  describe('getRushTiers', () => {
    it('returns empty array for an invalid shopId', async () => {
      const result = await repo.getRushTiers('not-a-uuid')
      expect(result).toEqual([])
    })

    it('returns tiers ordered by displayOrder', async () => {
      const tier = {
        id: 't1',
        shopId: SHOP_UUID,
        name: 'Next Day',
        daysUnderStandard: 6,
        flatFee: 30,
        pctSurcharge: 0.1,
        displayOrder: 1,
      }
      // getRushTiers chains .where().orderBy() — set up both mocks
      mockWhere.mockReturnValueOnce({ orderBy: mockOrderBy })
      mockOrderBy.mockResolvedValueOnce([tier])
      const result = await repo.getRushTiers(SHOP_UUID)
      expect(result).toHaveLength(1)
      expect(result[0]?.name).toBe('Next Day')
    })
  })

  // ─── upsertRushTiers ──────────────────────────────────────────────────────

  describe('upsertRushTiers', () => {
    it('returns early for an invalid shopId', async () => {
      await repo.upsertRushTiers('bad-id', [])
      expect(mockTransaction).not.toHaveBeenCalled()
    })

    it('replaces all rush tiers in a transaction', async () => {
      const tiers = [
        {
          shopId: SHOP_UUID,
          name: 'Next Day',
          daysUnderStandard: 6,
          flatFee: 30,
          pctSurcharge: 0.1,
          displayOrder: 1,
        },
      ]
      await repo.upsertRushTiers(SHOP_UUID, tiers)
      expect(mockTransaction).toHaveBeenCalled()
      expect(mockDelete).toHaveBeenCalled()
      expect(mockInsert).toHaveBeenCalled()
    })

    it('only deletes when tiers array is empty', async () => {
      await repo.upsertRushTiers(SHOP_UUID, [])
      expect(mockTransaction).toHaveBeenCalled()
      expect(mockDelete).toHaveBeenCalled()
      expect(mockInsert).not.toHaveBeenCalled()
    })
  })

  // ─── listTemplates (serviceType filter) ───────────────────────────────────

  describe('listTemplates (with serviceType)', () => {
    it('filters by serviceType when provided', async () => {
      mockWhere.mockResolvedValueOnce([TEMPLATE_ROW])
      const result = await repo.listTemplates(SHOP_UUID, 'screen-print')
      expect(result).toHaveLength(1)
      // and() should be called to combine shopId + serviceType conditions
      expect(mockAnd).toHaveBeenCalled()
    })

    it('returns all templates when serviceType is omitted', async () => {
      mockWhere.mockResolvedValueOnce([TEMPLATE_ROW])
      const result = await repo.listTemplates(SHOP_UUID)
      expect(result).toHaveLength(1)
    })
  })

  // ─── deleteTemplate ───────────────────────────────────────────────────────

  describe('deleteTemplate', () => {
    it('returns early for an invalid id', async () => {
      await repo.deleteTemplate('bad-id', SHOP_UUID)
      expect(mockDelete).not.toHaveBeenCalled()
    })

    it('returns early for an invalid shopId', async () => {
      await repo.deleteTemplate(TEMPLATE_UUID, 'bad-shop')
      expect(mockDelete).not.toHaveBeenCalled()
    })

    it('deletes the template with both id and shopId as conditions', async () => {
      mockDeleteWhere.mockResolvedValueOnce(undefined)
      await repo.deleteTemplate(TEMPLATE_UUID, SHOP_UUID)
      expect(mockDelete).toHaveBeenCalled()
      expect(mockDeleteWhere).toHaveBeenCalled()
    })

    it('throws when the DB delete fails', async () => {
      mockDeleteWhere.mockRejectedValueOnce(new Error('DB error'))
      await expect(repo.deleteTemplate(TEMPLATE_UUID, SHOP_UUID)).rejects.toThrow('DB error')
    })
  })

  // ─── setDefaultTemplate ───────────────────────────────────────────────────

  describe('setDefaultTemplate', () => {
    it('returns early for an invalid shopId', async () => {
      await repo.setDefaultTemplate('bad-shop', TEMPLATE_UUID, 'screen-print')
      expect(mockTransaction).not.toHaveBeenCalled()
    })

    it('returns early for an invalid id', async () => {
      await repo.setDefaultTemplate(SHOP_UUID, 'bad-id', 'screen-print')
      expect(mockTransaction).not.toHaveBeenCalled()
    })

    it('runs two UPDATE statements in a transaction', async () => {
      await repo.setDefaultTemplate(SHOP_UUID, TEMPLATE_UUID, 'screen-print')
      expect(mockTransaction).toHaveBeenCalled()
      // update is called twice: once to clear defaults, once to set the target
      expect(mockUpdate).toHaveBeenCalledTimes(2)
    })

    it('throws when the transaction fails', async () => {
      mockTransaction.mockRejectedValueOnce(new Error('TX error'))
      await expect(
        repo.setDefaultTemplate(SHOP_UUID, TEMPLATE_UUID, 'screen-print')
      ).rejects.toThrow('TX error')
    })
  })
})
