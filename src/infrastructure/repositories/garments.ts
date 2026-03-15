import 'server-only'
import { z } from 'zod'

// Auth classification: PUBLIC — product catalog; no PII or financial data.
// Phase 2: May be exposed to unauthenticated customer-facing quote requests.
//
// Router: SUPPLIER_ADAPTER env var selects the data source.
//   - 'supabase-catalog' → Supabase PostgreSQL catalog table (Phase 1B+)
//   - 'ss-activewear'    → supplier provider via SSActivewearAdapter (real S&S API)
//   - 'mock'             → supplier provider via MockAdapter (no HTTP; for dev/CI)
//   - unset              → legacy mock provider (direct in-process data, no SupplierAdapter)
//
// Note: SUPPLIER_ADAPTER='mock' still routes through the supplier provider code path
// (SupplierAdapter registry, pagination, schema mapping). The MockAdapter returns
// fixture data with no HTTP calls — useful for exercising the full pipeline without
// S&S credentials. See lib/suppliers/registry.ts for adapter selection logic.
//
// getGarmentCatalogMutable() is Phase 1 only and always returns mock data.
import type { GarmentCatalog } from '@domain/entities/garment'
import type { NormalizedGarmentCatalog } from '@domain/entities/catalog-style'

import {
  getGarmentCatalog as getMockCatalog,
  getGarmentById as getMockById,
  getAvailableBrands as getMockBrands,
  getGarmentCatalogMutable,
} from '@infra/repositories/_providers/mock/garments'

import {
  getGarmentCatalog as getSupplierCatalog,
  getGarmentById as getSupplierById,
  getAvailableBrands as getSupplierBrands,
} from '@infra/repositories/_providers/supplier/garments'

type GarmentProvider = 'supabase-catalog' | 'supplier' | 'mock'

function getActiveProvider(): GarmentProvider {
  const adapter = process.env.SUPPLIER_ADAPTER
  if (adapter === 'supabase-catalog') return 'supabase-catalog'
  if (adapter) return 'supplier'
  return 'mock'
}

// Dynamic import: supabase provider is server-only and only loaded when SUPPLIER_ADAPTER=supabase-catalog
let supabaseGarmentsModule:
  | typeof import('@infra/repositories/_providers/supabase/garments')
  | null = null

async function loadSupabaseGarmentsModule() {
  if (!supabaseGarmentsModule) {
    supabaseGarmentsModule = await import('@infra/repositories/_providers/supabase/garments')
  }
  return supabaseGarmentsModule
}

let supabaseCatalogModule: typeof import('@infra/repositories/_providers/supabase/catalog') | null =
  null

async function loadSupabaseCatalogModule() {
  if (!supabaseCatalogModule) {
    supabaseCatalogModule = await import('@infra/repositories/_providers/supabase/catalog')
  }
  return supabaseCatalogModule
}

async function getSupabaseCatalog(): Promise<GarmentCatalog[]> {
  const mod = await loadSupabaseGarmentsModule()
  return mod.getGarmentCatalog()
}

async function getSupabaseById(id: string): Promise<GarmentCatalog | null> {
  const mod = await loadSupabaseGarmentsModule()
  return mod.getGarmentById(id)
}

async function getSupabaseBrands(): Promise<string[]> {
  const mod = await loadSupabaseGarmentsModule()
  return mod.getAvailableBrands()
}

export async function getGarmentCatalog(): Promise<GarmentCatalog[]> {
  const provider = getActiveProvider()
  if (provider === 'supabase-catalog') return getSupabaseCatalog()
  if (provider === 'supplier') return getSupplierCatalog()
  return getMockCatalog()
}

export async function getGarmentById(id: string): Promise<GarmentCatalog | null> {
  const provider = getActiveProvider()
  if (provider === 'supabase-catalog') return getSupabaseById(id)
  if (provider === 'supplier') return getSupplierById(id)
  return getMockById(id)
}

export async function getAvailableBrands(): Promise<string[]> {
  const provider = getActiveProvider()
  if (provider === 'supabase-catalog') return getSupabaseBrands()
  if (provider === 'supplier') return getSupplierBrands()
  return getMockBrands()
}

/**
 * Fetch normalized catalog styles (with colors and images).
 * Only available in supabase-catalog mode. Returns [] in mock/supplier mode.
 */
export async function getNormalizedCatalog(): Promise<NormalizedGarmentCatalog[]> {
  if (getActiveProvider() !== 'supabase-catalog') return []
  const mod = await loadSupabaseCatalogModule()
  return mod.getNormalizedCatalog()
}

/**
 * Fetch slim style metadata (Tier 1) — no colors, no images, with precomputed cardImageUrl.
 * Cached 60s per shopId. Only available in supabase-catalog mode. Returns [] otherwise.
 */
export async function getCatalogStylesSlim(): Promise<
  import('@domain/entities/catalog-style').CatalogStyleMetadata[]
> {
  if (getActiveProvider() !== 'supabase-catalog') return []
  const mod = await loadSupabaseCatalogModule()
  return mod.getCatalogStylesSlim()
}

/**
 * Fetch slim color supplement (Tier 1 supplement) — name/hex1/colorGroupName per color, no images.
 * Cached 1h globally (tags: catalog, catalog-colors). Only available in supabase-catalog mode. Returns [] otherwise.
 */
export async function getCatalogColorSupplement(): Promise<
  import('@infra/repositories/_providers/supabase/catalog').CatalogColorSupplementRow[]
> {
  if (getActiveProvider() !== 'supabase-catalog') return []
  const mod = await loadSupabaseCatalogModule()
  return mod.getCatalogColorSupplement()
}

/**
 * Fetch full color + image data for a single style (Tier 2, lazy on drawer open).
 * Only available in supabase-catalog mode. Returns [] otherwise.
 */
const styleIdSchema = z.string().min(1).max(100)

export async function getCatalogStyleDetail(styleId: string): Promise<{
  colors: import('@domain/entities/catalog-style').CatalogColor[]
  sizes: import('@domain/entities/catalog-style').CatalogSize[]
  basePrice: number | null
}> {
  if (!styleIdSchema.safeParse(styleId).success) return { colors: [], sizes: [], basePrice: null }
  if (getActiveProvider() !== 'supabase-catalog') return { colors: [], sizes: [], basePrice: null }
  const mod = await loadSupabaseCatalogModule()
  return mod.getCatalogStyleDetail(styleId)
}

// Phase 1 mutable export - for development only, always returns mock data
// Client components should import from garments-phase1.ts instead
export { getGarmentCatalogMutable }

// Re-exported so app-layer files can import from '@infra/repositories/garments'
// without importing directly from the _providers/* subdirectory (architecture rule).
export type { CatalogColorSupplementRow } from './_providers/supabase/catalog'
