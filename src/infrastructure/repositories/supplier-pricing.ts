import 'server-only'

// Auth classification: PUBLIC — supplier pricing; no PII or financial data.
// Router: SUPPLIER_ADAPTER env var selects the data source.
//   - 'supabase-catalog' → Supabase PostgreSQL marts tables (dbt-managed)
//   - everything else    → mock provider (fixture data, for dev/CI)
import type { StructuredSupplierPricing } from '@domain/entities/supplier-pricing'

import {
  getStylePricing as getMockStylePricing,
  getStylesPricing as getMockStylesPricing,
} from '@infra/repositories/_providers/mock/supplier-pricing'

function isSupabaseCatalogMode(): boolean {
  return process.env.SUPPLIER_ADAPTER === 'supabase-catalog'
}

// Dynamic import: supabase provider is server-only and only loaded when needed
let supabaseModule:
  | typeof import('@infra/repositories/_providers/supabase/supplier-pricing')
  | null = null

async function loadSupabaseModule() {
  if (!supabaseModule) {
    supabaseModule = await import('@infra/repositories/_providers/supabase/supplier-pricing')
  }
  return supabaseModule
}

export async function getStylePricing(
  styleId: string,
  source: string
): Promise<StructuredSupplierPricing | null> {
  if (isSupabaseCatalogMode()) {
    const mod = await loadSupabaseModule()
    return mod.getStylePricing(styleId, source)
  }
  return getMockStylePricing(styleId, source)
}

export async function getStylesPricing(
  styleIds: string[],
  source: string
): Promise<Map<string, StructuredSupplierPricing>> {
  if (isSupabaseCatalogMode()) {
    const mod = await loadSupabaseModule()
    return mod.getStylesPricing(styleIds, source)
  }
  return getMockStylesPricing(styleIds, source)
}
