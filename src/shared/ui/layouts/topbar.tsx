import { LogOut } from 'lucide-react'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from '@shared/ui/primitives/breadcrumb'
import type { BreadcrumbSegment } from '@shared/lib/breadcrumbs'
import { signOut } from '@shared/actions/auth'

type TopbarProps = {
  breadcrumbs?: BreadcrumbSegment[]
}

export function Topbar({ breadcrumbs }: TopbarProps) {
  return (
    <header className="-mx-6 -mt-6 mb-6 flex h-14 items-center border-b border-border px-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">Dashboard</BreadcrumbLink>
          </BreadcrumbItem>
          {breadcrumbs?.map((crumb) => (
            <span key={crumb.label} className="contents">
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                {crumb.href ? (
                  <BreadcrumbLink href={crumb.href}>{crumb.label}</BreadcrumbLink>
                ) : (
                  <span className="text-foreground">{crumb.label}</span>
                )}
              </BreadcrumbItem>
            </span>
          ))}
        </BreadcrumbList>
      </Breadcrumb>

      <form action={signOut} className="ml-auto">
        <button
          type="submit"
          className="inline-flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          title="Sign out"
        >
          <LogOut size={16} />
          <span>Sign out</span>
        </button>
      </form>
    </header>
  )
}
