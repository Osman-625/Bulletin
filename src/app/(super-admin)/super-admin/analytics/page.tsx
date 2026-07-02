import { GlassCard } from '@/components/dashboard/GlassCard'
import { CountUp } from '@/components/dashboard/CountUp'
import { DashboardBoardHeader, DashboardBoardPage } from '@/components/dashboard/DashboardBoard'
import { formatCampusCompactDate } from '@/modules/announcements/public-board'
import { getPlatformStats } from '@/infrastructure/database/data'
import { createClient } from '@/infrastructure/database/server'

export const metadata = { title: 'Analytics — Bulletin Super Admin' }

export default async function SuperAdminAnalyticsPage() {
  const [stats, supabase] = await Promise.all([getPlatformStats(), createClient()])

  const [{ data: byOrg }, { data: recentUsers }] = await Promise.all([
    supabase.from('announcements').select('organizations(name), status').eq('status', 'published'),
    supabase
      .from('users')
      .select('display_name, role, created_at')
      .order('created_at', { ascending: false })
      .limit(8),
  ])

  const orgCounts = (byOrg ?? []).reduce<Record<string, number>>((acc, r) => {
    const name =
      (r as { organizations?: { name?: string } | null }).organizations?.name ?? 'Unknown'
    acc[name] = (acc[name] ?? 0) + 1
    return acc
  }, {})

  const sortedOrgs = Object.entries(orgCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)

  return (
    <DashboardBoardPage className="flex flex-col gap-6">
      <DashboardBoardHeader
        kicker="Super analytics"
        title="Platform analytics"
        description="Platform-wide publishing statistics, organization activity, and new user movement."
      />

      {/* Platform stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        {[
          { label: 'Total Announcements', value: stats.totalAnnouncements },
          { label: 'Published', value: stats.publishedCount },
          { label: 'Pending Review', value: stats.pendingReview },
          { label: 'Organizations', value: stats.totalOrgs },
          { label: 'Total Users', value: stats.totalUsers },
        ].map(({ label, value }) => (
          <GlassCard key={label} hover={false} className="p-5">
            <CountUp
              value={value}
              className="font-mono text-3xl font-bold text-[var(--color-accent)]"
            />
            <p className="mt-1 text-xs tracking-widest text-[var(--color-text-muted)] uppercase">
              {label}
            </p>
          </GlassCard>
        ))}
      </div>

      <div>
        <h2 className="mb-4 text-lg font-semibold text-[var(--color-text-primary)]">
          Most Active Organizations
        </h2>
        {sortedOrgs.length > 0 ? (
          <div className="space-y-2">
            {sortedOrgs.map(([name, count]) => (
              <GlassCard key={name} hover={false} className="flex items-center gap-4 px-5 py-3">
                <p className="flex-1 truncate text-sm font-medium text-[var(--color-text-primary)]">
                  {name}
                </p>
                <CountUp
                  value={count}
                  className="font-mono text-sm font-bold text-[var(--color-text-primary)]"
                />
                <p className="text-xs text-[var(--color-text-muted)]">published</p>
              </GlassCard>
            ))}
          </div>
        ) : (
          <GlassCard hover={false} className="p-6">
            <output className="block text-sm">
              <p className="font-semibold text-[var(--color-text-primary)]">
                No organization activity yet
              </p>
              <p className="mt-1 text-[var(--color-text-secondary)]">
                Organization rankings will appear after published announcements exist.
              </p>
            </output>
          </GlassCard>
        )}
      </div>

      <div>
        <h2 className="mb-4 text-lg font-semibold text-[var(--color-text-primary)]">
          Recently Joined
        </h2>
        {(recentUsers ?? []).length > 0 ? (
          <div className="space-y-2">
            {(recentUsers ?? []).map((u) => (
              <GlassCard
                key={u.display_name + u.created_at}
                hover={false}
                className="flex items-center gap-4 px-5 py-3"
              >
                <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[var(--color-surface-elevated)]">
                  <span className="text-xs font-bold text-[var(--color-text-secondary)]">
                    {u.display_name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <p className="flex-1 text-sm text-[var(--color-text-primary)]">{u.display_name}</p>
                <span className="text-[15px] font-medium tracking-wider text-[var(--color-text-muted)] uppercase">
                  {u.role.replace('_', ' ')}
                </span>
                <p className="shrink-0 font-mono text-xs text-[var(--color-text-muted)]">
                  {formatCampusCompactDate(u.created_at)}
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
    </DashboardBoardPage>
  )
}
