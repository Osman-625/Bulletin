'use client'

import { useEffect } from 'react'
import { BrandMark } from '@/components/layout/BrandMark'
import { reportClientError } from '@/lib/client-error-reporting'

export default function PublicError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    reportClientError('public.error_boundary', error, {
      digest: error.digest ?? null,
    })
  }, [error])

  return (
    <div className="future-warm-plane min-h-[100dvh] px-4 py-12 sm:px-6 lg:px-10">
      <div className="future-bento-cell mx-auto flex min-h-[28rem] max-w-[42rem] flex-col items-center justify-center rounded-[1.75rem] px-6 py-14 text-center">
        <BrandMark size="lg" showText={false} className="campus-logo-halo mb-6 rounded-[1.35rem]" />
        <h2 className="font-display text-4xl leading-tight font-bold text-[var(--color-text-primary)] sm:text-5xl">
          Bulletin could not load
        </h2>
        <p className="mt-4 max-w-[28rem] text-base leading-7 text-[var(--color-text-muted)]">
          The public board hit a temporary problem. Try again to reload the latest notices.
        </p>
        <button
          onClick={reset}
          className="action-lift mt-7 min-h-12 rounded-[1rem] bg-[var(--color-accent-inti)] px-6 text-base font-semibold text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-inti)]"
        >
          Try again
        </button>
      </div>
    </div>
  )
}
