// Canonical entity label + color assignments.
// Every component that renders entity metadata MUST import from here to
// guarantee visual consistency. For icon components, use ENTITY_ICONS from
// @shared/constants/entity-icons (icons are a UI concern, not domain).

export type EntityStyle = {
  /** Tailwind text-color class, e.g. "text-purple" */
  color: string
  /** Tailwind border-l color for board card accent */
  borderColor: string
  label: string
}

export const ENTITY_STYLES = {
  job: {
    color: 'text-purple',
    borderColor: 'border-l-purple',
    label: 'Jobs',
  },
  quote: {
    color: 'text-magenta',
    borderColor: 'border-l-magenta',
    label: 'Quotes',
  },
  invoice: {
    color: 'text-emerald',
    borderColor: 'border-l-emerald',
    label: 'Invoices',
  },
  scratch_note: {
    color: 'text-magenta',
    borderColor: 'border-l-magenta',
    label: 'Scratch Notes',
  },
} as const satisfies Record<string, EntityStyle>
