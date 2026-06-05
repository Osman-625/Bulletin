import { CalendarClock, Clock, FileText, Radio } from 'lucide-react'
import { redirect } from 'next/navigation'
import { shouldScopeAnnouncementsToMembership } from '@/lib/announcements/access'
import { dateValue, formatCampusDayDate } from '@/lib/announcements/public-board'
import { getCurrentAccessContext } from '@/lib/auth/authz'
import { createClient } from '@/lib/supabase/server'
import {
  DashboardDeskBoard,
  DashboardDeskEmpty,
  DashboardDeskHeader,
  DashboardDeskMetrics,
  DashboardDeskPage,
  DashboardDeskPanel,
  DashboardDeskRow,
} from '@/components/dashboard/DashboardDesk'
import type { DbAnnouncement } from '@/lib/types'

export const metadata = { title: 'Schedule' }

type ScheduleRow = Pick<
  DbAnnouncement,
  | 'id'
  | 'title'
  | 'status'
  | 'scheduled_publish_at'
  | 'published_at'
  | 'expires_at'
  | 'updated_at'
  | 'view_count'
> & {
  categories: { name: string; color: string | null } | null
}

const EMPTY_ORG_ID = '00000000-0000-0000-0000-000000000000'

function formatDate(iso: string | null) {
  return formatCampusDayDate(iso)
}

function formatStatus(status: string) {
  if (status === 'submitted') return 'In review'
  if (status === 'published') return 'Published'
  if (status === 'draft') return 'Draft'
  return status
}

function statusTone(status: string) {
  if (status === 'submitted') return 'submitted'
  if (status === 'published') return 'published'
  if (status === 'draft') return 'draft'
  return 'draft'
}

function scheduleTime(row: ScheduleRow) {
  return row.scheduled_publish_at ?? row.expires_at ?? row.published_at ?? row.updated_at
}

function isFuture(iso: string | null, nowMs: number) {
  return dateValue(iso) > nowMs
}

export default async function PublisherSchedulePage() {
  const access = await getCurrentAccessContext()
  if (!access) redirect('/login')

  const supabase = await createClient()
  const scopedOrgIds = shouldScopeAnnouncementsToMembership(access)
    ? access.orgIds.length > 0
      ? access.orgIds
      : [EMPTY_ORG_ID]
    : null

  let query = supabase
    .from('announcements')
    .select(
      'id, title, status, scheduled_publish_at, published_at, expires_at, updated_at, view_count, categories(name, color)'
    )
    .in('status', ['published', 'submitted', 'draft'])
    .order('updated_at', { ascending: false })
    .limit(32)

  if (scopedOrgIds) query = query.in('organization_id', scopedOrgIds)

  const { data } = await query
  const rows = ((data ?? []) as unknown as ScheduleRow[]).sort(
    (a, b) => dateValue(scheduleTime(a)) - dateValue(scheduleTime(b))
  )
  const now = new Date()
  const nowMs = now.getTime()
  const liveRows = rows.filter(
    (row) => row.status === 'published' && !isFuture(row.scheduled_publish_at, nowMs)
  )
  const upcomingRows = rows.filter(
    (row) => row.status === 'submitted' || isFuture(row.scheduled_publish_at, nowMs)
  )
  const expiringRows = rows.filter((row) => isFuture(row.expires_at, nowMs)).slice(0, 5)
  const todayLabel = formatCampusDayDate(now)

  return (
    <DashboardDeskPage className="publisher-dashboard-shell">
      <DashboardDeskHeader
        kicker={`Publisher schedule · ${todayLabel}`}
        title="Schedule"
        description="Live windows, scheduled reviews, and expiry dates in one compact desk."
        action={{
          href: '/dashboard/announcements/new',
          label: 'Schedule notice',
          icon: CalendarClock,
        }}
      />

      <DashboardDeskMetrics
        metrics={[
          {
            label: 'Live now',
            value: liveRows.length,
            caption: 'visible on the board',
            icon: Radio,
            href: '/dashboard/announcements?status=published',
            tone: 'accent',
          },
          {
            label: 'Upcoming',
            value: upcomingRows.length,
            caption: 'scheduled or in review',
            icon: CalendarClock,
            href: '/dashboard/announcements?status=submitted',
          },
          {
            label: 'Expiring',
            value: expiringRows.length,
            caption: 'with a future close date',
            icon: Clock,
            tone: 'gold',
          },
          {
            label: 'Total',
            value: rows.length,
            caption: 'publishing windows',
            icon: FileText,
            href: '/dashboard/announcements',
          },
        ]}
      />

      <DashboardDeskBoard>
        <DashboardDeskPanel
          title="Next publishing moments"
          count={`${Math.min(rows.length, 8)}`}
          action={{ href: '/dashboard/announcements', label: 'All notices' }}
        >
          {rows.length === 0 ? (
            <DashboardDeskEmpty>No scheduled notices yet.</DashboardDeskEmpty>
          ) : (
            rows.slice(0, 8).map((row, index) => {
              const date = scheduleTime(row)
              const isLive =
                row.status === 'published' && !isFuture(row.scheduled_publish_at, nowMs)

              return (
                <DashboardDeskRow
                  key={row.id}
                  href={`/dashboard/announcements/${row.id}/edit`}
                  title={row.title}
                  index={index}
                  meta={[
                    { label: isLive ? 'Live now' : formatDate(date) },
                    {
                      label: row.categories?.name ?? 'Uncategorized',
                      color: row.categories?.color ?? 'var(--color-text-muted)',
                    },
                  ]}
                  statusLabel={isLive ? 'Live' : formatStatus(row.status)}
                  statusTone={isLive ? 'published' : statusTone(row.status)}
                  stat={row.view_count.toLocaleString('en-MY')}
                  statLabel="views"
                />
              )
            })
          )}
        </DashboardDeskPanel>

        <DashboardDeskPanel title="Expiring soon" count={`${expiringRows.length}`}>
          {expiringRows.length === 0 ? (
            <DashboardDeskEmpty>No expiry dates need attention.</DashboardDeskEmpty>
          ) : (
            expiringRows.map((row, index) => (
              <DashboardDeskRow
                key={row.id}
                href={`/dashboard/announcements/${row.id}/edit`}
                title={row.title}
                index={index}
                meta={[
                  { label: `Closes ${formatDate(row.expires_at)}` },
                  {
                    label: row.categories?.name ?? 'Uncategorized',
                    color: row.categories?.color ?? 'var(--color-text-muted)',
                  },
                ]}
                statusLabel="Deadline"
                statusTone="draft"
                stat={row.view_count.toLocaleString('en-MY')}
                statLabel="views"
              />
            ))
          )}
        </DashboardDeskPanel>
      </DashboardDeskBoard>

      <DashboardDeskPanel title="Schedule index" count={`${rows.length}`}>
        {rows.length === 0 ? (
          <DashboardDeskEmpty>No publishing windows to show yet.</DashboardDeskEmpty>
        ) : (
          rows.map((row, index) => (
            <DashboardDeskRow
              key={row.id}
              href={`/dashboard/announcements/${row.id}/edit`}
              title={row.title}
              index={index}
              meta={[
                { label: formatDate(scheduleTime(row)) },
                {
                  label: row.categories?.name ?? 'Uncategorized',
                  color: row.categories?.color ?? 'var(--color-text-muted)',
                },
              ]}
              statusLabel={formatStatus(row.status)}
              statusTone={statusTone(row.status)}
              stat={row.view_count.toLocaleString('en-MY')}
              statLabel="views"
            />
          ))
        )}
      </DashboardDeskPanel>
    </DashboardDeskPage>
  )
}
