import Link from 'next/link'
import {
  AlertTriangle,
  ArrowRight,
  Building2,
  CheckCircle2,
  ClipboardList,
  Clock3,
} from 'lucide-react'
import {
  DashboardBoardHeader,
  DashboardBoardMetrics,
  DashboardBoardPage,
  DashboardBoardPanel,
} from '@/components/dashboard/DashboardBoard'
import { StatusBadge } from '@/components/dashboard/StatusBadge'
import { formatCampusShortDate } from '@/modules/announcements/public-board'
import { getSubmittedAnnouncements } from '@/infrastructure/database/data'

export const metadata = { title: 'Review Queue' }

type SubmittedAnnouncement = Awaited<ReturnType<typeof getSubmittedAnnouncements>>[number]

function formatQueueDate(iso: string) {
  return formatCampusShortDate(iso)
}

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
      className="admin-review-row group block p-4 transition-[background,color] duration-200 ease-[var(--ease-ui)] hover:bg-[color-mix(in_oklab,var(--color-surface-elevated)_36%,transparent)]"
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
            {formatQueueDate(announcement.updated_at)}
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
  const urgentCount = queue.filter((announcement) => announcement.urgency === 'urgent').length
  const orgCount = new Set(
    queue.flatMap((announcement) => {
      const organizationName = announcement.organizations?.name
      return organizationName ? [organizationName] : []
    })
  ).size
  const oldest = queue[0]?.updated_at

  return (
    <DashboardBoardPage className="admin-review-page flex flex-col gap-4">
      <DashboardBoardHeader
        kicker="Admin board"
        title="Review queue"
        description={
          queue.length === 0
            ? 'No submitted announcements are waiting for review.'
            : `Review oldest submissions first. ${queue.length} announcement${
                queue.length === 1 ? '' : 's'
              } awaiting a publishing decision.`
        }
      />

      <DashboardBoardMetrics
        metrics={[
          {
            label: 'Waiting',
            value: queue.length,
            caption: 'submitted',
            icon: ClipboardList,
            tone: 'accent',
          },
          {
            label: 'Urgent',
            value: urgentCount,
            caption: 'marked urgent',
            icon: AlertTriangle,
            tone: urgentCount > 0 ? 'gold' : 'muted',
          },
          {
            label: 'Organizations',
            value: orgCount,
            caption: 'in queue',
            icon: Building2,
          },
          {
            label: 'Oldest',
            value: oldest ? formatQueueDate(oldest) : 'Clear',
            caption: oldest ? 'first in line' : 'nothing waiting',
            icon: Clock3,
          },
        ]}
      />

      <DashboardBoardPanel title="Pending submissions" count={`${queue.length} waiting`}>
        {queue.length === 0 ? (
          <div className="grid min-h-[18rem] place-items-center px-5 py-16 text-center">
            <div className="mx-auto flex size-12 items-center justify-center rounded-[1rem] bg-[var(--color-status-published-bg)] text-[var(--color-status-published-text)]">
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
          <div className="admin-review-list">
            {queue.map((announcement, index) => (
              <ReviewQueueItem key={announcement.id} announcement={announcement} index={index} />
            ))}
          </div>
        )}
      </DashboardBoardPanel>
    </DashboardBoardPage>
  )
}
