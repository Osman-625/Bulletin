import { GlassCard } from '@/components/dashboard/GlassCard'
import { CountUp } from '@/components/dashboard/CountUp'
import { getPlatformStats } from '@/lib/data'
import { createClient } from '@/lib/supabase/server'

export const metadata = { title: 'Analytics — Bulletin Super Admin' }

export default async function SuperAdminAnalyticsPage() {
  const [stats, supabase] = await Promise.all([
    getPlatformStats(),
    createClient(),
  ])

  const [{ data: byOrg }, { data: recentUsers }] = await Promise.all([
    supabase
      .from('announcements')
      .select('organizations(name), status')
      .eq('status', 'published'),
    supabase
      .from('users')
      .select('display_name, role, created_at')
      .order('created_at', { ascending: false })
      .limit(8),
  ])

  const orgCounts = (byOrg ?? []).reduce<Record<string, number>>((acc, r) => {
    const name = (r as { organizations?: { name?: string } | null }).organizations?.name ?? 'Unknown'
    acc[name] = (acc[name] ?? 0) + 1
    return acc
  }, {})

  const sortedOrgs = Object.entries(orgCounts).sort((a, b) => b[1] - a[1]).slice(0, 10)

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-[var(--color-text-primary)] tracking-tight">Platform Analytics</h1>
        <p className="text-[var(--color-text-secondary)] mt-1">Platform-wide statistics.</p>
      </div>

      {/* Platform stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { label: 'Total Announcements', value: stats.totalAnnouncements },
          { label: 'Published', value: stats.publishedCount },
          { label: 'Pending Review', value: stats.pendingReview },
          { label: 'Organizations', value: stats.totalOrgs },
          { label: 'Total Users', value: stats.totalUsers },
        ].map(({ label, value }) => (
          <GlassCard key={label} hover={false} className="p-5">
            <CountUp value={value} className="text-3xl font-bold font-mono text-[var(--color-accent)]" />
            <p className="text-xs uppercase tracking-widest text-[var(--color-text-muted)] mt-1">{label}</p>
          </GlassCard>
        ))}
      </div>

      {/* Top orgs */}
      {sortedOrgs.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">Most Active Organizations</h2>
          <div className="space-y-2">
            {sortedOrgs.map(([name, count]) => (
              <GlassCard key={name} hover={false} className="px-5 py-3 flex items-center gap-4">
                <p className="flex-1 text-sm font-medium text-[var(--color-text-primary)] truncate">{name}</p>
                <CountUp value={count} className="text-sm font-bold font-mono text-[var(--color-text-primary)]" />
                <p className="text-xs text-[var(--color-text-muted)]">published</p>
              </GlassCard>
            ))}
          </div>
        </div>
      )}

      {/* Recent users */}
      {(recentUsers ?? []).length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">Recently Joined</h2>
          <div className="space-y-2">
            {(recentUsers ?? []).map((u) => (
              <GlassCard key={u.display_name + u.created_at} hover={false} className="px-5 py-3 flex items-center gap-4">
                <div className="h-7 w-7 rounded-full bg-[var(--color-surface-elevated)] flex items-center justify-center shrink-0">
                  <span className="text-xs font-bold text-[var(--color-text-secondary)]">
                    {u.display_name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <p className="flex-1 text-sm text-[var(--color-text-primary)]">{u.display_name}</p>
                <span className="text-[10px] font-medium uppercase tracking-wider text-[var(--color-text-muted)]">{u.role.replace('_', ' ')}</span>
                <p className="text-xs font-mono text-[var(--color-text-muted)] shrink-0">
                  {new Date(u.created_at).toLocaleDateString('en-MY', { day: 'numeric', month: 'short' })}
                </p>
              </GlassCard>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
