import { BarChart3, Eye, FileText, PieChart } from 'lucide-react'
import { redirect } from 'next/navigation'
import { shouldScopeAnnouncementsToMembership } from '@/modules/announcements/access'
import { formatCampusCompactDate } from '@/modules/announcements/public-board'
import { getCurrentAccessContext } from '@/modules/auth/authz'
import { createClient } from '@/infrastructure/database/server'
import {
  DashboardBoardBoard,
  DashboardBoardEmpty,
  DashboardBoardHeader,
  DashboardBoardMetrics,
  DashboardBoardPage,
  DashboardBoardPanel,
  DashboardBoardRow,
  DashboardBoardStaticRow,
} from '@/components/dashboard/DashboardBoard'
import type { DbAnnouncement } from '@/shared/types'

export const metadata = { title: 'Insights' }

type InsightRow = Pick<DbAnnouncement, 'id' | 'title' | 'status' | 'view_count' | 'updated_at'> & {
  categories: { name: string; color: string | null } | null
}

const EMPTY_ORG_ID = '00000000-0000-0000-0000-000000000000'
const INSIGHT_METRIC_PAGE_SIZE = 1000

function formatDate(iso: string) {
  return formatCampusCompactDate(iso)
}

function formatStatus(status: string) {
  if (status === 'submitted') return 'In review'
  if (status === 'published') return 'Published'
  if (status === 'draft') return 'Draft'
  if (status === 'expired') return 'Expired'
  if (status === 'archived') return 'Archived'
  if (status === 'rejected') return 'Rejected'
  return status
}

function statusTone(status: string) {
  if (status === 'submitted') return 'submitted'
  if (status === 'published') return 'published'
  if (status === 'draft') return 'draft'
  if (status === 'expired') return 'expired'
  if (status === 'archived') return 'archived'
  if (status === 'rejected') return 'rejected'
  return 'draft'
}

async function fetchInsightMetricRows(
  supabase: Awaited<ReturnType<typeof createClient>>,
  scopedOrgIds: string[] | null
) {
  const metricRows: InsightRow[] = []
  let offset = 0

  while (true) {
    let metricQuery = supabase
      .from('announcements')
      .select('id, title, status, view_count, updated_at, categories(name, color)')
      .order('view_count', { ascending: false })
      .range(offset, offset + INSIGHT_METRIC_PAGE_SIZE - 1)

    if (scopedOrgIds) metricQuery = metricQuery.in('organization_id', scopedOrgIds)

    const { data, error } = await metricQuery
    if (error) return metricRows

    const page = (data ?? []) as unknown as InsightRow[]
    metricRows.push(...page)
    if (page.length < INSIGHT_METRIC_PAGE_SIZE) return metricRows

    offset += INSIGHT_METRIC_PAGE_SIZE
  }
}

