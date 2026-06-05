import Link from 'next/link'
import { ArrowRight, Eye } from 'lucide-react'
import { StatusBadge } from './StatusBadge'
import { formatCampusCompactDate } from '@/lib/announcements/public-board'

export type DashboardRecentAnnouncement = {
  id: string
  title: string
  body: string | null
  status: string
  view_count: number
  updated_at: string
  categories: { name: string } | null
}

function getAnnouncementExcerpt(body: string | null) {
  const text = (body ?? '')
    .replace(/[`*_#>[\]()~]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  if (text.length <= 180) return text
  return `${text.slice(0, 177).trimEnd()}...`
}

export function DashboardRecentRow({
  announcement,
}: {
  announcement: DashboardRecentAnnouncement
}) {
  const excerpt = getAnnouncementExcerpt(announcement.body)

  return (
    <Link
      href={`/dashboard/announcements/${announcement.id}/edit`}
      className="publisher-recent-row group block rounded-[1.25rem] p-4 transition-[transform,background,border-color,box-shadow] duration-200 ease-[var(--ease-ui)] hover:-translate-y-0.5 active:scale-[0.99] sm:p-5"
    >
      <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_9rem_auto] md:items-center">
        <div className="min-w-0">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <StatusBadge
              status={
                announcement.status as
                  | 'draft'
                  | 'submitted'
                  | 'published'
                  | 'rejected'
                  | 'expired'
                  | 'archived'
              }
            />
            <span className="font-mono text-[0.7rem] font-semibold tracking-[0.12em] text-[var(--color-text-muted)] uppercase">
              {announcement.categories?.name ?? 'Uncategorized'}
            </span>
          </div>
          <p className="font-display line-clamp-2 text-lg leading-tight font-extrabold text-[var(--color-text-primary)]">
            {announcement.title}
          </p>
          <p className="mt-2 line-clamp-2 max-w-[68ch] text-sm leading-6 text-[var(--color-text-secondary)]">
            {excerpt ||
              'No description added yet. Add a short summary so students can scan the notice faster.'}
          </p>
        </div>

        <div className="flex items-center gap-4 text-left md:block md:text-right">
          <div>
            <p className="font-mono text-xs font-semibold text-[var(--color-text-secondary)]">
              {formatCampusCompactDate(announcement.updated_at)}
            </p>
            <p className="mt-1 text-[0.68rem] font-bold tracking-[0.14em] text-[var(--color-text-muted)] uppercase">
              Latest update
            </p>
          </div>
          <p className="mt-0 inline-flex items-center gap-1 rounded-[0.75rem] bg-[var(--color-accent-surface)] px-2.5 py-1.5 text-xs font-semibold text-[var(--color-accent)] md:mt-3">
            <Eye size={12} aria-hidden="true" />
            {announcement.view_count.toLocaleString('en-MY')}
          </p>
        </div>

        <ArrowRight
          size={17}
          className="hidden text-[var(--color-text-muted)] transition-transform duration-200 group-hover:translate-x-1 group-hover:text-[var(--color-accent)] md:block"
          aria-hidden="true"
        />
      </div>
    </Link>
  )
}
