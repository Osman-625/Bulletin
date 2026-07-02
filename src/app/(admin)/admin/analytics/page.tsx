import { GlassCard } from '@/components/dashboard/GlassCard'
import { CountUp } from '@/components/dashboard/CountUp'
import { DashboardBoardHeader, DashboardBoardPage } from '@/components/dashboard/DashboardBoard'
import { createClient } from '@/infrastructure/database/server'
import {
  canAccessAdminArea,
  getCurrentAccessContext,
  getDefaultAppPath,
} from '@/modules/auth/authz'
import { formatCampusCompactDate } from '@/modules/announcements/public-board'
import { DEFAULT_CATEGORY_DISPLAY_COLOR } from '@/modules/categories/display'
import { redirect } from 'next/navigation'

export const metadata = { title: 'Analytics — Bulletin Admin' }

export default async function AdminAnalyticsPage() {
  const access = await getCurrentAccessContext()
  if (!access) redirect('/login')
  if (!canAccessAdminArea(access.role)) redirect(getDefaultAppPath(access.role))

  const supabase = await createClient()

  let byStatusQuery = supabase.from('announcements').select('status')
  let byCategoryQuery = supabase
    .from('announcements')
    .select('categories(name, color), status')
    .eq('status', 'published')
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

  const [{ data: byStatus }, { data: byCategory }, { data: recentPublished }] = await Promise.all([
    byStatusQuery,
    byCategoryQuery,
    recentPublishedQuery,
  ])

  const statusCounts = (byStatus ?? []).reduce<Record<string, number>>((acc, r) => {
    acc[r.status] = (acc[r.status] ?? 0) + 1
    return acc
  }, {})

  const catCounts = (byCategory ?? []).reduce<Record<string, { count: number; color: string }>>(
    (acc, r) => {
      const cat = (r as unknown as { categories?: { name: string; color: string | null } | null })
        .categories
      if (!cat) return acc
      const key = cat.name
      if (!acc[key]) acc[key] = { count: 0, color: cat.color ?? DEFAULT_CATEGORY_DISPLAY_COLOR }
      acc[key].count++
      return acc
    },
    {}
  )

  const sortedCats = Object.entries(catCounts).sort((a, b) => b[1].count - a[1].count)
  const total = Object.values(statusCounts).reduce((s, n) => s + n, 0)

  return (
    <DashboardBoardPage className="flex flex-col gap-6">
      <DashboardBoardHeader
        kicker="Admin analytics"
        title="Analytics"
        description="Publishing activity, status pressure, and category performance in your scope."
      />

      {/* Status breakdown */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-[var(--color-text-primary)]">By Status</h2>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
          {['published', 'submitted', 'draft', 'rejected', 'archived', 'expired'].map((s) => (
            <GlassCard key={s} hover={false} className="p-5">
              <CountUp
                value={statusCounts[s] ?? 0}
                className="font-mono text-3xl font-bold text-[var(--color-text-primary)]"
              />
              <p className="mt-1 text-xs tracking-widest text-[var(--color-text-muted)] uppercase">
                {s}
              </p>
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

      <div>
        <h2 className="mb-4 text-lg font-semibold text-[var(--color-text-primary)]">
          Top Categories
        </h2>
        {sortedCats.length > 0 ? (
          <div className="space-y-2">
            {sortedCats.map(([name, { count, color }]) => (
              <GlassCard key={name} hover={false} className="flex items-center gap-4 px-5 py-3">
                <span className="size-3 shrink-0 rounded-full" style={{ background: color }} />
                <p className="flex-1 text-sm font-medium text-[var(--color-text-primary)]">
                  {name}
                </p>
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
                Category rankings will appear after announcements in your scope are published.
              </p>
            </output>
          </GlassCard>
        )}
      </div>

      <div>
        <h2 className="mb-4 text-lg font-semibold text-[var(--color-text-primary)]">
          Recently Published
        </h2>
        {(recentPublished ?? []).length > 0 ? (
          <div className="space-y-2">
            {(recentPublished ?? []).map((a) => (
              <GlassCard
                key={(a as { id?: string }).id ?? a.title}
                hover={false}
                className="flex items-center gap-4 px-5 py-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-[var(--color-text-primary)]">
                    {a.title}
                  </p>
                  <p className="text-xs text-[var(--color-text-muted)]">
                    {(a as { organizations?: { name?: string } | null }).organizations?.name ?? '—'}
                  </p>
                </div>
                <p className="shrink-0 font-mono text-xs text-[var(--color-text-muted)]">
                  {formatCampusCompactDate(a.published_at, '—')}
                </p>
              </GlassCard>
            ))}
          </div>
        ) : (
          <GlassCard hover={false} className="p-6">
            <output className="block text-sm">
              <p className="font-semibold text-[var(--color-text-primary)]">
                No recent publications yet
              </p>
              <p className="mt-1 text-[var(--color-text-secondary)]">
                Approved announcements will appear here after they go live.
              </p>
            </output>
          </GlassCard>
        )}
      </div>
    </DashboardBoardPage>
  )
}
