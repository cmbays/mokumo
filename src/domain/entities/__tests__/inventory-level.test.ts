import { describe, it, expect } from 'vitest'
import { inventoryLevelSchema, styleInventorySchema, LOW_STOCK_THRESHOLD } from '../inventory-level'

const UUID_A = '00000000-0000-4000-8000-000000000001'
const UUID_B = '00000000-0000-4000-8000-000000000002'
const UUID_C = '00000000-0000-4000-8000-000000000003'

describe('inventoryLevelSchema', () => {
  it('accepts a valid level with null lastSyncedAt', () => {
    const result = inventoryLevelSchema.safeParse({
      colorId: UUID_A,
      sizeId: UUID_B,
      quantity: 50,
      lastSyncedAt: null,
    })
    expect(result.success).toBe(true)
  })

  it('accepts a valid level with zero quantity and an ISO datetime string', () => {
    const result = inventoryLevelSchema.safeParse({
      colorId: UUID_A,
      sizeId: UUID_B,
      quantity: 0,
      lastSyncedAt: '2026-01-01T00:00:00.000Z',
    })
    expect(result.success).toBe(true)
  })

  it('rejects a Date object for lastSyncedAt — Drizzle adapter must call .toISOString()', () => {
    const result = inventoryLevelSchema.safeParse({
      colorId: UUID_A,
      sizeId: UUID_B,
      quantity: 10,
      lastSyncedAt: new Date('2026-01-01T00:00:00.000Z'),
    })
    expect(result.success).toBe(false)
  })

  it('rejects a plain date string without time component', () => {
    const result = inventoryLevelSchema.safeParse({
      colorId: UUID_A,
      sizeId: UUID_B,
      quantity: 10,
      lastSyncedAt: '2026-01-01',
    })
    expect(result.success).toBe(false)
  })

  it('rejects negative quantity', () => {
    const result = inventoryLevelSchema.safeParse({
      colorId: UUID_A,
      sizeId: UUID_B,
      quantity: -1,
      lastSyncedAt: null,
    })
    expect(result.success).toBe(false)
  })

  it('rejects non-integer quantity', () => {
    const result = inventoryLevelSchema.safeParse({
      colorId: UUID_A,
      sizeId: UUID_B,
      quantity: 3.5,
      lastSyncedAt: null,
    })
    expect(result.success).toBe(false)
  })

  it('rejects an invalid colorId', () => {
    const result = inventoryLevelSchema.safeParse({
      colorId: 'not-a-uuid',
      sizeId: UUID_B,
      quantity: 10,
      lastSyncedAt: null,
    })
    expect(result.success).toBe(false)
  })

  it('rejects an invalid sizeId', () => {
    const result = inventoryLevelSchema.safeParse({
      colorId: UUID_A,
      sizeId: 'not-a-uuid',
      quantity: 10,
      lastSyncedAt: null,
    })
    expect(result.success).toBe(false)
  })

  it('rejects a missing lastSyncedAt field', () => {
    const result = inventoryLevelSchema.safeParse({
      colorId: UUID_A,
      sizeId: UUID_B,
      quantity: 10,
    })
    expect(result.success).toBe(false)
  })
})

