'use client'

import { MapPin, Building2, CreditCard, Calendar, UserPlus } from 'lucide-react'
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

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:items-start sm:gap-4">
      <dt className="text-xs text-muted-foreground shrink-0 sm:w-32">{label}</dt>
      <dd className="text-sm text-foreground">{children}</dd>
    </div>
  )
}

function SectionHeader({
  icon: Icon,
  title,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
}) {
  return (
    <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wider pb-2 border-b border-border">
      <Icon className="size-3.5" />
      {title}
    </div>
  )
}

function AddressBlock({ address }: { address: Address }) {
  return (
    <div className="text-sm text-foreground space-y-0.5">
      <div className="flex items-center gap-2">
        <span className="font-medium">{address.label}</span>
        {address.isDefault && (
          <Badge variant="secondary" className="text-xs">
            Default
          </Badge>
        )}
      </div>
      <div className="text-muted-foreground">
        <p>{address.street1}</p>
        {address.street2 && <p>{address.street2}</p>}
        <p>
          {address.city}, {address.state} {address.zip}
        </p>
      </div>
    </div>
  )
}

export function CustomerDetailsPanel({ customer, customers }: CustomerDetailsPanelProps) {
  const referrer = customers?.find((c) => c.id === customer.referredByCustomerId)

  return (
    <div className="space-y-6">
      {/* Company Info */}
      <section className="space-y-3">
        <SectionHeader icon={Building2} title="Company Info" />
        <dl className="space-y-3">
          <FieldRow label="Company">
            <span className="font-medium">{customer.company}</span>
          </FieldRow>
          <FieldRow label="Lifecycle">
            <LifecycleBadge stage={customer.lifecycleStage} />
          </FieldRow>
          <FieldRow label="Health">
            {customer.healthStatus === 'active' ? (
              <span className="text-success text-sm">Active</span>
            ) : (
              <HealthBadge status={customer.healthStatus} />
            )}
          </FieldRow>
          {customer.typeTags.length > 0 && (
            <FieldRow label="Type Tags">
              <TypeTagBadges tags={customer.typeTags} />
            </FieldRow>
          )}
        </dl>
      </section>

      {/* Financial */}
      <section className="space-y-3">
        <SectionHeader icon={CreditCard} title="Financial" />
        <dl className="space-y-3">
          <FieldRow label="Payment Terms">{PAYMENT_TERMS_LABELS[customer.paymentTerms]}</FieldRow>
          <FieldRow label="Pricing Tier">{PRICING_TIER_LABELS[customer.pricingTier]}</FieldRow>
          {customer.discountPercentage !== undefined && (
            <FieldRow label="Discount">{customer.discountPercentage}%</FieldRow>
          )}
          <FieldRow label="Tax Exempt">
            {customer.taxExempt ? (
              <span className="text-success">
                Yes
                {customer.taxExemptCertExpiry && (
                  <span className="text-muted-foreground ml-1">
                    (expires {new Date(customer.taxExemptCertExpiry).toLocaleDateString()})
                  </span>
                )}
              </span>
            ) : (
              'No'
            )}
          </FieldRow>
        </dl>
      </section>

      {/* Addresses */}
      {(customer.billingAddress || customer.shippingAddresses.length > 0) && (
        <section className="space-y-3">
          <SectionHeader icon={MapPin} title="Addresses" />
          <div className="space-y-4">
            {customer.billingAddress && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Billing</p>
                <AddressBlock address={customer.billingAddress} />
              </div>
            )}
            {customer.shippingAddresses.length > 0 && (
              <div className="space-y-3">
                <p className="text-xs text-muted-foreground">Shipping</p>
                {customer.shippingAddresses.map((addr) => (
                  <AddressBlock key={addr.id} address={addr} />
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Metadata */}
      <section className="space-y-3">
        <SectionHeader icon={Calendar} title="Metadata" />
        <dl className="space-y-3">
          <FieldRow label="Created">{new Date(customer.createdAt).toLocaleDateString()}</FieldRow>
          <FieldRow label="Last Updated">
            {new Date(customer.updatedAt).toLocaleDateString()}
          </FieldRow>
          {referrer && (
            <FieldRow label="Referred By">
              <span className="flex items-center gap-1.5">
                <UserPlus className="size-3.5 text-muted-foreground" />
                {referrer.company}
              </span>
            </FieldRow>
          )}
        </dl>
      </section>
    </div>
  )
}
