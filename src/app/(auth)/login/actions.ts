'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@shared/lib/supabase/server'
import { logger } from '@shared/lib/logger'
import { normalizeAuthError } from '@infra/auth/normalize-auth-error'

const loginLogger = logger.child({ domain: 'auth' })

export async function signIn(formData: FormData) {
  // Proper type narrowing instead of unsafe 'as string' cast
  const rawEmail = formData.get('email')
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
    if (safeMessage === 'Something went wrong. Please try again.') {
      // Log unexpected Supabase errors for server-side observability — never returned to the client
      loginLogger.warn('auth.signIn unexpected error', { code: error.code })
    }
    return { error: safeMessage }
  }

  redirect('/')
}
