import { BarChart3, ClipboardList, FileText, ShieldCheck, Tag, UserCog, Users } from 'lucide-react'
import {
  DashboardDeskBoard,
  DashboardDeskEmpty,
  DashboardDeskHeader,
  DashboardDeskMetrics,
  DashboardDeskPage,
  DashboardDeskPanel,
  DashboardDeskRow,
} from '@/components/dashboard/DashboardDesk'
import { getPlatformStats } from '@/lib/data'

export const metadata = { title: 'Platform Overview' }

const SUPER_ADMIN_QUICK_LINKS = [
  {
    href: '/super-admin/admins',
    label: 'Admin access',
    icon: ShieldCheck,
    desc: 'Invite and manage administrators.',
  },
  {
    href: '/super-admin/categories',
    label: 'Category system',
    icon: Tag,
    desc: 'Maintain the public topic structure.',
  },
  {
    href: '/super-admin/users',
    label: 'User directory',
    icon: UserCog,
    desc: 'View users and support account recovery.',
  },
  {
    href: '/super-admin/analytics',
    label: 'Platform analytics',
    icon: BarChart3,
    desc: 'View publication activity across the platform.',
  },
]

export default async function SuperAdminPage() {
  const stats = await getPlatformStats()

  const tiles = [
    { label: 'Announcements', value: stats.totalAnnouncements, icon: FileText },
    { label: 'Pending review', value: stats.pendingReview, icon: ClipboardList },
    { label: 'Organizations', value: stats.totalOrgs, icon: ShieldCheck },
    { label: 'Users', value: stats.totalUsers, icon: Users },
  ]

  return (
    <DashboardDeskPage>
      <DashboardDeskHeader
        kicker="Super desk"
        title="Super desk"
        description="Platform-wide publishing structure, admin access, categories, and user support."
        action={{ href: '/super-admin/admins', label: 'Manage admins', icon: ShieldCheck }}
      />

      <DashboardDeskMetrics
        metrics={[
          ...tiles.map(({ label, value, icon }) => ({
            label,
            value,
            caption:
              label === 'Pending review'
                ? 'awaiting admin'
                : label === 'Organizations'
                  ? 'campus groups'
                  : label === 'Users'
                    ? 'all roles'
                    : `${stats.publishedCount.toLocaleString('en-MY')} published`,
            icon,
            tone:
              label === 'Pending review' && value > 0 ? ('accent' as const) : ('muted' as const),
          })),
        ]}
      />

      <DashboardDeskBoard>
        <DashboardDeskPanel title="Platform work" count={`${SUPER_ADMIN_QUICK_LINKS.length}`}>
          {SUPER_ADMIN_QUICK_LINKS.map(({ href, label, desc }, index) => (
            <DashboardDeskRow
              key={href}
              href={href}
              title={label}
              index={index}
              meta={[{ label: desc }]}
            />
          ))}
        </DashboardDeskPanel>

        <DashboardDeskPanel
          title="Needs attention"
          count={stats.pendingReview > 0 ? `${stats.pendingReview}` : '0'}
        >
          {stats.pendingReview > 0 ? (
            <DashboardDeskRow
              href="/super-admin/analytics"
              title="Review pressure is building"
              index={0}
              meta={[
                { label: `${stats.pendingReview} submitted announcements need admin decisions` },
              ]}
              statusLabel="Review"
              statusTone="submitted"
            />
          ) : (
            <DashboardDeskEmpty>No platform-wide queue pressure right now.</DashboardDeskEmpty>
          )}
        </DashboardDeskPanel>
      </DashboardDeskBoard>
    </DashboardDeskPage>
  )
}
