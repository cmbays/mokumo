/**
 * One-shot catalog sync script — run with:
 *   npx tsx -r ./scripts/mock-server-only.cjs scripts/run-catalog-sync.ts
 */
import dotenv from 'dotenv'
import { existsSync } from 'fs'

if (existsSync('.env.local')) dotenv.config({ path: '.env.local', override: false })

void (async () => {
  // Dynamic import so env is set before the module evaluates
  const { syncStylesFromSupplier } =
    await import('../src/infrastructure/services/styles-sync.service.js')

  console.log('Starting styles sync...')
  const count = await syncStylesFromSupplier()
  console.log(`Styles sync complete — synced ${count} styles`)
})().catch((err) => {
  console.error('Styles sync failed:', err)
  process.exit(1)
})
