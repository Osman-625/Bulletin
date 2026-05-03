import { Crown, Tag, Users, ScrollText, BarChart3, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { GlassCard } from '@/components/dashboard/GlassCard'
import { CountUp } from '@/components/dashboard/CountUp'
import { createServiceClient } from '@/lib/supabase/server'

export const metadata = { title: 'System — Bulletin Owner' }

export default async function OwnerPage() {
  const supabase = await createServiceClient()

  const [
    { data: users },
    { count: totalAnnouncements },
    { count: publishedCount },
    { count: pendingReview },
    { count: totalOrgs },
    { data: recentAudit },
  ] = await Promise.all([
    supabase.from('users').select('role'),
    supabase.from('announcements').select('*', { count: 'exact', head: true }),
    supabase.from('announcements').select('*', { count: 'exact', head: true }).eq('status', 'published'),
    supabase.from('announcements').select('*', { count: 'exact', head: true }).eq('status', 'submitted'),
    supabase.from('organizations').select('*', { count: 'exact', head: true }),
    supabase.from('audit_log').select('action, target_type, created_at, users(display_name)').order('created_at', { ascending: false }).limit(6),
  ])

  const roleCounts = (users ?? []).reduce<Record<string, number>>((acc, u) => {
    const r = u.role as string
    acc[r] = (acc[r] ?? 0) + 1
    return acc
  }, {})

  const totalUsers = users?.length ?? 0
  const publishRate = totalAnnouncements ? Math.round(((publishedCount ?? 0) / totalAnnouncements) * 100) : 0

  const quickLinks = [
    { href: '/owner/analytics', label: 'Analytics', icon: BarChart3, desc: 'Full platform analytics and system metrics' },
    { href: '/owner/users', label: 'All Users', icon: Users, desc: 'Manage all roles including super admins' },
    { href: '/owner/categories', label: 'Categories', icon: Tag, desc: 'Create, edit, and force delete categories' },
    { href: '/owner/audit', label: 'Audit Log', icon: ScrollText, desc: 'System-wide action history' },
  ]

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="h-8 w-8 rounded-xl flex items-center justify-center" style={{ background: 'rgba(212,148,31,0.15)' }}>
          <Crown size={16} style={{ color: 'var(--color-gold)' }} />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-[var(--color-text-primary)] tracking-tight">System Overview</h1>
          <p className="text-[var(--color-text-secondary)] mt-0.5 text-sm">Full system visibility and control</p>
        </div>
      </div>

      {/* Bento grid */}
      <div className="grid grid-cols-12 gap-4">

        {/* Hero: Users by role */}
        <GlassCard hover={false} className="col-span-12 lg:col-span-7 p-6">
          <p className="text-xs uppercase tracking-widest text-[var(--color-text-muted)] mb-1">Total Users</p>
          <CountUp value={totalUsers} className="text-5xl font-bold font-mono text-[var(--color-text-primary)]" />
          <div className="mt-5 space-y-2.5">
            {[
              { role: 'super_admin', label: 'Super Admins', color: '#7C3AED' },
              { role: 'admin', label: 'Admins', color: 'var(--color-accent-inti)' },
              { role: 'publisher', label: 'Publishers', color: 'var(--color-text-muted)' },
            ].map(({ role, label, color }) => {
              const count = roleCounts[role] ?? 0
              const pct = totalUsers > 0 ? Math.round((count / totalUsers) * 100) : 0
              return (
                <div key={role}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full shrink-0" style={{ background: color }} />
                      <span className="text-xs text-[var(--color-text-secondary)]">{label}</span>
                    </div>
                    <span className="text-xs font-mono font-semibold text-[var(--color-text-primary)]">{count}</span>
                  </div>
                  <div className="h-1 rounded-full bg-[var(--color-surface-elevated)]">
                    <div className="h-1 rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: color }} />
                  </div>
                </div>
              )
            })}
          </div>
        </GlassCard>

        {/* Publish rate ring */}
        <GlassCard hover={false} className="col-span-6 lg:col-span-3 p-6 flex flex-col items-center justify-center gap-3">
          <div className="relative h-24 w-24">
            <svg viewBox="0 0 36 36" className="h-24 w-24 -rotate-90">
              <circle cx="18" cy="18" r="15.9" fill="none" stroke="var(--color-surface-elevated)" strokeWidth="2.5" />
              <circle
                cx="18" cy="18" r="15.9" fill="none"
                stroke="var(--color-accent-inti)" strokeWidth="2.5"
                strokeDasharray={`${publishRate} ${100 - publishRate}`}
                strokeDashoffset="0"
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xl font-bold font-mono text-[var(--color-text-primary)]">{publishRate}%</span>
            </div>
          </div>
          <p className="text-xs text-center uppercase tracking-widest text-[var(--color-text-muted)]">Publish Rate</p>
        </GlassCard>

        {/* Pending */}
        <GlassCard hover={false} className="col-span-6 lg:col-span-2 p-6 flex flex-col justify-center">
          <p className={`text-4xl font-bold font-mono`} style={{ color: pendingReview ? 'var(--color-gold)' : 'var(--color-text-primary)' }}>
            {pendingReview ?? 0}
          </p>
          <p className="text-xs uppercase tracking-widest text-[var(--color-text-muted)] mt-2">Pending Review</p>
        </GlassCard>

        {/* Stat row */}
        {[
          { label: 'Total Announcements', value: totalAnnouncements ?? 0 },
          { label: 'Published', value: publishedCount ?? 0 },
          { label: 'Organizations', value: totalOrgs ?? 0 },
        ].map(({ label, value }) => (
          <GlassCard key={label} hover={false} className="col-span-4 p-5">
            <CountUp value={value} className="text-3xl font-bold font-mono text-[var(--color-accent)]" />
            <p className="text-xs uppercase tracking-widest text-[var(--color-text-muted)] mt-1 leading-tight">{label}</p>
          </GlassCard>
        ))}

        {/* Recent audit log */}
        <GlassCard hover={false} className="col-span-12 lg:col-span-5 p-6">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-semibold text-[var(--color-text-primary)]">Recent Activity</p>
            <Link href="/owner/audit" className="text-xs text-[var(--color-accent)] hover:underline">View all</Link>
          </div>
          <div className="space-y-3">
            {(recentAudit ?? []).length === 0 ? (
              <p className="text-xs text-[var(--color-text-muted)]">No activity recorded yet.</p>
            ) : (recentAudit ?? []).map((entry, i) => {
              const actor = (entry as { users?: { display_name?: string } | null }).users?.display_name ?? 'System'
              return (
                <div key={i} className="flex items-start gap-3">
                  <div className="h-6 w-6 rounded-full bg-[var(--color-surface-elevated)] flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-[9px] font-bold text-[var(--color-text-secondary)]">{actor.charAt(0).toUpperCase()}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-[var(--color-text-primary)] truncate">{entry.action}</p>
                    <p className="text-[10px] text-[var(--color-text-muted)]">{actor} · {entry.target_type}</p>
                  </div>
                  <p className="text-[10px] font-mono text-[var(--color-text-muted)] shrink-0">
                    {new Date(entry.created_at).toLocaleDateString('en-MY', { day: 'numeric', month: 'short' })}
                  </p>
                </div>
              )
            })}
          </div>
        </GlassCard>

        {/* Quick links */}
        <div className="col-span-12 lg:col-span-7">
          <div className="grid grid-cols-2 gap-4 h-full">
            {quickLinks.map(({ href, label, icon: Icon, desc }) => (
              <Link key={href} href={href}>
                <GlassCard hover className="p-5 flex items-center gap-4 group h-full">
                  <div className="h-9 w-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(212,148,31,0.12)' }}>
                    <Icon size={16} style={{ color: 'var(--color-gold)' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[var(--color-text-primary)]">{label}</p>
                    <p className="text-xs text-[var(--color-text-muted)] mt-0.5 leading-tight">{desc}</p>
                  </div>
                  <ArrowRight size={13} className="text-[var(--color-text-muted)] group-hover:text-[var(--color-accent)] transition-colors shrink-0" />
                </GlassCard>
              </Link>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
