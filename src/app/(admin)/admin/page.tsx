import { BarChart3, Building2, ClipboardList, FileText, Tag, Users } from 'lucide-react'
import {
  DashboardBoardBoard,
  DashboardBoardEmpty,
  DashboardBoardHeader,
  DashboardBoardMetrics,
  DashboardBoardPage,
  DashboardBoardPanel,
  DashboardBoardRow,
} from '@/components/dashboard/DashboardBoard'
import { formatCampusCompactDate } from '@/lib/announcements/public-board'
import { getAdminStats, getSubmittedAnnouncements } from '@/lib/data'
import { requireUsableAccessContext } from '@/lib/auth/authz'

export const metadata = { title: 'Admin Overview' }

type SubmittedAnnouncement = Awaited<ReturnType<typeof getSubmittedAnnouncements>>[number]

function formatShortDate(iso: string) {
  return formatCampusCompactDate(iso)
}

export default async function AdminPage() {
  await requireUsableAccessContext()
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
    <DashboardBoardPage className="admin-dashboard-shell">
      <DashboardBoardHeader
        kicker="Admin board"
        title="Admin board"
        description="Review submissions, keep publishers organized, and clear moderation work."
        action={{
          href: '/admin/review',
          label: needsReview ? 'Open queue' : 'View queue',
          icon: ClipboardList,
        }}
      />

      <DashboardBoardMetrics
        metrics={metricCards.map(({ label, value, icon, href, urgent }) => ({
          label,
          value,
          caption:
            label === 'Pending review'
              ? needsReview
                ? 'need decision'
                : 'queue clear'
              : label === 'Published this month'
                ? 'this month'
                : label === 'Organizations'
                  ? 'approved orgs'
                  : 'publisher accounts',
          icon,
          href: href ?? undefined,
          tone: urgent && value > 0 ? 'accent' : 'muted',
        }))}
      />

      <DashboardBoardBoard>
        <DashboardBoardPanel
          title="Review queue"
          count={`${recent.length} shown`}
          action={{ href: '/admin/review', label: 'View all' }}
        >
          {recent.length === 0 ? (
            <DashboardBoardEmpty>
              Review queue is clear. New submissions will appear here.
            </DashboardBoardEmpty>
          ) : (
            recent.map((announcement: SubmittedAnnouncement, index) => (
              <DashboardBoardRow
                key={announcement.id}
                href={`/admin/review/${announcement.id}`}
                title={announcement.title}
                index={index}
                meta={[
                  { label: announcement.organizations?.name ?? 'No organization' },
                  { label: announcement.users?.display_name ?? 'Unknown publisher' },
                  { label: formatShortDate(announcement.updated_at) },
                ]}
                statusLabel="In review"
                statusTone="submitted"
              />
            ))
          )}
        </DashboardBoardPanel>

        <DashboardBoardPanel
          title="Needs attention"
          count={needsReview ? `${stats.pendingReview}` : '0'}
        >
          {needsReview ? (
            operationLinks
              .slice(0, 4)
              .map((link, index) => (
                <DashboardBoardRow
                  key={link.href}
                  href={link.href}
                  title={link.label}
                  index={index}
                  meta={[{ label: link.description }]}
                />
              ))
          ) : (
            <DashboardBoardEmpty>No moderation issues need action right now.</DashboardBoardEmpty>
          )}
        </DashboardBoardPanel>
      </DashboardBoardBoard>
    </DashboardBoardPage>
  )
}
