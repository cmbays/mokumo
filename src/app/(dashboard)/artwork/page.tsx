export const dynamic = 'force-dynamic'

import { db } from '@shared/lib/supabase/db'
import { artworkPieces } from '@db/schema/artworks'
import { eq, and, desc } from 'drizzle-orm'
import { Topbar } from '@shared/ui/layouts/topbar'
import { buildBreadcrumbs } from '@shared/lib/breadcrumbs'
import { ArtworkLibraryClient } from '@features/artwork/components/ArtworkLibraryClient'

export default async function ArtworkPage() {
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
