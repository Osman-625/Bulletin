import { GlassCard } from '@/components/dashboard/GlassCard'
import { CountUp } from '@/components/dashboard/CountUp'
import { DashboardBoardHeader, DashboardBoardPage } from '@/components/dashboard/DashboardBoard'
import { formatCampusCompactDate } from '@/modules/announcements/public-board'
import { DEFAULT_CATEGORY_DISPLAY_COLOR } from '@/modules/categories/display'
import { requireOwnerAccessContext } from '@/modules/auth/authz'
import { createServiceClient } from '@/infrastructure/database/server'

export const metadata = { title: 'Analytics — Bulletin Owner' }

const ROLE_ROWS = [
  { role: 'super_admin', label: 'Super Admins', color: 'var(--color-navy)' },
  { role: 'admin', label: 'Admins', color: 'var(--color-accent-inti)' },
  { role: 'publisher', label: 'Publishers', color: 'var(--color-text-muted)' },
] as const

const STATUS_ROWS = ['published', 'submitted', 'draft', 'rejected', 'archived', 'expired'] as const

type TopStat = {
  label: string
  value: number
  accent: string
}

type RankedRow = [name: string, count: number]

type CategoryRankRow = [name: string, data: { count: number; color: string }]

type RecentUser = {
  display_name: string
  role: string
  created_at: string
  email: string
}

function OwnerStatsGrid({ stats }: { stats: TopStat[] }) {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
      {stats.map(({ label, value, accent }) => (
        <GlassCard key={label} hover={false} className="relative overflow-hidden p-5 pl-6">
          <span
            className="absolute inset-y-0 left-0 w-1 rounded-l-2xl"
            style={{ background: accent }}
            aria-hidden="true"
          />
          <CountUp
            value={value}
            className="font-mono text-3xl font-bold text-[var(--color-text-primary)]"
          />
          <p className="mt-1 text-xs tracking-widest text-[var(--color-text-muted)] uppercase">
            {label}
          </p>
        </GlassCard>
      ))}
    </div>
  )
}

function UsersByRolePanel({
  roleCounts,
  totalUsers,
}: {
  roleCounts: Record<string, number>
  totalUsers: number
}) {
  return (
    <div>
      <h2 className="mb-4 text-lg font-semibold text-[var(--color-text-primary)]">Users by Role</h2>
      <GlassCard hover={false} className="space-y-4 p-6">
        {ROLE_ROWS.map(({ role, label, color }) => {
          const count = roleCounts[role] ?? 0
          const pct = totalUsers > 0 ? Math.round((count / totalUsers) * 100) : 0
          return (
            <div key={role}>
              <div className="mb-1.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="size-2.5 rounded-full" style={{ background: color }} />
                  <span className="text-sm text-[var(--color-text-primary)]">{label}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-bold text-[var(--color-text-primary)]">
                    {count}
                  </span>
                  <span className="text-xs text-[var(--color-text-muted)]">{pct}%</span>
                </div>
              </div>
              <div className="h-1.5 rounded-full bg-[var(--color-surface-elevated)]">
                <div
                  className="h-1.5 rounded-full transition-all duration-700"
                  style={{ width: `${pct}%`, background: color }}
                />
              </div>
            </div>
          )
        })}
      </GlassCard>
    </div>
  )
}

function StatusPanel({
  statusCounts,
  totalAnnouncements,
}: {
  statusCounts: Record<string, number>
  totalAnnouncements: number
}) {
  return (
    <div>
      <h2 className="mb-4 text-lg font-semibold text-[var(--color-text-primary)]">By Status</h2>
      <div className="grid grid-cols-3 gap-3">
        {STATUS_ROWS.map((status) => (
          <GlassCard key={status} hover={false} className="p-4">
            <CountUp
              value={statusCounts[status] ?? 0}
              className="font-mono text-2xl font-bold text-[var(--color-text-primary)]"
            />
            <p className="mt-1 text-[15px] tracking-wider text-[var(--color-text-muted)] uppercase">
              {status}
            </p>
            {totalAnnouncements > 0 && (
              <div className="mt-2 h-0.5 rounded-full bg-[var(--color-surface-elevated)]">
                <div
                  className="h-0.5 rounded-full bg-[var(--color-accent-inti)]"
                  style={{
                    width: `${Math.round(((statusCounts[status] ?? 0) / totalAnnouncements) * 100)}%`,
                  }}
                />
              </div>
            )}
          </GlassCard>
        ))}
      </div>
    </div>
  )
}

