import { describe, it, expect, vi, afterEach } from 'vitest'
import * as moneyModule from '@domain/lib/money'
import type { RushTier } from '@domain/entities/pricing-template'

// Mock the server actions to avoid server-only guard during testing
vi.mock('@/app/(dashboard)/settings/pricing/pricing-templates-actions', () => ({
  saveRushTiers: vi.fn(),
}))
import {
  tiersToRows,
  rowsToInserts,
  addTierRow,
  removeTierRow,
  updateTierField,
  type RushTierRow,
} from '../RushTierEditor'

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

const SHOP_ID = 'aaaaaaaa-0000-4000-8000-000000000001'

function makeTier(
  overrides: Partial<RushTier> & { id?: string } = {}
): RushTier {
  return {
    id: overrides.id ?? 'tier-aaa',
    shopId: SHOP_ID,
    name: overrides.name ?? 'Same-Day',
    daysUnderStandard: overrides.daysUnderStandard ?? 5,
    flatFee: overrides.flatFee ?? 50,
    pctSurcharge: overrides.pctSurcharge ?? 0.25, // 25%
    displayOrder: overrides.displayOrder ?? 0,
    ...overrides,
  }
}

function makeRow(overrides: Partial<RushTierRow> = {}): RushTierRow {
  return {
    localKey: 'key-aaa',
    name: 'Rush',
    daysUnderStandard: 3,
    flatFee: 25,
    pctDisplay: 15,
    ...overrides,
  }
}

afterEach(() => {
  vi.restoreAllMocks()
})

// ---------------------------------------------------------------------------
// tiersToRows
// ---------------------------------------------------------------------------

describe('tiersToRows', () => {
  it('converts pctSurcharge fraction to display percentage', () => {
    const tier = makeTier({ pctSurcharge: 0.25 })
    const rows = tiersToRows([tier])
    expect(rows[0].pctDisplay).toBe(25)
  })

  it('converts pctSurcharge 0.10 → 10', () => {
    const tier = makeTier({ pctSurcharge: 0.1 })
    const rows = tiersToRows([tier])
    expect(rows[0].pctDisplay).toBe(10)
  })

  it('sorts tiers by displayOrder ascending', () => {
    const tiers = [
      makeTier({ id: 'a', displayOrder: 2, name: 'C' }),
      makeTier({ id: 'b', displayOrder: 0, name: 'A' }),
      makeTier({ id: 'c', displayOrder: 1, name: 'B' }),
    ]
    const rows = tiersToRows(tiers)
    expect(rows.map((r) => r.name)).toEqual(['A', 'B', 'C'])
  })

  it('uses tier id as localKey', () => {
    const tier = makeTier({ id: 'my-tier-id' })
    const rows = tiersToRows([tier])
    expect(rows[0].localKey).toBe('my-tier-id')
  })

  it('preserves flatFee, name, and daysUnderStandard', () => {
    const tier = makeTier({ name: 'Overnight', flatFee: 100, daysUnderStandard: 10 })
    const rows = tiersToRows([tier])
    expect(rows[0].name).toBe('Overnight')
    expect(rows[0].flatFee).toBe(100)
    expect(rows[0].daysUnderStandard).toBe(10)
  })

  it('returns empty array for empty input', () => {
    expect(tiersToRows([])).toHaveLength(0)
  })
})

// ---------------------------------------------------------------------------
// rowsToInserts
// ---------------------------------------------------------------------------

