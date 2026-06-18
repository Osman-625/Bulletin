import {
  Activity,
  BarChart3,
  ClipboardList,
  Crown,
  LayoutDashboard,
  Megaphone,
  Server,
  Shield,
  Users,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import Link from 'next/link'
import {
  DashboardBoardHeader,
  DashboardBoardMetrics,
  DashboardBoardPage,
} from '@/components/dashboard/DashboardBoard'
import { getOwnerResourceOverview } from '@/modules/owner/resources'
import { createServiceClient } from '@/infrastructure/database/server'
import { requireUsableAccessContext } from '@/modules/auth/authz'

export const metadata = { title: 'Owner Board' }

const OWNER_WORKSPACE_LINKS: Array<{
  href: string
  label: string
  desc: string
  icon: LucideIcon
  wide?: boolean
}> = [
  {
    href: '/owner/resources',
    label: 'Resources',
    desc: 'Storage, counters, and external service health',
    icon: Server,
    wide: true,
  },
  {
    href: '/owner/users',
    label: 'Users',
    desc: 'Manage every platform role',
    icon: Users,
  },
  {
    href: '/owner/audit',
    label: 'Audit',
    desc: 'System-wide action history',
    icon: Shield,
  },
  {
    href: '/super-admin',
    label: 'Super board',
    desc: 'Platform roles, categories, and user support',
    icon: Crown,
  },
  {
    href: '/admin',
    label: 'Admin board',
    desc: 'Review queues, organizations, and publishers',
    icon: ClipboardList,
  },
  {
    href: '/dashboard',
    label: 'Publisher board',
    desc: 'Create and manage announcements',
    icon: LayoutDashboard,
  },
]

function WorkspaceCard({
  href,
  label,
  desc,
  icon: Icon,
  wide,
}: {
  href: string
  label: string
  desc: string
  icon: LucideIcon
  wide?: boolean
}) {
  return (
    <Link
      href={href}
      className={`group relative overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--color-accent-inti)]/40 hover:shadow-md${wide ? 'md:col-span-2' : ''}`}
    >
      <div className="mb-4 flex items-center justify-between">
        <div className="flex size-10 items-center justify-center rounded-xl bg-[var(--color-surface-elevated)] text-[var(--color-accent-inti)] transition-colors group-hover:bg-[var(--color-accent-inti)]/10">
          <Icon size={18} strokeWidth={1.8} aria-hidden="true" />
        </div>
        <span className="text-xs text-[var(--color-text-muted)] opacity-0 transition-opacity group-hover:opacity-100">
          Open →
        </span>
      </div>
      <p className="text-sm font-semibold text-[var(--color-text-primary)]">{label}</p>
      <p className="mt-1 text-xs leading-5 text-[var(--color-text-muted)]">{desc}</p>
    </Link>
  )
}

const STATUS_STYLES: Record<string, string> = {
  published: 'bg-[var(--color-status-published-bg)] text-[var(--color-status-published-text)]',
  submitted: 'bg-[var(--color-status-submitted-bg)] text-[var(--color-status-submitted-text)]',
  draft: 'bg-[var(--color-surface-elevated)] text-[var(--color-text-muted)]',
  review: 'bg-[var(--color-status-submitted-bg)] text-[var(--color-status-submitted-text)]',
  clear: 'bg-[var(--color-status-published-bg)] text-[var(--color-status-published-text)]',
  ready: 'bg-[var(--color-status-published-bg)] text-[var(--color-status-published-text)]',
  'not configured': 'bg-[var(--color-surface-elevated)] text-[var(--color-text-muted)]',
}

function AttentionCard({
  href,
  title,
  meta,
  status,
  tone,
}: {
  href: string
  title: string
  meta: string
  status: string
  tone: string
}) {
  const badgeClass =
    STATUS_STYLES[status] ??
    STATUS_STYLES[tone] ??
    'bg-[var(--color-surface-elevated)] text-[var(--color-text-muted)]'

  return (
    <Link
      href={href}
      className="group flex items-center gap-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-4 transition-all hover:-translate-y-0.5 hover:border-[var(--color-border)]/80 hover:shadow-sm"
    >
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-[var(--color-text-primary)]">{title}</p>
        <p className="mt-0.5 text-xs leading-5 text-[var(--color-text-muted)]">{meta}</p>
      </div>
      <span
        className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-bold tracking-[0.08em] uppercase ${badgeClass}`}
      >
        {status}
      </span>
    </Link>
  )
}

export default async function OwnerPage() {
  await requireUsableAccessContext()
  const supabase = await createServiceClient()

  const [
    { data: users },
    { count: totalAnnouncements },
    { count: publishedCount },
    { count: pendingReview },
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
    getOwnerResourceOverview(supabase),
  ])

  const totalUsers = users?.length ?? 0
  const attentionRows = [
    {
      href: '/owner/resources',
      title: overview.external.vercel.name,
      meta: overview.external.vercel.summary,
      status: overview.external.vercel.status.replace('_', ' '),
      tone: overview.external.vercel.status === 'ready' ? 'published' : 'draft',
    },
    {
      href: '/owner/resources',
      title: overview.external.supabase.name,
      meta: overview.external.supabase.summary,
      status: overview.external.supabase.status.replace('_', ' '),
      tone: overview.external.supabase.status === 'ready' ? 'published' : 'draft',
    },
    {
      href: '/admin/review',
      title: 'Review pressure',
      meta: `${pendingReview ?? 0} announcements waiting`,
      status: pendingReview ? 'review' : 'clear',
      tone: pendingReview ? 'submitted' : 'published',
    },
  ]

  return (
    <DashboardBoardPage>
      <DashboardBoardHeader
        kicker="Owner board"
        title="Owner board"
        description="System ownership, cross-role access, service health, and audit awareness."
        action={{ href: '/owner/resources', label: 'Open resources', icon: Activity }}
      />

      <DashboardBoardMetrics
        metrics={[
          {
            label: 'Users',
            value: totalUsers,
            caption: 'all roles',
            icon: Users,
            href: '/owner/users',
            tone: 'accent',
          },
          {
            label: 'Pending review',
            value: pendingReview ?? 0,
            caption: 'across platform',
            icon: ClipboardList,
            href: '/admin/review',
          },
          {
            label: 'Announcements',
            value: totalAnnouncements ?? 0,
            caption: `${publishedCount ?? 0} published`,
            icon: Megaphone,
            href: '/owner/analytics',
          },
          {
            label: 'Views',
            value: overview.totalViews,
            caption: 'tracked visits',
            icon: BarChart3,
            href: '/owner/resources',
            tone: 'gold',
          },
        ]}
      />

      <section>
        <h2 className="mb-3 text-xs font-semibold tracking-[0.14em] text-[var(--color-text-muted)] uppercase">
          Workspaces
        </h2>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {OWNER_WORKSPACE_LINKS.map((link) => (
            <WorkspaceCard key={link.href} {...link} />
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-xs font-semibold tracking-[0.14em] text-[var(--color-text-muted)] uppercase">
          Needs attention
        </h2>
        <div className="grid gap-2 md:grid-cols-3">
          {attentionRows.map((row) => (
            <AttentionCard key={row.title} {...row} />
          ))}
        </div>
      </section>
    </DashboardBoardPage>
  )
}
