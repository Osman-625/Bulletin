import { GlassCard } from '@/components/dashboard/GlassCard'
import { CountUp } from '@/components/dashboard/CountUp'
import { createServiceClient } from '@/lib/supabase/server'

export const metadata = { title: 'Analytics — Bulletin Owner' }

export default async function OwnerAnalyticsPage() {
  const supabase = await createServiceClient()

  const [
    { data: users },
    { data: byStatus },
    { data: byOrg },
    { data: byCategory },
    { data: recentUsers },
  ] = await Promise.all([
    supabase.from('users').select('role, created_at'),
    supabase.from('announcements').select('status'),
    supabase.from('announcements').select('organizations(name), status').eq('status', 'published'),
    supabase.from('announcements').select('categories(name, color), status').eq('status', 'published'),
    supabase.from('users').select('display_name, role, created_at, email').order('created_at', { ascending: false }).limit(10),
  ])

  const roleCounts = (users ?? []).reduce<Record<string, number>>((acc, u) => {
    const r = u.role as string
    acc[r] = (acc[r] ?? 0) + 1
    return acc
  }, {})

  const statusCounts = (byStatus ?? []).reduce<Record<string, number>>((acc, r) => {
    acc[r.status] = (acc[r.status] ?? 0) + 1
    return acc
  }, {})

  const orgCounts = (byOrg ?? []).reduce<Record<string, number>>((acc, r) => {
    const name = (r as { organizations?: { name?: string } | null }).organizations?.name ?? 'Unknown'
    acc[name] = (acc[name] ?? 0) + 1
    return acc
  }, {})
  const sortedOrgs = Object.entries(orgCounts).sort((a, b) => b[1] - a[1]).slice(0, 8)

  const catCounts = (byCategory ?? []).reduce<Record<string, { count: number; color: string }>>((acc, r) => {
    const catRow = r as { categories?: unknown }
    const cat = catRow.categories as { name: string; color: string | null } | null
    if (!cat) return acc
    if (!acc[cat.name]) acc[cat.name] = { count: 0, color: cat.color ?? '#C8102E' }
    acc[cat.name].count++
    return acc
  }, {})
  const sortedCats = Object.entries(catCounts).sort((a, b) => b[1].count - a[1].count)

  const totalAnnouncements = Object.values(statusCounts).reduce((s, n) => s + n, 0)
  const totalUsers = users?.length ?? 0

  const roleRows = [
    { role: 'super_admin', label: 'Super Admins', color: '#7C3AED' },
    { role: 'admin', label: 'Admins', color: 'var(--color-accent-inti)' },
    { role: 'publisher', label: 'Publishers', color: 'var(--color-text-muted)' },
  ]

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-[var(--color-text-primary)] tracking-tight">Platform Analytics</h1>
        <p className="text-[var(--color-text-secondary)] mt-1">Full system view — all roles, all data.</p>
      </div>

      {/* Top stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Users', value: totalUsers },
          { label: 'Total Announcements', value: totalAnnouncements },
          { label: 'Published', value: statusCounts['published'] ?? 0 },
          { label: 'Pending Review', value: statusCounts['submitted'] ?? 0 },
        ].map(({ label, value }) => (
          <GlassCard key={label} hover={false} className="p-5">
            <CountUp value={value} className="text-3xl font-bold font-mono text-[var(--color-accent)]" />
            <p className="text-xs uppercase tracking-widest text-[var(--color-text-muted)] mt-1">{label}</p>
          </GlassCard>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Users by role */}
        <div>
          <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">Users by Role</h2>
          <GlassCard hover={false} className="p-6 space-y-4">
            {roleRows.map(({ role, label, color }) => {
              const count = roleCounts[role] ?? 0
              const pct = totalUsers > 0 ? Math.round((count / totalUsers) * 100) : 0
              return (
                <div key={role}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ background: color }} />
                      <span className="text-sm text-[var(--color-text-primary)]">{label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-mono font-bold text-[var(--color-text-primary)]">{count}</span>
                      <span className="text-xs text-[var(--color-text-muted)]">{pct}%</span>
                    </div>
                  </div>
                  <div className="h-1.5 rounded-full bg-[var(--color-surface-elevated)]">
                    <div className="h-1.5 rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: color }} />
                  </div>
                </div>
              )
            })}
          </GlassCard>
        </div>

        {/* Announcements by status */}
        <div>
          <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">By Status</h2>
          <div className="grid grid-cols-3 gap-3">
            {['published', 'submitted', 'draft', 'rejected', 'archived', 'expired'].map((s) => (
              <GlassCard key={s} hover={false} className="p-4">
                <CountUp value={statusCounts[s] ?? 0} className="text-2xl font-bold font-mono text-[var(--color-text-primary)]" />
                <p className="text-[10px] uppercase tracking-wider text-[var(--color-text-muted)] mt-1">{s}</p>
                {totalAnnouncements > 0 && (
                  <div className="mt-2 h-0.5 rounded-full bg-[var(--color-surface-elevated)]">
                    <div
                      className="h-0.5 rounded-full bg-[var(--color-accent)]"
                      style={{ width: `${Math.round(((statusCounts[s] ?? 0) / totalAnnouncements) * 100)}%` }}
                    />
                  </div>
                )}
              </GlassCard>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Top orgs */}
        {sortedOrgs.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">Most Active Organizations</h2>
            <div className="space-y-2">
              {sortedOrgs.map(([name, count], i) => (
                <GlassCard key={name} hover={false} className="px-5 py-3 flex items-center gap-4">
                  <span className="text-sm font-mono text-[var(--color-text-muted)] w-5 shrink-0">{i + 1}</span>
                  <p className="flex-1 text-sm font-medium text-[var(--color-text-primary)] truncate">{name}</p>
                  <CountUp value={count} className="text-sm font-bold font-mono text-[var(--color-text-primary)]" />
                  <p className="text-xs text-[var(--color-text-muted)]">published</p>
                </GlassCard>
              ))}
            </div>
          </div>
        )}

        {/* Top categories */}
        {sortedCats.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">Top Categories</h2>
            <div className="space-y-2">
              {sortedCats.map(([name, { count, color }]) => (
                <GlassCard key={name} hover={false} className="px-5 py-3 flex items-center gap-4">
                  <span className="h-3 w-3 rounded-full shrink-0" style={{ background: color }} />
                  <p className="flex-1 text-sm font-medium text-[var(--color-text-primary)]">{name}</p>
                  <CountUp value={count} className="text-sm font-bold font-mono text-[var(--color-text-primary)]" />
                </GlassCard>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Recently joined */}
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
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-[var(--color-text-primary)]">{u.display_name}</p>
                  <p className="text-xs text-[var(--color-text-muted)]">{u.email}</p>
                </div>
                <span className="text-[10px] font-medium uppercase tracking-wider text-[var(--color-text-muted)]">{(u.role as string).replace('_', ' ')}</span>
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
