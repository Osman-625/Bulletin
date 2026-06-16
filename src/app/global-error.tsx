'use client'

import * as Sentry from '@sentry/nextjs'
import { useEffect } from 'react'
import { reportClientError } from '@/lib/client-error-reporting'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    Sentry.captureException(error)
    reportClientError('global.error_boundary', error, {
      digest: error.digest ?? null,
    })
  }, [error])

  return (
    <html lang="en">
      <body>
        <main
          id="main-content"
          className="future-warm-plane flex min-h-screen items-center justify-center px-6 py-12 text-center"
        >
          <section className="future-bento-cell max-w-xl rounded-[1.5rem] px-6 py-10">
            <p className="future-kicker">Bulletin paused</p>
            <h1 className="mt-4 text-3xl font-bold text-[var(--color-text-primary)]">
              Something went wrong.
            </h1>
            <p className="mt-3 text-sm leading-6 text-[var(--color-text-secondary)]">
              The app hit an unexpected error before this page could finish loading.
            </p>
            <button
              type="button"
              onClick={reset}
              className="action-lift mt-6 min-h-11 rounded-[0.95rem] bg-[var(--color-accent)] px-5 text-sm font-semibold text-[var(--color-on-accent)] shadow-[var(--shadow-button)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2"
            >
              Reload page
            </button>
          </section>
        </main>
      </body>
    </html>
  )
}
