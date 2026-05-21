import type { LucideIcon } from 'lucide-react'
import {
  Activity,
  ArrowRight,
  BarChart3,
  ClipboardList,
  Crown,
  Database,
  Eye,
  HardDrive,
  Link2,
  Megaphone,
  ScrollText,
  Server,
  ShieldCheck,
  Tag,
  Users,
} from 'lucide-react'
import Link from 'next/link'
import { GlassCard } from '@/components/dashboard/GlassCard'
import { CountUp } from '@/components/dashboard/CountUp'
import { createServiceClient } from '@/lib/supabase/server'
import {
  type ExternalResourceCard,
  type OwnerResourceOverview,
  getOwnerResourceOverview,
} from '@/lib/owner/resources'

export const metadata = { title: 'System — Bulletin Owner' }

const resourceStatusStyles: Record<ExternalResourceCard['status'], string> = {
  ready: 'bg-[var(--color-status-published-bg)] text-[var(--color-status-published-text)]',
  attention: 'bg-[rgba(212,148,31,0.12)] text-[var(--color-gold)]',
  not_configured: 'bg-[var(--color-status-submitted-bg)] text-[var(--color-status-submitted-text)]',
  error: 'bg-[var(--color-status-rejected-bg)] text-[var(--color-status-rejected-text)]',
}

