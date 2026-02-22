import 'server-only'

/**
 * Safe generic fallback — exported so callers can compare without duplicating
 * the string literal (avoids silent breakage if the message is ever changed).
 */
export const AUTH_ERROR_GENERIC_FALLBACK = 'Something went wrong. Please try again.'

/**
 * Maps a raw Supabase auth error message to a safe, user-facing string.
 *
 * The mapping is an explicit allowlist — anything not matched returns
 * AUTH_ERROR_GENERIC_FALLBACK so internal Supabase error strings never
 * reach the client. Case-insensitive to guard against GoTrue casing changes
 * across versions.
 */
export function normalizeAuthError(message: string): string {
  const lower = message.toLowerCase()
  if (lower.includes('invalid login credentials')) return 'Invalid email or password'
  if (lower.includes('user not found')) return 'Invalid email or password' // anti-enumeration
  if (lower.includes('email not confirmed')) return 'Please confirm your email before signing in'
  if (lower.includes('too many requests')) return 'Too many attempts. Please wait a moment.'
  if (lower.includes('rate limit')) return 'Too many attempts. Please wait a moment.'
  return AUTH_ERROR_GENERIC_FALLBACK
}
