import { describe, it, expect } from 'vitest'
import { inventoryLevelSchema, styleInventorySchema } from '../inventory-level'

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

  it('accepts a valid level with zero quantity and a date', () => {
    const result = inventoryLevelSchema.safeParse({
      colorId: UUID_A,
      sizeId: UUID_B,
      quantity: 0,
      lastSyncedAt: new Date('2026-01-01T00:00:00.000Z'),
    })
    expect(result.success).toBe(true)
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
  it('accepts a full valid style inventory with levels', () => {
    const result = styleInventorySchema.safeParse({
      styleId: UUID_C,
      levels: [
        {
          colorId: UUID_A,
          sizeId: UUID_B,
          quantity: 25,
          lastSyncedAt: null,
        },
      ],
      totalQuantity: 25,
      hasLowStock: false,
      hasOutOfStock: false,
    })
    expect(result.success).toBe(true)
  })

  it('accepts empty levels with zero totalQuantity', () => {
    const result = styleInventorySchema.safeParse({
      styleId: UUID_C,
      levels: [],
      totalQuantity: 0,
      hasLowStock: false,
      hasOutOfStock: true,
    })
    expect(result.success).toBe(true)
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
})