export default async function PublisherInsightsPage() {
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
    .select('id, title, status, view_count, updated_at, categories(name, color)')
    .order('view_count', { ascending: false })
    .limit(48)

  if (scopedOrgIds) query = query.in('organization_id', scopedOrgIds)

  const [{ data }, metricRows] = await Promise.all([
    query,
    fetchInsightMetricRows(supabase, scopedOrgIds),
  ])
  const rows = (data ?? []) as unknown as InsightRow[]
  const totalViews = metricRows.reduce((sum, row) => sum + (row.view_count ?? 0), 0)
  const averageViews = metricRows.length > 0 ? Math.round(totalViews / metricRows.length) : 0
  const liveCount = metricRows.filter((row) => row.status === 'published').length
  const draftCount = metricRows.filter((row) => row.status === 'draft').length
  const topRows = rows.slice(0, 8)

  const categoryTotals = metricRows.reduce<
    Record<string, { name: string; color: string | null; views: number; count: number }>
  >((totals, row) => {
    const name = row.categories?.name ?? 'Uncategorized'
    const current = totals[name] ?? {
      name,
      color: row.categories?.color ?? null,
      views: 0,
      count: 0,
    }
    current.views += row.view_count ?? 0
    current.count += 1
    totals[name] = current
    return totals
  }, {})
  const categoryRows = Object.values(categoryTotals)
    .sort((a, b) => b.views - a.views)
    .slice(0, 6)
  const topCategory = categoryRows[0]?.name ?? 'No category yet'
  const updatedLabel = formatCampusCompactDate(new Date())

  return (
    <DashboardBoardPage className="publisher-dashboard-shell">
      <DashboardBoardHeader
        kicker={`Publisher insights · Updated ${updatedLabel}`}
        title="Insights"
        description="A compact read on what students open, where attention gathers, and which notices need follow-up."
        action={{
          href: '/dashboard/announcements',
          label: 'Open notices',
          icon: FileText,
          variant: 'secondary',
        }}
      />

      <DashboardBoardMetrics
        metrics={[
          {
            label: 'Total views',
            value: totalViews,
            caption: 'across this workspace',
            icon: Eye,
            tone: 'accent',
          },
          {
            label: 'Average',
            value: averageViews,
            caption: 'views per notice',
            icon: BarChart3,
          },
          {
            label: 'Live notices',
            value: liveCount,
            caption: 'currently published',
            icon: FileText,
            href: '/dashboard/announcements?status=published',
          },
          {
            label: 'Drafts',
            value: draftCount,
            caption: 'not yet submitted',
            icon: PieChart,
            href: '/dashboard/announcements?status=draft',
            tone: 'gold',
          },
        ]}
      />

      <DashboardBoardBoard>
        <DashboardBoardPanel
          title="Top viewed"
          count={`${topRows.length}`}
          action={{ href: '/dashboard/announcements', label: 'All notices' }}
        >
          {topRows.length === 0 ? (
            <DashboardBoardEmpty>No view data yet.</DashboardBoardEmpty>
          ) : (
            topRows.map((row, index) => (
              <DashboardBoardRow
                key={row.id}
                href={`/dashboard/announcements/${row.id}/edit`}
                title={row.title}
                index={index}
                meta={[
                  {
                    label: row.categories?.name ?? 'Uncategorized',
                    color: row.categories?.color ?? 'var(--color-text-muted)',
                  },
                  { label: `Updated ${formatDate(row.updated_at)}` },
                ]}
                statusLabel={formatStatus(row.status)}
                statusTone={statusTone(row.status)}
                stat={row.view_count.toLocaleString('en-MY')}
                statLabel="views"
              />
            ))
          )}
        </DashboardBoardPanel>

        <DashboardBoardPanel title="Category pull" count={topCategory}>
          {categoryRows.length === 0 ? (
            <DashboardBoardEmpty>No category data yet.</DashboardBoardEmpty>
          ) : (
            categoryRows.map((category, index) => (
              <DashboardBoardStaticRow
                key={category.name}
                title={category.name}
                index={index}
                meta={[
                  {
                    label: `${category.count} notice${category.count === 1 ? '' : 's'}`,
                    color: category.color ?? 'var(--color-gold)',
                  },
                ]}
                statusLabel="Category"
                statusTone="draft"
                stat={category.views.toLocaleString('en-MY')}
                statLabel="views"
              />
            ))
          )}
        </DashboardBoardPanel>
      </DashboardBoardBoard>

      <DashboardBoardPanel title="Notice performance" count={`${rows.length} tracked`}>
        {rows.length === 0 ? (
          <DashboardBoardEmpty>No announcement performance data yet.</DashboardBoardEmpty>
        ) : (
          rows.map((row, index) => (
            <DashboardBoardRow
              key={row.id}
              href={`/dashboard/announcements/${row.id}/edit`}
              title={row.title}
              index={index}
              meta={[
                {
                  label: row.categories?.name ?? 'Uncategorized',
                  color: row.categories?.color ?? 'var(--color-text-muted)',
                },
                { label: `Updated ${formatDate(row.updated_at)}` },
              ]}
              statusLabel={formatStatus(row.status)}
              statusTone={statusTone(row.status)}
              stat={row.view_count.toLocaleString('en-MY')}
              statLabel="views"
            />
          ))
        )}
      </DashboardBoardPanel>
    </DashboardBoardPage>
  )
}
