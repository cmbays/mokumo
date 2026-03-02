'use client'

import { useState, useRef, useEffect } from 'react'
import { cn } from '@shared/lib/cn'

// ---------------------------------------------------------------------------
// CellInput — click-to-edit inline table cell
// ---------------------------------------------------------------------------

type CellInputProps = {
  value: string | number
  type: 'text' | 'number'
  step?: string
  min?: string
  suffix?: string
  prefix?: string
  ariaLabel: string
  onCommit: (value: string) => void
}

export function CellInput({
  value,
  type,
  step,
  min,
  suffix,
  prefix,
  ariaLabel,
  onCommit,
}: CellInputProps) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(String(value))
  const inputRef = useRef<HTMLInputElement>(null)
  // Prevents double-commit: Enter/Escape set this before blur fires
  const skipBlurRef = useRef(false)

  // Sync draft when parent value changes externally (e.g., after save)
  useEffect(() => {
    if (!editing) setDraft(String(value))
  }, [value, editing])

  useEffect(() => {
    if (editing) inputRef.current?.focus()
  }, [editing])

  function startEdit() {
    setDraft(String(value))
    setEditing(true)
  }

  function commit() {
    setEditing(false)
    onCommit(draft)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      skipBlurRef.current = true
      commit()
    }
    if (e.key === 'Escape') {
      skipBlurRef.current = true
      setDraft(String(value))
      setEditing(false)
    }
  }

  if (editing) {
    return (
      <div className="inline-flex items-center gap-0.5">
        {prefix && <span className="text-xs text-muted-foreground">{prefix}</span>}
        <input
          ref={inputRef}
          type={type}
          step={step}
          min={min}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={() => {
            if (!skipBlurRef.current) commit()
            skipBlurRef.current = false
          }}
          onKeyDown={handleKeyDown}
          aria-label={`Editing: ${ariaLabel}`}
          className={cn(
            'w-20 rounded border border-action bg-surface px-1.5 py-0.5',
            'text-sm text-foreground tabular-nums',
            'focus:outline-none focus-visible:ring-1 focus-visible:ring-action',
            'transition-colors'
          )}
        />
        {suffix && <span className="text-xs text-muted-foreground">{suffix}</span>}
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={startEdit}
      aria-label={ariaLabel}
      className={cn(
        'inline-flex items-center gap-0.5 rounded px-1.5 py-0.5',
        'text-sm text-foreground tabular-nums',
        'hover:bg-surface cursor-pointer transition-colors',
        // 44px touch target on mobile; auto height on desktop
        'min-h-11 md:min-h-0',
        'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-action'
      )}
    >
      {prefix && <span className="text-xs text-muted-foreground">{prefix}</span>}
      <span>{value}</span>
      {suffix && <span className="text-xs text-muted-foreground">{suffix}</span>}
    </button>
  )
}
