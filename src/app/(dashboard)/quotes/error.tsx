'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AlertCircle, RotateCcw, ArrowLeft } from 'lucide-react'
import { Button } from '@shared/ui/primitives/button'
import { logger } from '@shared/lib/logger'

const errorLogger = logger.child({ domain: 'quotes-error-boundary' })

type Props = {
  error: Error & { digest?: string }
  reset: () => void
}

export default function QuotesError({ error, reset }: Props) {
  const router = useRouter()

  useEffect(() => {
    errorLogger.error('Quotes segment error boundary caught', {
      message: error.message,
      digest: error.digest,
    })
  }, [error])

  return (
    <div className="mx-auto max-w-4xl">
      <div className="flex flex-col items-center justify-center rounded-lg border border-border bg-elevated px-8 py-16 text-center">
        <div className="mb-4 rounded-full bg-surface p-3">
          <AlertCircle className="h-8 w-8 text-error" />
        </div>

        <h2 className="mb-2 text-lg font-semibold text-foreground">Something went wrong</h2>

        <p className="mb-1 max-w-sm text-sm text-muted-foreground">
          This page failed to load. The error has been logged.
        </p>

        {error.digest && (
          <p className="mb-6 font-mono text-xs text-muted-foreground">Error ID: {error.digest}</p>
        )}

        <div className="flex gap-3">
          <Button variant="outline" size="sm" onClick={() => router.push('/quotes')}>
            <ArrowLeft className="mr-1.5 h-4 w-4" />
            Back to Quotes
          </Button>
          <Button size="sm" onClick={reset}>
            <RotateCcw className="mr-1.5 h-4 w-4" />
            Try again
          </Button>
        </div>
      </div>
    </div>
  )
}
