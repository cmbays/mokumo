// Template: Data Table Screen
// Use for: Jobs List, Quotes List, Customers List, Screen Room, Garment Catalog
// Adapt: columns, filters, toolbar actions, row click navigation
//
// This is structural guidance — adapt to the specific screen's APP_FLOW entry.
// Do NOT copy-paste without reading APP_FLOW for this route.

// --- SERVER or CLIENT decision ---
// If the page has search/filter via URL params: "use client" + useSearchParams()
// If the page is purely rendering mock data: server component (no directive)
'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@shared/ui/primitives/card'
import { Badge } from '@shared/ui/primitives/badge'
import { Input } from '@shared/ui/primitives/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@shared/ui/primitives/table'
// import { PageHeader } from "@features/{vertical}/components/page-header";
// import { StatusBadge } from "@features/{vertical}/components/status-badge";
// import { PriorityBadge } from "@features/{vertical}/components/priority-badge";
// import { EmptyState } from "@features/{vertical}/components/empty-state";
// import { DataTable } from "@features/{vertical}/components/data-table";
import { Search } from 'lucide-react'
import { cn } from '@shared/lib/cn'

// Import mock data + constants for this domain
// import data from your domain layer
// import { PRODUCTION_STATE_LABELS, PRODUCTION_STATE_COLORS } from "@domain/constants";

export default function ExampleListPage() {
  const searchParams = useSearchParams()
  const router = useRouter()

  // URL state for filters
  const query = searchParams.get('q') ?? ''
  const statusFilter = searchParams.get('status') ?? 'all'

  // Filter logic
  // const filtered = items.filter(item => {
  //   const matchesQuery = item.title.toLowerCase().includes(query.toLowerCase());
  //   const matchesStatus = statusFilter === "all" || item.status === statusFilter;
  //   return matchesQuery && matchesStatus;
  // });

  return (
    <div className="space-y-6">
      {/* Page header */}
      {/* <PageHeader title="Jobs" subtitle="Manage production jobs" action={...} /> */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{/* Page title from APP_FLOW */}</h1>
        <p className="text-sm text-muted-foreground">{/* Subtitle */}</p>
      </div>

      {/* Toolbar: search + filters + optional action button */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search..."
            className="pl-9"
            value={query}
            onChange={(e) => {
              const params = new URLSearchParams(searchParams.toString())
              if (e.target.value) {
                params.set('q', e.target.value)
              } else {
                params.delete('q')
              }
              router.replace(`?${params.toString()}`)
            }}
          />
        </div>

        {/* Status filter dropdown */}
        {/* <Select value={statusFilter} onValueChange={...}> */}
        {/*   <SelectTrigger className="w-[150px]"> */}
        {/*     <SelectValue placeholder="All statuses" /> */}
        {/*   </SelectTrigger> */}
        {/*   <SelectContent> ... </SelectContent> */}
        {/* </Select> */}

        {/* Optional: view toggle (List | Board) or primary CTA (New Quote) */}
      </div>

      {/* Data table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                {/* Columns from APP_FLOW */}
                <TableHead>Column 1</TableHead>
                <TableHead>Column 2</TableHead>
                <TableHead>Column 3</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {/* Map over filtered items */}
              {/* {filtered.length === 0 ? ( */}
              {/*   <TableRow> */}
              {/*     <TableCell colSpan={N} className="h-32"> */}
              {/*       <EmptyState */}
              {/*         icon={...} */}
              {/*         message="No items match your search" */}
              {/*       /> */}
              {/*     </TableCell> */}
              {/*   </TableRow> */}
              {/* ) : ( */}
              {/*   filtered.map((item) => ( */}
              {/*     <TableRow */}
              {/*       key={item.id} */}
              {/*       className="cursor-pointer hover:bg-muted/50" */}
              {/*       onClick={() => router.push(`/route/${item.id}`)} */}
              {/*     > */}
              {/*       <TableCell>...</TableCell> */}
              {/*     </TableRow> */}
              {/*   )) */}
              {/* )} */}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
