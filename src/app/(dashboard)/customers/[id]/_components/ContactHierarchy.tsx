'use client'

import { useState, useMemo } from 'react'
import {
  Star,
  UserPlus,
  FolderPlus,
  ChevronDown,
  ChevronRight,
  Mail,
  Phone,
  Users,
  Building2,
} from 'lucide-react'
import { cn } from '@shared/lib/cn'
import { Badge } from '@shared/ui/primitives/badge'
import { Button } from '@shared/ui/primitives/button'
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from '@shared/ui/primitives/collapsible'
import { AddContactSheet } from './AddContactSheet'
import { AddGroupSheet } from './AddGroupSheet'
import type { Customer } from '@domain/entities/customer'
import type { Contact } from '@domain/entities/contact'
import type { ContactRole } from '@domain/entities/contact'
import { CONTACT_ROLE_LABELS } from '@domain/constants'

type ContactHierarchyProps = {
  customer: Customer
}

const CONTACT_ROLE_COLORS: Record<ContactRole, string> = {
  ordering: 'bg-action/10 text-action border border-action/20',
  'art-approver': 'bg-success/10 text-success border border-success/20',
  billing: 'bg-warning/10 text-warning border border-warning/20',
  primary: 'bg-action/10 text-action border border-action/20',
  owner: 'bg-muted text-foreground border border-border',
  other: 'bg-muted text-muted-foreground',
}

function ContactCard({ contact }: { contact: Contact }) {
  return (
    <div
      className={cn(
        'rounded-lg border border-border bg-elevated p-3',
        'transition-colors hover:border-border/80'
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1 space-y-1.5">
          {/* Name + primary star */}
          <div className="flex items-center gap-1.5">
            <p className="text-sm font-medium text-foreground truncate">{contact.name}</p>
            {contact.isPrimary && (
              <Star
                className="h-3.5 w-3.5 shrink-0 fill-warning text-warning"
                aria-label="Primary contact"
              />
            )}
          </div>

          {/* Role badges — contacts can hold multiple roles */}
          <div className="flex flex-wrap gap-1">
            {contact.role.map((r) => (
              <Badge
                key={r}
                variant="ghost"
                className={cn('text-[10px] px-1.5 py-0', CONTACT_ROLE_COLORS[r])}
              >
                {CONTACT_ROLE_LABELS[r]}
              </Badge>
            ))}
          </div>

          {/* Contact info */}
          <div className="space-y-0.5">
            {contact.email && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Mail className="h-3 w-3 shrink-0" />
                <span className="truncate">{contact.email}</span>
              </div>
            )}
            {contact.phone && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Phone className="h-3 w-3 shrink-0" />
                <span>{contact.phone}</span>
              </div>
            )}
          </div>
        </div>

        {/* Set as Primary action */}
        {!contact.isPrimary && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 text-muted-foreground hover:text-warning shrink-0"
            aria-label={`Set ${contact.name} as primary contact`}
          >
            <Star className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
    </div>
  )
}

function GroupSection({ groupName, contacts }: { groupName: string; contacts: Contact[] }) {
  const [open, setOpen] = useState(true)

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger
        className={cn(
          'flex items-center gap-2 w-full text-left py-2 px-1',
          'text-sm font-medium text-foreground hover:text-action transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md'
        )}
        aria-label={`${open ? 'Collapse' : 'Expand'} ${groupName} group`}
      >
        {open ? (
          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
        ) : (
          <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
        )}
        <span>{groupName}</span>
        <span className="text-xs text-muted-foreground ml-1">({contacts.length})</span>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="space-y-2 pl-6 pb-2">
          {contacts.map((contact) => (
            <ContactCard key={contact.id} contact={contact} />
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}

export function ContactHierarchy({ customer }: ContactHierarchyProps) {
  const { contacts, groups, company } = customer

  const [addContactOpen, setAddContactOpen] = useState(false)
  const [addGroupOpen, setAddGroupOpen] = useState(false)

  const showAddGroup = contacts.length >= 2

  // Partition contacts: those with a groupId vs ungrouped
  const { ungrouped, groupedMap } = useMemo(() => {
    const ungrouped: Contact[] = []
    const groupedMap = new Map<string, Contact[]>()

    for (const contact of contacts) {
      if (contact.groupId) {
        const existing = groupedMap.get(contact.groupId) ?? []
        existing.push(contact)
        groupedMap.set(contact.groupId, existing)
      } else {
        ungrouped.push(contact)
      }
    }

    return { ungrouped, groupedMap }
  }, [contacts])

  if (contacts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="rounded-full bg-surface p-4 mb-4">
          <Users className="h-8 w-8 text-muted-foreground" />
        </div>
        <p className="text-sm font-medium text-foreground mb-1">No contacts</p>
        <p className="text-xs text-muted-foreground mb-4">
          Add your first contact for this customer.
        </p>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={() => setAddContactOpen(true)}
        >
          <UserPlus className="h-4 w-4" />
          Add Contact
        </Button>
        <AddContactSheet
          customerId={customer.id}
          open={addContactOpen}
          onOpenChange={setAddContactOpen}
        />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Action buttons */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 text-xs"
          aria-label="Add a new contact"
          onClick={() => setAddContactOpen(true)}
        >
          <UserPlus className="h-3.5 w-3.5" />
          Add Contact
        </Button>
        {showAddGroup && (
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 text-xs"
            aria-label="Add a new group"
            onClick={() => setAddGroupOpen(true)}
          >
            <FolderPlus className="h-3.5 w-3.5" />
            Add Group
          </Button>
        )}
      </div>

      {/* Company level header */}
      <div className="flex items-center gap-2 pb-1 border-b border-border">
        <Building2 className="h-4 w-4 text-muted-foreground" />
        <p className="text-sm font-medium text-foreground">{company}</p>
        <span className="text-xs text-muted-foreground">
          ({contacts.length} contact{contacts.length !== 1 ? 's' : ''})
        </span>
      </div>

      {/* Ungrouped contacts (directly under company) */}
      {ungrouped.length > 0 && (
        <div className="space-y-2">
          {ungrouped.map((contact) => (
            <ContactCard key={contact.id} contact={contact} />
          ))}
        </div>
      )}

      {/* Grouped contacts */}
      {groups.map((group) => {
        const groupContacts = groupedMap.get(group.id) ?? []
        if (groupContacts.length === 0) return null
        return <GroupSection key={group.id} groupName={group.name} contacts={groupContacts} />
      })}

      {/* Sheets */}
      <AddContactSheet
        customerId={customer.id}
        open={addContactOpen}
        onOpenChange={setAddContactOpen}
      />
      <AddGroupSheet open={addGroupOpen} onOpenChange={setAddGroupOpen} />
    </div>
  )
}
