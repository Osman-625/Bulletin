import { Eye, FileEdit, Megaphone, Plus, Send } from 'lucide-react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { DashboardIndexAnnouncement } from '@/components/dashboard/DashboardContentsIndex'
import {
  DashboardDeskBoard,
  DashboardDeskEmpty,
  DashboardDeskHeader,
  DashboardDeskMetrics,
  DashboardDeskPage,
  DashboardDeskPanel,
  DashboardDeskRow,
} from '@/components/dashboard/DashboardDesk'
import { getCurrentAccessContext } from '@/lib/auth/authz'
import { shouldScopeAnnouncementsToMembership } from '@/lib/announcements/access'
import { formatCampusCompactDate } from '@/lib/announcements/public-board'

export const metadata = { title: 'Publisher Desk' }

function formatShortDate(iso: string | null): string {
  return formatCampusCompactDate(iso)
}

function statusLabel(status: string) {
  if (status === 'published') return 'Published'
  if (status === 'submitted') return 'In review'
  if (status === 'draft') return 'Draft'
  if (status === 'expired') return 'Expired'
  if (status === 'archived') return 'Archived'
  if (status === 'rejected') return 'Rejected'
  return status
}

function statusTone(status: string) {
  if (status === 'published') return 'published'
  if (status === 'submitted') return 'submitted'
  if (status === 'draft') return 'draft'
  if (status === 'expired') return 'expired'
  if (status === 'archived') return 'archived'
  if (status === 'rejected') return 'rejected'
  return 'draft'
}

type DashboardAnnouncement = DashboardIndexAnnouncement & {
  body: string | null
  banner_url: string | null
  published_at: string | null
  expires_at: string | null
}

export default async function DashboardPage() {
  const access = await getCurrentAccessContext()
  if (!access) redirect('/login')

  const supabase = await createClient()

  let live = 0
  let inDraft = 0
  let inReview = 0
  let totalViews = 0
  let recentAnnouncements: DashboardAnnouncement[] = []

  const scopeToMembership = shouldScopeAnnouncementsToMembership(access)
  const hasAnnouncementScope = !scopeToMembership || access.orgIds.length > 0

  if (hasAnnouncementScope) {
    const orgFilter = scopeToMembership ? access.orgIds : null

    let liveQ = supabase
      .from('announcements')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'published')
    let draftQ = supabase
      .from('announcements')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'draft')
    let reviewQ = supabase
      .from('announcements')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'submitted')
    let viewsQ = supabase.from('announcements').select('view_count')
    let recentQ = supabase
      .from('announcements')
      .select(
        'id, title, body, banner_url, status, view_count, updated_at, published_at, expires_at, categories(name, color)'
      )
      .order('updated_at', { ascending: false })
      .limit(8)

    if (orgFilter) {
      liveQ = liveQ.in('organization_id', orgFilter)
      draftQ = draftQ.in('organization_id', orgFilter)
      reviewQ = reviewQ.in('organization_id', orgFilter)
      viewsQ = viewsQ.in('organization_id', orgFilter)
      recentQ = recentQ.in('organization_id', orgFilter)
    }

    const [liveResult, draftResult, reviewResult, viewsResult, recentResult] = await Promise.all([
      liveQ,
      draftQ,
      reviewQ,
      viewsQ,
      recentQ,
    ])

    live = liveResult.count ?? 0
    inDraft = draftResult.count ?? 0
    inReview = reviewResult.count ?? 0
    totalViews = (viewsResult.data ?? []).reduce((sum, row) => sum + (row.view_count ?? 0), 0)
    recentAnnouncements = (recentResult.data ?? []) as unknown as DashboardAnnouncement[]
  }

  const attentionItems = recentAnnouncements.filter((a) => a.status === 'draft')
  const viewsDisplay =
    totalViews >= 1000 ? `${(totalViews / 1000).toFixed(1)}k` : String(totalViews)

  return (
    <DashboardDeskPage className="publisher-dashboard-shell">
      <DashboardDeskHeader
        kicker="Publisher desk"
        title="Publisher desk"
        description="Your announcements, drafts, and what's going live."
        action={{ href: '/dashboard/announcements/new', label: 'New announcement', icon: Plus }}
      />

      <DashboardDeskMetrics
        metrics={[
          {
            label: 'Live notices',
            value: live,
            caption: 'on the board',
            icon: Megaphone,
            href: '/dashboard/announcements?status=published',
            tone: 'accent',
          },
          {
            label: 'Drafts',
            value: inDraft,
            caption: 'to finish',
            icon: FileEdit,
            href: '/dashboard/announcements?status=draft',
          },
          {
            label: 'In review',
            value: inReview,
            caption: 'with admin',
            icon: Send,
            href: '/dashboard/announcements?status=submitted',
          },
          {
            label: 'Views',
            value: viewsDisplay,
            caption: 'all announcements',
            icon: Eye,
            tone: 'gold',
          },
        ]}
      />

      <DashboardDeskBoard>
        <DashboardDeskPanel
          title="Your announcements"
          count={`${recentAnnouncements.length}`}
          action={{ href: '/dashboard/announcements', label: 'View all' }}
        >
          {!hasAnnouncementScope ? (
            <DashboardDeskEmpty>
              No organization is assigned to this publisher account yet.
            </DashboardDeskEmpty>
          ) : recentAnnouncements.length === 0 ? (
            <DashboardDeskEmpty>
              No announcements yet. Create the first announcement for your desk.
            </DashboardDeskEmpty>
          ) : (
            recentAnnouncements.slice(0, 6).map((announcement, index) => (
              <DashboardDeskRow
                key={announcement.id}
                href={`/dashboard/announcements/${announcement.id}/edit`}
                title={announcement.title}
                index={index}
                meta={[
                  {
                    label: announcement.categories?.name ?? 'Uncategorized',
                    color: announcement.categories?.color ?? 'var(--color-text-muted)',
                  },
                  { label: `Updated ${formatShortDate(announcement.updated_at)}` },
                ]}
                statusLabel={statusLabel(announcement.status)}
                statusTone={statusTone(announcement.status)}
                stat={
                  announcement.view_count > 0
                    ? announcement.view_count.toLocaleString('en-MY')
                    : '—'
                }
                statLabel="views"
              />
            ))
          )}
        </DashboardDeskPanel>

        <DashboardDeskPanel title="Needs attention" count={`${attentionItems.length}`}>
          {attentionItems.length === 0 ? (
            <DashboardDeskEmpty>No drafts waiting. Your desk is clear.</DashboardDeskEmpty>
          ) : (
            attentionItems
              .slice(0, 5)
              .map((announcement, index) => (
                <DashboardDeskRow
                  key={announcement.id}
                  href={`/dashboard/announcements/${announcement.id}/edit`}
                  title={announcement.title}
                  index={index}
                  meta={[
                    { label: 'Draft' },
                    { label: announcement.categories?.name ?? 'Uncategorized' },
                  ]}
                  statusLabel="Draft"
                  statusTone="draft"
                />
              ))
          )}
        </DashboardDeskPanel>
      </DashboardDeskBoard>
    </DashboardDeskPage>
  )
}
