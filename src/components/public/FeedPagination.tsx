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
  return (
    <nav
      className="mt-8 flex flex-col gap-3 rounded-[1.15rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 sm:flex-row sm:items-center sm:justify-between"
      aria-label="Announcement pagination"
    >
      <div className="min-w-0 flex-1">
        <p className="text-sm text-[var(--color-text-muted)]">
          Showing{' '}
          <span className="font-semibold text-[var(--color-text-primary)]">{visibleStart}</span> to{' '}
          <span className="font-semibold text-[var(--color-text-primary)]">{visibleEnd}</span> of{' '}
          <span className="font-semibold text-[var(--color-text-primary)]">{total}</span>
        </p>
        <progress
          className="pagination-progress mt-3 block h-1.5 w-full [appearance:none] overflow-hidden rounded-full bg-[var(--color-surface-elevated)] [&::-moz-progress-bar]:rounded-full [&::-moz-progress-bar]:bg-[var(--color-accent-inti)] [&::-webkit-progress-bar]:rounded-full [&::-webkit-progress-bar]:bg-[var(--color-surface-elevated)] [&::-webkit-progress-value]:rounded-full [&::-webkit-progress-value]:bg-[var(--color-accent-inti)]"
          aria-label="Pagination progress"
          value={page}
          max={Math.max(totalPages, 1)}
        />
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