function RankedOrganizationPanel({
  title,
  rows,
  valueLabel,
  emptyTitle,
  emptyDescription,
}: {
  title: string
  rows: RankedRow[]
  valueLabel: string
  emptyTitle: string
  emptyDescription: string
}) {
  return (
    <div>
      <h2 className="mb-4 text-lg font-semibold text-[var(--color-text-primary)]">{title}</h2>
      {rows.length > 0 ? (
        <div className="space-y-2">
          {rows.map(([name, count], index) => (
            <GlassCard key={name} hover={false} className="flex items-center gap-4 px-5 py-3">
              <span className="w-5 shrink-0 font-mono text-sm text-[var(--color-text-muted)]">
                {index + 1}
              </span>
              <p className="flex-1 truncate text-sm font-medium text-[var(--color-text-primary)]">
                {name}
              </p>
              <CountUp
                value={count}
                className="font-mono text-sm font-bold text-[var(--color-text-primary)]"
              />
              <p className="text-xs text-[var(--color-text-muted)]">{valueLabel}</p>
            </GlassCard>
          ))}
        </div>
      ) : (
        <GlassCard hover={false} className="p-6">
          <output className="block text-sm">
            <p className="font-semibold text-[var(--color-text-primary)]">{emptyTitle}</p>
            <p className="mt-1 text-[var(--color-text-secondary)]">{emptyDescription}</p>
          </output>
        </GlassCard>
      )}
    </div>
  )
}

function TopCategoriesPanel({ rows }: { rows: CategoryRankRow[] }) {
  return (
    <div>
      <h2 className="mb-4 text-lg font-semibold text-[var(--color-text-primary)]">
        Top Categories
      </h2>
      {rows.length > 0 ? (
        <div className="space-y-2">
          {rows.map(([name, { count, color }]) => (
            <GlassCard key={name} hover={false} className="flex items-center gap-4 px-5 py-3">
              <span className="size-3 shrink-0 rounded-full" style={{ background: color }} />
              <p className="flex-1 text-sm font-medium text-[var(--color-text-primary)]">{name}</p>
              <CountUp
                value={count}
                className="font-mono text-sm font-bold text-[var(--color-text-primary)]"
              />
            </GlassCard>
          ))}
        </div>
      ) : (
        <GlassCard hover={false} className="p-6">
          <output className="block text-sm">
            <p className="font-semibold text-[var(--color-text-primary)]">
              No published categories yet
            </p>
            <p className="mt-1 text-[var(--color-text-secondary)]">
              Category rankings will appear after announcements are published.
            </p>
          </output>
        </GlassCard>
      )}
    </div>
  )
}

