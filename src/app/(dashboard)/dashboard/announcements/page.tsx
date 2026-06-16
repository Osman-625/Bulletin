import { Archive, CheckCircle2, Clock3, FileText, Plus } from 'lucide-react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import {
  AnnouncementsClient,
  type AnnouncementTab,
  type AnnouncementTabCounts,
} from '@/components/dashboard/AnnouncementsClient'
import {
  DashboardBoardHeader,
  DashboardBoardMetrics,
  DashboardBoardPage,
  DashboardBoardPanel,
} from '@/components/dashboard/DashboardBoard'
import { getCurrentAccessContext } from '@/lib/auth/authz'
import { shouldScopeAnnouncementsToMembership } from '@/lib/announcements/access'
import { reportServerError } from '@/lib/error-reporting'
import type { AnnouncementRowData } from '@/components/dashboard/AnnouncementRow'
import type { DbAnnouncement } from '@/lib/types'

export const metadata = { title: 'Announcements' }

const DASHBOARD_ANNOUNCEMENTS_PAGE_SIZE = 20
const EMPTY_ORG_ID = '00000000-0000-0000-0000-000000000000'
const DASHBOARD_TABS: AnnouncementTab[] = ['all', 'published', 'drafts', 'pending', 'archived']

type QueryRow = Pick<
  DbAnnouncement,
  | 'id'
  | 'title'
  | 'status'
  | 'urgency'
  | 'banner_url'
  | 'published_at'
  | 'scheduled_publish_at'
  | 'pinned_until'
  | 'rejection_comment'
  | 'view_count'
  | 'expires_at'
  | 'archived_at'
  | 'updated_at'
> & {
  categories: { id: string; name: string; color: string | null } | null
  organizations: { id: string; name: string } | null
  author: { display_name: string } | null
}

type SearchParams = {
  search?: string
  tab?: string
  page?: string
}

function normalizeDashboardTab(value?: string): AnnouncementTab {
  return DASHBOARD_TABS.includes(value as AnnouncementTab) ? (value as AnnouncementTab) : 'all'
}

