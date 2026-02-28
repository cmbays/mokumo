/**
 * Centralized breadcrumb builder.
 *
 * The Topbar component always renders "Dashboard" as the root breadcrumb.
 * Pages pass only the segments *after* Dashboard via buildBreadcrumbs().
 */

export type BreadcrumbSegment = { label: string; href?: string }

/** Reusable route segments — single source of truth for repeated breadcrumbs. */
export const CRUMBS = {
  jobs: { label: 'Jobs', href: '/jobs' },
  jobsBoard: { label: 'Jobs', href: '/jobs/board' },
  quotes: { label: 'Quotes', href: '/quotes' },
  invoices: { label: 'Invoices', href: '/invoices' },
  customers: { label: 'Customers', href: '/customers' },
  garments: { label: 'Garment Catalog', href: '/garments' },
  garmentFavorites: { label: 'Garment Favorites', href: '/garments/favorites' },
  settings: { label: 'Settings', href: '/settings/pricing' },
  pricing: { label: 'Pricing', href: '/settings/pricing' },
} satisfies Record<string, BreadcrumbSegment>

/**
 * Build a type-safe breadcrumb array for the Topbar component.
 * Validates that no segment duplicates the root "Dashboard" crumb
 * (which Topbar renders automatically).
 */
export function buildBreadcrumbs(...segments: BreadcrumbSegment[]): BreadcrumbSegment[] {
  if (process.env.NODE_ENV !== 'production') {
    for (const seg of segments) {
      if (seg.label.toLowerCase() === 'dashboard') {
        throw new Error(
          'Breadcrumb segment must not include "Dashboard" — Topbar renders it automatically. ' +
            'Use buildBreadcrumbs() with only the segments after Dashboard.'
        )
      }
    }
  }
  return segments
}
