'use client'

import * as React from 'react'
import {
  Check,
  ChevronsUpDown,
  Plus,
  User,
  Building2,
  Mail,
  Phone,
  ExternalLink,
} from 'lucide-react'

import { cn } from '@shared/lib/cn'
import { Button } from '@shared/ui/primitives/button'
import { Badge } from '@shared/ui/primitives/badge'
import { Popover, PopoverContent, PopoverTrigger } from '@shared/ui/primitives/popover'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@shared/ui/primitives/command'
import {
  CUSTOMER_TYPE_TAG_LABELS,
  CONTACT_ROLE_LABELS,
  LIFECYCLE_STAGE_LABELS,
} from '@domain/constants'
import { LifecycleBadge } from '@shared/ui/organisms/LifecycleBadge'
import { TypeTagBadges } from '@shared/ui/organisms/TypeTagBadges'
import type { Customer } from '@domain/entities/customer'
import type { ContactRole } from '@domain/entities/contact'

/** Subset of Customer fields needed by the combobox */
export type CustomerOption = Pick<
  Customer,
  'id' | 'name' | 'company' | 'email' | 'phone' | 'tag' | 'lifecycleStage' | 'typeTags'
> & {
  contactRole?: ContactRole[]
}

export type CustomerComboboxProps = {
  customers: CustomerOption[]
  selectedCustomerId?: string
  onSelect: (customerId: string) => void
  onAddNew?: () => void
}

export function CustomerCombobox({
  customers,
  selectedCustomerId,
  onSelect,
  onAddNew,
}: CustomerComboboxProps) {
  const [open, setOpen] = React.useState(false)

  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId)

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            aria-label="Select customer"
            className="w-full justify-between"
          >
            <span className="truncate">
              {selectedCustomer ? selectedCustomer.name : 'Select customer...'}
            </span>
            <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
          <Command
            filter={(value, search) => {
              const customer = customers.find((c) => c.id === value)
              if (!customer) return 0
              const lifecycleLabel = customer.lifecycleStage
                ? LIFECYCLE_STAGE_LABELS[customer.lifecycleStage]
                : ''
              const typeTagLabels = (customer.typeTags || [])
                .map((t) => CUSTOMER_TYPE_TAG_LABELS[t])
                .join(' ')
              const haystack =
                `${customer.name} ${customer.company} ${lifecycleLabel} ${typeTagLabels}`.toLowerCase()
              return haystack.includes(search.toLowerCase()) ? 1 : 0
            }}
          >
            <CommandInput placeholder="Search customers..." />
            <CommandList>
              <CommandEmpty>No customers found.</CommandEmpty>
              <CommandGroup>
                {customers.map((customer) => (
                  <CommandItem
                    key={customer.id}
                    value={customer.id}
                    onSelect={(currentValue) => {
                      onSelect(currentValue)
                      setOpen(false)
                    }}
                  >
                    <Check
                      className={cn(
                        'mr-2 size-4',
                        selectedCustomerId === customer.id ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                    <span className="truncate">
                      {customer.name}
                      <span className="text-muted-foreground"> — {customer.company}</span>
                    </span>
                    {customer.lifecycleStage && (
                      <LifecycleBadge
                        stage={customer.lifecycleStage}
                        className="ml-auto text-xs shrink-0"
                      />
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
              {onAddNew && (
                <>
                  <CommandSeparator />
                  <CommandGroup>
                    <CommandItem
                      onSelect={() => {
                        onAddNew()
                        setOpen(false)
                      }}
                    >
                      <Plus className="mr-2 size-4" />
                      Add New Customer
                    </CommandItem>
                  </CommandGroup>
                </>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {selectedCustomer && (
        <div className="rounded-lg border bg-elevated p-3 space-y-2 text-sm">
          {/* Company name — prominent */}
          <div className="flex items-center gap-2 text-foreground">
            <Building2 className="size-4 shrink-0 text-muted-foreground" />
            <span className="font-medium">{selectedCustomer.company}</span>
          </div>

          {/* Primary contact name + role badge */}
          <div className="flex items-center gap-2 text-foreground">
            <User className="size-4 shrink-0 text-muted-foreground" />
            <span>{selectedCustomer.name}</span>
            {selectedCustomer.contactRole?.[0] && (
              <Badge variant="outline" className="text-xs text-muted-foreground">
                {CONTACT_ROLE_LABELS[selectedCustomer.contactRole[0]]}
              </Badge>
            )}
          </div>

          {/* Email + phone */}
          <div className="flex items-center gap-2 text-foreground">
            <Mail className="size-4 shrink-0 text-muted-foreground" />
            <span>{selectedCustomer.email}</span>
          </div>
          {selectedCustomer.phone && (
            <div className="flex items-center gap-2 text-foreground">
              <Phone className="size-4 shrink-0 text-muted-foreground" />
              <span>{selectedCustomer.phone}</span>
            </div>
          )}

          {/* Lifecycle badge + type tag badges */}
          <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
            {selectedCustomer.lifecycleStage && (
              <LifecycleBadge stage={selectedCustomer.lifecycleStage} className="text-xs" />
            )}
            <TypeTagBadges tags={selectedCustomer.typeTags ?? []} />
          </div>

          {/* View Customer link */}
          <a
            href={`/customers/${selectedCustomer.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 rounded-sm text-xs text-action hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action/50 active:underline pt-0.5"
          >
            View Customer
            <ExternalLink className="size-4" />
          </a>
        </div>
      )}
    </div>
  )
}
