# Supplier Adapter Layer Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build `lib/suppliers/` — the CanonicalStyle schema, SupplierAdapter interface, CacheStore, InMemoryCacheStore, MockAdapter, and registry — so external garment catalog data has a clean, testable abstraction layer ready for real S&S API integration.

**Architecture:** `lib/suppliers/` is a sibling to `lib/dal/`, not nested inside it. External catalog data (supplier APIs) is a different concern from app-owned data (DAL). Each adapter normalizes supplier responses into `CanonicalStyle`. The DAL's `garments.ts` (wired in a later wave) maps `CanonicalStyle` → `GarmentCatalog`. Full design: `docs/plans/2026-02-17-supplier-adapter-design.md`.

**Tech Stack:** TypeScript, Zod v4, Vitest, existing `DalError` from `lib/dal/_shared/errors.ts`

**Issue:** #159
**Worktree:** `~/Github/mokumo-worktrees/session-0217-supplier-adapter/`
**Branch:** `session/0217-supplier-adapter`
**Dev server:** `PORT=3003 npm run dev`

---

## Pre-flight

Before starting, from the worktree root:

```bash
npm test
```

Expected: all 529 tests pass. If not, stop and investigate.

---

## Task 1: Create `lib/suppliers/types.ts`

All Zod schemas and TypeScript interfaces for the supplier layer. No external deps — just Zod.

**Files:**

- Create: `lib/suppliers/types.ts`

### Step 1: Create the file

```typescript
// lib/suppliers/types.ts
import { z } from 'zod'

// ─── Image ────────────────────────────────────────────────────────────────────

export const canonicalImageTypeSchema = z.enum([
  'front',
  'back',
  'side',
  'on-model-front',
  'on-model-back',
  'on-model-side',
  'swatch',
  'direct-side',
])

export const canonicalImageSchema = z.object({
  type: canonicalImageTypeSchema,
  url: z.string().url(),
  size: z.enum(['small', 'medium', 'large']).optional(),
})

// ─── Color ────────────────────────────────────────────────────────────────────

export const canonicalColorSchema = z.object({
  name: z.string().min(1),
  hex1: z.string().nullable(),
  hex2: z.string().nullable(),
  images: z.array(canonicalImageSchema),
})

// ─── Size ─────────────────────────────────────────────────────────────────────

export const canonicalSizeSchema = z.object({
  name: z.string().min(1),
  sortOrder: z.number().int().nonnegative(),
  priceAdjustment: z.number().default(0),
})

// ─── Pricing ──────────────────────────────────────────────────────────────────

/**
 * Raw supplier prices — NOT for arithmetic.
 * Use big.js (lib/helpers/money.ts) whenever these values are used in calculations.
 */
export const canonicalPricingSchema = z.object({
  piecePrice: z.number().nonnegative().nullable(),
  dozenPrice: z.number().nonnegative().nullable(),
  casePrice: z.number().nonnegative().nullable(),
})

// ─── Supplier Name ────────────────────────────────────────────────────────────

export const supplierNameSchema = z.enum(['mock', 'ss-activewear', 'sanmar', 'alphabroder'])

// ─── CanonicalStyle ───────────────────────────────────────────────────────────

export const canonicalStyleSchema = z.object({
  supplierId: z.string().min(1),
  styleNumber: z.string().min(1),
  styleName: z.string().min(1),
  brand: z.string().min(1),
  description: z.string().default(''),
  categories: z.array(z.string()),
  colors: z.array(canonicalColorSchema),
  sizes: z.array(canonicalSizeSchema),
  pricing: canonicalPricingSchema,
  gtin: z.string().nullable(),
  supplier: supplierNameSchema,
  lastSynced: z.date().optional(),
})

export type CanonicalStyle = z.infer<typeof canonicalStyleSchema>
export type SupplierName = z.infer<typeof supplierNameSchema>
export type CanonicalColor = z.infer<typeof canonicalColorSchema>
export type CanonicalSize = z.infer<typeof canonicalSizeSchema>
export type CanonicalPricing = z.infer<typeof canonicalPricingSchema>

// ─── CacheStore ───────────────────────────────────────────────────────────────

export interface CacheStore {
  get<T>(key: string): Promise<T | null>
  set<T>(key: string, value: T, ttlSeconds: number): Promise<void>
  del(key: string): Promise<void>
}

// ─── SupplierAdapter ──────────────────────────────────────────────────────────

export const catalogSearchParamsSchema = z.object({
  brand: z.string().optional(),
  category: z.string().optional(),
  query: z.string().optional(),
  limit: z.number().int().positive().max(100).default(50),
  offset: z.number().int().nonnegative().default(0),
})

export type CatalogSearchParams = z.infer<typeof catalogSearchParamsSchema>

export interface CatalogSearchResult {
  styles: CanonicalStyle[]
  total: number
  hasMore: boolean
}

export interface HealthStatus {
  healthy: boolean
  supplier: string
  checkedAt: Date
  latencyMs?: number
  message?: string
}

export interface SupplierAdapter {
  readonly supplierName: string

  getStyle(styleId: string): Promise<CanonicalStyle | null>
  getStylesBatch(styleIds: string[]): Promise<CanonicalStyle[]>
  searchCatalog(params: CatalogSearchParams): Promise<CatalogSearchResult>
  getInventory(skuIds: string[]): Promise<Record<string, number>>
  getBrands(): Promise<string[]>
  getCategories(): Promise<string[]>
  healthCheck(): Promise<HealthStatus>
}
```

