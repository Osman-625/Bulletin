import { Activity, BarChart3, ClipboardList, Megaphone, Users } from 'lucide-react'
import {
  DashboardDeskBoard,
  DashboardDeskHeader,
  DashboardDeskMetrics,
  DashboardDeskPage,
  DashboardDeskPanel,
  DashboardDeskRow,
} from '@/components/dashboard/DashboardDesk'
import { getOwnerResourceOverview } from '@/lib/owner/resources'
import { createServiceClient } from '@/lib/supabase/server'

export const metadata = { title: 'Owner Desk' }

const OWNER_WORKSPACE_LINKS = [
  {
    href: '/owner/resources',
    label: 'Owner resources',
    desc: 'Storage, counters, and external service health',
  },
  {
    href: '/owner/users',
    label: 'Owner users',
    desc: 'Manage every platform role',
  },
  {
    href: '/owner/audit',
    label: 'Owner audit',
    desc: 'System-wide action history',
  },
  {
    href: '/super-admin',
    label: 'Super desk',
    desc: 'Platform roles, categories, and user support',
  },
  {
    href: '/admin',
    label: 'Admin desk',
    desc: 'Review queues, organizations, and publishers',
  },
  {
    href: '/dashboard',
    label: 'Publisher desk',
    desc: 'Create and manage announcements',
  },
]

export default async function OwnerPage() {
  const supabase = await createServiceClient()

  const [
    { data: users },
    { count: totalAnnouncements },
    { count: publishedCount },
    { count: pendingReview },
    overview,
  ] = await Promise.all([
    supabase.from('users').select('role'),
    supabase.from('announcements').select('*', { count: 'exact', head: true }),
    supabase
      .from('announcements')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'published'),
    supabase
      .from('announcements')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'submitted'),
    getOwnerResourceOverview(supabase),
  ])

  const totalUsers = users?.length ?? 0
  const attentionRows = [
    {
      href: '/owner/resources',
      title: overview.external.vercel.name,
      meta: overview.external.vercel.summary,
      status: overview.external.vercel.status.replace('_', ' '),
      tone: overview.external.vercel.status === 'ready' ? 'published' : 'draft',
    },
    {
      href: '/owner/resources',
      title: overview.external.supabase.name,
      meta: overview.external.supabase.summary,
      status: overview.external.supabase.status.replace('_', ' '),
      tone: overview.external.supabase.status === 'ready' ? 'published' : 'draft',
    },
    {
      href: '/admin/review',
      title: 'Review pressure',
      meta: `${pendingReview ?? 0} announcements waiting`,
      status: pendingReview ? 'review' : 'clear',
      tone: pendingReview ? 'submitted' : 'published',
    },
  ]

  return (
    <DashboardDeskPage>
      <DashboardDeskHeader
        kicker="Owner desk"
        title="Owner desk"
        description="System ownership, cross-role access, service health, and audit awareness."
        action={{ href: '/owner/resources', label: 'Open resources', icon: Activity }}
      />

      <DashboardDeskMetrics
        metrics={[
          {
            label: 'Users',
            value: totalUsers,
            caption: 'all roles',
            icon: Users,
            href: '/owner/users',
            tone: 'accent',
          },
          {
            label: 'Pending review',
            value: pendingReview ?? 0,
            caption: 'across platform',
            icon: ClipboardList,
            href: '/admin/review',
          },
          {
            label: 'Announcements',
            value: totalAnnouncements ?? 0,
            caption: `${publishedCount ?? 0} published`,
            icon: Megaphone,
            href: '/owner/analytics',
          },
          {
            label: 'Views',
            value: overview.totalViews,
            caption: 'tracked visits',
            icon: BarChart3,
            href: '/owner/resources',
            tone: 'gold',
          },
        ]}
      />

      <DashboardDeskBoard>
        <DashboardDeskPanel title="Owner workspaces" count={`${OWNER_WORKSPACE_LINKS.length}`}>
          {OWNER_WORKSPACE_LINKS.map((link, index) => (
            <DashboardDeskRow
              key={link.href}
              href={link.href}
              title={link.label}
              index={index}
              meta={[{ label: link.desc }]}
            />
          ))}
        </DashboardDeskPanel>

        <DashboardDeskPanel title="Needs attention" count={`${attentionRows.length}`}>
          {attentionRows.map((row, index) => (
            <DashboardDeskRow
              key={row.title}
              href={row.href}
              title={row.title}
              index={index}
              meta={[{ label: row.meta }]}
              statusLabel={row.status}
              statusTone={row.tone}
            />
          ))}
        </DashboardDeskPanel>
      </DashboardDeskBoard>
    </DashboardDeskPage>
  )
}
