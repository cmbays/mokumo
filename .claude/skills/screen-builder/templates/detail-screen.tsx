// Template: Detail Screen
// Use for: Job Detail, Quote Detail, Customer Detail
// Adapt: sections, layout (two-column vs single), cross-links, not-found handling
//
// This is structural guidance — adapt to the specific screen's APP_FLOW entry.
// Do NOT copy-paste without reading APP_FLOW for this route.

// Detail pages are typically server components (no hooks needed)
// Add "use client" only if interactive features require it

import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@shared/ui/primitives/card'
import { Badge } from '@shared/ui/primitives/badge'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@shared/ui/primitives/breadcrumb'
// import { StatusBadge } from "@features/{vertical}/components/status-badge";
// import { PriorityBadge } from "@features/{vertical}/components/priority-badge";
import { ArrowLeft } from 'lucide-react'
import { cn } from '@shared/lib/cn'

// Import mock data + constants
// import data from your domain layer
// import { PRODUCTION_STATE_LABELS } from "@domain/constants";

// Next.js dynamic route params
interface PageProps {
  params: Promise<{ id: string }>
}

export default async function ExampleDetailPage({ params }: PageProps) {
  const { id } = await params

  // Look up item in mock data
  // const item = items.find((i) => i.id === id);
  // if (!item) {
  //   return (
  //     <div className="space-y-6">
  //       <div className="rounded-md border border-error/30 bg-error/10 p-4" role="alert">
  //         <p className="text-sm font-medium text-error">Item not found</p>
  //         <p className="text-sm text-muted-foreground mt-1">
  //           This item may have been removed.{" "}
  //           <Link href="/items" className="text-action underline">Back to list</Link>
  //         </p>
  //       </div>
  //     </div>
  //   );
  // }

  return (
    <div className="space-y-6">
      {/* Breadcrumb — match APP_FLOW breadcrumb trail */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">Dashboard</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/items">Items</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{/* item.identifier */}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header: title + badges */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{/* item.title */}</h1>
          <p className="text-sm text-muted-foreground mt-1">{/* item.subtitle */}</p>
        </div>
        <div className="flex items-center gap-2">
          {/* <StatusBadge status={item.status} /> */}
          {/* <PriorityBadge priority={item.priority} /> */}
        </div>
      </div>

      {/* Content: two-column for Job Detail, single-column for Quote/Customer */}
      {/* Two-column layout: */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content (left, 2/3 width) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Primary content sections */}
          {/* e.g., Status Timeline, Print Locations table, Line Items table */}
          <Card>
            <CardHeader>
              <CardTitle>Section Title</CardTitle>
            </CardHeader>
            <CardContent>{/* Section content */}</CardContent>
          </Card>
        </div>

        {/* Sidebar info (right, 1/3 width) */}
        <div className="space-y-6">
          {/* e.g., Customer card, Garments card, Due Date card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Related Info
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Cross-link: click customer name → /customers/[id] */}
              {/* <Link href={`/customers/${item.customerId}`} className="text-action hover:underline"> */}
              {/*   {customerName} */}
              {/* </Link> */}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Single-column layout (alternative): */}
      {/* <div className="space-y-6"> */}
      {/*   <Card>...</Card> */}
      {/*   <Card>...</Card> */}
      {/* </div> */}
    </div>
  )
}
