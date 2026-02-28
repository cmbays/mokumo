'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Store, Users } from 'lucide-react'
import { cn } from '@shared/lib/cn'

export function ScopeSelector() {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          'flex w-full items-center gap-2 rounded-md border border-border bg-surface px-3 py-2',
          'text-sm text-foreground transition-colors hover:border-border/80 hover:bg-surface/80',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action'
        )}
      >
        <Store className="h-3.5 w-3.5 shrink-0 text-action" />
        <span className="flex-1 text-left font-medium">Shop Defaults</span>
        <ChevronDown
          className={cn(
            'h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform',
            open && 'rotate-180'
          )}
        />
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-full z-20 mt-1 overflow-hidden rounded-md border border-border bg-elevated shadow-lg">
          {/* Active: Shop Defaults */}
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-foreground transition-colors hover:bg-surface"
          >
            <Store className="h-3.5 w-3.5 shrink-0 text-action" />
            <span className="font-medium">Shop Defaults</span>
            <span className="ml-auto h-1.5 w-1.5 rounded-full bg-action" />
          </button>

          {/* Divider + skeleton Customers section */}
          <div className="border-t border-border px-3 py-1.5">
            <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">
              <Users className="h-3 w-3" />
              Customers
            </div>
          </div>
          <div className="px-3 py-2">
            <p className="text-xs text-muted-foreground/50">No customers yet</p>
          </div>
        </div>
      )}
    </div>
  )
}