### Step 2: Type-check

```bash
npx tsc --noEmit
```

Expected: no errors.

### Step 3: Commit

```bash
git add lib/suppliers/types.ts
git commit -m "feat(suppliers): CanonicalStyle schema + SupplierAdapter interface (#159)"
```

---

## Task 2: Write and implement `InMemoryCacheStore`

**Files:**

- Create: `lib/suppliers/cache/in-memory.ts`
- Create: `lib/suppliers/__tests__/in-memory-cache.test.ts`

### Step 1: Write the failing tests first

```typescript
// lib/suppliers/__tests__/in-memory-cache.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { InMemoryCacheStore } from '../cache/in-memory'

describe('InMemoryCacheStore', () => {
  let cache: InMemoryCacheStore

  beforeEach(() => {
    cache = new InMemoryCacheStore()
  })

  it('returns null for missing key', async () => {
    expect(await cache.get('missing')).toBeNull()
  })

  it('stores and retrieves a value', async () => {
    await cache.set('key', { data: 42 }, 60)
    expect(await cache.get('key')).toEqual({ data: 42 })
  })

  it('returns null after TTL expires', async () => {
    vi.useFakeTimers()
    await cache.set('key', 'value', 1) // 1 second TTL
    vi.advanceTimersByTime(1001)
    expect(await cache.get<string>('key')).toBeNull()
    vi.useRealTimers()
  })

  it('returns value before TTL expires', async () => {
    vi.useFakeTimers()
    await cache.set('key', 'value', 10)
    vi.advanceTimersByTime(9000)
    expect(await cache.get<string>('key')).toBe('value')
    vi.useRealTimers()
  })

  it('del removes a stored key', async () => {
    await cache.set('key', 'value', 60)
    await cache.del('key')
    expect(await cache.get('key')).toBeNull()
  })

  it('del on missing key does not throw', async () => {
    await expect(cache.del('nonexistent')).resolves.toBeUndefined()
  })

  it('overwrites existing key', async () => {
    await cache.set('key', 'first', 60)
    await cache.set('key', 'second', 60)
    expect(await cache.get<string>('key')).toBe('second')
  })

  it('stores different types', async () => {
    await cache.set('num', 99, 60)
    await cache.set('arr', [1, 2, 3], 60)
    await cache.set('obj', { x: true }, 60)
    expect(await cache.get<number>('num')).toBe(99)
    expect(await cache.get<number[]>('arr')).toEqual([1, 2, 3])
    expect(await cache.get<object>('obj')).toEqual({ x: true })
  })
})
```