describe('rowsToInserts', () => {
  it('converts display percentage back to fraction', () => {
    const rows = [makeRow({ pctDisplay: 25 })]
    const inserts = rowsToInserts(rows)
    expect(inserts[0].pctSurcharge).toBeCloseTo(0.25)
  })

  it('converts 10% display → 0.10 fraction', () => {
    const rows = [makeRow({ pctDisplay: 10 })]
    const inserts = rowsToInserts(rows)
    expect(inserts[0].pctSurcharge).toBe(0.1)
  })

  it('sets displayOrder to array index position', () => {
    const rows = [makeRow({ localKey: 'a' }), makeRow({ localKey: 'b' }), makeRow({ localKey: 'c' })]
    const inserts = rowsToInserts(rows)
    expect(inserts[0].displayOrder).toBe(0)
    expect(inserts[1].displayOrder).toBe(1)
    expect(inserts[2].displayOrder).toBe(2)
  })

  it('rounds flatFee to 2 decimal places', () => {
    const rows = [makeRow({ flatFee: 25.555 })]
    const inserts = rowsToInserts(rows)
    expect(inserts[0].flatFee).toBe(25.56)
  })

  it('preserves name and daysUnderStandard', () => {
    const rows = [makeRow({ name: 'Next Day', daysUnderStandard: 7 })]
    const inserts = rowsToInserts(rows)
    expect(inserts[0].name).toBe('Next Day')
    expect(inserts[0].daysUnderStandard).toBe(7)
  })

  it('uses big.js for pctSurcharge conversion (not native division)', () => {
    const moneySpy = vi.spyOn(moneyModule, 'money')
    rowsToInserts([makeRow({ pctDisplay: 10 })])
    expect(moneySpy).toHaveBeenCalled()
  })
})

// ---------------------------------------------------------------------------
// addTierRow
// ---------------------------------------------------------------------------

describe('addTierRow', () => {
  it('appends one row to the end', () => {
    const rows = [makeRow({ localKey: 'existing' })]
    const result = addTierRow(rows)
    expect(result).toHaveLength(2)
    expect(result[0].localKey).toBe('existing')
  })

  it('new row has default blank values', () => {
    const result = addTierRow([])
    expect(result[0].name).toBe('')
    expect(result[0].daysUnderStandard).toBe(1)
    expect(result[0].flatFee).toBe(0)
    expect(result[0].pctDisplay).toBe(0)
  })

  it('new row has a non-empty localKey string', () => {
    const result = addTierRow([])
    expect(typeof result[0].localKey).toBe('string')
    expect(result[0].localKey.length).toBeGreaterThan(0)
  })

  it('does not mutate the original array', () => {
    const rows = [makeRow()]
    const original = [...rows]
    addTierRow(rows)
    expect(rows).toHaveLength(original.length)
  })
})

// ---------------------------------------------------------------------------
// removeTierRow
// ---------------------------------------------------------------------------

describe('removeTierRow', () => {
  it('removes the row matching localKey', () => {
    const rows = [makeRow({ localKey: 'a' }), makeRow({ localKey: 'b' })]
    const result = removeTierRow(rows, 'a')
    expect(result).toHaveLength(1)
    expect(result[0].localKey).toBe('b')
  })

  it('returns unchanged array when localKey not present', () => {
    const rows = [makeRow({ localKey: 'a' })]
    const result = removeTierRow(rows, 'not-found')
    expect(result).toHaveLength(1)
  })

  it('returns empty array when removing the only row', () => {
    const rows = [makeRow({ localKey: 'only' })]
    expect(removeTierRow(rows, 'only')).toHaveLength(0)
  })
})

// ---------------------------------------------------------------------------
// updateTierField
// ---------------------------------------------------------------------------

describe('updateTierField', () => {
  it('updates the specified field on the matching row', () => {
    const rows = [makeRow({ localKey: 'a', name: 'Old Name' })]
    const result = updateTierField(rows, 'a', 'name', 'New Name')
    expect(result[0].name).toBe('New Name')
  })

  it('preserves other rows unchanged', () => {
    const rows = [makeRow({ localKey: 'a' }), makeRow({ localKey: 'b', name: 'Keep Me' })]
    const result = updateTierField(rows, 'a', 'name', 'Changed')
    expect(result[1].name).toBe('Keep Me')
  })

  it('preserves other fields on the updated row', () => {
    const row = makeRow({ localKey: 'a', flatFee: 99, daysUnderStandard: 7 })
    const result = updateTierField([row], 'a', 'name', 'New')
    expect(result[0].flatFee).toBe(99)
    expect(result[0].daysUnderStandard).toBe(7)
  })

  it('works for numeric fields (pctDisplay)', () => {
    const rows = [makeRow({ localKey: 'a', pctDisplay: 0 })]
    const result = updateTierField(rows, 'a', 'pctDisplay', 30)
    expect(result[0].pctDisplay).toBe(30)
  })

  it('does not mutate the original row', () => {
    const original = makeRow({ localKey: 'a', name: 'Original' })
    updateTierField([original], 'a', 'name', 'Changed')
    expect(original.name).toBe('Original')
  })
})
