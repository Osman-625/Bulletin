import {
  Activity,
  ArrowRight,
  BarChart3,
  ClipboardList,
  Crown,
  Megaphone,
  ScrollText,
  ShieldCheck,
  Tag,
  Users,
} from 'lucide-react'
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
    supabase
      .from('announcements')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'published'),
    supabase
      .from('announcements')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'submitted'),
    supabase.from('organizations').select('*', { count: 'exact', head: true }),
    supabase
      .from('audit_log')
      .select('action, target_type, created_at, users(display_name)')
      .order('created_at', { ascending: false })
      .limit(6),
  ])

  const roleCounts = (users ?? []).reduce<Record<string, number>>((acc, u) => {
    const r = u.role as string
    acc[r] = (acc[r] ?? 0) + 1
    return acc
  }, {})

  const totalUsers = users?.length ?? 0
  const publishRate = totalAnnouncements
    ? Math.round(((publishedCount ?? 0) / totalAnnouncements) * 100)
    : 0

  const quickLinks = [
    {
      href: '/super-admin',
      label: 'Super Admin Workspace',
      icon: ShieldCheck,
      desc: 'Manage users, admins, and platform-level settings.',
    },
    {
      href: '/admin',
      label: 'Admin Workspace',
      icon: ClipboardList,
      desc: 'Review queues, organizations, publishers, and reports',
    },
    {
      href: '/dashboard',
      label: 'Publisher Workspace',
      icon: Megaphone,
      desc: 'Create and manage announcement content',
    },
    {
      href: '/owner/analytics',
      label: 'Analytics',
      icon: BarChart3,
      desc: 'Full platform analytics and system metrics',
    },
    {
      href: '/owner/resources',
      label: 'Resources',
      icon: Activity,
      desc: 'Monitor server health, storage usage, and view counters.',
    },
    {
      href: '/owner/users',
      label: 'All Users',
      icon: Users,
      desc: 'Manage all roles including super admins',
    },
    {
      href: '/owner/categories',
      label: 'Categories',
      icon: Tag,
      desc: 'Create, edit, and remove categories.',
    },
    {
      href: '/owner/audit',
      label: 'Audit Log',
      icon: ScrollText,
      desc: 'System-wide action history',
    },
  ]

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-6 py-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div
          className="flex h-8 w-8 items-center justify-center rounded-xl"
          style={{ background: 'rgba(212,148,31,0.15)' }}
        >
          <Crown size={16} style={{ color: 'var(--color-gold)' }} />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[var(--color-text-primary)]">
            System Overview
          </h1>
          <p className="mt-0.5 text-sm text-[var(--color-text-secondary)]">
            Full system visibility and control
          </p>
        </div>
      </div>

      {/* Bento grid */}
      <div className="grid grid-cols-12 gap-4">
        {/* Hero: Users by role */}
        <GlassCard hover={false} className="col-span-12 p-6 lg:col-span-7">
          <p className="mb-1 text-xs tracking-widest text-[var(--color-text-muted)] uppercase">
            Total Users
          </p>
          <CountUp
            value={totalUsers}
            className="font-mono text-5xl font-bold text-[var(--color-text-primary)]"
          />
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
                  <div className="mb-1 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className="h-2 w-2 shrink-0 rounded-full"
                        style={{ background: color }}
                      />
                      <span className="text-xs text-[var(--color-text-secondary)]">{label}</span>
                    </div>
                    <span className="font-mono text-xs font-semibold text-[var(--color-text-primary)]">
                      {count}
                    </span>
                  </div>
                  <div className="h-1 rounded-full bg-[var(--color-surface-elevated)]">
                    <div
                      className="h-1 rounded-full transition-all duration-700"
                      style={{ width: `${pct}%`, background: color }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </GlassCard>

        {/* Publish rate ring */}
        <GlassCard
          hover={false}
          className="col-span-12 flex flex-col items-center justify-center gap-3 p-6 sm:col-span-6 lg:col-span-3"
        >
          <div className="relative h-24 w-24">
            <svg viewBox="0 0 36 36" className="h-24 w-24 -rotate-90">
              <circle
                cx="18"
                cy="18"
                r="15.9"
                fill="none"
                stroke="var(--color-surface-elevated)"
                strokeWidth="2.5"
              />
              <circle
                cx="18"
                cy="18"
                r="15.9"
                fill="none"
                stroke="var(--color-accent-inti)"
                strokeWidth="2.5"
                strokeDasharray={`${publishRate} ${100 - publishRate}`}
                strokeDashoffset="0"
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="font-mono text-xl font-bold text-[var(--color-text-primary)]">
                {publishRate}%
              </span>
            </div>
          </div>
          <p className="text-center text-xs tracking-widest text-[var(--color-text-muted)] uppercase">
            Publish Rate
          </p>
        </GlassCard>

        {/* Pending */}
        <GlassCard
          hover={false}
          className="col-span-12 flex flex-col justify-center p-6 sm:col-span-6 lg:col-span-2"
        >
          <p
            className={`font-mono text-4xl font-bold`}
            style={{ color: pendingReview ? 'var(--color-gold)' : 'var(--color-text-primary)' }}
          >
            {pendingReview ?? 0}
          </p>
          <p className="mt-2 text-xs tracking-widest text-[var(--color-text-muted)] uppercase">
            Pending Review
          </p>
        </GlassCard>

        {/* Stat row */}
        {[
          { label: 'Total Announcements', value: totalAnnouncements ?? 0 },
          { label: 'Published', value: publishedCount ?? 0 },
          { label: 'Organizations', value: totalOrgs ?? 0 },
        ].map(({ label, value }) => (
          <GlassCard key={label} hover={false} className="col-span-12 p-5 sm:col-span-4">
            <CountUp
              value={value}
              className="font-mono text-3xl font-bold text-[var(--color-accent)]"
            />
            <p className="mt-1 text-xs leading-tight tracking-widest text-[var(--color-text-muted)] uppercase">
              {label}
            </p>
          </GlassCard>
        ))}

        {/* Recent audit log */}
        <GlassCard hover={false} className="col-span-12 p-6 lg:col-span-5">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm font-semibold text-[var(--color-text-primary)]">
              Recent Activity
            </p>
            <Link
              href="/owner/audit"
              className="text-xs text-[var(--color-accent)] hover:underline"
            >
              View all
            </Link>
          </div>
          <div className="space-y-3">
            {(recentAudit ?? []).length === 0 ? (
              <div
                role="status"
                className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-5 text-sm"
              >
                <p className="font-semibold text-[var(--color-text-primary)]">
                  No audit activity yet
                </p>
                <p className="mt-1 text-[var(--color-text-secondary)]">
                  Create, review, and account changes will appear here when they are recorded.
                </p>
              </div>
            ) : (
              (recentAudit ?? []).map((entry, i) => {
                const actor =
                  (entry as { users?: { display_name?: string } | null }).users?.display_name ??
                  'System'
                return (
                  <div key={i} className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--color-surface-elevated)]">
                      <span className="text-[13.5px] font-bold text-[var(--color-text-secondary)]">
                        {actor.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs text-[var(--color-text-primary)]">
                        {entry.action}
                      </p>
                      <p className="text-[15px] text-[var(--color-text-muted)]">
                        {actor} · {entry.target_type}
                      </p>
                    </div>
                    <p className="shrink-0 font-mono text-[15px] text-[var(--color-text-muted)]">
                      {new Date(entry.created_at).toLocaleDateString('en-MY', {
                        day: 'numeric',
                        month: 'short',
                      })}
                    </p>
                  </div>
                )
              })
            )}
          </div>
        </GlassCard>

        {/* Quick links */}
        <div className="col-span-12 lg:col-span-7">
          <div className="grid h-full grid-cols-1 gap-4 sm:grid-cols-2">
            {quickLinks.map(({ href, label, icon: Icon, desc }) => (
              <Link key={href} href={href} className="block h-full">
                <GlassCard hover className="group flex h-full items-center gap-4 p-5">
                  <div
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                    style={{ background: 'rgba(212,148,31,0.12)' }}
                  >
                    <Icon size={16} style={{ color: 'var(--color-gold)' }} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-[var(--color-text-primary)]">
                      {label}
                    </p>
                    <p className="mt-0.5 text-xs leading-tight text-[var(--color-text-muted)]">
                      {desc}
                    </p>
                  </div>
                  <ArrowRight
                    size={13}
                    className="shrink-0 text-[var(--color-text-muted)] transition-colors group-hover:text-[var(--color-accent)]"
                  />
                </GlassCard>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