### Step 2: Run tests — verify they fail

```bash
npx vitest run lib/suppliers/__tests__/in-memory-cache.test.ts
```

Expected: FAIL — `Cannot find module '../cache/in-memory'`

### Step 3: Implement `InMemoryCacheStore`

```typescript
// lib/suppliers/cache/in-memory.ts
import type { CacheStore } from '../types'

export class InMemoryCacheStore implements CacheStore {
  private store = new Map<string, { value: unknown; expiresAt: number }>()

  async get<T>(key: string): Promise<T | null> {
    const entry = this.store.get(key)
    if (!entry || Date.now() > entry.expiresAt) return null
    return entry.value as T
  }

  async set<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
    this.store.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 })
  }

  async del(key: string): Promise<void> {
    this.store.delete(key)
  }
}
```

### Step 4: Run tests — verify they pass

```bash
npx vitest run lib/suppliers/__tests__/in-memory-cache.test.ts
```

Expected: 8 tests pass.

### Step 5: Run full suite — verify nothing broken

```bash
npm test
```

Expected: all tests pass.

### Step 6: Commit

```bash
git add lib/suppliers/cache/in-memory.ts lib/suppliers/__tests__/in-memory-cache.test.ts
git commit -m "feat(suppliers): InMemoryCacheStore with TTL support (#159)"
```

---

## Task 3: Write and implement `MockAdapter`

**Files:**

- Create: `lib/suppliers/adapters/mock.ts`
- Create: `lib/suppliers/__tests__/mock-adapter.test.ts`

### Step 1: Understand the mock garment data shape

The existing mock data lives in `lib/mock-data.ts`. Relevant exports:

- `garmentCatalog: GarmentCatalog[]` — array of garment styles, IDs like "gc-001"
- `GarmentCatalog` fields: `id`, `brand`, `sku`, `name`, `baseCategory`, `basePrice`, `availableColors` (string[]), `availableSizes` ({ name, order, priceAdjustment }[])

The MockAdapter maps these into `CanonicalStyle`:

- `supplierId` ← `garment.id`
- `styleNumber` ← `garment.sku`
- `styleName` ← `garment.name`
- `brand` ← `garment.brand`
- `description` ← `''` (mock has none)
- `categories` ← `[garment.baseCategory]`
- `colors` ← `garment.availableColors.map(id => ({ name: id, hex1: null, hex2: null, images: [] }))`
- `sizes` ← `garment.availableSizes.map(s => ({ name: s.name, sortOrder: s.order, priceAdjustment: s.priceAdjustment }))`
- `pricing.piecePrice` ← `garment.basePrice`, dozen/case ← `null`
- `gtin` ← `null`
- `supplier` ← `'mock'`

### Step 2: Write the failing tests first

