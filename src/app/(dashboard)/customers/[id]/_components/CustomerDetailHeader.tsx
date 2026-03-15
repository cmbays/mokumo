'use client'

import { useState } from 'react'
import { Copy, Check, Star } from 'lucide-react'
import { Button } from '@shared/ui/primitives/button'
import { LifecycleBadge } from '@shared/ui/organisms/LifecycleBadge'
import { HealthBadge } from '@shared/ui/organisms/HealthBadge'
import { TypeTagBadges } from '@shared/ui/organisms/TypeTagBadges'
import {
  CustomerQuickStats,
  type CustomerStats,
} from '@features/customers/components/CustomerQuickStats'
import { CONTACT_ROLE_LABELS } from '@domain/constants'
import { cn } from '@shared/lib/cn'
import { EditCustomerSheet } from './EditCustomerSheet'
import { ArchiveDialog } from './ArchiveDialog'
import type { Customer } from '@domain/entities/customer'

type CustomerDetailHeaderProps = {
  customer: Customer
  stats: CustomerStats
}

function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      onClick={handleCopy}
      className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
      aria-label={`Copy ${label}: ${value}`}
    >
      {value}
      {copied ? (
        <Check className="size-4 text-success" />
      ) : (
        <Copy className="size-4 md:opacity-0 md:group-hover:opacity-100 transition-opacity" />
      )}
    </button>
  )
}

export function CustomerDetailHeader({ customer, stats }: CustomerDetailHeaderProps) {
  const [editOpen, setEditOpen] = useState(false)
  const [archiveOpen, setArchiveOpen] = useState(false)

  // Sort contacts so primary comes first
  const sortedContacts = [...customer.contacts].sort((a, b) => {
    if (a.isPrimary && !b.isPrimary) return -1
    if (!a.isPrimary && b.isPrimary) return 1
    return 0
  })

  return (
    <div className="space-y-4">
      {/* ---- Inline breadcrumb ------------------------------------------------ */}
      <div className="text-xs text-muted-foreground/50 mb-3 tracking-wide">
        Customers
        <span className="mx-1.5 opacity-40">/</span>
        {customer.company}
      </div>

      {/* ---- Section 1: Company row ----------------------------------------- */}
      {/* Left group (name + badges) can wrap freely; right group (buttons) never wraps */}
      <div className="flex items-start gap-3">
        {/* Name + badges — wrappable flex-1 group */}
        <div className="flex-1 min-w-0 flex items-center flex-wrap gap-2.5">
          {/* Company name — Niji spec: 26px, weight 700, tight tracking */}
          <h1 className="text-[22px] md:text-[26px] font-bold tracking-[-0.02em] leading-8 text-foreground w-full">
            {customer.company}
          </h1>

          {/* Lifecycle — full mode: dot + label text */}
          <LifecycleBadge stage={customer.lifecycleStage} />

          {/* Health — full mode: glow dot + dimmed label */}
          <HealthBadge status={customer.healthStatus} />

          {/* Type tags — plain gray bold text, no border */}
          {customer.typeTags.length > 0 && <TypeTagBadges tags={customer.typeTags} />}
        </div>

        {/* Action buttons — always right-aligned, never wrap */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Archive — pure outline, text only */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setArchiveOpen(true)}
            aria-label="Archive customer"
          >
            Archive
          </Button>

          {/* Edit Customer — solid filled action background, text only */}
          <Button
            size="sm"
            onClick={() => setEditOpen(true)}
            className="bg-action text-white dark:text-black font-semibold shadow-[1.5px_1.5px_0_rgba(0,0,0,0.3)] hover:bg-action-hover active:scale-95 transition-all duration-150"
          >
            Edit Customer
          </Button>
        </div>
      </div>

      {/* ---- Section 2: Stats strip ----------------------------------------- */}
      {/* Niji spec: divider-separated cells with 19px numbers + 10px uppercase labels */}
      <CustomerQuickStats stats={stats} variant="cells" />

      {/* ---- Section 3: Contacts -------------------------------------------- */}
      {/* Desktop: fixed-width column slots aligned horizontally.
          Mobile: name+role on line 1, email+phone links on line 2 (indented).
          md:contents dissolves the inner rows so their children participate
          directly in the parent flex row on desktop, preserving column alignment. */}
      {sortedContacts.length > 0 && (
        <div className="flex flex-col gap-2">
          {sortedContacts.map((contact) => {
            const functionalRoles = contact.role.filter((r) => r !== 'primary')
            const roleLabel =
              functionalRoles.length > 0
                ? functionalRoles.map((r) => CONTACT_ROLE_LABELS[r]).join(', ')
                : null

            return (
              <div
                key={contact.id}
                className="flex flex-col gap-0.5 md:flex-row md:items-center md:gap-4 text-sm"
              >
                {/* Line 1 (mobile): star + name + role.
                    Desktop: md:contents dissolves this into the parent flex row. */}
                <div className="flex items-center gap-2 md:contents">
                  {contact.isPrimary ? (
                    <Star
                      className="size-3 shrink-0 fill-warning text-warning"
                      aria-label="Primary contact"
                    />
                  ) : (
                    <span className="w-3 shrink-0" aria-hidden="true" />
                  )}

                  <span
                    className={cn(
                      'w-[110px] shrink-0 text-[13px]',
                      contact.isPrimary ? 'text-foreground font-semibold' : 'text-muted-foreground'
                    )}
                  >
                    {contact.name}
                  </span>

                  {roleLabel ? (
                    <span className="md:w-[148px] md:shrink-0 text-[13px] text-muted-foreground">
                      {roleLabel}
                    </span>
                  ) : (
                    <span
                      className="hidden md:inline-block w-[148px] shrink-0"
                      aria-hidden="true"
                    />
                  )}
                </div>

                {/* Line 2 (mobile): email + phone links, indented under name.
                    Desktop: md:contents dissolves this into the parent flex row. */}
                {(contact.email || contact.phone) && (
                  <div className="flex items-center gap-3 pl-5 md:pl-0 md:contents">
                    {contact.email ? (
                      <span className="min-w-0 text-[13px] text-muted-foreground md:w-[190px] md:shrink-0">
                        <span className="hidden md:inline">
                          <CopyButton value={contact.email} label="email" />
                        </span>
                        <a
                          href={`mailto:${contact.email}`}
                          className="md:hidden text-sm text-action active:text-action/80 transition-colors truncate block"
                          aria-label={`Email ${contact.email}`}
                        >
                          {contact.email}
                        </a>
                      </span>
                    ) : (
                      <span
                        className="hidden md:inline-block w-[190px] shrink-0"
                        aria-hidden="true"
                      />
                    )}

                    {contact.phone && (
                      <span className="shrink-0 text-[13px] text-muted-foreground">
                        <span className="hidden md:inline">
                          <CopyButton value={contact.phone} label="phone" />
                        </span>
                        <a
                          href={`tel:${contact.phone}`}
                          className="md:hidden text-sm text-action active:text-action/80 transition-colors"
                          aria-label={`Call ${contact.phone}`}
                        >
                          {contact.phone}
                        </a>
                      </span>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* ---- Modals --------------------------------------------------------- */}
      {editOpen && (
        <EditCustomerSheet customer={customer} open={editOpen} onOpenChange={setEditOpen} />
      )}
      {archiveOpen && (
        <ArchiveDialog customer={customer} open={archiveOpen} onOpenChange={setArchiveOpen} />
      )}
    </div>
  )
}
