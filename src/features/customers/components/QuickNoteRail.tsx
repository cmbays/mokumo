'use client'

import * as React from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '@shared/lib/cn'
import { Button } from '@shared/ui/primitives/button'
import { Textarea } from '@shared/ui/primitives/textarea'
import { addCustomerNote } from '@features/customers/actions/activity.actions'
import type { CustomerActivity } from '@domain/ports/customer-activity.port'
import { ACTIVITY_ERROR_MESSAGES } from '@features/customers/lib/activity-error-messages'

type QuickNoteRailProps = {
  customerId: string
  onNoteSaved: (activity: CustomerActivity) => void
}

export function QuickNoteRail({ customerId, onNoteSaved }: QuickNoteRailProps) {
  const [content, setContent] = React.useState('')
  const [saving, setSaving] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  async function handleSave() {
    if (!content.trim()) return

    setSaving(true)
    setError(null)

    const result = await addCustomerNote({ customerId, content: content.trim() })

    setSaving(false)

    if (result.ok) {
      setContent('')
      onNoteSaved(result.value)
    } else {
      setError(ACTIVITY_ERROR_MESSAGES[result.error])
    }
  }

  // 360px fixed per design spec (stacks below timeline on mobile)
  return (
    <div className="flex flex-col gap-3 border-l border-border pl-5 w-full md:w-90 shrink-0">
      <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
        Quick Note
      </h3>

      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Add a note about this customer…"
        rows={4}
        className="resize-none text-sm bg-elevated border border-border rounded-md min-h-22"
        disabled={saving}
        aria-label="Quick note content"
      />

      {error && (
        <p className="text-xs text-error" role="alert">
          {error}
        </p>
      )}

      {/* Footer: save button */}
      <div className="flex justify-end">
        <Button
          size="sm"
          disabled={!content.trim() || saving}
          onClick={handleSave}
          className={cn('relative', content.trim() && !saving && 'shadow-brutal shadow-black/50')}
        >
          {saving ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              Saving…
            </>
          ) : (
            'Save Note'
          )}
        </Button>
      </div>
    </div>
  )
}