```typescript
// lib/suppliers/__tests__/mock-adapter.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { MockAdapter } from '../adapters/mock'
import { InMemoryCacheStore } from '../cache/in-memory'
import type { SupplierAdapter } from '../types'

describe('MockAdapter', () => {
  let adapter: SupplierAdapter

  beforeEach(() => {
    adapter = new MockAdapter(new InMemoryCacheStore())
  })

  describe('supplierName', () => {
    it('is "mock"', () => {
      expect(adapter.supplierName).toBe('mock')
    })
  })

  describe('getStyle()', () => {
    it('returns null for unknown ID', async () => {
      expect(await adapter.getStyle('nonexistent')).toBeNull()
    })

    it('returns CanonicalStyle for known ID', async () => {
      const style = await adapter.getStyle('gc-001')
      expect(style).not.toBeNull()
      expect(style?.supplierId).toBe('gc-001')
      expect(style?.supplier).toBe('mock')
      expect(style?.styleNumber).toBeTruthy()
      expect(style?.brand).toBeTruthy()
      expect(style?.colors.length).toBeGreaterThan(0)
      expect(style?.sizes.length).toBeGreaterThan(0)
    })

    it('returned CanonicalStyle has null hex codes (mock data has none)', async () => {
      const style = await adapter.getStyle('gc-001')
      expect(style?.colors[0].hex1).toBeNull()
      expect(style?.colors[0].hex2).toBeNull()
    })

    it('returned CanonicalStyle has empty images array (mock has none)', async () => {
      const style = await adapter.getStyle('gc-001')
      expect(style?.colors[0].images).toEqual([])
    })

    it('returned CanonicalStyle has valid pricing', async () => {
      const style = await adapter.getStyle('gc-001')
      expect(typeof style?.pricing.piecePrice).toBe('number')
      expect(style?.pricing.dozenPrice).toBeNull()
      expect(style?.pricing.casePrice).toBeNull()
    })

    it('returned CanonicalStyle has null GTIN (mock has none)', async () => {
      const style = await adapter.getStyle('gc-001')
      expect(style?.gtin).toBeNull()
    })
  })

  describe('getStylesBatch()', () => {
    it('returns array of CanonicalStyles for known IDs', async () => {
      const styles = await adapter.getStylesBatch(['gc-001', 'gc-002'])
      expect(styles.length).toBe(2)
    })

    it('silently drops unknown IDs', async () => {
      const styles = await adapter.getStylesBatch(['gc-001', 'nonexistent', 'gc-002'])
      expect(styles.length).toBe(2)
    })

    it('returns empty array for all unknown IDs', async () => {
      const styles = await adapter.getStylesBatch(['x', 'y'])
      expect(styles).toEqual([])
    })

    it('returns empty array for empty input', async () => {
      const styles = await adapter.getStylesBatch([])
      expect(styles).toEqual([])
    })
  })

  describe('searchCatalog()', () => {
    it('returns all styles with empty params', async () => {
      const result = await adapter.searchCatalog({})
      expect(result.styles.length).toBeGreaterThan(0)
      expect(typeof result.total).toBe('number')
      expect(typeof result.hasMore).toBe('boolean')
    })

    it('filters by brand', async () => {
      const result = await adapter.searchCatalog({ brand: 'Gildan' })
      expect(result.styles.every((s) => s.brand === 'Gildan')).toBe(true)
    })

    it('filters by category', async () => {
      const result = await adapter.searchCatalog({ category: 't-shirts' })
      expect(result.styles.every((s) => s.categories.includes('t-shirts'))).toBe(true)
    })

    it('filters by query (matches styleName)', async () => {
      const result = await adapter.searchCatalog({ query: 'Tee' })
      expect(result.styles.length).toBeGreaterThan(0)
      expect(
        result.styles.every(
          (s) => s.styleName.toLowerCase().includes('tee') || s.brand.toLowerCase().includes('tee')
        )
      ).toBe(true)
    })

    it('respects limit', async () => {
      const result = await adapter.searchCatalog({ limit: 2 })
      expect(result.styles.length).toBeLessThanOrEqual(2)
    })

    it('returns hasMore true when results exceed limit', async () => {
      const allResult = await adapter.searchCatalog({})
      if (allResult.total > 1) {
        const limited = await adapter.searchCatalog({ limit: 1 })
        expect(limited.hasMore).toBe(true)
      }
    })
  })

  describe('getInventory()', () => {
    it('returns a record of skuId to qty', async () => {
      const inventory = await adapter.getInventory(['gc-001-black-M', 'gc-001-black-L'])
      expect(typeof inventory).toBe('object')
    })

    it('mock returns 999 for any SKU (simulates in-stock)', async () => {
      const inventory = await adapter.getInventory(['any-sku'])
      expect(inventory['any-sku']).toBe(999)
    })

    it('returns empty object for empty input', async () => {
      const inventory = await adapter.getInventory([])
      expect(inventory).toEqual({})
    })
  })

  describe('getBrands()', () => {
    it('returns a non-empty array of strings', async () => {
      const brands = await adapter.getBrands()
      expect(brands.length).toBeGreaterThan(0)
      expect(brands.every((b) => typeof b === 'string')).toBe(true)
    })

    it('returns sorted brands', async () => {
      const brands = await adapter.getBrands()
      expect(brands).toEqual([...brands].sort())
    })

    it('returns deduplicated brands', async () => {
      const brands = await adapter.getBrands()
      expect(brands.length).toBe(new Set(brands).size)
    })
  })

  describe('getCategories()', () => {
    it('returns a non-empty array of strings', async () => {
      const cats = await adapter.getCategories()
      expect(cats.length).toBeGreaterThan(0)
    })

    it('returns deduplicated categories', async () => {
      const cats = await adapter.getCategories()
      expect(cats.length).toBe(new Set(cats).size)
    })
  })

  describe('healthCheck()', () => {
    it('returns healthy: true', async () => {
      const health = await adapter.healthCheck()
      expect(health.healthy).toBe(true)
      expect(health.supplier).toBe('mock')
      expect(health.checkedAt).toBeInstanceOf(Date)
    })
  })
})
```

