import type { ReactNode } from 'react'
import { cn } from '@shared/lib/cn'
import { DollarSign, ShoppingBag, TrendingUp, Clock, Users } from 'lucide-react'
import { MoneyAmount } from '@shared/ui/organisms/MoneyAmount'
import { money, toNumber, formatCompactMoney } from '@domain/lib/money'
import type { CustomerStats } from '@features/customers/lib/customer-stats.schema'

export type { CustomerStats }

type CustomerQuickStatsProps = {
  stats: CustomerStats
  variant?: 'bar' | 'header'
  className?: string
}

function formatDaysAgo(dateString: string | null): string {
  if (!dateString) return 'No orders'
  const diffMs = Date.now() - new Date(dateString).getTime()
  const days = Math.floor(Math.abs(diffMs) / (1000 * 60 * 60 * 24))
  if (diffMs < 0) {
    // Future date
    if (days === 0) return 'Today'
    if (days === 1) return 'In 1 day'
    return `In ${days} days`
  }
  if (days === 0) return 'Today'
  if (days === 1) return '1 day ago'
  return `${days} days ago`
}

/** Compact relative date for the inline stats strip: "3d", "14d", "Jan 12", "today", "—" */
function formatDaysShort(dateString: string | null): string {
  if (!dateString) return '—'
  const date = new Date(dateString)
  const diffMs = Date.now() - date.getTime()
  const days = Math.floor(Math.abs(diffMs) / (1000 * 60 * 60 * 24))
  if (diffMs < 0) return 'upcoming'
  if (days === 0) return 'today'
  if (days < 30) return `${days}d`
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function StatDot() {
  return (
    <span className="mx-2 text-border select-none" aria-hidden="true">
      ·
    </span>
  )
}

const statItems = [
  {
    key: 'revenue' as const,
    label: 'Lifetime Revenue',
    icon: DollarSign,
    format: (s: CustomerQuickStatsProps['stats']): ReactNode => (
      <MoneyAmount value={s.lifetimeRevenue} format="compact" />
    ),
  },
  {
    key: 'orders' as const,
    label: 'Total Orders',
    icon: ShoppingBag,
    format: (s: CustomerQuickStatsProps['stats']): ReactNode => String(s.totalOrders),
  },
  {
    key: 'aov' as const,
    label: 'Avg Order',
    icon: TrendingUp,
    format: (s: CustomerQuickStatsProps['stats']): ReactNode => (
      <MoneyAmount value={s.avgOrderValue} format="compact" />
    ),
  },
  {
    key: 'lastOrder' as const,
    label: 'Last Order',
    icon: Clock,
    format: (s: CustomerQuickStatsProps['stats']): ReactNode => formatDaysAgo(s.lastOrderDate),
  },
]

export function CustomerQuickStats({ stats, variant = 'bar', className }: CustomerQuickStatsProps) {
  const showReferrals = stats.referralCount !== undefined && stats.referralCount > 0
  const showCreditBar =
    stats.creditLimit !== undefined &&
    stats.creditLimit > 0 &&
    stats.outstandingBalance !== undefined

  if (variant === 'bar') {
    return (
      <div
        className={cn('flex flex-wrap items-center gap-4 text-sm', className)}
        aria-label="Customer statistics"
      >
        {statItems.map(({ key, label, icon: Icon, format }) => (
          <div key={key} className="flex items-center gap-1.5">
            <Icon className="size-4 text-muted-foreground" aria-hidden="true" />
            <span className="text-muted-foreground">{label}:</span>
            <span className="font-medium text-foreground">{format(stats)}</span>
          </div>
        ))}
        {showReferrals && (
          <div className="flex items-center gap-1.5">
            <Users className="size-4 text-muted-foreground" aria-hidden="true" />
            <span className="text-muted-foreground">Referrals:</span>
            <span className="font-medium text-foreground">{stats.referralCount}</span>
          </div>
        )}
      </div>
    )
  }

  // variant === "header" — inline compact dot-separated strip matching design spec
  // Format: $284.6K lifetime · $23.7K avg order · 12 orders · 3d last order · 3 referrals
  return (
    <div
      className={cn('flex flex-wrap items-baseline text-sm', className)}
      aria-label="Customer statistics"
    >
      <MoneyAmount value={stats.lifetimeRevenue} format="compact" className="font-medium" />
      <span className="ml-1 text-xs text-muted-foreground">lifetime</span>

      <StatDot />

      <MoneyAmount value={stats.avgOrderValue} format="compact" className="font-medium" />
      <span className="ml-1 text-xs text-muted-foreground">avg order</span>

      <StatDot />

      <span className="font-medium text-foreground">{stats.totalOrders}</span>
      <span className="ml-1 text-xs text-muted-foreground">orders</span>

      <StatDot />

      <span className="font-medium text-foreground">{formatDaysShort(stats.lastOrderDate)}</span>
      <span className="ml-1 text-xs text-muted-foreground">last order</span>

      {showReferrals && (
        <>
          <StatDot />
          <span className="font-medium text-foreground">{stats.referralCount}</span>
          <span className="ml-1 text-xs text-muted-foreground">referrals</span>
        </>
      )}

      {showCreditBar && (
        <>
          <StatDot />
          <CreditBar outstanding={stats.outstandingBalance ?? 0} limit={stats.creditLimit ?? 0} />
        </>
      )}
    </div>
  )
}

// ─── CreditBar ────────────────────────────────────────────────────────────────

function CreditBar({ outstanding, limit }: { outstanding: number; limit: number }) {
  const rawPct = limit > 0 ? toNumber(money(outstanding).div(limit).times(100)) : 0
  const pct = Math.max(0, Math.min(100, rawPct))
  const isNearLimit = pct >= 80

  return (
    <span
      className="flex items-center gap-1.5"
      aria-label={`Credit: ${formatCompactMoney(outstanding)} of ${formatCompactMoney(limit)} used`}
    >
      <span className="text-xs text-muted-foreground">credit</span>
      <span className="w-16 h-1.5 rounded-full bg-border overflow-hidden shrink-0">
        <span
          className={cn(
            'h-full rounded-full transition-all',
            isNearLimit ? 'bg-warning' : 'bg-success'
          )}
          style={{ width: `${pct}%` }}
        />
      </span>
      <span className={cn('font-medium', isNearLimit ? 'text-warning' : 'text-foreground')}>
        {formatCompactMoney(outstanding)}
      </span>
      <span className="text-xs text-muted-foreground">/ {formatCompactMoney(limit)}</span>
    </span>
  )
}
