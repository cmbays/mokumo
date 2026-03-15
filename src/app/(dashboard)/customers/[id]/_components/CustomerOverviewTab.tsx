'use client'

import { Clock } from 'lucide-react'
import { ActivityEntry } from '@features/customers/components/ActivityEntry'
import { QuickNoteRail } from '@features/customers/components/QuickNoteRail'
import { PAYMENT_TERMS_LABELS, PRICING_TIER_LABELS } from '@domain/constants'
import type { Customer } from '@domain/entities/customer'
import type { Artwork } from '@domain/entities/artwork'
import type { CustomerActivity } from '@domain/ports/customer-activity.port'
import type { ActivityResult } from '@features/customers/lib/activity-types'

type CustomerOverviewTabProps = {
  customer: Customer
  /** First 5 entries from the activity stream — same data source as the Activity tab */
  recentActivities: CustomerActivity[]
  artworks: Artwork[]
  onSwitchTab: (tab: string) => void
  onAddNote: (params: {
    customerId: string
    content: string
  }) => Promise<ActivityResult<CustomerActivity>>
}

// ─── Niji section header: 10px, uppercase, 0.12em tracking ──────────────────

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="text-[10px] font-semibold tracking-[0.12em] uppercase text-muted-foreground mb-4">
      {title}
    </div>
  )
}

function Divider() {
  return <div className="h-px bg-border" aria-hidden="true" />
}

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-2 text-[13px]">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-foreground text-right">{children}</span>
    </div>
  )
}

// ─── CustomerOverviewTab ─────────────────────────────────────────────────────

export function CustomerOverviewTab({
  customer,
  recentActivities,
  artworks,
  onSwitchTab,
  onAddNote,
}: CustomerOverviewTabProps) {
  const hasAddresses =
    customer.billingAddress !== undefined || customer.shippingAddresses.length > 0

  return (
    <div className="flex flex-col md:flex-row gap-6">
      {/* ── Left column: Recent Activity + Most Used Artwork ── */}
      <div className="flex-1 min-w-0">
        <SectionHeader title="Recent Activity" />

        {recentActivities.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Clock className="size-8 mb-2" aria-hidden="true" />
            <p className="text-sm font-medium">No activity yet</p>
          </div>
        ) : (
          <div>
            {recentActivities.map((activity, index) => (
              <ActivityEntry
                key={activity.id}
                activity={activity}
                isLast={index === recentActivities.length - 1}
              />
            ))}
            {/* View all link */}
            <button
              type="button"
              onClick={() => onSwitchTab('activity')}
              className="mt-3 text-xs text-action hover:text-action/80 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
            >
              View all activity →
            </button>
          </div>
        )}

        {artworks.length > 0 && (
          <div className="mt-8">
            <SectionHeader title="Most Used Artwork" />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {artworks.slice(0, 4).map((artwork) => (
                <div
                  key={artwork.id}
                  className="rounded-md border border-border overflow-hidden bg-elevated dark:shadow-[1.5px_1.5px_0_rgba(255,255,255,0.04)]"
                >
                  <div className="h-24 bg-ds-surface-thumb flex items-center justify-center relative">
                    <div className="w-10 h-10 rounded-full border border-border flex items-center justify-center">
                      <div className="w-4 h-4 rounded-full bg-border" />
                    </div>
                    {/* File type badge in top-right */}
                    <span className="absolute top-1.5 right-1.5 text-[9px] font-semibold rounded px-1 py-px border border-border text-muted-foreground bg-elevated">
                      {artwork.fileName.split('.').pop()?.toUpperCase() ?? 'IMG'}
                    </span>
                  </div>
                  <div className="p-2">
                    <p className="text-xs font-semibold text-foreground truncate">{artwork.name}</p>
                    <p className="text-[11px] text-muted-foreground/50 mt-0.5">
                      {artwork.lastUsedAt ? new Date(artwork.lastUsedAt).toLocaleDateString() : '–'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Right sidebar: Quick Note + Addresses + Financial ── */}
      <div className="w-full md:w-[300px] shrink-0 md:border-l md:border-border md:pl-6">
        {/* Quick Note */}
        <QuickNoteRail customerId={customer.id} onNoteSaved={() => {}} onSave={onAddNote} />

        {/* Addresses */}
        {hasAddresses && (
          <div className="mt-6">
            <SectionHeader title="Addresses" />
            <div className="space-y-4 text-[13px] text-muted-foreground">
              {customer.shippingAddresses.length > 0 && (
                <div>
                  <p className="text-[10px] font-semibold tracking-[0.12em] uppercase text-muted-foreground/50 mb-1.5">
                    Shipping
                  </p>
                  {customer.shippingAddresses.map((addr) => (
                    <div key={addr.id} className="space-y-0.5">
                      <p>{addr.street1}</p>
                      {addr.street2 && <p>{addr.street2}</p>}
                      <p>
                        {addr.city}, {addr.state} {addr.zip}
                      </p>
                    </div>
                  ))}
                </div>
              )}
              {customer.billingAddress && (
                <>
                  {customer.shippingAddresses.length > 0 && <Divider />}
                  <div>
                    <p className="text-[10px] font-semibold tracking-[0.12em] uppercase text-muted-foreground/50 mb-1.5">
                      Billing
                    </p>
                    <div className="space-y-0.5">
                      <p>{customer.billingAddress.street1}</p>
                      {customer.billingAddress.street2 && <p>{customer.billingAddress.street2}</p>}
                      <p>
                        {customer.billingAddress.city}, {customer.billingAddress.state}{' '}
                        {customer.billingAddress.zip}
                      </p>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Financial */}
        <div className="mt-6">
          <SectionHeader title="Financial" />
          <div>
            <FieldRow label="Payment Terms">
              <span className="font-semibold">{PAYMENT_TERMS_LABELS[customer.paymentTerms]}</span>
            </FieldRow>
            <Divider />
            <FieldRow label="Pricing Tier">{PRICING_TIER_LABELS[customer.pricingTier]}</FieldRow>
            <Divider />
            <FieldRow label="Tax Exempt">
              {customer.taxExempt ? (
                <span className="text-success font-semibold">Yes</span>
              ) : (
                <span className="text-muted-foreground">No</span>
              )}
            </FieldRow>
          </div>
        </div>
      </div>
    </div>
  )
}
