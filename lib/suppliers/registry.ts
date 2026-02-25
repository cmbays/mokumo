import { DalError } from '@infra/repositories/_shared/errors'
import { InMemoryCacheStore } from './cache/in-memory'
import { UpstashCacheStore } from './cache/upstash'
import { MockAdapter } from './adapters/mock'
import { SSActivewearAdapter } from './adapters/ss-activewear'
import { supplierNameSchema } from './types'
import type { CacheStore, SupplierAdapter, SupplierName } from './types'

const VALID_ADAPTERS = supplierNameSchema.options

let _adapter: SupplierAdapter | null = null

/**
 * Select the appropriate CacheStore based on available environment variables.
 * UpstashCacheStore is used when both Upstash env vars are set (production/staging).
 * InMemoryCacheStore is the fallback for local dev without Upstash credentials.
 */
function buildCacheStore(): CacheStore {
  const hasUpstash =
    Boolean(process.env.UPSTASH_REDIS_REST_URL) && Boolean(process.env.UPSTASH_REDIS_REST_TOKEN)
  return hasUpstash ? new UpstashCacheStore() : new InMemoryCacheStore()
}

export function getSupplierAdapter(): SupplierAdapter {
  if (_adapter) return _adapter

  const name = process.env.SUPPLIER_ADAPTER
  // `includes` requires a cast: string is not narrowable to SupplierName via overload resolution
  if (!name || !VALID_ADAPTERS.includes(name as SupplierName)) {
    throw new DalError(
      'PROVIDER',
      `SUPPLIER_ADAPTER must be one of [${VALID_ADAPTERS.join(', ')}], got: '${name}'`
    )
  }

  const cache = buildCacheStore()

  if (name === 'mock') {
    _adapter = new MockAdapter(cache)
    return _adapter
  }

  if (name === 'ss-activewear') {
    const fallback = new MockAdapter(cache)
    _adapter = new SSActivewearAdapter(cache, fallback)
    return _adapter
  }

  throw new DalError('PROVIDER', `Adapter '${name}' not yet implemented`)
}

/**
 * Returns an S&S Activewear adapter unconditionally — for use by the catalog
 * sync service, which always fetches from S&S regardless of how SUPPLIER_ADAPTER
 * is configured for the app-level garment routing (e.g. 'supabase-catalog').
 */
export function getSsActivewearAdapter(): SupplierAdapter {
  const cache = buildCacheStore()
  const fallback = new MockAdapter(cache)
  return new SSActivewearAdapter(cache, fallback)
}

/** For testing only — resets the singleton so tests get a fresh adapter. */
export function _resetSupplierAdapter(): void {
  _adapter = null
}