### Step 3: Run tests — verify they fail

```bash
npx vitest run lib/suppliers/__tests__/mock-adapter.test.ts
```

Expected: FAIL — `Cannot find module '../adapters/mock'`

### Step 4: Implement `MockAdapter`

```typescript
// lib/suppliers/adapters/mock.ts
import { garmentCatalog } from '@/lib/mock-data'
import type {
  SupplierAdapter,
  CanonicalStyle,
  CacheStore,
  CatalogSearchParams,
  CatalogSearchResult,
  HealthStatus,
} from '../types'
import { catalogSearchParamsSchema } from '../types'

const CACHE_TTL = {
  catalog: 86400, // 24h — static mock data
  inventory: 300, // 5min — mirrors volatile S&S inventory TTL
}

export class MockAdapter implements SupplierAdapter {
  readonly supplierName = 'mock'

  constructor(private readonly cache: CacheStore) {}

  private toCanonicalStyle(garment: (typeof garmentCatalog)[number]): CanonicalStyle {
    return {
      supplierId: garment.id,
      styleNumber: garment.sku,
      styleName: garment.name,
      brand: garment.brand,
      description: '',
      categories: [garment.baseCategory],
      colors: garment.availableColors.map((id) => ({
        name: id,
        hex1: null,
        hex2: null,
        images: [],
      })),
      sizes: garment.availableSizes.map((s) => ({
        name: s.name,
        sortOrder: s.order,
        priceAdjustment: s.priceAdjustment,
      })),
      pricing: {
        piecePrice: garment.basePrice,
        dozenPrice: null,
        casePrice: null,
      },
      gtin: null,
      supplier: 'mock',
    }
  }

  async getStyle(styleId: string): Promise<CanonicalStyle | null> {
    const cacheKey = `mock:style:${styleId}`
    const cached = await this.cache.get<CanonicalStyle>(cacheKey)
    if (cached) return cached

    const garment = garmentCatalog.find((g) => g.id === styleId)
    if (!garment) return null

    const style = this.toCanonicalStyle(garment)
    await this.cache.set(cacheKey, style, CACHE_TTL.catalog)
    return style
  }

  async getStylesBatch(styleIds: string[]): Promise<CanonicalStyle[]> {
    const results = await Promise.all(styleIds.map((id) => this.getStyle(id)))
    return results.filter((s): s is CanonicalStyle => s !== null)
  }

  async searchCatalog(params: CatalogSearchParams): Promise<CatalogSearchResult> {
    const { brand, category, query, limit, offset } = catalogSearchParamsSchema.parse(params)

    let results = garmentCatalog.map((g) => this.toCanonicalStyle(g))

    if (brand) results = results.filter((s) => s.brand === brand)
    if (category) results = results.filter((s) => s.categories.includes(category))
    if (query) {
      const q = query.toLowerCase()
      results = results.filter(
        (s) =>
          s.styleName.toLowerCase().includes(q) ||
          s.brand.toLowerCase().includes(q) ||
          s.styleNumber.toLowerCase().includes(q)
      )
    }

    const total = results.length
    const sliced = results.slice(offset, offset + limit)
    return { styles: sliced, total, hasMore: offset + sliced.length < total }
  }

  async getInventory(skuIds: string[]): Promise<Record<string, number>> {
    return Object.fromEntries(skuIds.map((id) => [id, 999]))
  }

  async getBrands(): Promise<string[]> {
    const brands = new Set(garmentCatalog.map((g) => g.brand))
    return Array.from(brands).sort()
  }

  async getCategories(): Promise<string[]> {
    const cats = new Set(garmentCatalog.map((g) => g.baseCategory))
    return Array.from(cats)
  }

  async healthCheck(): Promise<HealthStatus> {
    return {
      healthy: true,
      supplier: this.supplierName,
      checkedAt: new Date(),
    }
  }
}
```

