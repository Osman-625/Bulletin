import { BOARD_SORT_OPTIONS, type BoardSort } from '@/lib/announcements/public-board'

export function BoardStructurePanel({
  activeSort,
  featuredIsPinned,
}: {
  activeSort: BoardSort
  featuredIsPinned: boolean
}) {
  const activeOption = BOARD_SORT_OPTIONS.find((option) => option.sort === activeSort)
  const rows = [
    {
      label: 'Urgent and official action',
      summary: featuredIsPinned
        ? 'Pinned notices stay first when campus action matters.'
        : 'The featured notice leads when it needs attention.',
      dotClass: 'bg-[var(--color-accent-inti)]',
    },
    {
      label: 'Dates and deadlines',
      summary: 'Closing soon stays visible before it disappears.',
      dotClass: 'bg-[var(--color-gold)]',
    },
    {
      label: 'Posters stay intact',
      summary: 'Image cards keep artwork inside a padded frame.',
      dotClass: 'bg-[var(--color-navy)]',
    },
    {
      label: 'New today',
      summary: 'Fresh posts remain easy to scan. Plan ahead notices keep room to breathe.',
      dotClass: 'bg-[var(--color-text-muted)]',
    },
  ]

  return (
    <aside
      className="public-board-guide future-bento-cell hidden rounded-[1.25rem] p-5 xl:flex xl:flex-col"
      aria-label="Board order structure"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="future-kicker">Board order</p>
          <h3 className="font-display mt-2 text-2xl leading-none font-extrabold text-[var(--color-text-primary)]">
            Scan guide
          </h3>
          <p className="mt-3 text-sm leading-6 text-[var(--color-text-muted)]">
            Sorted by: {activeOption?.label}
          </p>
        </div>
        <span className="rounded-[0.65rem] border border-[var(--color-border-subtle)] bg-[var(--color-surface)] px-2.5 py-1.5 font-mono text-[0.6rem] leading-none font-bold tracking-[0.14em] text-[var(--color-accent-inti)] uppercase">
          Active
        </span>
      </div>

      <div className="public-board-guide-current mt-4 border-y border-[var(--color-border-subtle)] py-3">
        <p className="font-mono text-[0.62rem] leading-none font-bold tracking-[0.14em] text-[var(--color-text-muted)] uppercase">
          Current rule
        </p>
        <p className="mt-2 text-sm leading-5 font-semibold text-[var(--color-text-primary)]">
          {activeOption?.summary}
        </p>
      </div>

      <div className="public-board-guide-list mt-4">
        {rows.map((row, index) => (
          <div
            key={row.label}
            className="public-board-guide-row grid grid-cols-[1.65rem_minmax(0,1fr)] gap-3 py-3"
            data-row-index={index}
          >
            <span className="relative mt-0.5 flex size-6 items-center justify-center font-mono text-[0.58rem] font-bold text-[var(--color-text-muted)]">
              <span
                className={`absolute size-2.5 rounded-full ${row.dotClass}`}
                aria-hidden="true"
              />
              <span className="sr-only">{index + 1}</span>
            </span>
            <div>
              <p className="text-sm leading-tight font-bold text-[var(--color-text-primary)]">
                {row.label}
              </p>
              <p className="mt-1 text-xs leading-5 text-[var(--color-text-muted)]">{row.summary}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-auto pt-4">
        <p className="border-t border-[var(--color-border-subtle)] pt-3 text-xs leading-5 text-[var(--color-text-muted)]">
          Pinned, urgent, and closing-soon posts stay easy to find.
        </p>
      </div>
    </aside>
  )
}