describe('styleInventorySchema', () => {
  it('accepts a full valid style inventory with levels above threshold', () => {
    // quantity 25 > LOW_STOCK_THRESHOLD (12) → hasLowStock false
    const result = styleInventorySchema.safeParse({
      styleId: UUID_C,
      levels: [{ colorId: UUID_A, sizeId: UUID_B, quantity: 25, lastSyncedAt: null }],
      totalQuantity: 25,
      hasLowStock: false,
      hasOutOfStock: false,
    })
    expect(result.success).toBe(true)
  })

  it('accepts a style with a low-stock level', () => {
    // quantity 5 is 0 < 5 < LOW_STOCK_THRESHOLD → hasLowStock true
    const result = styleInventorySchema.safeParse({
      styleId: UUID_C,
      levels: [{ colorId: UUID_A, sizeId: UUID_B, quantity: 5, lastSyncedAt: null }],
      totalQuantity: 5,
      hasLowStock: true,
      hasOutOfStock: false,
    })
    expect(result.success).toBe(true)
  })

  it('accepts a style with an out-of-stock level', () => {
    const result = styleInventorySchema.safeParse({
      styleId: UUID_C,
      levels: [{ colorId: UUID_A, sizeId: UUID_B, quantity: 0, lastSyncedAt: null }],
      totalQuantity: 0,
      hasLowStock: false,
      hasOutOfStock: true,
    })
    expect(result.success).toBe(true)
  })

  it('accepts empty levels — all computed booleans must be false', () => {
    // No levels → no items out of stock or low stock
    const result = styleInventorySchema.safeParse({
      styleId: UUID_C,
      levels: [],
      totalQuantity: 0,
      hasLowStock: false,
      hasOutOfStock: false,
    })
    expect(result.success).toBe(true)
  })

  it('rejects nested level with invalid colorId', () => {
    const result = styleInventorySchema.safeParse({
      styleId: UUID_C,
      levels: [{ colorId: 'not-a-uuid', sizeId: UUID_B, quantity: 10, lastSyncedAt: null }],
      totalQuantity: 10,
      hasLowStock: false,
      hasOutOfStock: false,
    })
    expect(result.success).toBe(false)
  })

  it('rejects when totalQuantity does not match the sum of level quantities', () => {
    const result = styleInventorySchema.safeParse({
      styleId: UUID_C,
      levels: [{ colorId: UUID_A, sizeId: UUID_B, quantity: 25, lastSyncedAt: null }],
      totalQuantity: 99, // wrong — should be 25
      hasLowStock: false,
      hasOutOfStock: false,
    })
    expect(result.success).toBe(false)
  })

  it('rejects when hasOutOfStock does not match levels', () => {
    const result = styleInventorySchema.safeParse({
      styleId: UUID_C,
      levels: [{ colorId: UUID_A, sizeId: UUID_B, quantity: 25, lastSyncedAt: null }],
      totalQuantity: 25,
      hasLowStock: false,
      hasOutOfStock: true, // wrong — quantity 25 is not 0
    })
    expect(result.success).toBe(false)
  })

  it('rejects when hasLowStock does not match levels', () => {
    const result = styleInventorySchema.safeParse({
      styleId: UUID_C,
      levels: [{ colorId: UUID_A, sizeId: UUID_B, quantity: 5, lastSyncedAt: null }],
      totalQuantity: 5,
      hasLowStock: false, // wrong — 0 < 5 < LOW_STOCK_THRESHOLD
      hasOutOfStock: false,
    })
    expect(result.success).toBe(false)
  })

  it('rejects an invalid styleId', () => {
    const result = styleInventorySchema.safeParse({
      styleId: 'not-a-uuid',
      levels: [],
      totalQuantity: 0,
      hasLowStock: false,
      hasOutOfStock: false,
    })
    expect(result.success).toBe(false)
  })

  it('rejects negative totalQuantity', () => {
    const result = styleInventorySchema.safeParse({
      styleId: UUID_C,
      levels: [],
      totalQuantity: -5,
      hasLowStock: false,
      hasOutOfStock: false,
    })
    expect(result.success).toBe(false)
  })

  it('rejects non-boolean hasLowStock', () => {
    const result = styleInventorySchema.safeParse({
      styleId: UUID_C,
      levels: [],
      totalQuantity: 0,
      hasLowStock: 'yes',
      hasOutOfStock: false,
    })
    expect(result.success).toBe(false)
  })

  it('rejects non-boolean hasOutOfStock', () => {
    const result = styleInventorySchema.safeParse({
      styleId: UUID_C,
      levels: [],
      totalQuantity: 0,
      hasLowStock: false,
      hasOutOfStock: 1,
    })
    expect(result.success).toBe(false)
  })

  it('rejects non-integer totalQuantity', () => {
    const result = styleInventorySchema.safeParse({
      styleId: UUID_C,
      levels: [],
      totalQuantity: 2.5,
      hasLowStock: false,
      hasOutOfStock: false,
    })
    expect(result.success).toBe(false)
  })

  it('LOW_STOCK_THRESHOLD is exported as a number', () => {
    expect(typeof LOW_STOCK_THRESHOLD).toBe('number')
    expect(LOW_STOCK_THRESHOLD).toBeGreaterThan(0)
  })
})
