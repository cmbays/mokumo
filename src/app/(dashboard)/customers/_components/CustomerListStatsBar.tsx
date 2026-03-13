'use client'

import type { ReactNode } from 'react'
import type { Customer } from '@domain/entities/customer'
import type { Quote } from '@domain/entities/quote'
import { Users, UserCheck, DollarSign, UserPlus } from 'lucide-react'
import { MoneyAmount } from '@shared/ui/organisms/MoneyAmount'

function computeRevenueYTD(quotes: Quote[]): number {
  const now = new Date()
  const startOfYear = new Date(now.getFullYear(), 0, 1)
  return quotes
    .filter((q) => q.status === 'accepted' && new Date(q.createdAt) >= startOfYear)
    .reduce((sum, q) => sum + q.total, 0)
}

const stats = [
  { key: 'total', label: 'Total Customers', icon: Users },
  { key: 'active', label: 'Active', icon: UserCheck },
  { key: 'revenue', label: 'Revenue YTD', icon: DollarSign },
  { key: 'prospects', label: 'Prospects', icon: UserPlus },
] as const

type CustomerListStatsBarProps = {
  customers: Customer[]
  quotes: Quote[]
}

export function CustomerListStatsBar({ customers, quotes }: CustomerListStatsBarProps) {
  const activeCustomers = customers.filter((c) => !c.isArchived)
  const total = activeCustomers.length
  const active = activeCustomers.filter((c) => c.healthStatus === 'active').length
  const prospects = activeCustomers.filter((c) => c.lifecycleStage === 'prospect').length
  const revenueYTD = computeRevenueYTD(quotes)

  const values: Record<(typeof stats)[number]['key'], ReactNode> = {
    total: String(total),
    active: String(active),
    revenue: <MoneyAmount value={revenueYTD} format="compact" />,
    prospects: String(prospects),
  }

  return (
    <div
      className="grid grid-cols-2 gap-3 sm:grid-cols-4"
      aria-label="Customer statistics overview"
    >
      {stats.map(({ key, label, icon: Icon }) => (
        <div key={key} className="rounded-lg border border-border bg-elevated p-4">
          <div className="flex items-center gap-2">
            <Icon className={key === 'total' ? 'h-4 w-4 text-amber' : 'h-4 w-4 text-muted-foreground'} />
            <span className="text-xs text-muted-foreground">{label}</span>
          </div>
          <p className="mt-1 text-2xl font-bold text-foreground">{values[key]}</p>
        </div>
      ))}
    </div>
  )
}
