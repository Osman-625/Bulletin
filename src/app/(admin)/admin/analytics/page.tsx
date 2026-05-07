import { GlassCard } from '@/components/dashboard/GlassCard'
import { CountUp } from '@/components/dashboard/CountUp'
import { createClient } from '@/lib/supabase/server'
import { canAccessAdminArea, getCurrentAccessContext, getDefaultAppPath } from '@/lib/auth/authz'
import { redirect } from 'next/navigation'

export const metadata = { title: 'Analytics — Bulletin Admin' }

export default async function AdminAnalyticsPage() {
  const access = await getCurrentAccessContext()
  if (!access) redirect('/login')
  if (!canAccessAdminArea(access.role)) redirect(getDefaultAppPath(access.role))

  const supabase = await createClient()

  let byStatusQuery = supabase.from('announcements').select('status')
  let byCategoryQuery = supabase.from('announcements').select('categories(name, color), status').eq('status', 'published')
  let recentPublishedQuery = supabase
    .from('announcements')
    .select('title, organizations(name), published_at')
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(10)

  if (access.role === 'admin') {
    if (access.orgIds.length === 0) {
      byStatusQuery = byStatusQuery.eq('organization_id', '__none__')
      byCategoryQuery = byCategoryQuery.eq('organization_id', '__none__')
      recentPublishedQuery = recentPublishedQuery.eq('organization_id', '__none__')
    } else {
      byStatusQuery = byStatusQuery.in('organization_id', access.orgIds)
      byCategoryQuery = byCategoryQuery.in('organization_id', access.orgIds)
      recentPublishedQuery = recentPublishedQuery.in('organization_id', access.orgIds)
    }
  }

  const [
    { data: byStatus },
    { data: byCategory },
    { data: recentPublished },
  ] = await Promise.all([
    byStatusQuery,
    byCategoryQuery,
    recentPublishedQuery,
  ])

  const statusCounts = (byStatus ?? []).reduce<Record<string, number>>((acc, r) => {
    acc[r.status] = (acc[r.status] ?? 0) + 1
    return acc
  }, {})

  const catCounts = (byCategory ?? []).reduce<Record<string, { count: number; color: string }>>((acc, r) => {
    const cat = (r as unknown as { categories?: { name: string; color: string | null } | null }).categories
    if (!cat) return acc
    const key = cat.name
    if (!acc[key]) acc[key] = { count: 0, color: cat.color ?? '#C8102E' }
    acc[key].count++
    return acc
  }, {})

  const sortedCats = Object.entries(catCounts).sort((a, b) => b[1].count - a[1].count)
  const total = Object.values(statusCounts).reduce((s, n) => s + n, 0)

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-[var(--color-text-primary)] tracking-tight">Analytics</h1>
        <p className="text-[var(--color-text-secondary)] mt-1">Platform activity overview.</p>
      </div>

      {/* Status breakdown */}
      <div>
        <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">By Status</h2>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {['published', 'submitted', 'draft', 'rejected', 'archived', 'expired'].map((s) => (
            <GlassCard key={s} hover={false} className="p-5">
              <CountUp value={statusCounts[s] ?? 0} className="text-3xl font-bold font-mono text-[var(--color-text-primary)]" />
              <p className="text-xs uppercase tracking-widest text-[var(--color-text-muted)] mt-1">{s}</p>
              {total > 0 && (
                <div className="mt-2 h-1 rounded-full bg-[var(--color-surface-elevated)]">
                  <div
                    className="h-1 rounded-full bg-[var(--color-accent)]"
                    style={{ width: `${Math.round(((statusCounts[s] ?? 0) / total) * 100)}%` }}
                  />
                </div>
              )}
            </GlassCard>
          ))}
        </div>
      </div>

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

      {/* Recent published */}
      {(recentPublished ?? []).length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">Recently Published</h2>
          <div className="space-y-2">
            {(recentPublished ?? []).map((a) => (
              <GlassCard key={(a as { id?: string }).id ?? a.title} hover={false} className="px-5 py-3 flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">{a.title}</p>
                  <p className="text-xs text-[var(--color-text-muted)]">
                    {(a as { organizations?: { name?: string } | null }).organizations?.name ?? '—'}
                  </p>
                </div>
                <p className="text-xs font-mono text-[var(--color-text-muted)] shrink-0">
                  {a.published_at ? new Date(a.published_at).toLocaleDateString('en-MY', { day: 'numeric', month: 'short' }) : '—'}
                </p>
              </GlassCard>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
