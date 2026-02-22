'use client'

import { FormEvent, useState } from 'react'
import { signIn } from './actions'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    // signIn() calls redirect('/') on success (throws NEXT_REDIRECT).
    // It only returns a value on validation/auth failure.
    const result = await signIn(new FormData(e.currentTarget))

    if (result.error) {
      setError(result.error)
    }

    setIsLoading(false)
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="w-full max-w-md p-8 space-y-6 bg-elevated rounded-lg border border-border">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Screen Print Pro</h1>
          <p className="mt-2 text-sm text-muted-foreground">Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" suppressHydrationWarning>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-foreground">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-3 py-2 mt-1 border border-border rounded-md bg-surface text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-action"
              disabled={isLoading}
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-foreground">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3 py-2 mt-1 border border-border rounded-md bg-surface text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-action"
              disabled={isLoading}
              required
            />
          </div>

          {error && <p className="text-sm text-error">{error}</p>}

          <button
            type="submit"
            disabled={isLoading || !email || !password}
            className="w-full px-4 py-2 font-medium text-background bg-action rounded-md hover:bg-action/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <p className="text-xs text-muted-foreground text-center">
          Protected area. Contact support for account access.
        </p>
      </div>
    </div>
  )
}
