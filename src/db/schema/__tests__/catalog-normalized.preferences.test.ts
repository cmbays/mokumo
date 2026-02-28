import { describe, it, expect } from 'vitest'
import { getTableName } from 'drizzle-orm'
import {
  catalogColorGroups,
  catalogBrandPreferences,
  catalogColorGroupPreferences,
} from '../catalog-normalized'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const PG_INLINE_FK = Symbol.for('drizzle:PgInlineForeignKeys')

type InlineFK = {
  reference: () => { foreignTable: object; columns: { name: string }[] }
  onDelete: string | undefined
  onUpdate: string | undefined
}

function getFKs(table: object): InlineFK[] {
  return ((table as Record<symbol, InlineFK[]>)[PG_INLINE_FK] ?? []) as InlineFK[]
}

function fkTo(table: object, targetTableName: string): InlineFK | undefined {
  return getFKs(table).find(
    (fk) =>
      getTableName(fk.reference().foreignTable as Parameters<typeof getTableName>[0]) ===
      targetTableName
  )
}

// ─── catalog_color_groups ─────────────────────────────────────────────────────

describe('catalogColorGroups', () => {
  it('has required columns', () => {
    expect(catalogColorGroups.id).toBeDefined()
    expect(catalogColorGroups.brandId).toBeDefined()
    expect(catalogColorGroups.colorGroupName).toBeDefined()
    expect(catalogColorGroups.createdAt).toBeDefined()
    expect(catalogColorGroups.updatedAt).toBeDefined()
  })

  it('maps to table name "catalog_color_groups"', () => {
    expect(getTableName(catalogColorGroups)).toBe('catalog_color_groups')
  })

  it('colorGroupName is varchar(100)', () => {
    const col = catalogColorGroups.colorGroupName as {
      columnType: string
      length?: number
    }
    expect(col.columnType).toBe('PgVarchar')
    expect(col.length).toBe(100)
  })

  it('brandId has CASCADE FK to catalog_brands', () => {
    const fk = fkTo(catalogColorGroups, 'catalog_brands')
    expect(fk).toBeDefined()
    expect(fk?.onDelete).toBe('cascade')
  })
})

// ─── catalog_brand_preferences ────────────────────────────────────────────────

describe('catalogBrandPreferences', () => {
  it('has required columns', () => {
    expect(catalogBrandPreferences.id).toBeDefined()
    expect(catalogBrandPreferences.scopeType).toBeDefined()
    expect(catalogBrandPreferences.scopeId).toBeDefined()
    expect(catalogBrandPreferences.brandId).toBeDefined()
    expect(catalogBrandPreferences.isEnabled).toBeDefined()
    expect(catalogBrandPreferences.isFavorite).toBeDefined()
    expect(catalogBrandPreferences.createdAt).toBeDefined()
    expect(catalogBrandPreferences.updatedAt).toBeDefined()
  })

  it('maps to table name "catalog_brand_preferences"', () => {
    expect(getTableName(catalogBrandPreferences)).toBe('catalog_brand_preferences')
  })

  it('scopeType defaults to "shop"', () => {
    const col = catalogBrandPreferences.scopeType as { default?: string }
    expect(col.default).toBe('shop')
  })

  it('isEnabled is nullable boolean (tristate: NULL | true | false)', () => {
    // notNull: false is intentional — NULL means "unset" (different from false = explicitly off)
    const col = catalogBrandPreferences.isEnabled as { notNull: boolean }
    expect(col.notNull).toBe(false)
  })

  it('isFavorite is nullable boolean (tristate)', () => {
    const col = catalogBrandPreferences.isFavorite as { notNull: boolean }
    expect(col.notNull).toBe(false)
  })

  it('brandId has CASCADE FK to catalog_brands', () => {
    const fk = fkTo(catalogBrandPreferences, 'catalog_brands')
    expect(fk).toBeDefined()
    expect(fk?.onDelete).toBe('cascade')
  })
})

// ─── catalog_color_group_preferences ──────────────────────────────────────────

describe('catalogColorGroupPreferences', () => {
  it('has required columns', () => {
    expect(catalogColorGroupPreferences.id).toBeDefined()
    expect(catalogColorGroupPreferences.scopeType).toBeDefined()
    expect(catalogColorGroupPreferences.scopeId).toBeDefined()
    expect(catalogColorGroupPreferences.colorGroupId).toBeDefined()
    expect(catalogColorGroupPreferences.isFavorite).toBeDefined()
    expect(catalogColorGroupPreferences.createdAt).toBeDefined()
    expect(catalogColorGroupPreferences.updatedAt).toBeDefined()
  })

  it('maps to table name "catalog_color_group_preferences"', () => {
    expect(getTableName(catalogColorGroupPreferences)).toBe('catalog_color_group_preferences')
  })

  it('scopeType defaults to "shop"', () => {
    const col = catalogColorGroupPreferences.scopeType as { default?: string }
    expect(col.default).toBe('shop')
  })

  it('isFavorite is nullable boolean (tristate)', () => {
    const col = catalogColorGroupPreferences.isFavorite as { notNull: boolean }
    expect(col.notNull).toBe(false)
  })

  it('colorGroupId has CASCADE FK to catalog_color_groups', () => {
    const fk = fkTo(catalogColorGroupPreferences, 'catalog_color_groups')
    expect(fk).toBeDefined()
    expect(fk?.onDelete).toBe('cascade')
  })
})
