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
      className="public-board-sort public-page-reveal future-bento-cell grid gap-3 rounded-[1.2rem] p-3 delay-4 sm:gap-4 sm:rounded-[1.35rem] sm:p-4 lg:grid-cols-[minmax(16rem,0.55fr)_minmax(0,1fr)] lg:items-center"
      aria-labelledby="board-order-title"
    >
      <div>
        <p className="future-kicker">{activeOption.eyebrow}</p>
        <h2
          id="board-order-title"
          className="font-display mt-2 text-3xl leading-none font-bold text-[var(--color-text-primary)]"
        >
          {activeOption.label}
        </h2>
        <p className="mt-2 max-w-[30rem] text-sm leading-6 text-[var(--color-text-muted)]">
          {activeCategory ?? 'All topics'} · {count} visible notices
        </p>
      </div>

      <nav
        className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] sm:grid sm:grid-cols-3 sm:overflow-visible sm:pb-0 [&::-webkit-scrollbar]:hidden"
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
              className="group min-h-11 min-w-[8.75rem] shrink-0 rounded-[0.95rem] border px-3 py-2 transition-[background,border-color,box-shadow,transform,color] duration-300 ease-[var(--ease-ui)] hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-inti)] active:scale-[0.99] sm:min-h-24 sm:min-w-0 sm:p-4"
              style={{
                background: active ? 'var(--color-text-primary)' : 'var(--color-surface)',
                borderColor: active ? 'var(--color-text-primary)' : 'var(--color-border)',
                boxShadow: active ? 'var(--shadow-button-hover)' : 'none',
                color: active ? 'var(--color-canvas)' : 'var(--color-text-primary)',
              }}
            >
              <span className="font-mono text-[0.64rem] font-bold tracking-[0.16em] uppercase opacity-70">
                {option.eyebrow}
              </span>
              <span className="mt-2 block text-base leading-tight font-bold">{option.label}</span>
              <span className="mt-1 hidden text-xs leading-5 opacity-72 sm:block">
                {option.summary}
              </span>
            </Link>
          )
        })}
      </nav>
    </section>
  )
}
