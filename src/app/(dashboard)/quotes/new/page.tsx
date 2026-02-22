export const dynamic = 'force-dynamic'

import { Topbar } from '@shared/ui/layouts/topbar'
import { buildBreadcrumbs, CRUMBS } from '@shared/lib/breadcrumbs'
import { QuoteForm } from '../_components/QuoteForm'
import type { QuoteFormInitialData } from '../_components/QuoteForm'
import { getQuoteById } from '@infra/repositories/quotes'
import { getCustomers } from '@infra/repositories/customers'
import { getColors } from '@infra/repositories/colors'
import { getGarmentCatalog } from '@infra/repositories/garments'
import { getArtworks } from '@infra/repositories/artworks'

export default async function NewQuotePage({
  searchParams,
}: {
  searchParams: Promise<{ duplicate?: string; customer?: string }>
}) {
  const { duplicate, customer: customerParam } = await searchParams

  const [customers, colors, garmentCatalog, artworks] = await Promise.all([
    getCustomers(),
    getColors(),
    getGarmentCatalog(),
    getArtworks(),
  ])

  let initialData: QuoteFormInitialData | undefined

  let isDuplicate = false

  // Pre-fill customer if coming from customer detail page
  if (customerParam && !duplicate) {
    initialData = { customerId: customerParam }
  }

  if (duplicate) {
    const sourceQuote = await getQuoteById(duplicate)
    if (sourceQuote) {
      isDuplicate = true
      initialData = {
        customerId: sourceQuote.customerId,
        lineItems: sourceQuote.lineItems.map((item, i) => ({
          id: `dup-${i}`,
          garmentId: item.garmentId,
          colorId: item.colorId,
          sizes: { ...item.sizes },
          serviceType: item.serviceType,
          printLocationDetails: item.printLocationDetails.map((d) => ({
            location: d.location,
            colorCount: d.colorCount,
            setupFee: d.setupFee,
            artworkId: d.artworkId,
          })),
        })),
        discounts: sourceQuote.discounts
          .filter((d) => d.type !== 'contract')
          .map((d) => ({ ...d })),
        shipping: sourceQuote.shipping,
        artworkIds: [...sourceQuote.artworkIds],
        internalNotes: sourceQuote.internalNotes,
        customerNotes: sourceQuote.customerNotes,
      }
    }
  }

  return (
    <>
      <Topbar
        breadcrumbs={buildBreadcrumbs(CRUMBS.quotes, {
          label: isDuplicate ? 'Copy as New' : 'New Quote',
        })}
      />
      <div className="flex flex-col gap-6">
        <h1 className="text-2xl font-semibold tracking-tight">
          {isDuplicate ? 'Copy as New' : 'New Quote'}
        </h1>
        <QuoteForm
          key={duplicate || 'new'}
          mode="create"
          customers={customers}
          colors={colors}
          garmentCatalog={garmentCatalog}
          artworks={artworks}
          initialData={initialData}
        />
      </div>
    </>
  )
}
