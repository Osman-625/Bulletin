'use client'

import Link from 'next/link'
import { BOARD_SORT_OPTIONS, type BoardSort } from '@/modules/announcements/public-board'
import { buildFeedHref } from './FeedHref'
import { useFeedNavigation } from './FeedNavigation'
import { FeedPendingStatus } from './FeedPendingStatus'

export function BoardOrderControls({
  activeSort,
  category,
  search,
  activeCategory,
  count,
}: {
  activeSort: BoardSort
  category?: string
  search: string
  activeCategory?: string | null
  count: number
}) {
  const activeOption = BOARD_SORT_OPTIONS.find((option) => option.sort === activeSort)!
  const { navigate } = useFeedNavigation()

  return (
    <section
      className="public-board-sort public-board-sort-bar public-board-order public-board-span-full public-page-reveal future-bento-cell grid min-w-0 gap-2 rounded-[1rem] p-1.5 delay-4 sm:p-2 lg:grid-cols-[auto_minmax(0,1fr)] lg:items-center"
      aria-labelledby="board-order-title"
    >
      <div className="min-w-0 px-1 lg:w-[10rem]">
        <p className="future-kicker">{activeOption.eyebrow}</p>
        <h2
          id="board-order-title"
          className="font-display mt-0.5 text-sm leading-none font-extrabold text-[var(--color-text-primary)]"
        >
          {activeOption.label}
        </h2>
        <p className="mt-0.5 max-w-[30rem] text-[0.72rem] leading-4 text-[var(--color-text-muted)]">
          Showing: {activeCategory ?? 'All topics'} · {count} notices
        </p>
        <div className="mt-2">
          <FeedPendingStatus />
        </div>
      </div>

      <nav
        className="grid min-w-0 grid-cols-3 gap-1 overflow-visible rounded-[var(--radius-control)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-elevated)] p-0.5"
        aria-label="Sort order"
      >
        {BOARD_SORT_OPTIONS.map((option) => {
          const active = option.sort === activeSort
          const href = buildFeedHref({ category, q: search, sort: option.sort })

          return (
            <Link
              key={option.sort}
              href={href}
              onClick={(event) => {
                event.preventDefault()
                navigate(href)
              }}
              data-sort={option.sort}
              aria-current={active ? 'true' : undefined}
              className="group min-h-11 min-w-0 rounded-[0.55rem] px-2 py-1.5 transition-[background,box-shadow,transform,color] duration-200 ease-[var(--ease-ui)] hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-inti)] active:scale-[0.99] sm:px-2.5"
              style={{
                background: active ? 'var(--color-surface)' : 'transparent',
                boxShadow: active ? 'var(--shadow-soft)' : 'none',
                color: active ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
              }}
            >
              <span className="font-mono text-[0.56rem] font-bold tracking-[0.14em] uppercase opacity-70 sm:text-[0.6rem] sm:tracking-[0.14em]">
                {option.eyebrow}
              </span>
              <span className="mt-0.5 block text-[0.78rem] leading-tight font-bold sm:text-[0.84rem]">
                {option.label}
              </span>
              <span className="mt-0.5 hidden text-[0.7rem] leading-4 opacity-72 2xl:block">
                {option.summary}
              </span>
            </Link>
          )
        })}
      </nav>
    </section>
  )
}