export default async function OwnerPage() {
  const supabase = await createServiceClient()

  const [
    { data: users },
    { count: totalAnnouncements },
    { count: publishedCount },
    { count: pendingReview },
    { count: totalOrgs },
    { data: recentAudit },
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
    supabase.from('organizations').select('*', { count: 'exact', head: true }),
    supabase
      .from('audit_log')
      .select('action, target_type, created_at, users(display_name)')
      .order('created_at', { ascending: false })
      .limit(6),
    getOwnerResourceOverview(supabase),
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
      desc: 'Detailed role, status, organization, and category breakdowns',
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
    <div className="dashboard-page mx-auto w-full max-w-7xl space-y-8 px-4 py-6 sm:px-6 sm:py-8">
      <header className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
        <div className="flex items-start gap-3">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
            style={{ background: 'rgba(212,148,31,0.15)' }}
          >
            <Crown size={18} style={{ color: 'var(--color-gold)' }} aria-hidden="true" />
          </div>
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-[var(--color-accent-surface)] px-3 py-1 text-xs font-semibold tracking-[0.14em] text-[var(--color-accent-inti)] uppercase">
              Owner command center
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-[var(--color-text-primary)]">
              System Overview
            </h1>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-[var(--color-text-secondary)]">
              Full system visibility across users, publishing activity, view counters, resource
              health, storage, and audit activity.
            </p>
          </div>
        </div>
        <Link
          href="/owner/resources"
          className="inline-flex min-h-11 w-fit items-center gap-2 rounded-xl border border-[var(--color-border)] px-4 text-sm font-semibold text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text-primary)]"
        >
          Open resources
          <ArrowRight size={14} aria-hidden="true" />
        </Link>
      </header>

      <section className="grid grid-cols-12 gap-4">
        <GlassCard hover={false} className="col-span-12 p-6 xl:col-span-5">
          <p className="mb-1 text-xs tracking-widest text-[var(--color-text-muted)] uppercase">
            Total Users
          </p>
          <CountUp
            value={totalUsers}
            className="font-mono text-5xl font-bold text-[var(--color-text-primary)]"
          />
          <div className="mt-5 space-y-2.5">
            {[
              { role: 'owner', label: 'Owners', color: 'var(--color-gold)' },
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
                        aria-hidden="true"
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

        <GlassCard
          hover={false}
          className="col-span-12 flex flex-col items-center justify-center gap-3 p-6 sm:col-span-6 lg:col-span-3 xl:col-span-2"
        >
          <div className="relative h-24 w-24">
            <svg viewBox="0 0 36 36" className="h-24 w-24 -rotate-90" aria-hidden="true">
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

        <MetricTile
          icon={ClipboardList}
          label="Pending Review"
          value={pendingReview ?? 0}
          helper="Announcements waiting on review"
          tone={pendingReview ? 'warn' : 'accent'}
          className="col-span-12 sm:col-span-6 lg:col-span-3 xl:col-span-2"
        />
        <MetricTile
          icon={Megaphone}
          label="Total Announcements"
          value={totalAnnouncements ?? 0}
          helper={`${(publishedCount ?? 0).toLocaleString('en-MY')} published`}
          className="col-span-12 sm:col-span-4 xl:col-span-3"
        />
        <MetricTile
          icon={Users}
          label="Organizations"
          value={totalOrgs ?? 0}
          helper="Approved, pending, and archived org records"
          className="col-span-12 sm:col-span-4 xl:col-span-3"
        />
        <MetricTile
          icon={Eye}
          label="Total Views"
          value={overview.totalViews}
          helper="All tracked announcement detail views"
          className="col-span-12 sm:col-span-4 xl:col-span-2"
        />
        <MetricTile
          icon={Activity}
          label="Published Views"
          value={overview.publishedViews}
          helper={`${overview.averageViews.toLocaleString('en-MY')} average views per published post`}
          className="col-span-12 sm:col-span-4 xl:col-span-2"
        />
        <MetricTile
          icon={BarChart3}
          label="Average Views"
          value={overview.averageViews}
          helper="Mean views across published posts"
          className="col-span-12 sm:col-span-4 xl:col-span-2"
        />
        <MetricTile
          icon={Link2}
          label="Registration Links"
          value={overview.postsWithRegistration}
          helper="Announcements with registration URLs"
          className="col-span-12 sm:col-span-4 xl:col-span-2"
        />
        <MetricTile
          icon={HardDrive}
          label="Banner Storage"
          value={overview.bannerFiles}
          helper={`${formatBytes(overview.bannerStorageBytes)} in banner-images`}
          tone={overview.bannerStorageStatus === 'ready' ? 'accent' : 'warn'}
          className="col-span-12 sm:col-span-4 xl:col-span-2"
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <SystemHealthCard icon={Server} resource={overview.external.vercel} />
        <SystemHealthCard icon={Database} resource={overview.external.supabase} />
      </section>

      <section className="grid gap-8 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <TopViewedAnnouncements overview={overview} />
        <RecentActivityPanel recentAudit={recentAudit ?? []} />
      </section>

      <section className="grid gap-8 lg:grid-cols-2">
        <DistributionPanel
          title="Views by Category"
          rows={overview.viewsByCategory.map((row) => ({
            name: row.name,
            value: row.views,
            color: row.color,
          }))}
        />
        <DistributionPanel
          title="Views by Organization"
          rows={overview.viewsByOrganization.map((row) => ({
            name: row.name,
            value: row.views,
          }))}
        />
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
              Owner Workspaces
            </h2>
            <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
              Jump into the operational surfaces you manage most often.
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {quickLinks.map(({ href, label, icon: Icon, desc }) => (
            <Link key={href} href={href} className="block h-full">
              <GlassCard hover className="group flex h-full items-center gap-4 p-5">
                <div
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                  style={{ background: 'rgba(212,148,31,0.12)' }}
                >
                  <Icon size={16} style={{ color: 'var(--color-gold)' }} aria-hidden="true" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-[var(--color-text-primary)]">{label}</p>
                  <p className="mt-0.5 text-xs leading-tight text-[var(--color-text-muted)]">
                    {desc}
                  </p>
                </div>
                <ArrowRight
                  size={13}
                  className="shrink-0 text-[var(--color-text-muted)] transition-colors group-hover:text-[var(--color-accent)]"
                  aria-hidden="true"
                />
              </GlassCard>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}

function MetricTile({
  icon: Icon,
  label,
  value,
  helper,
  tone = 'accent',
  className = '',
}: {
  icon: LucideIcon
  label: string
  value: number
  helper: string
  tone?: 'accent' | 'warn'
  className?: string
}) {
  return (
    <GlassCard hover={false} className={`${className} p-5`}>
      <div className="mb-4 flex items-center justify-between gap-4">
        <p className="text-xs font-semibold tracking-[0.16em] text-[var(--color-text-muted)] uppercase">
          {label}
        </p>
        <span
          className={
            tone === 'warn' ? 'text-[var(--color-gold)]' : 'text-[var(--color-accent-inti)]'
          }
        >
          <Icon size={17} aria-hidden="true" />
        </span>
      </div>
      <CountUp
        value={value}
        className="font-mono text-3xl font-bold text-[var(--color-text-primary)]"
      />
      <p className="mt-2 text-xs leading-5 text-[var(--color-text-muted)]">{helper}</p>
    </GlassCard>
  )
}

function SystemHealthCard({
  icon: Icon,
  resource,
}: {
  icon: LucideIcon
  resource: ExternalResourceCard
}) {
  return (
    <GlassCard hover={false} className="p-5">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--color-surface-elevated)] text-[var(--color-accent-inti)]">
            <Icon size={18} aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold tracking-[0.16em] text-[var(--color-text-muted)] uppercase">
              System Health
            </p>
            <h2 className="mt-1 text-base font-semibold text-[var(--color-text-primary)]">
              {resource.name}
            </h2>
            <p className="mt-1 line-clamp-2 text-xs leading-5 text-[var(--color-text-muted)]">
              {resource.summary}
            </p>
          </div>
        </div>
        <span
          className={`shrink-0 rounded-md px-2.5 py-1 text-xs font-bold tracking-[0.08em] uppercase ${resourceStatusStyles[resource.status]}`}
        >
          {resource.status.replace('_', ' ')}
        </span>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {resource.metrics.slice(0, 4).map((metric) => (
          <div
            key={`${resource.name}-${metric.label}`}
            className="rounded-xl bg-[var(--color-surface-elevated)] px-3 py-3"
          >
            <p className="text-[11px] font-semibold tracking-[0.14em] text-[var(--color-text-muted)] uppercase">
              {metric.label}
            </p>
            <p className="mt-1 truncate text-sm font-semibold text-[var(--color-text-primary)]">
              {metric.value}
            </p>
          </div>
        ))}
      </div>
    </GlassCard>
  )
}

function TopViewedAnnouncements({ overview }: { overview: OwnerResourceOverview }) {
  return (
    <section>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
          Top Viewed Announcements
        </h2>
        <Link
          href="/owner/resources"
          className="text-xs text-[var(--color-accent)] hover:underline"
        >
          Full view report
        </Link>
      </div>
      <div className="space-y-2">
        {overview.topAnnouncements.length === 0 ? (
          <GlassCard hover={false} className="p-6">
            <div role="status" className="text-sm">
              <p className="font-semibold text-[var(--color-text-primary)]">
                No tracked announcement views yet
              </p>
              <p className="mt-1 text-[var(--color-text-secondary)]">
                Announcement rankings will appear after public detail pages receive visits.
              </p>
            </div>
          </GlassCard>
        ) : (
          overview.topAnnouncements.slice(0, 6).map((announcement, index) => (
            <GlassCard
              key={announcement.id}
              hover={false}
              className="flex items-center gap-4 px-4 py-3"
            >
              <span className="w-6 shrink-0 font-mono text-sm text-[var(--color-text-muted)]">
                {index + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-[var(--color-text-primary)]">
                  {announcement.title}
                </p>
                <p className="mt-1 truncate text-xs text-[var(--color-text-muted)]">
                  {announcement.organizations?.name ?? 'Unknown organization'}
                  {announcement.categories?.name ? ` · ${announcement.categories.name}` : ''}
                </p>
              </div>
              <div className="text-right">
                <p className="font-mono text-sm font-bold text-[var(--color-text-primary)]">
                  {(announcement.view_count ?? 0).toLocaleString('en-MY')}
                </p>
                <p className="text-xs text-[var(--color-text-muted)]">views</p>
              </div>
            </GlassCard>
          ))
        )}
      </div>
    </section>
  )
}

function RecentActivityPanel({
  recentAudit,
}: {
  recentAudit: Array<{
    action: string
    target_type: string
    created_at: string
    users: unknown
  }>
}) {
  return (
    <section>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Recent Activity</h2>
        <Link href="/owner/audit" className="text-xs text-[var(--color-accent)] hover:underline">
          View all
        </Link>
      </div>
      <GlassCard hover={false} className="p-5">
        <div className="space-y-3">
          {recentAudit.length === 0 ? (
            <div
              role="status"
              className="rounded-xl bg-[var(--color-surface-elevated)] px-4 py-5 text-sm"
            >
              <p className="font-semibold text-[var(--color-text-primary)]">
                No audit activity yet
              </p>
              <p className="mt-1 text-[var(--color-text-secondary)]">
                Create, review, and account changes will appear here when they are recorded.
              </p>
            </div>
          ) : (
            recentAudit.map((entry, i) => {
              const actor =
                (entry as { users?: { display_name?: string } | null }).users?.display_name ??
                'System'
              return (
                <div
                  key={`${entry.action}-${entry.created_at}-${i}`}
                  className="flex items-start gap-3"
                >
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
    </section>
  )
}

function DistributionPanel({
  title,
  rows,
}: {
  title: string
  rows: Array<{ name: string; value: number; color?: string }>
}) {
  const max = Math.max(...rows.map((row) => row.value), 1)

  return (
    <section>
      <h2 className="mb-4 text-lg font-semibold text-[var(--color-text-primary)]">{title}</h2>
      <GlassCard hover={false} className="p-5">
        {rows.length === 0 ? (
          <div role="status" className="text-sm">
            <p className="font-semibold text-[var(--color-text-primary)]">
              No view distribution yet
            </p>
            <p className="mt-1 text-[var(--color-text-secondary)]">
              View distribution will appear after announcements receive tracked visits.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {rows.slice(0, 6).map((row) => (
              <div key={row.name}>
                <div className="mb-1.5 flex items-center justify-between gap-4">
                  <div className="flex min-w-0 items-center gap-2">
                    {row.color && (
                      <span
                        className="h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{ background: row.color }}
                        aria-hidden="true"
                      />
                    )}
                    <p className="truncate text-sm font-medium text-[var(--color-text-primary)]">
                      {row.name}
                    </p>
                  </div>
                  <p className="font-mono text-sm font-semibold text-[var(--color-text-primary)]">
                    {row.value.toLocaleString('en-MY')}
                  </p>
                </div>
                <div className="h-1.5 rounded-full bg-[var(--color-surface-elevated)]">
                  <div
                    className="h-1.5 rounded-full bg-[var(--color-accent-inti)]"
                    style={{ width: `${Math.round((row.value / max) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </GlassCard>
    </section>
  )
}

function formatBytes(bytes: number) {
  if (bytes <= 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  return `${(bytes / 1024 ** index).toFixed(index === 0 ? 0 : 1)} ${units[index]}`
}
