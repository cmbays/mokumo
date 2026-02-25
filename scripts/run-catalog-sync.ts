/**
 * One-shot catalog sync script — run with:
 *   npx tsx -r ./scripts/mock-server-only.cjs scripts/run-catalog-sync.ts
 */
import dotenv from 'dotenv'
import { existsSync } from 'fs'

if (existsSync('.env.local')) dotenv.config({ path: '.env.local', override: false })

void (async () => {
  // Dynamic import so env is set before the module evaluates
  const { syncCatalogFromSupplier } =
    await import('../src/infrastructure/services/catalog-sync.service.js')

  console.log('Starting catalog sync...')
  const count = await syncCatalogFromSupplier()
  console.log(`Catalog sync complete — synced ${count} styles`)
})().catch((err) => {
  console.error('Catalog sync failed:', err)
  process.exit(1)
})
