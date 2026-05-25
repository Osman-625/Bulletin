import Link from 'next/link'
import { Archive, CheckCircle2, Clock3, FileText, Plus } from 'lucide-react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import {
  AnnouncementsClient,
  type AnnouncementTab,
  type AnnouncementTabCounts,
} from '@/components/dashboard/AnnouncementsClient'
import { CountUp } from '@/components/dashboard/CountUp'
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
  const { search, tab, page } = await searchParams
  const access = await getCurrentAccessContext()
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
      .or(`scheduled_publish_at.is.null,scheduled_publish_at.lte.${nowIso}`),
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
    <div className="dashboard-page mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
      <section className="grid gap-3 xl:grid-cols-12">
        <div className="dashboard-command-card rounded-[1.5rem] p-6 sm:p-8 xl:col-span-8">
          <p className="future-kicker">Announcements</p>
          <div className="mt-4 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="font-display text-4xl leading-none font-extrabold text-[var(--color-text-primary)] sm:text-5xl">
                Manage campus posts
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--color-text-secondary)] sm:text-base">
                {scopeToMembership
                  ? "Search, filter, and update your organization's announcements."
                  : 'Search, filter, and update announcements across approved organizations.'}
              </p>
            </div>
            <Link
              href="/dashboard/announcements/new"
              className="action-lift inline-flex min-h-11 w-full shrink-0 items-center justify-center gap-2 rounded-[0.95rem] bg-[var(--color-accent)] px-5 text-sm font-semibold text-white shadow-[var(--shadow-button)] sm:w-auto"
            >
              <Plus size={16} aria-hidden="true" />
              New announcement
            </Link>
          </div>
        </div>

        <div className="dashboard-command-card rounded-[1.5rem] p-5 xl:col-span-4">
          <p className="future-kicker">Total</p>
          <CountUp
            value={totalAnnouncements}
            className="mt-5 block font-mono text-4xl font-bold text-[var(--color-text-primary)]"
          />
          <p className="mt-2 text-sm leading-6 text-[var(--color-text-muted)]">
            Total announcements in your workspace.
          </p>
        </div>

        {stats.map(({ label, value, icon: Icon }) => (
          <div
            key={label}
            className="dashboard-command-card rounded-[1.2rem] p-4 sm:p-5 xl:col-span-3"
          >
            <Icon size={18} className="text-[var(--color-accent)]" aria-hidden="true" />
            <CountUp
              value={value}
              className="mt-4 block font-mono text-3xl font-bold text-[var(--color-text-primary)]"
            />
            <p className="mt-1 text-[0.68rem] font-bold tracking-[0.14em] text-[var(--color-text-muted)] uppercase">
              {label}
            </p>
          </div>
        ))}
      </section>

      <section className="dashboard-command-card mt-3 rounded-[1.5rem] p-4 sm:p-5">
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
      </section>
    </div>
  )
}
