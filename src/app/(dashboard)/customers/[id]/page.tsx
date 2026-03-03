import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import {
  getCustomers,
  getCustomerById,
  getCustomerQuotes,
  getCustomerJobs,
  getCustomerInvoices,
  getCustomerArtworks,
  getCustomerNotes,
} from '@infra/repositories/customers'
import { listCustomerActivities } from '@infra/repositories/customer-activity'
import { getColors } from '@infra/repositories/colors'
import { getGarmentCatalog } from '@infra/repositories/garments'
import { money, round2, toNumber } from '@domain/lib/money'
import { Button } from '@shared/ui/primitives/button'
import { Topbar } from '@shared/ui/layouts/topbar'
import { buildBreadcrumbs, CRUMBS } from '@shared/lib/breadcrumbs'
import { CustomerDetailHeader } from './_components/CustomerDetailHeader'
import { CustomerTabs } from './_components/CustomerTabs'

export default async function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const customer = await getCustomerById(id)

  if (!customer) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <div className="rounded-lg border border-border bg-card p-8 text-center" role="alert">
          <h2 className="text-xl font-semibold text-foreground">Customer not found</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            This customer doesn&apos;t exist or has been removed.
          </p>
          <Button variant="outline" className="mt-4" asChild>
            <Link href="/customers">
              <ArrowLeft className="size-4" />
              Back to Customers
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  const [
    customerQuotes,
    customerJobs,
    customerInvoices,
    customerArtworks,
    notes,
    allCustomers,
    colors,
    garmentCatalog,
    initialActivityPage,
  ] = await Promise.all([
    getCustomerQuotes(id),
    getCustomerJobs(id),
    getCustomerInvoices(id),
    getCustomerArtworks(id),
    getCustomerNotes(id),
    getCustomers(),
    getColors(),
    getGarmentCatalog(),
    listCustomerActivities(id, { limit: 20 }),
  ])

  // Compute stats for the header
  const lifetimeRevenue = toNumber(
    customerQuotes
      .filter((q) => q.status === 'accepted')
      .reduce((sum, q) => sum.plus(money(q.total)), money(0))
  )
  const totalOrders = customerJobs.length
  const avgOrderValue =
    totalOrders > 0 ? toNumber(round2(money(lifetimeRevenue).div(totalOrders))) : 0
  const lastOrderDate =
    customerJobs.length > 0
      ? (customerJobs
          .map((j) => j.dueDate)
          .sort()
          .reverse()[0] ?? null)
      : null
  const referralCount = allCustomers.filter((c) => c.referredByCustomerId === id).length

  const stats = {
    lifetimeRevenue,
    totalOrders,
    avgOrderValue,
    lastOrderDate,
    referralCount,
    creditLimit: customer.creditLimit,
    outstandingBalance: 0, // Wave 2a: wire to getAccountBalance() when invoices cross-join is ready
  }

  return (
    <>
      <Topbar breadcrumbs={buildBreadcrumbs(CRUMBS.customers, { label: customer.company })} />
      <div className="mx-auto max-w-5xl space-y-6">
        {/* Header */}
        <CustomerDetailHeader customer={customer} stats={stats} />

        {/* Tabs */}
        <CustomerTabs
          customer={customer}
          customers={allCustomers}
          quotes={customerQuotes}
          jobs={customerJobs}
          invoices={customerInvoices}
          artworks={customerArtworks}
          notes={notes}
          colors={colors}
          garmentCatalog={garmentCatalog}
          initialActivities={initialActivityPage.items}
          initialHasMore={initialActivityPage.hasMore}
          initialNextCursor={initialActivityPage.nextCursor}
        />
      </div>
    </>
  )
}
