'use client'

import { UserPlus } from 'lucide-react'
import { Badge } from '@shared/ui/primitives/badge'
import { LifecycleBadge } from '@shared/ui/organisms/LifecycleBadge'
import { HealthBadge } from '@shared/ui/organisms/HealthBadge'
import { TypeTagBadges } from '@shared/ui/organisms/TypeTagBadges'

import { PAYMENT_TERMS_LABELS, PRICING_TIER_LABELS } from '@domain/constants'
import type { Customer } from '@domain/entities/customer'
import type { Address } from '@domain/entities/address'

type CustomerDetailsPanelProps = {
  customer: Customer
  customers?: Customer[]
}

// ─── Niji section header: 10px, uppercase, 0.12em tracking ───────────────────

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="text-[10px] font-semibold tracking-[0.12em] uppercase text-muted-foreground mb-3">
      {title}
    </div>
  )
}

// ─── Niji field row: justify-between with thin divider ────────────────────────

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-2 text-[13px]">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-foreground text-right">{children}</span>
    </div>
  )
}

function Divider() {
  return <div className="h-px bg-border" aria-hidden="true" />
}

// ─── Address block: direct on surface ────────────────────────────────────────

function AddressBlock({ address }: { address: Address }) {
  return (
    <div className="text-[13px] text-muted-foreground space-y-0.5">
      <div className="flex items-center gap-2">
        <span className="font-semibold text-foreground">{address.label}</span>
        {address.isDefault && (
          <Badge variant="secondary" className="text-xs">
            Default
          </Badge>
        )}
      </div>
      <p>{address.street1}</p>
      {address.street2 && <p>{address.street2}</p>}
      <p>
        {address.city}, {address.state} {address.zip}
      </p>
    </div>
  )
}

// ─── CustomerDetailsPanel ─────────────────────────────────────────────────────

export function CustomerDetailsPanel({ customer, customers }: CustomerDetailsPanelProps) {
  const referrer = customers?.find((c) => c.id === customer.referredByCustomerId)

  return (
    <div className="space-y-6">
      {/* Company Info */}
      <section>
        <SectionHeader title="Company Info" />
        <div>
          <FieldRow label="Company">
            <span className="font-semibold">{customer.company}</span>
          </FieldRow>
          <Divider />
          <FieldRow label="Lifecycle">
            <LifecycleBadge stage={customer.lifecycleStage} />
          </FieldRow>
          <Divider />
          <FieldRow label="Health">
            {customer.healthStatus === 'active' ? (
              <span className="text-success text-[13px]">Active</span>
            ) : (
              <HealthBadge status={customer.healthStatus} />
            )}
          </FieldRow>
          {customer.typeTags.length > 0 && (
            <>
              <Divider />
              <FieldRow label="Type">
                <TypeTagBadges tags={customer.typeTags} />
              </FieldRow>
            </>
          )}
        </div>
      </section>

      {/* Financial */}
      <section>
        <SectionHeader title="Financial" />
        <div>
          <FieldRow label="Payment Terms">
            <span className="font-semibold">{PAYMENT_TERMS_LABELS[customer.paymentTerms]}</span>
          </FieldRow>
          <Divider />
          <FieldRow label="Pricing Tier">{PRICING_TIER_LABELS[customer.pricingTier]}</FieldRow>
          {customer.discountPercentage !== undefined && (
            <>
              <Divider />
              <FieldRow label="Discount">{customer.discountPercentage}%</FieldRow>
            </>
          )}
          <Divider />
          <FieldRow label="Tax Exempt">
            {customer.taxExempt ? (
              <span className="text-success font-semibold">
                Yes
                {customer.taxExemptCertExpiry && (
                  <span className="text-muted-foreground font-normal ml-1">
                    (expires {new Date(customer.taxExemptCertExpiry).toLocaleDateString()})
                  </span>
                )}
              </span>
            ) : (
              <span className="text-muted-foreground">No</span>
            )}
          </FieldRow>
        </div>
      </section>

      {/* Addresses — direct on surface, no card wrapper */}
      {(customer.billingAddress || customer.shippingAddresses.length > 0) && (
        <section>
          <SectionHeader title="Addresses" />
          <div className="space-y-4">
            {customer.billingAddress && (
              <div>
                <p className="text-[10px] font-semibold tracking-[0.12em] uppercase text-muted-foreground/50 mb-1.5">
                  Billing
                </p>
                <AddressBlock address={customer.billingAddress} />
              </div>
            )}
            {customer.shippingAddresses.length > 0 && (
              <div className="space-y-3">
                <p className="text-[10px] font-semibold tracking-[0.12em] uppercase text-muted-foreground/50">
                  Shipping
                </p>
                {customer.shippingAddresses.map((addr) => (
                  <AddressBlock key={addr.id} address={addr} />
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Metadata */}
      <section>
        <SectionHeader title="Metadata" />
        <div>
          <FieldRow label="Created">
            {new Date(customer.createdAt).toLocaleDateString()}
          </FieldRow>
          <Divider />
          <FieldRow label="Last Updated">
            {new Date(customer.updatedAt).toLocaleDateString()}
          </FieldRow>
          {referrer && (
            <>
              <Divider />
              <FieldRow label="Referred By">
                <span className="flex items-center gap-1.5">
                  <UserPlus className="size-3.5 text-muted-foreground" />
                  {referrer.company}
                </span>
              </FieldRow>
            </>
          )}
        </div>
      </section>
    </div>
  )
}
