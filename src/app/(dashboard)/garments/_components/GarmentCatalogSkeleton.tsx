/**
 * Shared skeleton for the garment catalog grid.
 * Used by loading.tsx (navigation) and the Suspense fallback in page.tsx (SSR streaming).
 * Pure Server Component — no client state.
 */
export function GarmentCatalogSkeleton() {
  return (
    <>
      {/* Toolbar row skeleton */}
      <div className="flex items-center gap-2">
        <div className="h-9 w-44 animate-pulse rounded-md bg-elevated" />
        <div className="h-9 w-28 animate-pulse rounded-md bg-elevated" />
        <div className="h-9 w-20 animate-pulse rounded-md bg-elevated" />
        <div className="ml-auto h-9 w-24 animate-pulse rounded-md bg-elevated" />
      </div>

      {/* Color filter tab strip skeleton */}
      <div className="flex gap-1.5 overflow-hidden">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-7 w-16 flex-shrink-0 animate-pulse rounded-full bg-elevated" />
        ))}
      </div>

      {/* Card grid skeleton — mirrors the 2-col mobile / 4-col desktop layout */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="flex flex-col gap-2 rounded-lg bg-elevated p-3">
            {/* Garment image placeholder */}
            <div className="aspect-square w-full animate-pulse rounded-md bg-surface" />
            {/* Brand + name lines */}
            <div className="h-2.5 w-1/3 animate-pulse rounded bg-surface" />
            <div className="h-3 w-3/4 animate-pulse rounded bg-surface" />
            {/* Color swatch strip */}
            <div className="flex gap-1 pt-0.5">
              {Array.from({ length: 6 }).map((_, j) => (
                <div key={j} className="h-4 w-4 animate-pulse rounded-full bg-surface" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </>
  )
}
