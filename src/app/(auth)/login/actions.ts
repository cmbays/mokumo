'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@shared/lib/supabase/server'

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
    return { error: error.message }
  }

  redirect('/')
}
