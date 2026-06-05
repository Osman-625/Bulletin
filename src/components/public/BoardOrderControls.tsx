import Link from 'next/link'
import { BOARD_SORT_OPTIONS, type BoardSort } from '@/lib/announcements/public-board'
import { buildFeedHref } from './FeedHref'

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

  return (
    <section
      className="public-board-sort public-board-order public-page-reveal future-bento-cell grid gap-3 rounded-[1.05rem] p-3 delay-4 lg:grid-cols-[minmax(16rem,0.55fr)_minmax(0,1fr)] lg:items-center"
      aria-labelledby="board-order-title"
    >
      <div className="px-1">
        <p className="future-kicker">{activeOption.eyebrow}</p>
        <h2
          id="board-order-title"
          className="font-display mt-1 text-base leading-none font-extrabold text-[var(--color-text-primary)]"
        >
          {activeOption.label}
        </h2>
        <p className="mt-1 max-w-[30rem] text-xs leading-5 text-[var(--color-text-muted)]">
          {activeCategory ?? 'All topics'} · {count} notices
        </p>
      </div>

      <nav
        className="grid grid-cols-3 gap-1 rounded-[var(--radius-control)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-elevated)] p-1 [&::-webkit-scrollbar]:hidden"
        aria-label="Sort order"
      >
        {BOARD_SORT_OPTIONS.map((option) => {
          const active = option.sort === activeSort

          return (
            <Link
              key={option.sort}
              href={buildFeedHref({ category, q: search, sort: option.sort })}
              data-sort={option.sort}
              aria-current={active ? 'true' : undefined}
              className="group min-h-10 min-w-0 rounded-[0.55rem] px-2 py-2 transition-[background,box-shadow,transform,color] duration-200 ease-[var(--ease-ui)] hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-inti)] active:scale-[0.99] sm:px-3"
              style={{
                background: active ? 'var(--color-surface)' : 'transparent',
                boxShadow: active ? 'var(--shadow-soft)' : 'none',
                color: active ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
              }}
            >
              <span className="font-mono text-[0.56rem] font-bold tracking-[0.14em] uppercase opacity-70 sm:text-[0.64rem] sm:tracking-[0.16em]">
                {option.eyebrow}
              </span>
              <span className="mt-1 block text-[0.78rem] leading-tight font-bold sm:text-sm">
                {option.label}
              </span>
              <span className="mt-0.5 hidden text-[0.72rem] leading-4 opacity-72 sm:block">
                {option.summary}
              </span>
            </Link>
          )
        })}
      </nav>
    </section>
  )
}
