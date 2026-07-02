import Link from 'next/link'

import { announcementPath } from '@/modules/announcements/urls'
import { deadlineLabel, daysUntilDeadline } from '@/modules/announcements/public-board'

import type { PublicAnnouncement } from '@/shared/types'

const PIN_DOT_TONES = [
  'bg-[var(--color-accent-inti)]',
  'bg-[var(--color-gold)]',
  'bg-[var(--color-navy)]',
]

// Up to 3 pinned announcements shown beside the featured hero using the same
// public board side-column contract as the live board panel.
export function PinnedNoticesPanel({
  pins,
  mode = 'pinned',
  now,
}: {
  pins: PublicAnnouncement[]
  mode?: 'pinned' | 'priority'
  now: number
}) {
  const visiblePins = pins.slice(0, 3)
  if (visiblePins.length === 0) return null

  const panelLabel = mode === 'pinned' ? 'Pinned Features' : 'Priority Features'
  const chipLabel = mode === 'pinned' ? 'Pinned' : 'Priority'

  return (
    <aside
      aria-label={panelLabel}
      className={`public-board-pins public-board-side-column public-page-reveal grid min-w-0 gap-3 overflow-visible pb-0 ${
        visiblePins.length === 1
          ? 'lg:h-full lg:auto-rows-fr'
          : 'md:grid-cols-2 lg:h-full lg:auto-rows-fr lg:grid-cols-1'
      }`}
    >
      {visiblePins.map((pin, index) => {
        const showDeadline = daysUntilDeadline(pin.expires_at, now) !== null
        return (
          <Link
            key={pin.id}
            href={announcementPath(pin)}
            data-pin-index={index}
            className="public-board-pin-card future-bento-cell group flex min-h-[5.6rem] flex-col justify-start gap-2 rounded-[1rem] p-3 transition-[border-color,transform] duration-200 hover:-translate-y-0.5 hover:border-[var(--color-accent-inti)] focus-visible:ring-2 focus-visible:ring-[var(--color-accent-inti)] focus-visible:outline-none sm:p-3.5 lg:min-h-0 lg:justify-center"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="future-kicker">{chipLabel}</span>
              <span
                className={`size-2 shrink-0 rounded-full ${PIN_DOT_TONES[index] ?? 'bg-[var(--color-text-muted)]'}`}
                aria-hidden="true"
              />
            </div>
            <div>
              <h3 className="font-display line-clamp-2 text-base leading-tight font-extrabold text-[var(--color-text-primary)] sm:text-[1.02rem]">
                {pin.title}
              </h3>
              <p className="mt-1 line-clamp-1 text-xs leading-4 text-[var(--color-text-muted)]">
                {pin.categories?.name ?? 'Campus notice'}
                {showDeadline ? ` · ${deadlineLabel(pin.expires_at, now)}` : ''}
              </p>
            </div>
          </Link>
        )
      })}
    </aside>
  )
}
