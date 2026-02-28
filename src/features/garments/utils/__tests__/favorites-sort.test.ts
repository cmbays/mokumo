import { describe, it, expect } from 'vitest'
import { sortColorGroupsByFavorites } from '../favorites-sort'
import type { FilterColorGroup } from '@features/garments/types'

const makeGroup = (
  colorGroupName: string,
  colorFamilyName: string | null = 'Blues'
): FilterColorGroup => ({
  colorGroupName,
  colorFamilyName,
  hex: '#000000',
  swatchTextColor: '#ffffff',
})

describe('sortColorGroupsByFavorites', () => {
  it('moves favorited groups to the front', () => {
    const groups = [makeGroup('Black'), makeGroup('Navy'), makeGroup('Royal Blue')]
    const favorites = new Set(['Royal Blue', 'Navy'])
    const result = sortColorGroupsByFavorites(groups, favorites)
    expect(result[0].colorGroupName).toBe('Navy')
    expect(result[1].colorGroupName).toBe('Royal Blue')
    expect(result[2].colorGroupName).toBe('Black')
  })

  it('preserves relative order within favorited groups', () => {
    const groups = [makeGroup('Navy'), makeGroup('Royal Blue'), makeGroup('Black')]
    const favorites = new Set(['Royal Blue', 'Navy'])
    const result = sortColorGroupsByFavorites(groups, favorites)
    expect(result[0].colorGroupName).toBe('Navy')
    expect(result[1].colorGroupName).toBe('Royal Blue')
  })

  it('preserves relative order within non-favorited groups', () => {
    const groups = [makeGroup('Black'), makeGroup('White'), makeGroup('Navy'), makeGroup('Grey')]
    const favorites = new Set(['Navy'])
    const result = sortColorGroupsByFavorites(groups, favorites)
    expect(result[0].colorGroupName).toBe('Navy')
    expect(result.slice(1).map((g) => g.colorGroupName)).toEqual(['Black', 'White', 'Grey'])
  })

  it('returns original order when no favorites', () => {
    const groups = [makeGroup('Black'), makeGroup('Navy'), makeGroup('White')]
    const result = sortColorGroupsByFavorites(groups, new Set())
    expect(result.map((g) => g.colorGroupName)).toEqual(['Black', 'Navy', 'White'])
  })

  it('returns original order when all are favorited', () => {
    const groups = [makeGroup('Black'), makeGroup('Navy'), makeGroup('White')]
    const favorites = new Set(['Black', 'Navy', 'White'])
    const result = sortColorGroupsByFavorites(groups, favorites)
    expect(result.map((g) => g.colorGroupName)).toEqual(['Black', 'Navy', 'White'])
  })

  it('returns empty array for empty input', () => {
    expect(sortColorGroupsByFavorites([], new Set(['Navy']))).toEqual([])
  })

  it('does not mutate the original array', () => {
    const groups = [makeGroup('Black'), makeGroup('Navy')]
    const original = groups.map((g) => g.colorGroupName)
    sortColorGroupsByFavorites(groups, new Set(['Navy']))
    expect(groups.map((g) => g.colorGroupName)).toEqual(original)
  })
})