function RecentUsersPanel({ users }: { users: RecentUser[] }) {
  return (
    <div>
      <h2 className="mb-4 text-lg font-semibold text-[var(--color-text-primary)]">
        Recently Joined
      </h2>
      {users.length > 0 ? (
        <div className="space-y-2">
          {users.map((user) => (
            <GlassCard
              key={user.display_name + user.created_at}
              hover={false}
              className="flex items-center gap-4 px-5 py-3"
            >
              <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[var(--color-surface-elevated)]">
                <span className="text-xs font-bold text-[var(--color-text-secondary)]">
                  {user.display_name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm text-[var(--color-text-primary)]">{user.display_name}</p>
                <p className="text-xs text-[var(--color-text-muted)]">{user.email}</p>
              </div>
              <span className="text-[15px] font-medium tracking-wider text-[var(--color-text-muted)] uppercase">
                {user.role.replace('_', ' ')}
              </span>
              <p className="shrink-0 font-mono text-xs text-[var(--color-text-muted)]">
                {formatCampusCompactDate(user.created_at)}
              </p>
            </GlassCard>
          ))}
        </div>
      ) : (
        <GlassCard hover={false} className="p-6">
          <output className="block text-sm">
            <p className="font-semibold text-[var(--color-text-primary)]">No recent users yet</p>
            <p className="mt-1 text-[var(--color-text-secondary)]">
              New account activity will appear here after users join.
            </p>
          </output>
        </GlassCard>
      )}
    </div>
  )
}

export default async function OwnerAnalyticsPage() {
  await requireOwnerAccessContext()
  const supabase = await createServiceClient()

  const now = new Date()
  const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

  const [
    { data: users },
    { data: byStatus },
    { data: byOrg },
    { data: byCategory },
    { data: recentUsers },
    { count: closingCount },
    { data: byRejectedOrg },
  ] = await Promise.all([
    supabase.from('users').select('role, created_at'),
    supabase.from('announcements').select('status'),
    supabase.from('announcements').select('organizations(name), status').eq('status', 'published'),
    supabase
      .from('announcements')
      .select('categories(name, color), status')
      .eq('status', 'published'),
    supabase
      .from('users')
      .select('display_name, role, created_at, email')
      .order('created_at', { ascending: false })
      .limit(10),
    supabase
      .from('announcements')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'published')
      .gt('expires_at', now.toISOString())
      .lt('expires_at', sevenDaysFromNow.toISOString()),
    supabase.from('announcements').select('organizations(name), status').eq('status', 'rejected'),
  ])

  const roleCounts = (users ?? []).reduce<Record<string, number>>((acc, user) => {
    const role = user.role as string
    acc[role] = (acc[role] ?? 0) + 1
    return acc
  }, {})

  const statusCounts = (byStatus ?? []).reduce<Record<string, number>>((acc, row) => {
    acc[row.status] = (acc[row.status] ?? 0) + 1
    return acc
  }, {})

  const orgCounts = (byOrg ?? []).reduce<Record<string, number>>((acc, row) => {
    const name =
      (row as { organizations?: { name?: string } | null }).organizations?.name ?? 'Unknown'
    acc[name] = (acc[name] ?? 0) + 1
    return acc
  }, {})
  const sortedOrgs = Object.entries(orgCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)

  const catCounts = (byCategory ?? []).reduce<Record<string, { count: number; color: string }>>(
    (acc, row) => {
      const catRow = row as { categories?: unknown }
      const cat = catRow.categories as { name: string; color: string | null } | null
      if (!cat) return acc
      if (!acc[cat.name]) {
        acc[cat.name] = { count: 0, color: cat.color ?? DEFAULT_CATEGORY_DISPLAY_COLOR }
      }
      acc[cat.name].count++
      return acc
    },
    {}
  )
  const sortedCats = Object.entries(catCounts).sort((a, b) => b[1].count - a[1].count)

  const rejectedOrgCounts = (byRejectedOrg ?? []).reduce<Record<string, number>>((acc, row) => {
    const name =
      (row as { organizations?: { name?: string } | null }).organizations?.name ?? 'Unknown'
    acc[name] = (acc[name] ?? 0) + 1
    return acc
  }, {})
  const sortedRejectedOrgs = Object.entries(rejectedOrgCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)

  const closingThisWeek = closingCount ?? 0
  const totalAnnouncements = Object.values(statusCounts).reduce((sum, count) => sum + count, 0)
  const totalUsers = users?.length ?? 0
  const topStats = [
    { label: 'Total Users', value: totalUsers, accent: 'var(--color-navy)' },
    {
      label: 'Total Announcements',
      value: totalAnnouncements,
      accent: 'var(--color-accent-inti)',
    },
    {
      label: 'Published',
      value: statusCounts['published'] ?? 0,
      accent: 'var(--color-status-published-text)',
    },
    {
      label: 'Pending Review',
      value: statusCounts['submitted'] ?? 0,
      accent: 'var(--color-gold)',
    },
    { label: 'Closing This Week', value: closingThisWeek, accent: 'var(--color-gold)' },
  ]

  return (
    <DashboardBoardPage className="flex flex-col gap-6">
      <DashboardBoardHeader
        kicker="Owner analytics"
        title="Platform analytics"
        description="Full system view across roles, announcements, organizations, categories, and account movement."
      />

      <OwnerStatsGrid stats={topStats} />

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <UsersByRolePanel roleCounts={roleCounts} totalUsers={totalUsers} />
        <StatusPanel statusCounts={statusCounts} totalAnnouncements={totalAnnouncements} />
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <RankedOrganizationPanel
          title="Most Active Organizations"
          rows={sortedOrgs}
          valueLabel="published"
          emptyTitle="No organization activity yet"
          emptyDescription="Published announcement counts will appear after organizations start posting."
        />
        <RankedOrganizationPanel
          title="Most Rejected Organizations"
          rows={sortedRejectedOrgs}
          valueLabel="rejected"
          emptyTitle="No rejected announcements yet"
          emptyDescription="Rejection counts will appear after moderation decisions are recorded."
        />
        <TopCategoriesPanel rows={sortedCats} />
      </div>

      <RecentUsersPanel users={(recentUsers ?? []) as RecentUser[]} />
    </DashboardBoardPage>
  )
}