### Step 5: Run tests — verify they pass

```bash
npx vitest run lib/suppliers/__tests__/mock-adapter.test.ts
```

Expected: all tests pass.

### Step 6: Run full suite

```bash
npm test
```

Expected: all tests pass (529 + new tests).

### Step 7: Commit

```bash
git add lib/suppliers/adapters/mock.ts lib/suppliers/__tests__/mock-adapter.test.ts
git commit -m "feat(suppliers): MockAdapter wrapping mock garment catalog (#159)"
```

---

## Task 4: Write and implement registry

**Files:**

- Create: `lib/suppliers/registry.ts`
- Create: `lib/suppliers/__tests__/registry.test.ts`

### Step 1: Write the failing tests first

```typescript
// lib/suppliers/__tests__/registry.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { getSupplierAdapter, _resetSupplierAdapter } from '../registry'

describe('getSupplierAdapter()', () => {
  const originalEnv = process.env.SUPPLIER_ADAPTER

  afterEach(() => {
    _resetSupplierAdapter()
    if (originalEnv === undefined) {
      delete process.env.SUPPLIER_ADAPTER
    } else {
      process.env.SUPPLIER_ADAPTER = originalEnv
    }
  })

  it('throws when SUPPLIER_ADAPTER is not set', () => {
    delete process.env.SUPPLIER_ADAPTER
    expect(() => getSupplierAdapter()).toThrow('SUPPLIER_ADAPTER')
  })

  it('throws when SUPPLIER_ADAPTER is an invalid value', () => {
    process.env.SUPPLIER_ADAPTER = 'bogus'
    expect(() => getSupplierAdapter()).toThrow('SUPPLIER_ADAPTER')
  })

  it('returns MockAdapter when SUPPLIER_ADAPTER=mock', () => {
    process.env.SUPPLIER_ADAPTER = 'mock'
    const adapter = getSupplierAdapter()
    expect(adapter.supplierName).toBe('mock')
  })

  it('returns the same instance on repeated calls (singleton)', () => {
    process.env.SUPPLIER_ADAPTER = 'mock'
    const a = getSupplierAdapter()
    const b = getSupplierAdapter()
    expect(a).toBe(b)
  })

  it('_resetSupplierAdapter clears singleton', () => {
    process.env.SUPPLIER_ADAPTER = 'mock'
    const a = getSupplierAdapter()
    _resetSupplierAdapter()
    const b = getSupplierAdapter()
    expect(a).not.toBe(b)
  })

  it('throws for ss-activewear (not yet implemented)', () => {
    process.env.SUPPLIER_ADAPTER = 'ss-activewear'
    expect(() => getSupplierAdapter()).toThrow('not yet implemented')
  })
})
```

