import { describe, it, expect } from 'vitest'
import { normalizeAuthError } from '../normalize-auth-error'

describe('normalizeAuthError()', () => {
  it('maps "Invalid login credentials" to the credential error message', () => {
    expect(normalizeAuthError('Invalid login credentials')).toBe('Invalid email or password')
  })

  it('matches "Invalid login credentials" as a substring', () => {
    expect(normalizeAuthError('AuthApiError: Invalid login credentials')).toBe(
      'Invalid email or password'
    )
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

  it('returns the generic fallback for unknown error messages', () => {
    expect(normalizeAuthError('User not found')).toBe('Something went wrong. Please try again.')
  })

  it('returns the generic fallback for an empty string', () => {
    expect(normalizeAuthError('')).toBe('Something went wrong. Please try again.')
  })
})
