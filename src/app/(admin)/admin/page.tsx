import Link from 'next/link'
import { ArrowRight, Building2, CheckCircle2, ClipboardList, FileText, Users } from 'lucide-react'
import { StatusBadge } from '@/components/dashboard/StatusBadge'
import { CountUp } from '@/components/dashboard/CountUp'
import { getAdminStats, getSubmittedAnnouncements } from '@/lib/data'

export const metadata = { title: 'Admin Overview' }

type SubmittedAnnouncement = Awaited<ReturnType<typeof getSubmittedAnnouncements>>[number]

function QueuePreviewRow({
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
      <div className="grid gap-4 sm:grid-cols-[3.25rem_minmax(0,1fr)_auto] sm:items-center">
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
        <div className="flex items-center justify-between gap-4 sm:justify-end">
          <p className="font-mono text-xs text-[var(--color-text-muted)]">
            {new Date(announcement.updated_at).toLocaleDateString('en-MY', {
              day: 'numeric',
              month: 'short',
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

function EmptyQueue() {
  return (
    <div className="rounded-[1.2rem] border border-dashed border-[var(--color-border)] px-5 py-14 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-[1rem] bg-[var(--color-status-published-bg)] text-[var(--color-status-published-text)]">
        <CheckCircle2 size={20} aria-hidden="true" />
      </div>
      <h3 className="mt-4 text-base font-semibold text-[var(--color-text-primary)]">
        Review queue is clear
      </h3>
      <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[var(--color-text-muted)]">
        New submitted announcements will appear here with publisher, organization, and topic
        context.
      </p>
    </div>
  )
}

export default async function AdminPage() {
  const [stats, queue] = await Promise.all([getAdminStats(), getSubmittedAnnouncements()])
  const recent = queue.slice(0, 5)
  const needsReview = stats.pendingReview > 0

  const metricCards = [
    {
      label: 'Pending review',
      value: stats.pendingReview,
      icon: ClipboardList,
      href: '/admin/review',
      urgent: needsReview,
    },
    {
      label: 'Published this month',
      value: stats.publishedThisMonth,
      icon: FileText,
      href: null,
      urgent: false,
    },
    {
      label: 'Organizations',
      value: stats.totalOrgs,
      icon: Building2,
      href: '/admin/orgs',
      urgent: false,
    },
    {
      label: 'Publishers',
      value: stats.totalPublishers,
      icon: Users,
      href: '/admin/publishers',
      urgent: false,
    },
  ]

  return (
    <div className="dashboard-page mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
      <section className="grid gap-3 xl:grid-cols-12">
        <div className="dashboard-command-card rounded-[1.5rem] p-6 sm:p-8 xl:col-span-8">
          <p className="future-kicker">Admin workspace</p>
          <div className="mt-4 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="font-display text-4xl leading-none font-extrabold text-[var(--color-text-primary)] sm:text-5xl">
                Keep the board trustworthy
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--color-text-secondary)] sm:text-base">
                Review submitted announcements, manage publishers, and keep campus posts clear
                before they reach students.
              </p>
            </div>
            <Link
              href="/admin/review"
              className="action-lift inline-flex min-h-11 w-full shrink-0 items-center justify-center gap-2 rounded-[0.95rem] bg-[var(--color-accent)] px-5 text-sm font-semibold text-white shadow-[var(--shadow-button)] sm:w-auto"
            >
              Open review queue
              <ArrowRight size={15} aria-hidden="true" />
            </Link>
          </div>
        </div>

        <Link
          href="/admin/review"
          className="dashboard-command-card action-lift rounded-[1.5rem] p-5 xl:col-span-4"
        >
          <p className="future-kicker">{needsReview ? 'Needs attention' : 'Queue status'}</p>
          <CountUp
            value={stats.pendingReview}
            className="mt-5 block font-mono text-5xl font-bold text-[var(--color-accent)]"
          />
          <p className="mt-2 text-sm leading-6 text-[var(--color-text-muted)]">
            {needsReview
              ? 'Announcements are waiting for approval or publisher feedback.'
              : 'No submissions are waiting right now.'}
          </p>
        </Link>

        {metricCards.map(({ label, value, icon: Icon, href, urgent }) => {
          const content = (
            <>
              <div className="flex items-start justify-between gap-3">
                <Icon
                  size={18}
                  className={
                    urgent ? 'text-[var(--color-accent)]' : 'text-[var(--color-text-muted)]'
                  }
                  aria-hidden="true"
                />
                {urgent && value > 0 && (
                  <span className="rounded-[0.6rem] bg-[var(--color-accent-surface)] px-2 py-1 font-mono text-[0.65rem] font-bold tracking-[0.12em] text-[var(--color-accent)] uppercase">
                    Action
                  </span>
                )}
              </div>
              <CountUp
                value={value}
                className={`mt-4 block font-mono text-3xl font-bold ${
                  urgent && value > 0
                    ? 'text-[var(--color-accent)]'
                    : 'text-[var(--color-text-primary)]'
                }`}
              />
              <p className="mt-1 text-[0.68rem] font-bold tracking-[0.14em] text-[var(--color-text-muted)] uppercase">
                {label}
              </p>
            </>
          )

          return href ? (
            <Link
              key={label}
              href={href}
              className="dashboard-command-card action-lift rounded-[1.2rem] p-4 sm:p-5 xl:col-span-3"
            >
              {content}
            </Link>
          ) : (
            <div
              key={label}
              className="dashboard-command-card rounded-[1.2rem] p-4 sm:p-5 xl:col-span-3"
            >
              {content}
            </div>
          )
        })}
      </section>

      <section className="mt-3 grid gap-3 lg:grid-cols-12">
        <div className="dashboard-command-card rounded-[1.5rem] p-4 sm:p-5 lg:col-span-8">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="future-kicker">Review queue</p>
              <h2 className="mt-2 text-xl font-bold text-[var(--color-text-primary)]">
                Submissions awaiting decision
              </h2>
            </div>
            <Link
              href="/admin/review"
              className="inline-flex min-h-11 items-center gap-1.5 rounded-[0.9rem] px-3 text-sm font-semibold text-[var(--color-accent)] transition-colors hover:bg-[var(--color-accent-surface)]"
            >
              View all
              <ArrowRight size={14} aria-hidden="true" />
            </Link>
          </div>
          {recent.length === 0 ? (
            <EmptyQueue />
          ) : (
            <div className="space-y-3">
              {recent.map((announcement, index) => (
                <QueuePreviewRow key={announcement.id} announcement={announcement} index={index} />
              ))}
            </div>
          )}
        </div>

        <aside className="dashboard-command-card rounded-[1.5rem] p-5 lg:col-span-4">
          <p className="future-kicker">Review standards</p>
          <h2 className="mt-3 text-xl font-bold text-[var(--color-text-primary)]">
            What good review protects
          </h2>
          <div className="mt-5 space-y-3">
            {[
              'Titles should tell students exactly what changed.',
              'Urgency should match real deadlines, not preference.',
              'Organization and category should be correct before publishing.',
            ].map((item, index) => (
              <div
                key={item}
                className="flex gap-3 rounded-[1rem] bg-[color-mix(in_oklab,var(--color-surface)_70%,transparent)] p-3"
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[0.75rem] bg-[var(--color-accent-surface)] font-mono text-xs font-bold text-[var(--color-accent)]">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <p className="text-sm leading-6 text-[var(--color-text-secondary)]">{item}</p>
              </div>
            ))}
          </div>
        </aside>
      </section>
    </div>
  )
}
