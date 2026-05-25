import { BOARD_SORT_OPTIONS, type BoardSort } from '@/lib/announcements/public-board'

export function BoardStructurePanel({
  activeSort,
  featuredIsPinned,
}: {
  activeSort: BoardSort
  featuredIsPinned: boolean
}) {
  const rows = [
    {
      label: featuredIsPinned ? 'Pinned first' : 'Featured first',
      summary: featuredIsPinned ? 'Pinned notices are promoted first.' : 'A useful notice leads.',
    },
    { label: 'New today', summary: 'Fresh notices from today.' },
    { label: 'Closing soon', summary: 'Deadlines move up when selected.' },
    { label: 'Plan ahead', summary: 'Upcoming notices with time to plan.' },
  ]

  return (
    <aside
      className="future-bento-cell hidden rounded-[1.35rem] p-5 xl:flex xl:flex-col xl:justify-between"
      aria-label="Board order structure"
    >
      <div>
        <p className="future-kicker">Board order</p>
        <h3 className="font-display mt-2 text-3xl leading-none font-bold text-[var(--color-text-primary)]">
          How we sort this board
        </h3>
        <p className="mt-3 text-sm leading-6 text-[var(--color-text-muted)]">
          Sorted by: {BOARD_SORT_OPTIONS.find((option) => option.sort === activeSort)?.label}
        </p>
      </div>

      <div className="mt-6 grid gap-2">
        {rows.map((row) => (
          <div
            key={row.label}
            className="rounded-[0.95rem] border bg-[var(--color-surface)] px-4 py-3"
            style={{ borderColor: 'var(--color-border-subtle)' }}
          >
            <p className="text-base leading-tight font-bold text-[var(--color-text-primary)]">
              {row.label}
            </p>
            <p className="mt-1 text-xs leading-5 text-[var(--color-text-muted)]">{row.summary}</p>
          </div>
        ))}
      </div>
    </aside>
  )
}
