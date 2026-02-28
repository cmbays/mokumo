export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import { z } from 'zod'
import { Topbar } from '@shared/ui/layouts/topbar'
import { buildBreadcrumbs, CRUMBS } from '@shared/lib/breadcrumbs'
import { FavoritesConfigureClient } from './_components/FavoritesConfigureClient'

type Props = {
  searchParams: Promise<{ brand?: string }>
}

export default async function FavoritesConfigurePage({ searchParams }: Props) {
  const { brand: brandParam } = await searchParams

  // Validate brand UUID from query param
  const parsed = z.string().uuid().safeParse(brandParam)
  if (!parsed.success) notFound()
  const brandId = parsed.data

  const { verifySession } = await import('@infra/auth/session')
  const { getBrandConfigureData } = await import('../actions')

  const session = await verifySession()
  if (!session) notFound()

  const configureData = await getBrandConfigureData(session.shopId, brandId)
  if (!configureData) notFound()

  return (
    <>
      <Topbar
        breadcrumbs={buildBreadcrumbs(CRUMBS.garmentFavorites, {
          label: configureData.brand.name,
        })}
      />
      <FavoritesConfigureClient initialData={configureData} />
    </>
  )
}
