export const dynamic = 'force-dynamic'

import { Topbar } from '@shared/ui/layouts/topbar'
import { buildBreadcrumbs } from '@shared/lib/breadcrumbs'
import { ArtworkLibraryClient } from '@features/artwork/components/ArtworkLibraryClient'

export default async function ArtworkPage() {
  // Dynamic import: db.ts throws at module-evaluation time when DATABASE_URL is absent
  // (e.g. during Next.js build). Importing inside the function body defers the throw
  // to request time when the env var is guaranteed present. See garments/page.tsx.
  const { db } = await import('@shared/lib/supabase/db')
  const { artworkPieces } = await import('@db/schema/artworks')
  const { eq, and, desc } = await import('drizzle-orm')

  const pieces = await db
    .select()
    .from(artworkPieces)
    .where(and(eq(artworkPieces.shopId, 'shop_4ink'), eq(artworkPieces.scope, 'shop')))
    .orderBy(desc(artworkPieces.createdAt))

  return (
    <>
      <Topbar breadcrumbs={buildBreadcrumbs({ label: 'Artwork', href: '/artwork' })} />
      <ArtworkLibraryClient initialPieces={pieces} />
    </>
  )
}
