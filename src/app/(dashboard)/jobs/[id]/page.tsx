import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@shared/ui/primitives/button'
import { getJobById } from '@infra/repositories/jobs'
import { getCustomerById } from '@infra/repositories/customers'
import { getQuoteById } from '@infra/repositories/quotes'
import { getInvoiceById } from '@infra/repositories/invoices'
import { getGarmentById } from '@infra/repositories/garments'
import { getArtworks } from '@infra/repositories/artworks'
import { normalizePosition } from '@domain/constants/print-zones'
import { JobDetail } from './_components/JobDetail'
import type { ArtworkPlacement } from '@features/quotes/components/mockup'

export default async function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const job = await getJobById(id)

  if (!job) {
    return (
      <div className="flex flex-col items-center justify-center p-6 py-24">
        <div className="rounded-lg border border-border bg-card p-8 text-center" role="alert">
          <h2 className="text-xl font-semibold text-foreground">Job not found</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            This job doesn&apos;t exist or has been removed.
          </p>
          <Button variant="outline" className="mt-4" asChild>
            <Link href="/jobs/board">
              <ArrowLeft className="size-4" />
              Back to Jobs
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  const garmentId = job.garmentDetails[0]?.garmentId

  const [customer, quote, invoice, garment, artworks] = await Promise.all([
    getCustomerById(job.customerId),
    job.sourceQuoteId ? getQuoteById(job.sourceQuoteId) : Promise.resolve(null),
    job.invoiceId ? getInvoiceById(job.invoiceId) : Promise.resolve(null),
    garmentId ? getGarmentById(garmentId) : Promise.resolve(null),
    getArtworks(),
  ])

  const customerName = customer?.company ?? customer?.name ?? 'Unknown'
  const quoteTotal = quote?.total
  const invoiceStatus = invoice?.status

  const mockupData = garment
    ? {
        garmentCategory: garment.baseCategory,
        artworkPlacements: job.printLocations
          .map((loc, i) => {
            const artworkId = i < job.artworkIds.length ? job.artworkIds[i] : undefined
            const artwork = artworkId ? artworks.find((a) => a.id === artworkId) : undefined
            return {
              artworkUrl: artwork?.thumbnailUrl ?? '',
              position: normalizePosition(loc.position),
            }
          })
          .filter((p): p is ArtworkPlacement => Boolean(p.artworkUrl)),
      }
    : null

  return (
    <JobDetail
      initialJob={job}
      customerName={customerName}
      quoteTotal={quoteTotal}
      invoiceStatus={invoiceStatus}
      mockupData={mockupData}
    />
  )
}
