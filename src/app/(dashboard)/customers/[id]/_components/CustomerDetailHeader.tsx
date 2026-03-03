'use client'

import { useState } from 'react'
import { Copy, Check, Pencil, Archive, Star } from 'lucide-react'
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
        <Check className="size-3 text-success" />
      ) : (
        <Copy className="size-3 md:opacity-0 md:group-hover:opacity-100 transition-opacity" />
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
    <div className="space-y-3">
      {/* ---- Section 2: Company row ----------------------------------------- */}
      {/* Left group (name + badges) can wrap freely; right group (buttons) never wraps */}
      <div className="flex items-start gap-3">
        {/* Name + badges — wrappable flex-1 group */}
        <div className="flex-1 min-w-0 flex items-center flex-wrap gap-3">
          <h1 className="text-2xl font-bold text-foreground tracking-tight shrink-0">
            {customer.company}
          </h1>

          {/* Lifecycle dot indicator */}
          <LifecycleBadge stage={customer.lifecycleStage} />

          {/* Health dot indicator */}
          <HealthBadge status={customer.healthStatus} />

          {/* Type tags — monochrome muted pill */}
          {customer.typeTags.length > 0 && <TypeTagBadges tags={customer.typeTags} />}

        </div>

        {/* Action buttons — always right-aligned, never wrap */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Archive button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setArchiveOpen(true)}
            className="text-error/70 border-error/30 hover:text-error hover:border-error/50 hover:bg-error/5 focus-visible:ring-error/50"
          >
            <Archive className="size-4" />
            <span className="hidden sm:inline">Archive</span>
          </Button>

          {/* Edit Customer button — action blue, neobrutalist shadow */}
          <Button
            size="sm"
            onClick={() => setEditOpen(true)}
            className="bg-action text-primary-foreground font-medium shadow-brutal shadow-action/30 hover:shadow-brutal-sm hover:translate-x-0.5 hover:translate-y-0.5 transition-all"
          >
            <Pencil className="size-4" />
            Edit Customer
          </Button>
        </div>
      </div>

      {/* ---- Section 3: Contacts row ---------------------------------------- */}
      {/* Fixed-width column slots — all contacts aligned vertically */}
      {sortedContacts.length > 0 && (
        <div className="flex flex-col gap-1.5">
          {sortedContacts.map((contact) => {
            // Filter 'primary' — already communicated by the star icon
            const functionalRoles = contact.role.filter((r) => r !== 'primary')
            const roleLabel =
              functionalRoles.length > 0
                ? functionalRoles.map((r) => CONTACT_ROLE_LABELS[r]).join(', ')
                : null

            return (
              <div key={contact.id} className="flex items-center gap-3 text-sm">
                {/* Star / spacer — 18px fixed width */}
                {contact.isPrimary ? (
                  <Star
                    className="size-4 shrink-0 fill-warning text-warning"
                    aria-label="Primary contact"
                  />
                ) : (
                  <span className="w-4 shrink-0" aria-hidden="true" />
                )}

                {/* Name — fixed minimum width */}
                <span
                  className={cn(
                    'min-w-36 shrink-0 font-medium',
                    contact.isPrimary ? 'text-foreground' : 'text-muted-foreground'
                  )}
                >
                  {contact.name}
                </span>

                {/* Role badge */}
                {roleLabel && (
                  <span className="shrink-0 rounded border border-border px-1.5 py-0.5 text-xs text-muted-foreground">
                    {roleLabel}
                  </span>
                )}

                {/* Email — copy-to-clipboard, flex:1 */}
                {contact.email && (
                  <span className="flex-1 min-w-0">
                    {/* Desktop: copy button */}
                    <span className="hidden md:inline">
                      <CopyButton value={contact.email} label="email" />
                    </span>
                    {/* Mobile: mailto link */}
                    <a
                      href={`mailto:${contact.email}`}
                      className="md:hidden text-sm text-action active:text-action/80 transition-colors truncate"
                      aria-label={`Email ${contact.email}`}
                    >
                      {contact.email}
                    </a>
                  </span>
                )}
                {!contact.email && <span className="flex-1" />}

                {/* Phone — fixed minimum width */}
                {contact.phone && (
                  <span className="min-w-30 shrink-0">
                    {/* Desktop: copy button */}
                    <span className="hidden md:inline">
                      <CopyButton value={contact.phone} label="phone" />
                    </span>
                    {/* Mobile: tel link */}
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
            )
          })}
        </div>
      )}

      {/* ---- Section 4: Stats strip ----------------------------------------- */}
      <CustomerQuickStats stats={stats} variant="header" />

      {/* ---- Modals --------------------------------------------------------- */}
      {editOpen && <EditCustomerSheet customer={customer} open={editOpen} onOpenChange={setEditOpen} />}
      {archiveOpen && <ArchiveDialog customer={customer} open={archiveOpen} onOpenChange={setArchiveOpen} />}
    </div>
  )
}
