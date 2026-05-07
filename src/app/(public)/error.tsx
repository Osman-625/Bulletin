'use client'

import { useEffect } from 'react'

export default function PublicError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 text-center">
      <h2 className="text-[1.85625rem] font-semibold">Something went wrong</h2>
      <button onClick={reset} className="text-[1.44375rem] underline underline-offset-4">
        Try again
      </button>
    </div>
  )
}
