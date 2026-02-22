/**
 * Maps a raw Supabase auth error message to a safe, user-facing string.
 *
 * The mapping is an explicit allowlist — anything not matched returns a
 * generic fallback so internal Supabase error strings never reach the client.
 */
export function normalizeAuthError(message: string): string {
  if (message.includes('Invalid login credentials')) return 'Invalid email or password'
  if (message.includes('Email not confirmed')) return 'Please confirm your email before signing in'
  if (message.includes('Too many requests')) return 'Too many attempts. Please wait a moment.'
  if (message.includes('rate limit')) return 'Too many attempts. Please wait a moment.'
  return 'Something went wrong. Please try again.'
}
