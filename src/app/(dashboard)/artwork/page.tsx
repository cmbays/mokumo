import { db } from '@shared/lib/supabase/db'
import { artworkVersions } from '@db/schema/artworks'
import { eq, desc } from 'drizzle-orm'
import { Topbar } from '@shared/ui/layouts/topbar'
import { buildBreadcrumbs } from '@shared/lib/breadcrumbs'
import { ArtworkLibraryClient } from '@features/artwork/components/ArtworkLibraryClient'

export default async function ArtworkPage() {
  const artworks = await db
    .select()
    .from(artworkVersions)
    .where(eq(artworkVersions.shopId, 'shop_4ink'))
    .orderBy(desc(artworkVersions.createdAt))

  return (
    <>
      <Topbar breadcrumbs={buildBreadcrumbs({ label: 'Artwork', href: '/artwork' })} />
      <ArtworkLibraryClient initialArtworks={artworks} />
    </>
  )
}