function normalizeDashboardPage(value?: string) {
  const parsed = Number.parseInt(value ?? '1', 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1
}

function cleanDashboardSearch(value?: string) {
  return (value ?? '')
    .replace(/[%,()'"]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 80)
}

export default async function AnnouncementsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const [{ search, tab, page }, access] = await Promise.all([
    searchParams,
    getCurrentAccessContext(),
  ])
  if (!access) redirect('/login')

  const supabase = await createClient()
  const scopeToMembership = shouldScopeAnnouncementsToMembership(access)
  const scopedOrgIds = scopeToMembership
    ? access.orgIds.length > 0
      ? access.orgIds
      : [EMPTY_ORG_ID]
    : null
  const normalizedSearch = cleanDashboardSearch(search)
  const activeTab = normalizeDashboardTab(tab)
  const currentPage = normalizeDashboardPage(page)
  const from = (currentPage - 1) * DASHBOARD_ANNOUNCEMENTS_PAGE_SIZE
  const to = from + DASHBOARD_ANNOUNCEMENTS_PAGE_SIZE - 1
  const now = new Date()
  const nowIso = now.toISOString()
  const nowMs = now.getTime()

  let query = supabase.from('announcements').select(
    `
      id,
      title,
      status,
      urgency,
      banner_url,
      published_at,
      scheduled_publish_at,
      pinned_until,
      rejection_comment,
      view_count,
      expires_at,
      archived_at,
      updated_at,
      categories ( id, name, color ),
      organizations ( id, name ),
      author:users!announcements_author_id_fkey ( display_name )
    `,
    { count: 'exact' }
  )

  if (scopedOrgIds) {
    query = query.in('organization_id', scopedOrgIds)
  }

  if (activeTab === 'published') {
    query = query.eq('status', 'published')
  } else if (activeTab === 'drafts') {
    query = query.eq('status', 'draft')
  } else if (activeTab === 'pending') {
    query = query.in('status', ['submitted', 'rejected'])
  } else if (activeTab === 'archived') {
    query = query.in('status', ['archived', 'expired'])
  }

  if (normalizedSearch) {
    query = query.or(
      `title.ilike.%${normalizedSearch}%,body.ilike.%${normalizedSearch}%,rejection_comment.ilike.%${normalizedSearch}%`
    )
  }

  function countQuery() {
    let countRequest = supabase.from('announcements').select('id', { count: 'exact', head: true })
    if (scopedOrgIds) countRequest = countRequest.in('organization_id', scopedOrgIds)
    return countRequest
  }

  const [
    announcementsResult,
    totalCountResult,
    publishedCountResult,
    liveCountResult,
    draftCountResult,
    scheduledCountResult,
    archivedCountResult,
    pendingCountResult,
  ] = await Promise.all([
    query.order('updated_at', { ascending: false }).range(from, to),
    countQuery(),
    countQuery().eq('status', 'published'),
    countQuery()
      .eq('status', 'published')
      .or(`scheduled_publish_at.is.null,scheduled_publish_at.lte.${nowIso}`)
      .or(`expires_at.is.null,expires_at.gt.${nowIso}`),
    countQuery().eq('status', 'draft'),
    countQuery().eq('status', 'published').gt('scheduled_publish_at', nowIso),
    countQuery().in('status', ['archived', 'expired']),
    countQuery().in('status', ['submitted', 'rejected']),
  ])

  const { data: rows, count, error: announcementsError } = announcementsResult
  const countsError =
    totalCountResult.error ??
    publishedCountResult.error ??
    liveCountResult.error ??
    draftCountResult.error ??
    scheduledCountResult.error ??
    archivedCountResult.error ??
    pendingCountResult.error

  if (announcementsError) {
    reportServerError('dashboard.announcements.query_failed', announcementsError, {
      actorId: access.userId,
      role: access.role,
      tab: activeTab,
      hasSearch: Boolean(normalizedSearch),
      page: currentPage,
    })
  }

  if (countsError) {
    reportServerError('dashboard.announcement_counts.query_failed', countsError, {
      actorId: access.userId,
      role: access.role,
      orgCount: access.orgIds.length,
    })
  }

  const announcements: AnnouncementRowData[] = ((rows ?? []) as unknown as QueryRow[]).map((r) => ({
    id: r.id,
    title: r.title,
    status: r.status as AnnouncementRowData['status'],
    urgency: r.urgency,
    banner_url: r.banner_url,
    published_at: r.published_at,
    scheduled_publish_at: r.scheduled_publish_at,
    pinned_until: r.pinned_until,
    rejection_comment: r.rejection_comment,
    view_count: r.view_count ?? 0,
    updated_at: r.updated_at,
    categories: r.categories,
    organizations: r.organizations,
    author: r.author,
  }))

  const totalAnnouncements = totalCountResult.count ?? 0
  const totalResults = count ?? rows?.length ?? 0
  const totalPages = Math.max(1, Math.ceil(totalResults / DASHBOARD_ANNOUNCEMENTS_PAGE_SIZE))
  const tabCounts: AnnouncementTabCounts = {
    all: totalAnnouncements,
    published: publishedCountResult.count ?? 0,
    drafts: draftCountResult.count ?? 0,
    pending: pendingCountResult.count ?? 0,
    archived: archivedCountResult.count ?? 0,
  }

  const stats = [
    { label: 'Live', value: liveCountResult.count ?? 0, icon: CheckCircle2 },
    { label: 'Drafts', value: draftCountResult.count ?? 0, icon: FileText },
    { label: 'Scheduled', value: scheduledCountResult.count ?? 0, icon: Clock3 },
    { label: 'Archived', value: archivedCountResult.count ?? 0, icon: Archive },
  ]

  return (
    <DashboardBoardPage className="flex flex-col gap-4">
      <DashboardBoardHeader
        kicker="Announcement register"
        title="Manage campus posts"
        description={
          scopeToMembership
            ? `${totalAnnouncements} total notices in your organization workspace. Search, filter, and update them here.`
            : `${totalAnnouncements} total notices across approved organizations. Search, filter, and update them here.`
        }
        action={{
          href: '/dashboard/announcements/new',
          label: 'New announcement',
          icon: Plus,
        }}
      />

      <DashboardBoardMetrics
        metrics={stats.map(({ label, value, icon }) => ({
          label,
          value,
          caption:
            label === 'Live'
              ? 'on board'
              : label === 'Drafts'
                ? 'in progress'
                : label === 'Scheduled'
                  ? 'queued'
                  : 'stored',
          icon,
          tone: label === 'Live' ? 'accent' : label === 'Scheduled' ? 'gold' : 'muted',
        }))}
      />

      <DashboardBoardPanel title="Announcement register" count={`${totalResults} results`}>
        <AnnouncementsClient
          announcements={announcements}
          activeTab={activeTab}
          search={normalizedSearch}
          page={currentPage}
          pageSize={DASHBOARD_ANNOUNCEMENTS_PAGE_SIZE}
          totalPages={totalPages}
          totalResults={totalResults}
          tabCounts={tabCounts}
          nowMs={nowMs}
        />
      </DashboardBoardPanel>
    </DashboardBoardPage>
  )
}