### Step 2: Run tests — verify they fail

```bash
npx vitest run lib/suppliers/__tests__/registry.test.ts
```

Expected: FAIL — `Cannot find module '../registry'`

### Step 3: Implement the registry

```typescript
// lib/suppliers/registry.ts
import { DalError } from '@/lib/dal/_shared/errors'
import { InMemoryCacheStore } from './cache/in-memory'
import { MockAdapter } from './adapters/mock'
import type { SupplierAdapter } from './types'

const VALID_ADAPTERS = ['mock', 'ss-activewear'] as const
type AdapterName = (typeof VALID_ADAPTERS)[number]

let _adapter: SupplierAdapter | null = null

export function getSupplierAdapter(): SupplierAdapter {
  if (_adapter) return _adapter

  const name = process.env.SUPPLIER_ADAPTER
  if (!name || !VALID_ADAPTERS.includes(name as AdapterName)) {
    throw new DalError(
      'PROVIDER',
      `SUPPLIER_ADAPTER must be one of [${VALID_ADAPTERS.join(', ')}], got: '${name}'`
    )
  }

  const cache = new InMemoryCacheStore()

  if (name === 'mock') {
    _adapter = new MockAdapter(cache)
    return _adapter
  }

  throw new DalError('PROVIDER', `Adapter '${name}' not yet implemented`)
}

/** For testing only — resets the singleton so tests get a fresh adapter. */
export function _resetSupplierAdapter(): void {
  _adapter = null
}
```

### Step 4: Run tests — verify they pass

```bash
npx vitest run lib/suppliers/__tests__/registry.test.ts
```

Expected: all tests pass.

### Step 5: Run full suite

```bash
npm test
```

Expected: all tests pass.

### Step 6: Commit

```bash
git add lib/suppliers/registry.ts lib/suppliers/__tests__/registry.test.ts
git commit -m "feat(suppliers): registry with fail-closed singleton factory (#159)"
```

---

## Task 5: Schema validation tests

Tests to verify the Zod schemas reject bad data and accept good data.

**Files:**

- Create: `lib/suppliers/__tests__/canonical-style.test.ts`

### Step 1: Write the tests

```typescript
// lib/suppliers/__tests__/canonical-style.test.ts
import { describe, it, expect } from 'vitest'
import { canonicalStyleSchema, canonicalImageSchema, canonicalColorSchema } from '../types'

const validStyle = {
  supplierId: 'gc-001',
  styleNumber: '3001',
  styleName: 'Unisex Jersey Tee',
  brand: 'Bella+Canvas',
  categories: ['t-shirts'],
  colors: [{ name: 'Black', hex1: '#000000', hex2: null, images: [] }],
  sizes: [{ name: 'M', sortOrder: 2, priceAdjustment: 0 }],
  pricing: { piecePrice: 3.5, dozenPrice: null, casePrice: null },
  gtin: null,
  supplier: 'mock' as const,
}

describe('canonicalStyleSchema', () => {
  it('accepts a valid canonical style', () => {
    expect(() => canonicalStyleSchema.parse(validStyle)).not.toThrow()
  })

  it('applies default description when absent', () => {
    const parsed = canonicalStyleSchema.parse(validStyle)
    expect(parsed.description).toBe('')
  })

  it('rejects unknown supplier name', () => {
    expect(() =>
      canonicalStyleSchema.parse({ ...validStyle, supplier: 'unknown-supplier' })
    ).toThrow()
  })

  it('rejects negative pricing', () => {
    expect(() =>
      canonicalStyleSchema.parse({
        ...validStyle,
        pricing: { piecePrice: -1, dozenPrice: null, casePrice: null },
      })
    ).toThrow()
  })

  it('rejects empty styleNumber', () => {
    expect(() => canonicalStyleSchema.parse({ ...validStyle, styleNumber: '' })).toThrow()
  })
})

describe('canonicalImageSchema', () => {
  it('accepts a valid image', () => {
    expect(() =>
      canonicalImageSchema.parse({ type: 'front', url: 'https://example.com/img.jpg' })
    ).not.toThrow()
  })

  it('rejects invalid image type', () => {
    expect(() =>
      canonicalImageSchema.parse({ type: 'diagonal', url: 'https://example.com/img.jpg' })
    ).toThrow()
  })

  it('rejects non-URL string', () => {
    expect(() => canonicalImageSchema.parse({ type: 'front', url: 'not-a-url' })).toThrow()
  })
})

describe('canonicalColorSchema', () => {
  it('accepts null hex values', () => {
    const result = canonicalColorSchema.parse({ name: 'Black', hex1: null, hex2: null, images: [] })
    expect(result.hex1).toBeNull()
  })

  it('rejects empty name', () => {
    expect(() =>
      canonicalColorSchema.parse({ name: '', hex1: null, hex2: null, images: [] })
    ).toThrow()
  })
})
```

