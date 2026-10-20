import Link from 'next/link'
import { usersHref } from '@/modules/users/users-href'

export function UserPagination({
  basePath,
  page,
  totalPages,
  role,
}: {
  basePath: string
  page: number
  totalPages: number
  role?: string
}) {
  if (totalPages <= 1) return null
  const previousPage = Math.max(1, page - 1)
  const nextPage = Math.min(totalPages, page + 1)

  return (
    <nav
      aria-label="User pagination"
      className="flex flex-col gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
    >
      <p className="text-sm text-[var(--color-text-secondary)]">
        Page {page} of {totalPages}
      </p>
      <div className="flex items-center gap-2">
        <Link
          href={usersHref(basePath, { role, page: previousPage })}
          aria-disabled={page <= 1}
          className={`inline-flex min-h-11 items-center rounded-xl px-4 text-sm font-semibold transition-colors ${
            page <= 1
              ? 'pointer-events-none bg-[var(--color-surface-elevated)] text-[var(--color-text-muted)] opacity-50'
              : 'bg-[var(--color-surface-elevated)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
          }`}
        >
          Previous
        </Link>
        <Link
          href={usersHref(basePath, { role, page: nextPage })}
          aria-disabled={page >= totalPages}
          className={`inline-flex min-h-11 items-center rounded-xl px-4 text-sm font-semibold transition-colors ${
            page >= totalPages
              ? 'pointer-events-none bg-[var(--color-surface-elevated)] text-[var(--color-text-muted)] opacity-50'
              : 'bg-[var(--color-accent)] text-[var(--color-on-accent)] hover:bg-[var(--color-accent-hover)]'
          }`}
        >
          Next
        </Link>
      </div>
    </nav>
  )
}
