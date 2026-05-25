import Link from 'next/link'
import { ArrowRight, Clock3, Eye, FileText, Megaphone, Plus, Send } from 'lucide-react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { CountUp } from '@/components/dashboard/CountUp'
import { DashboardRecentRow } from '@/components/dashboard/DashboardRecentRow'
import { DashboardEmptyState } from '@/components/dashboard/DashboardEmptyState'
import { getCurrentAccessContext } from '@/lib/auth/authz'
import { shouldScopeAnnouncementsToMembership } from '@/lib/announcements/access'
import type { DashboardRecentAnnouncement } from '@/components/dashboard/DashboardRecentRow'

export const metadata = { title: 'Publisher Desk' }

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour >= 5 && hour <= 11) return 'Good morning'
  if (hour >= 12 && hour <= 17) return 'Good afternoon'
  return 'Good evening'
}

export default async function DashboardPage() {
  const access = await getCurrentAccessContext()
  if (!access) redirect('/login')

  const supabase = await createClient()

  let inDraft = 0
  let publishedThisMonth = 0
  let scheduled = 0
  let totalViews = 0
  let totalManaged = 0
  let recentAnnouncements: DashboardRecentAnnouncement[] = []
  const scopeToMembership = shouldScopeAnnouncementsToMembership(access)
  const hasAnnouncementScope = !scopeToMembership || access.orgIds.length > 0

  if (hasAnnouncementScope) {
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
    const nowIso = now.toISOString()

    const orgFilter = scopeToMembership ? access.orgIds : null

    let totalQ = supabase.from('announcements').select('*', { count: 'exact', head: true })
    let draftQ = supabase
      .from('announcements')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'draft')
    let publishedQ = supabase
      .from('announcements')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'published')
      .gte('published_at', startOfMonth)
      .or(`scheduled_publish_at.is.null,scheduled_publish_at.lte.${nowIso}`)
    let scheduledQ = supabase
      .from('announcements')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'published')
      .gt('scheduled_publish_at', nowIso)
    let viewsQ = supabase.from('announcements').select('view_count')
    let recentQ = supabase
      .from('announcements')
      .select('id, title, body, status, view_count, updated_at, categories(name)')
      .order('updated_at', { ascending: false })
      .limit(5)

    if (orgFilter) {
      totalQ = totalQ.in('organization_id', orgFilter)
      draftQ = draftQ.in('organization_id', orgFilter)
      publishedQ = publishedQ.in('organization_id', orgFilter)
      scheduledQ = scheduledQ.in('organization_id', orgFilter)
      viewsQ = viewsQ.in('organization_id', orgFilter)
      recentQ = recentQ.in('organization_id', orgFilter)
    }

    const [totalResult, draftResult, publishedResult, scheduledResult, viewsResult, recentResult] =
      await Promise.all([totalQ, draftQ, publishedQ, scheduledQ, viewsQ, recentQ])

    totalManaged = totalResult.count ?? 0
    inDraft = draftResult.count ?? 0
    publishedThisMonth = publishedResult.count ?? 0
    scheduled = scheduledResult.count ?? 0
    totalViews = (viewsResult.data ?? []).reduce((sum, row) => sum + (row.view_count ?? 0), 0)
    recentAnnouncements = (recentResult.data ?? []) as unknown as DashboardRecentAnnouncement[]
  }

  const greeting = getGreeting()
  const displayName = access.displayName
  const isInheritedWorkspace = access.role !== 'publisher'
  const todayLabel = new Date().toLocaleDateString('en-MY', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })

  const stats = [
    {
      label: 'Managed',
      value: totalManaged,
      description: 'Notices in your publishing workspace.',
      icon: FileText,
    },
    {
      label: 'Live this month',
      value: publishedThisMonth,
      description: 'Posts visible on the public board.',
      icon: Megaphone,
    },
    {
      label: 'Drafts',
      value: inDraft,
      description: 'Unsubmitted notices to finish.',
      icon: FileText,
    },
    {
      label: 'Scheduled',
      value: scheduled,
      description: 'Posts waiting for their publish time.',
      icon: Clock3,
    },
  ]

  return (
    <div className="dashboard-page publisher-dashboard-shell mx-auto w-full max-w-[92rem] px-4 py-5 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
      <div className="publisher-command-layout">
        <section className="dashboard-command-card publisher-overview-hero rounded-[1.75rem] p-5 sm:p-7 lg:p-8">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
            <div className="max-w-[60rem]">
              <p className="future-kicker">Publisher desk</p>
              <h1 className="font-display mt-5 max-w-[44rem] text-4xl leading-none font-extrabold text-balance text-[var(--color-text-primary)] sm:text-5xl lg:text-6xl">
                Publisher dashboard
              </h1>
              <p className="mt-5 max-w-[64ch] text-base leading-7 text-[var(--color-text-secondary)]">
                {greeting}, {displayName ?? 'Publisher'}.{' '}
                {isInheritedWorkspace
                  ? 'Use this overview for publishing work while keeping wider workspace tools separate.'
                  : 'Create notices, review recent work, and keep the public board current without extra noise.'}
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
              <Link
                href="/dashboard/announcements/new"
                className="action-lift inline-flex min-h-12 items-center justify-center gap-2 rounded-[1rem] bg-[var(--color-accent-inti)] px-5 text-sm font-bold text-[var(--color-surface)] shadow-[var(--shadow-button)]"
              >
                <Plus size={16} aria-hidden="true" />
                Start a new notice
              </Link>
              <Link
                href="/dashboard/announcements"
                className="action-lift inline-flex min-h-12 items-center justify-center gap-2 rounded-[1rem] border border-[var(--color-border)] bg-[color-mix(in_oklab,var(--color-surface)_74%,transparent)] px-5 text-sm font-bold text-[var(--color-text-primary)]"
              >
                Manage drafts
                <ArrowRight size={15} aria-hidden="true" />
              </Link>
            </div>
          </div>

          <div className="publisher-overview-note mt-6 flex flex-col gap-2 border-t border-[var(--color-border-subtle)] pt-5 text-sm text-[var(--color-text-secondary)] sm:flex-row sm:items-center sm:justify-between">
            <span>{todayLabel}</span>
            <span className="font-semibold text-[var(--color-text-primary)]">
              {hasAnnouncementScope ? 'Workspace ready' : 'Organization access needed'}
            </span>
          </div>
        </section>

        <section className="publisher-quiet-metrics" aria-label="Publisher workspace metrics">
          {stats.map(({ label, value, description, icon: Icon }) => (
            <article key={label} className="publisher-metric-item">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-mono text-[0.68rem] font-bold tracking-[0.14em] text-[var(--color-text-muted)] uppercase">
                    {label}
                  </p>
                  <CountUp
                    value={value}
                    className="mt-3 block font-mono text-4xl font-bold text-[var(--color-text-primary)]"
                  />
                </div>
                <Icon size={18} className="text-[var(--color-accent)]" aria-hidden="true" />
              </div>
              <p className="mt-3 text-sm leading-6 text-[var(--color-text-secondary)]">
                {description}
              </p>
            </article>
          ))}
        </section>

        <section className="publisher-workspace-board">
          <section
            className="dashboard-command-card rounded-[1.75rem] p-5 sm:p-6"
            aria-labelledby="publisher-recent-heading"
          >
            <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="future-kicker">Recent work</p>
                <h2
                  id="publisher-recent-heading"
                  className="font-display mt-2 text-2xl leading-tight font-extrabold text-[var(--color-text-primary)]"
                >
                  Recently updated
                </h2>
                <p className="mt-2 max-w-[62ch] text-sm leading-6 text-[var(--color-text-muted)]">
                  Open the posts most likely to need cleanup, review, or updated dates.
                </p>
              </div>
              <Link
                href="/dashboard/announcements"
                className="action-lift inline-flex min-h-11 items-center justify-center gap-1.5 rounded-[0.9rem] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm font-semibold text-[var(--color-accent)] transition-colors hover:bg-[var(--color-accent-surface)]"
              >
                View all
                <ArrowRight size={14} aria-hidden="true" />
              </Link>
            </div>
            {recentAnnouncements.length === 0 ? (
              <DashboardEmptyState hasAnnouncementScope={hasAnnouncementScope} />
            ) : (
              <div className="publisher-recent-list">
                {recentAnnouncements.map((announcement) => (
                  <DashboardRecentRow key={announcement.id} announcement={announcement} />
                ))}
              </div>
            )}
          </section>

          <aside className="dashboard-command-card publisher-next-actions rounded-[1.75rem] p-5 sm:p-6">
            <p className="future-kicker">Next actions</p>
            <h2 className="font-display mt-3 text-2xl leading-tight font-extrabold text-[var(--color-text-primary)]">
              Keep work moving
            </h2>
            <p className="mt-3 text-sm leading-6 text-[var(--color-text-secondary)]">
              Use this panel for the few actions that belong on the overview. Writing checks now
              live inside the announcement editor.
            </p>

            <div className="publisher-action-stack mt-6">
              <Link
                href="/dashboard/announcements/new"
                className="action-lift inline-flex min-h-11 items-center justify-center gap-2 rounded-[0.95rem] bg-[var(--color-accent-inti)] px-4 text-sm font-bold text-[var(--color-surface)] shadow-[var(--shadow-button)]"
              >
                Create announcement
                <ArrowRight size={14} aria-hidden="true" />
              </Link>
              <Link
                href="/dashboard/announcements"
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[0.95rem] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 text-sm font-bold text-[var(--color-text-primary)] transition-colors hover:bg-[var(--color-surface-elevated)]"
              >
                Open all notices
                <FileText size={14} aria-hidden="true" />
              </Link>
              <Link
                href="/"
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[0.95rem] bg-[var(--color-text-primary)] px-4 text-sm font-bold text-[var(--color-canvas)] transition-transform duration-200 hover:-translate-y-px active:scale-[0.98]"
              >
                Review public board
                <Send size={14} aria-hidden="true" />
              </Link>
            </div>

            <div className="mt-6 rounded-[1.1rem] border border-[var(--color-border-subtle)] bg-[color-mix(in_oklab,var(--color-canvas)_68%,transparent)] p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-mono text-[0.68rem] font-bold tracking-[0.14em] text-[var(--color-text-muted)] uppercase">
                    Total views
                  </p>
                  <CountUp
                    value={totalViews}
                    className="mt-2 block font-mono text-3xl font-bold text-[var(--color-text-primary)]"
                  />
                </div>
                <Eye size={18} className="text-[var(--color-accent)]" aria-hidden="true" />
              </div>
              <p className="mt-2 text-xs leading-5 text-[var(--color-text-muted)]">
                Reads recorded across the notices you can manage.
              </p>
            </div>
          </aside>
        </section>
      </div>
    </div>
  )
}
