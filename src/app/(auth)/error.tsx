'use client'

import { useEffect } from 'react'
import { reportClientError } from '@/lib/client-error-reporting'

export default function AuthError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    reportClientError('auth.error_boundary', error, {
      digest: error.digest ?? null,
    })
  }, [error])

  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <h2 className="text-lg font-semibold">Something went wrong</h2>
      <button onClick={reset} className="text-sm underline underline-offset-4">
        Try again
      </button>
    </div>
  )
}
