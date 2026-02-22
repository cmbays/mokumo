import { describe, it, expect, vi } from 'vitest'

// server-only guard must be mocked before importing any server-only module
vi.mock('server-only', () => ({}))

import { normalizeAuthError, AUTH_ERROR_GENERIC_FALLBACK } from '../normalize-auth-error'

describe('normalizeAuthError()', () => {
  it('maps "Invalid login credentials" to the credential error message', () => {
    expect(normalizeAuthError('Invalid login credentials')).toBe('Invalid email or password')
  })

  it('matches "Invalid login credentials" as a substring', () => {
    expect(normalizeAuthError('AuthApiError: Invalid login credentials')).toBe(
      'Invalid email or password'
    )
  })

  it('maps "User not found" to the credential error message (anti-enumeration)', () => {
    // Prevents attackers from detecting whether an email has an account.
    // Both wrong-password and no-such-user cases must return the same message.
    expect(normalizeAuthError('User not found')).toBe('Invalid email or password')
  })

  it('maps "Email not confirmed" to the confirmation message', () => {
    expect(normalizeAuthError('Email not confirmed')).toBe(
      'Please confirm your email before signing in'
    )
  })

  it('maps "Too many requests" to the rate-limit message', () => {
    expect(normalizeAuthError('Too many requests')).toBe('Too many attempts. Please wait a moment.')
  })

  it('maps a message containing "rate limit" to the rate-limit message', () => {
    expect(
      normalizeAuthError(
        'For security purposes, you can only request this after the rate limit resets'
      )
    ).toBe('Too many attempts. Please wait a moment.')
  })

  it('is case-insensitive (guards against GoTrue casing changes)', () => {
    expect(normalizeAuthError('invalid login credentials')).toBe('Invalid email or password')
    expect(normalizeAuthError('EMAIL NOT CONFIRMED')).toBe(
      'Please confirm your email before signing in'
    )
  })

  it('returns AUTH_ERROR_GENERIC_FALLBACK for unknown error messages', () => {
    expect(normalizeAuthError('Some obscure internal error')).toBe(AUTH_ERROR_GENERIC_FALLBACK)
  })

  it('returns AUTH_ERROR_GENERIC_FALLBACK for an empty string', () => {
    expect(normalizeAuthError('')).toBe(AUTH_ERROR_GENERIC_FALLBACK)
  })
})
