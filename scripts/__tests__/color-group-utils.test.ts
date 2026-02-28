import { describe, it, expect } from 'vitest'
import { collectColorGroupPairs } from '../color-group-utils'

const BRAND_A = '00000000-0000-4000-8000-000000000001'
const BRAND_B = '00000000-0000-4000-8000-000000000002'
const STYLE_1 = 'aaaaaaaa-0000-4000-8000-000000000001' // belongs to BRAND_A
const STYLE_2 = 'aaaaaaaa-0000-4000-8000-000000000002' // belongs to BRAND_A
const STYLE_3 = 'aaaaaaaa-0000-4000-8000-000000000003' // belongs to BRAND_B

const brandMap = new Map([
  [STYLE_1, BRAND_A],
  [STYLE_2, BRAND_A],
  [STYLE_3, BRAND_B],
])

describe('collectColorGroupPairs', () => {
  it('extracts unique (brandId, colorGroupName) pairs across 2 brands', () => {
    const colorValues = [
      { styleId: STYLE_1, colorGroupName: 'Navy' },
      { styleId: STYLE_1, colorGroupName: 'Black' },
      { styleId: STYLE_2, colorGroupName: 'Navy' }, // duplicate — same brand + group
      { styleId: STYLE_2, colorGroupName: 'Royal Blue' },
      { styleId: STYLE_3, colorGroupName: 'Navy' }, // same group name, different brand — NOT duplicate
    ]

    const result = collectColorGroupPairs(colorValues, brandMap)

    expect(result).toHaveLength(4)
    expect(result).toContainEqual({ brandId: BRAND_A, colorGroupName: 'Navy' })
    expect(result).toContainEqual({ brandId: BRAND_A, colorGroupName: 'Black' })
    expect(result).toContainEqual({ brandId: BRAND_A, colorGroupName: 'Royal Blue' })
    expect(result).toContainEqual({ brandId: BRAND_B, colorGroupName: 'Navy' })
  })

  it('filters out null colorGroupName entries', () => {
    const colorValues = [
      { styleId: STYLE_1, colorGroupName: 'Navy' },
      { styleId: STYLE_1, colorGroupName: null },
      { styleId: STYLE_2, colorGroupName: null },
    ]

    const result = collectColorGroupPairs(colorValues, brandMap)

    expect(result).toHaveLength(1)
    expect(result[0]).toEqual({ brandId: BRAND_A, colorGroupName: 'Navy' })
  })

  it('skips styleIds not present in the brand map', () => {
    const unknownStyleId = 'ffffffff-0000-4000-8000-000000000000'
    const colorValues = [
      { styleId: unknownStyleId, colorGroupName: 'Navy' },
      { styleId: STYLE_1, colorGroupName: 'Black' },
    ]

    const result = collectColorGroupPairs(colorValues, brandMap)

    expect(result).toHaveLength(1)
    expect(result[0]).toEqual({ brandId: BRAND_A, colorGroupName: 'Black' })
  })

  it('is idempotent — re-running with same input produces same count', () => {
    const colorValues = [
      { styleId: STYLE_1, colorGroupName: 'Navy' },
      { styleId: STYLE_1, colorGroupName: 'Black' },
      { styleId: STYLE_3, colorGroupName: 'Navy' },
    ]

    const first = collectColorGroupPairs(colorValues, brandMap)
    const second = collectColorGroupPairs([...colorValues, ...colorValues], brandMap)

    // Doubling the input should not produce duplicates
    expect(second).toHaveLength(first.length)
  })

  it('returns empty array for empty input', () => {
    expect(collectColorGroupPairs([], brandMap)).toEqual([])
  })
})
