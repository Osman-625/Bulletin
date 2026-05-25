import Link from 'next/link'
import type { BoardSort } from '@/lib/announcements/public-board'
import { buildFeedHref } from './FeedHref'

export function FeedPagination({
  page,
  totalPages,
  visibleStart,
  visibleEnd,
  total,
  category,
  search,
  activeSort,
}: {
  page: number
  totalPages: number
  visibleStart: number
  visibleEnd: number
  total: number
  category?: string
  search: string
  activeSort: BoardSort
}) {
  const progress =
    totalPages > 0 ? `${Math.max(0, Math.min(100, (page / totalPages) * 100))}%` : '0%'

  return (
    <nav
      className="mt-8 flex flex-col gap-3 rounded-[1.15rem] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
      aria-label="Announcement pagination"
    >
      <div className="min-w-0 flex-1">
        <p className="text-sm text-[var(--color-text-muted)]">
          Showing{' '}
          <span className="font-semibold text-[var(--color-text-primary)]">{visibleStart}</span> to{' '}
          <span className="font-semibold text-[var(--color-text-primary)]">{visibleEnd}</span> of{' '}
          <span className="font-semibold text-[var(--color-text-primary)]">{total}</span>
        </p>
        <div
          className="pagination-progress mt-3 h-1.5 overflow-hidden rounded-full bg-[var(--color-surface-elevated)]"
          aria-label="Pagination progress"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={totalPages}
          aria-valuenow={page}
        >
          <div
            className="h-full rounded-full bg-[var(--color-accent-inti)] transition-[width] duration-300 ease-[var(--ease-ui)]"
            style={{ width: progress }}
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        {page > 1 ? (
          <Link
            href={buildFeedHref({ category, q: search, sort: activeSort, page: page - 1 })}
            className="action-lift inline-flex min-h-10 items-center rounded-[0.85rem] border border-[var(--color-border)] px-3 text-sm font-semibold text-[var(--color-text-primary)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-inti)]"
          >
            Previous
          </Link>
        ) : (
          <span
            aria-disabled="true"
            className="inline-flex min-h-10 items-center rounded-[0.85rem] border border-[var(--color-border-subtle)] px-3 text-sm font-semibold text-[var(--color-text-muted)] opacity-55"
          >
            Previous
          </span>
        )}

        <span className="rounded-[0.85rem] bg-[var(--color-surface-elevated)] px-3 py-2 font-mono text-xs font-bold text-[var(--color-text-muted)]">
          {page} / {totalPages}
        </span>

        {page < totalPages ? (
          <Link
            href={buildFeedHref({ category, q: search, sort: activeSort, page: page + 1 })}
            className="action-lift inline-flex min-h-10 items-center rounded-[0.85rem] border border-[var(--color-border)] px-3 text-sm font-semibold text-[var(--color-text-primary)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-inti)]"
          >
            Load more notices
          </Link>
        ) : (
          <span
            aria-disabled="true"
            className="inline-flex min-h-10 items-center rounded-[0.85rem] border border-[var(--color-border-subtle)] px-3 text-sm font-semibold text-[var(--color-text-muted)] opacity-55"
          >
            All caught up
          </span>
        )}
      </div>
    </nav>
  )
}
