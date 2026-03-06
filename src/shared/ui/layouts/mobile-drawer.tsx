'use client'

import Link from 'next/link'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@shared/ui/primitives/sheet'
import { Layers } from 'lucide-react'
import { SECONDARY_NAV } from '@shared/constants/navigation'

type MobileDrawerProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function MobileDrawer({ open, onOpenChange }: MobileDrawerProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-72 bg-sidebar p-0">
        <SheetHeader className="border-b border-sidebar-border px-4 py-3">
          <SheetTitle className="flex items-center gap-2 text-sidebar-foreground">
            <Layers className="h-5 w-5 text-action" />
            Mokumo Print
          </SheetTitle>
        </SheetHeader>
        <nav className="flex flex-col gap-1 p-2" aria-label="Additional navigation">
          {SECONDARY_NAV.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => onOpenChange(false)}
              className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm text-sidebar-foreground transition-colors hover:bg-sidebar-accent min-h-(--mobile-touch-target) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar"
            >
              <link.icon className="h-5 w-5 text-muted-foreground" />
              {link.label}
            </Link>
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  )
}
