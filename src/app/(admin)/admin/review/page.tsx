import Link from 'next/link'
import { ArrowRight, CheckCircle2, ClipboardList } from 'lucide-react'
import { StatusBadge } from '@/components/dashboard/StatusBadge'
import { getSubmittedAnnouncements } from '@/lib/data'

export const metadata = { title: 'Review Queue' }

type SubmittedAnnouncement = Awaited<ReturnType<typeof getSubmittedAnnouncements>>[number]

function ReviewQueueItem({
  announcement,
  index,
}: {
  announcement: SubmittedAnnouncement
  index: number
}) {
  return (
    <Link
      href={`/admin/review/${announcement.id}`}
      className="group block rounded-[1rem] border border-[var(--color-border)] bg-[color-mix(in_oklab,var(--color-surface)_84%,transparent)] p-4 transition-[transform,background,border-color,box-shadow] duration-200 ease-[var(--ease-ui)] hover:-translate-y-0.5 hover:border-[color-mix(in_oklab,var(--color-accent-inti)_26%,var(--color-border))] hover:bg-[var(--color-surface)] hover:shadow-[var(--shadow-soft)] active:scale-[0.99]"
    >
      <div className="grid gap-4 md:grid-cols-[3.25rem_minmax(0,1fr)_auto] md:items-center">
        <span className="flex h-11 w-11 items-center justify-center rounded-[0.9rem] bg-[var(--color-accent-surface)] font-mono text-sm font-bold text-[var(--color-accent)]">
          {String(index + 1).padStart(2, '0')}
        </span>
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <StatusBadge status="submitted" />
            <span className="font-mono text-[0.7rem] font-semibold tracking-[0.12em] text-[var(--color-text-muted)] uppercase">
              {announcement.categories?.name ?? 'Uncategorized'}
            </span>
          </div>
          <p className="truncate text-base font-semibold text-[var(--color-text-primary)]">
            {announcement.title}
          </p>
          <p className="mt-1 truncate text-xs text-[var(--color-text-muted)]">
            {announcement.organizations?.name ?? 'No organization'} ·{' '}
            {announcement.users?.display_name ?? 'Unknown publisher'}
          </p>
        </div>
        <div className="flex items-center justify-between gap-4 md:justify-end">
          <p className="font-mono text-xs text-[var(--color-text-muted)]">
            {new Date(announcement.updated_at).toLocaleDateString('en-MY', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })}
          </p>
          <ArrowRight
            size={16}
            className="text-[var(--color-text-muted)] transition-transform duration-200 group-hover:translate-x-1 group-hover:text-[var(--color-accent)]"
            aria-hidden="true"
          />
        </div>
      </div>
    </Link>
  )
}

export default async function ReviewQueuePage() {
  const queue = await getSubmittedAnnouncements()

  return (
    <div className="dashboard-page mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      <section className="dashboard-command-card rounded-[1.5rem] p-6 sm:p-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="future-kicker">Review queue</p>
            <h1 className="mt-4 font-display text-4xl leading-none font-extrabold text-[var(--color-text-primary)] sm:text-5xl">
              Pending submissions
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--color-text-secondary)] sm:text-base">
              {queue.length === 0
                ? 'No submitted announcements are waiting for review.'
                : `${queue.length} announcement${queue.length === 1 ? '' : 's'} awaiting a publishing decision.`}
            </p>
          </div>
          <div className="flex min-h-24 min-w-32 flex-col justify-center rounded-[1.1rem] bg-[var(--color-accent-surface)] px-5">
            <ClipboardList size={18} className="text-[var(--color-accent)]" aria-hidden="true" />
            <p className="mt-3 font-mono text-3xl font-bold text-[var(--color-accent)]">
              {queue.length}
            </p>
            <p className="text-[0.68rem] font-bold tracking-[0.14em] text-[var(--color-text-muted)] uppercase">
              Waiting
            </p>
          </div>
        </div>
      </section>

      <section className="mt-3 dashboard-command-card rounded-[1.5rem] p-4 sm:p-5">
        {queue.length === 0 ? (
          <div className="rounded-[1.2rem] border border-dashed border-[var(--color-border)] px-5 py-16 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-[1rem] bg-[var(--color-status-published-bg)] text-[var(--color-status-published-text)]">
              <CheckCircle2 size={20} aria-hidden="true" />
            </div>
            <h2 className="mt-4 text-base font-semibold text-[var(--color-text-primary)]">
              All caught up
            </h2>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[var(--color-text-muted)]">
              When publishers submit announcements, they will appear here for review.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {queue.map((announcement, index) => (
              <ReviewQueueItem
                key={announcement.id}
                announcement={announcement}
                index={index}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
