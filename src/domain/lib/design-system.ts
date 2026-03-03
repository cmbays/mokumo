// Design System — Badge Recipe Utilities
//
// Two isolated color pools prevent semantic collision:
//   STATUS PALETTE  → filled badges (state/urgency)
//   CATEGORICAL     → outline badges + left borders (entity/service identity)
//
// Three badge visual variants:
//   Filled  = status only     (bg + text + border)
//   Outline = category only   (border + text, no fill)
//   Dot     = lifecycle/health (small dot + label text)
//
// All maps use complete Tailwind class strings for JIT compatibility.

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Status badge roles — the 4 semantic states */
export type StatusRole = 'action' | 'success' | 'warning' | 'error'

/** Categorical colors — entity/service identity */
export type CategoryColor = 'purple' | 'magenta' | 'teal' | 'emerald' | 'lime' | 'brown' | 'yellow'

// ---------------------------------------------------------------------------
// Filled badge: colored bg + text + border (STATUS ONLY)
// ---------------------------------------------------------------------------

const STATUS_BADGE_MAP: Record<StatusRole, string> = {
  action: 'bg-action/10 text-action border border-action/20',
  success: 'bg-success/10 text-success border border-success/20',
  warning: 'bg-warning/10 text-warning border border-warning/20',
  error: 'bg-error/10 text-error border border-error/20',
}

export function statusBadge(role: StatusRole): string {
  return STATUS_BADGE_MAP[role]
}

// ---------------------------------------------------------------------------
// Muted badge: neutral bg + muted text (for "draft", "pending", "inactive")
// ---------------------------------------------------------------------------

export const MUTED_BADGE = 'bg-muted text-muted-foreground' as const

// ---------------------------------------------------------------------------
// Outline badge: border + text, no fill (CATEGORY/IDENTITY ONLY)
// ---------------------------------------------------------------------------

const CATEGORY_BADGE_MAP: Record<CategoryColor, string> = {
  purple: 'text-purple border border-purple/20',
  magenta: 'text-magenta border border-magenta/20',
  teal: 'text-teal border border-teal/20',
  emerald: 'text-emerald border border-emerald/20',
  lime: 'text-lime border border-lime/20',
  brown: 'text-brown border border-brown/20',
  yellow: 'text-yellow border border-yellow/20',
}

export function categoryBadge(color: CategoryColor): string {
  return CATEGORY_BADGE_MAP[color]
}

// ---------------------------------------------------------------------------
// Dot indicator colors: small dot + label (LIFECYCLE/HEALTH)
// ---------------------------------------------------------------------------

const DOT_COLOR_MAP: Record<StatusRole | 'muted', string> = {
  action: 'bg-action',
  success: 'bg-success',
  warning: 'bg-warning',
  error: 'bg-error',
  muted: 'bg-muted-foreground',
}

export function dotColor(role: StatusRole | 'muted'): string {
  return DOT_COLOR_MAP[role]
}

// ---------------------------------------------------------------------------
// Text-to-bg color mapping (for BottomTabBar active indicator and similar)
// ---------------------------------------------------------------------------

const TEXT_TO_BG_MAP: Record<string, string> = {
  'text-purple': 'bg-purple',
  'text-magenta': 'bg-magenta',
  'text-teal': 'bg-teal',
  'text-emerald': 'bg-emerald',
  'text-lime': 'bg-lime',
  'text-brown': 'bg-brown',
  'text-yellow': 'bg-yellow',
  'text-success': 'bg-success',
  'text-action': 'bg-action',
}

export function textToBgColor(textClass: string): string {
  return TEXT_TO_BG_MAP[textClass] ?? 'bg-action'
}
