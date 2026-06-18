'use client'

import { useEffect } from 'react'
import { reportClientError } from '@/shared/errors/client-error-reporting'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    reportClientError('dashboard.error_boundary', error, {
      digest: error.digest ?? null,
    })
  }, [error])

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center px-6 text-center">
      <div className="rounded-[var(--radius-control)] border border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-10 shadow-[var(--shadow-soft)]">
        <p className="future-kicker">Dashboard paused</p>
        <h2 className="mt-4 text-2xl font-bold text-[var(--color-text-primary)]">
          We could not load this workspace.
        </h2>
        <p className="mt-3 text-sm leading-6 text-[var(--color-text-secondary)]">
          The request failed before the dashboard data finished loading. Try again, and the
          workspace will keep your current session.
        </p>
      </div>
      <button
        type="button"
        onClick={reset}
        className="action-lift mt-5 min-h-11 rounded-[0.95rem] bg-[var(--color-accent)] px-5 text-sm font-semibold text-white shadow-[var(--shadow-button)]"
      >
        Reload dashboard
      </button>
    </div>
  )
}
