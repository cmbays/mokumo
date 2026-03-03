/**
 * Shared formatting helpers used across UI components.
 */

/** Parse a date string safely (avoids UTC day-shift for date-only strings). */
function parseDate(dateStr: string): Date {
  if (dateStr.includes('T')) return new Date(dateStr)
  const [year, month, day] = dateStr.split('-').map(Number)
  return new Date(year, month - 1, day)
}

/**
 * Format a date string as "Feb 12, 2026".
 */
export function formatDate(dateStr: string): string {
  return parseDate(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

/**
 * Format a date string as "Feb 12" (no year — compact for cards).
 */
export function formatShortDate(dateStr: string): string {
  return parseDate(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

/**
 * Format a date or date string as a compact relative time: "just now", "5m ago", "3h ago", "2d ago".
 * Falls back to "Feb 12" for dates older than a week.
 */
export function formatRelativeTime(dateInput: Date | string): string {
  const now = new Date()
  const date = typeof dateInput === 'string' ? parseDate(dateInput) : dateInput
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
