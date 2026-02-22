'use server'

import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient } from '@shared/lib/supabase/server'
import { logger } from '@shared/lib/logger'
import { normalizeAuthError, AUTH_ERROR_GENERIC_FALLBACK } from '@infra/auth/normalize-auth-error'
import { checkSignInRateLimit } from '@shared/lib/rate-limit'

const loginLogger = logger.child({ domain: 'auth' })

export async function signIn(formData: FormData) {
  const headerStore = await headers()

  // Prefer Vercel-set headers that clients cannot forge over x-forwarded-for (client-appendable).
  // x-real-ip and x-vercel-forwarded-for are overwritten by the edge, not appended.
  const ip =
    headerStore.get('x-real-ip') ??
    headerStore.get('x-vercel-forwarded-for')?.split(',')[0]?.trim() ??
    headerStore.get('x-forwarded-for')?.split(',')[0]?.trim()

  if (!ip && process.env.NODE_ENV === 'production') {
    loginLogger.warn('auth.signIn blocked: no client IP resolvable')
    return { error: 'Unable to verify your request. Please try again.' }
  }

  // Compound key prevents locking out all users on a shared IP (e.g. NAT, office).
  // Uses the raw email before validation — any string gets its own per-IP bucket.
  const rawEmail = formData.get('email')
  const emailForKey = typeof rawEmail === 'string' ? rawEmail.trim() : ''
  const rateLimitKey = ip ? `${ip}:${emailForKey}` : 'unknown'
  const { limited } = await checkSignInRateLimit(rateLimitKey)
  if (limited) {
    return { error: 'Too many attempts. Please wait a moment.' }
  }

  // Full type narrowing instead of unsafe 'as string' cast
  const rawPassword = formData.get('password')
  if (typeof rawEmail !== 'string' || typeof rawPassword !== 'string') {
    return { error: 'Email and password are required' }
  }

  const email = rawEmail.trim()
  const password = rawPassword

  if (!email || !password) {
    return { error: 'Email and password are required' }
  }

  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    const safeMessage = normalizeAuthError(error.message)
    if (safeMessage === AUTH_ERROR_GENERIC_FALLBACK) {
      // Log unexpected Supabase errors for server-side observability — never returned to the client
      loginLogger.warn('auth.signIn unexpected error', { code: error.code })
    }
    return { error: safeMessage }
  }

  redirect('/')
}
