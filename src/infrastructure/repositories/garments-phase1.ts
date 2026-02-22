// Phase 1 exports - client-accessible garment functions
// These only use mock data and don't require database access
// Client components should import from this file, not from garments.ts
import { getGarmentCatalogMutable } from '@infra/repositories/_providers/mock/garments'

export { getGarmentCatalogMutable }
