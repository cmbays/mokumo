'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@shared/ui/primitives/sheet'
import { Button } from '@shared/ui/primitives/button'
import { Input } from '@shared/ui/primitives/input'
import { Label } from '@shared/ui/primitives/label'
import { Checkbox } from '@shared/ui/primitives/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@shared/ui/primitives/select'
import { CONTACT_ROLE_LABELS } from '@domain/constants'
import { contactRoleEnum } from '@domain/entities/contact'
import { createContact } from '../../actions/contact.actions'
import type { Group } from '@domain/entities/group'

type AddContactSheetProps = {
  customerId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  groups: Group[]
}

// contactRoleEnum includes 'owner' and 'other' which are not accepted by contactInputSchema.
// Only expose values accepted by the server action.
const SUBMITTABLE_ROLES = contactRoleEnum.options.filter(
  (r): r is 'ordering' | 'billing' | 'art-approver' | 'primary' =>
    r === 'ordering' || r === 'billing' || r === 'art-approver' || r === 'primary'
)

export function AddContactSheet({ customerId, open, onOpenChange, groups }: AddContactSheetProps) {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [role, setRole] = useState<string>('ordering')
  const [groupId, setGroupId] = useState<string>('none')
  const [isPrimary, setIsPrimary] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  async function handleAdd() {
    setSubmitting(true)
    const result = await createContact({
      customerId,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim() || undefined,
      phone: phone.trim() || undefined,
      // Single-select role wrapped as array to match the port schema (contacts can hold multiple roles)
      role: [role as 'ordering' | 'billing' | 'art-approver' | 'primary'],
      isPrimary,
      portalAccess: false,
      canApproveProofs: isPrimary,
      canPlaceOrders: false,
    })
    setSubmitting(false)

    if (result.ok) {
      toast.success('Contact added')
      resetForm()
      onOpenChange(false)
    } else {
      toast.error(
        result.error === 'VALIDATION'
          ? 'Please check the form fields.'
          : 'Failed to add contact. Please try again.'
      )
    }
  }

  function resetForm() {
    setFirstName('')
    setLastName('')
    setEmail('')
    setPhone('')
    setRole('ordering')
    setGroupId('none')
    setIsPrimary(false)
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) resetForm()
    onOpenChange(nextOpen)
  }

  const canSubmit = firstName.trim().length > 0 && lastName.trim().length > 0 && !submitting

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>Add Contact</SheetTitle>
          <SheetDescription>Add a new contact person to this customer.</SheetDescription>
        </SheetHeader>

        <div className="px-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="contact-first-name">
                First name <span className="text-error">*</span>
              </Label>
              <Input
                id="contact-first-name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Jane"
                autoComplete="given-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact-last-name">
                Last name <span className="text-error">*</span>
              </Label>
              <Input
                id="contact-last-name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Smith"
                autoComplete="family-name"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="contact-email">Email</Label>
            <Input
              id="contact-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@example.com"
              autoComplete="email"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contact-phone">Phone</Label>
            <Input
              id="contact-phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="(555) 555-5555"
              autoComplete="tel"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contact-role">Role</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger className="w-full" aria-label="Contact role">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SUBMITTABLE_ROLES.map((r) => (
                  <SelectItem key={r} value={r}>
                    {CONTACT_ROLE_LABELS[r]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {groups.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="contact-group">Group</Label>
              <Select value={groupId} onValueChange={setGroupId}>
                <SelectTrigger className="w-full" aria-label="Contact group">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No group</SelectItem>
                  {groups.map((g) => (
                    <SelectItem key={g.id} value={g.id}>
                      {g.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <Checkbox
              checked={isPrimary}
              onCheckedChange={(checked) => setIsPrimary(checked === true)}
              aria-label="Primary contact"
            />
            Primary contact
          </label>
        </div>

        <SheetFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleAdd} disabled={!canSubmit}>
            {submitting ? 'Adding…' : 'Add Contact'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
