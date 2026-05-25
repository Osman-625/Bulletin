import Link from 'next/link'
import {
  ArrowRight,
  BarChart3,
  Building2,
  CheckCircle2,
  ClipboardList,
  FileText,
  Tag,
  Users,
} from 'lucide-react'
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
      className="admin-review-row group block px-4 py-4 transition-[background,color] duration-200 ease-[var(--ease-ui)] hover:bg-[color-mix(in_oklab,var(--color-surface-elevated)_36%,transparent)]"
    >
      <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="font-mono text-[0.68rem] font-bold tracking-[0.14em] text-[var(--color-text-muted)] uppercase">
              {String(index + 1).padStart(2, '0')}
            </span>
            <StatusBadge status="submitted" />
            <span className="font-mono text-[0.68rem] font-semibold tracking-[0.12em] text-[var(--color-text-muted)] uppercase">
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

  const operationLinks = [
    {
      label: 'Review queue',
      href: '/admin/review',
      description: needsReview
        ? `${stats.pendingReview} awaiting decision`
        : 'No pending submissions',
      icon: ClipboardList,
    },
    {
      label: 'Publishers',
      href: '/admin/publishers',
      description: 'Invite and manage campus publishers',
      icon: Users,
    },
    {
      label: 'Organizations',
      href: '/admin/orgs',
      description: 'Maintain organization access',
      icon: Building2,
    },
    {
      label: 'Categories',
      href: '/admin/categories',
      description: 'Keep announcement topics tidy',
      icon: Tag,
    },
    {
      label: 'Analytics',
      href: '/admin/analytics',
      description: 'View moderation and publishing trends',
      icon: BarChart3,
    },
  ]

  return (
    <div className="dashboard-page admin-dashboard-shell mx-auto w-full max-w-[92rem] px-4 py-6 sm:px-6 sm:py-8">
      <div className="admin-command-layout">
        <section className="admin-overview-header dashboard-command-card rounded-[1.5rem] p-6 sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="future-kicker">Admin workspace</p>
              <h1 className="font-display mt-4 text-3xl leading-[0.98] font-extrabold text-[var(--color-text-primary)] sm:text-5xl">
                Review first, manage cleanly
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--color-text-secondary)] sm:text-base">
                Keep the moderation queue moving, then jump into publisher, organization, or
                category work without scanning a crowded board.
              </p>
            </div>

            <div className="sm:min-w-72 lg:max-w-xs">
              <p className="font-mono text-[0.68rem] font-bold tracking-[0.14em] text-[var(--color-text-muted)] uppercase">
                Review status
              </p>
              <p className="mt-2 text-lg font-semibold text-[var(--color-text-primary)]">
                {needsReview ? 'Queue needs decisions' : 'Queue is clear'}
              </p>
              <Link
                href="/admin/review"
                className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-[0.95rem] bg-[var(--color-accent)] px-4 text-sm font-semibold text-white shadow-[var(--shadow-button)] transition-[transform,background] duration-200 hover:-translate-y-px hover:bg-[var(--color-accent-hover)] active:scale-[0.98]"
              >
                Open full queue
                <ArrowRight size={15} aria-hidden="true" />
              </Link>
            </div>
          </div>
        </section>

        <section className="admin-quiet-metrics" aria-label="Admin overview metrics">
          {metricCards.map(({ label, value, icon: Icon, href, urgent }) => {
            const content = (
              <>
                <div className="flex items-center justify-between gap-3">
                  <Icon
                    size={17}
                    className={
                      urgent ? 'text-[var(--color-accent)]' : 'text-[var(--color-text-muted)]'
                    }
                    aria-hidden="true"
                  />
                  {urgent && value > 0 && (
                    <span className="rounded-[0.55rem] bg-[var(--color-accent-surface)] px-2 py-1 font-mono text-[0.62rem] font-bold tracking-[0.12em] text-[var(--color-accent)] uppercase">
                      Action
                    </span>
                  )}
                </div>
                <CountUp
                  value={value}
                  className={`mt-3 block font-mono text-3xl font-bold ${
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
                className="admin-metric-item transition-colors duration-200 hover:bg-[color-mix(in_oklab,var(--color-surface-elevated)_38%,transparent)]"
              >
                {content}
              </Link>
            ) : (
              <div key={label} className="admin-metric-item">
                {content}
              </div>
            )
          })}
        </section>

        <section className="admin-workflow-board">
          <div className="admin-review-panel rounded-[1.35rem] p-4 sm:p-5">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="future-kicker">Review queue</p>
                <h2 className="mt-2 text-xl font-bold text-[var(--color-text-primary)]">
                  Submissions awaiting decision
                </h2>
              </div>
              <Link
                href="/admin/review"
                className="inline-flex min-h-11 w-fit items-center gap-1.5 rounded-[0.9rem] px-3 text-sm font-semibold whitespace-nowrap text-[var(--color-accent)] transition-colors hover:bg-[var(--color-accent-surface)]"
              >
                View all
                <ArrowRight size={14} aria-hidden="true" />
              </Link>
            </div>
            {recent.length === 0 ? (
              <EmptyQueue />
            ) : (
              <div className="admin-review-list">
                {recent.map((announcement, index) => (
                  <QueuePreviewRow
                    key={announcement.id}
                    announcement={announcement}
                    index={index}
                  />
                ))}
              </div>
            )}
          </div>

          <aside className="admin-operations-panel rounded-[1.35rem] p-4 sm:p-5">
            <p className="future-kicker">Operations</p>
            <h2 className="mt-2 text-xl font-bold text-[var(--color-text-primary)]">
              Workspace controls
            </h2>
            <div className="admin-operation-list mt-4">
              {operationLinks.map(({ label, href, description, icon: Icon }) => (
                <Link key={label} href={href} className="admin-operation-row group">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[0.85rem] bg-[var(--color-accent-surface)] text-[var(--color-accent)]">
                    <Icon size={16} aria-hidden="true" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-[var(--color-text-primary)]">
                      {label}
                    </span>
                    <span className="mt-0.5 block text-xs leading-5 text-[var(--color-text-muted)]">
                      {description}
                    </span>
                  </span>
                  <ArrowRight
                    size={15}
                    className="shrink-0 text-[var(--color-text-muted)] transition-transform duration-200 group-hover:translate-x-1 group-hover:text-[var(--color-accent)]"
                    aria-hidden="true"
                  />
                </Link>
              ))}
            </div>
          </aside>
        </section>
      </div>
    </div>
  )
}