### Step 2: Run the tests

```bash
npx vitest run lib/suppliers/__tests__/canonical-style.test.ts
```

Expected: all tests pass (types.ts already exists).

### Step 3: Run full suite

```bash
npm test
```

Expected: all tests pass.

### Step 4: Commit

```bash
git add lib/suppliers/__tests__/canonical-style.test.ts
git commit -m "test(suppliers): CanonicalStyle schema validation tests (#159)"
```

---

## Task 6: Type-check + run complete suite

Final verification that everything compiles and all tests pass.

### Step 1: Type check

```bash
npx tsc --noEmit
```

Expected: no errors.

### Step 2: Run all tests

```bash
npm test
```

Expected: 529 original tests + new supplier tests — all pass.

### Step 3: Check for any leftover lint issues

```bash
npm run lint
```

Expected: no errors.

### Step 4: Final commit (if lint auto-fixed anything)

If lint changed files:

```bash
git add -A && git commit -m "chore(suppliers): lint fixes (#159)"
```

---

## Task 7: Open PR

### Step 1: Push branch

```bash
git push -u origin session/0217-supplier-adapter
```

### Step 2: Create PR

```bash
gh pr create \
  --title "feat(suppliers): SupplierAdapter layer — types, MockAdapter, registry (#159)" \
  --body "$(cat <<'EOF'
## Summary
- Introduces `lib/suppliers/` as a dedicated layer for external garment catalog data
- `CanonicalStyle` Zod schema — normalized product representation across all suppliers
- `SupplierAdapter` TypeScript interface — contract all adapters must satisfy
- `CacheStore` interface + `InMemoryCacheStore` implementation
- `MockAdapter` wrapping existing mock garment data through the adapter interface
- `getSupplierAdapter()` registry with fail-closed singleton factory
- Full test suite: schema validation, cache TTL, adapter contract, registry

## What this enables
- `SSActivewearAdapter` (#162) can be dropped in with zero changes to components
- `lib/dal/garments.ts` (future wave of #158) wires in via `getSupplierAdapter()`
- SanMar/alphabroder adapters are one new file + registry entry each

## Test plan
- [ ] `npm test` — all tests pass
- [ ] `npx tsc --noEmit` — no type errors
- [ ] `npm run lint` — no lint errors

Closes #159

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

---

## Acceptance Criteria Checklist

- [ ] `lib/suppliers/types.ts` — `SupplierAdapter`, `CanonicalStyle`, `CacheStore`, all sub-schemas
- [ ] `lib/suppliers/cache/in-memory.ts` — `InMemoryCacheStore` with TTL
- [ ] `lib/suppliers/adapters/mock.ts` — `MockAdapter` implementing full interface
- [ ] `lib/suppliers/registry.ts` — `getSupplierAdapter()` singleton, fail-closed
- [ ] Tests: schema validation, cache, adapter contract, registry
- [ ] All 529 existing tests still pass
- [ ] `tsc --noEmit` clean
- [ ] PR open against main
