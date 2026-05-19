import Link from 'next/link'
import { ArrowRight, CalendarDays, Eye, FileText, Plus, Send, Timer } from 'lucide-react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { StatusBadge } from '@/components/dashboard/StatusBadge'
import { CountUp } from '@/components/dashboard/CountUp'
import { getCurrentAccessContext } from '@/lib/auth/authz'
import { shouldScopeAnnouncementsToMembership } from '@/lib/announcements/access'

export const metadata = { title: 'Publisher Desk' }

type RecentAnnouncement = {
  id: string
  title: string
  status: string
  view_count: number
  updated_at: string
  categories: { name: string } | null
}

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour >= 5 && hour <= 11) return 'Good morning'
  if (hour >= 12 && hour <= 17) return 'Good afternoon'
  return 'Good evening'
}

function RecentRow({ announcement }: { announcement: RecentAnnouncement }) {
  return (
    <Link
      href={`/dashboard/announcements/${announcement.id}/edit`}
      className="group block rounded-[1rem] border border-[var(--color-border)] bg-[color-mix(in_oklab,var(--color-surface)_84%,transparent)] p-4 transition-[transform,background,border-color,box-shadow] duration-200 ease-[var(--ease-ui)] hover:-translate-y-0.5 hover:border-[color-mix(in_oklab,var(--color-accent-inti)_26%,var(--color-border))] hover:bg-[var(--color-surface)] hover:shadow-[var(--shadow-soft)] active:scale-[0.99]"
    >
      <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <StatusBadge
              status={
                announcement.status as
                  | 'draft'
                  | 'submitted'
                  | 'published'
                  | 'rejected'
                  | 'expired'
                  | 'archived'
              }
            />
            <span className="font-mono text-[0.7rem] font-semibold tracking-[0.12em] text-[var(--color-text-muted)] uppercase">
              {announcement.categories?.name ?? 'Uncategorized'}
            </span>
          </div>
          <p className="truncate text-base font-semibold text-[var(--color-text-primary)]">
            {announcement.title}
          </p>
        </div>
        <div className="flex items-center justify-between gap-5 sm:justify-end">
          <div className="text-left sm:text-right">
            <p className="font-mono text-xs text-[var(--color-text-muted)]">
              {new Date(announcement.updated_at).toLocaleDateString('en-MY', {
                day: 'numeric',
                month: 'short',
              })}
            </p>
            <p className="mt-1 inline-flex items-center gap-1 text-xs text-[var(--color-text-muted)]">
              <Eye size={12} aria-hidden="true" />
              {announcement.view_count.toLocaleString('en-MY')}
            </p>
          </div>
          <ArrowRight
            size={16}
            className="text-[var(--color-text-muted)] transition-transform duration-200 group-hover:translate-x-1 group-hover:text-[var(--color-accent)]"
            aria-hidden="true"
          />
        </div>
      </div>
    </Link>
  )
}

function EmptyState({ hasAnnouncementScope }: { hasAnnouncementScope: boolean }) {
  return (
    <div className="rounded-[1.2rem] border border-dashed border-[var(--color-border)] px-5 py-12 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-[1rem] bg-[var(--color-accent-surface)] text-[var(--color-accent)]">
        <FileText size={20} aria-hidden="true" />
      </div>
      <h3 className="mt-4 text-base font-semibold text-[var(--color-text-primary)]">
        {hasAnnouncementScope ? 'Nothing published yet' : 'No organization assigned yet'}
      </h3>
      <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[var(--color-text-muted)]">
        {hasAnnouncementScope
          ? 'Start with a draft. You can add a poster, set urgency, and send it for review when it is ready.'
          : 'Ask an admin to assign your publisher account to an organization before drafting announcements.'}
      </p>
      {hasAnnouncementScope && (
        <Link
          href="/dashboard/announcements/new"
          className="action-lift mt-5 inline-flex min-h-11 items-center gap-2 rounded-[0.95rem] bg-[var(--color-accent)] px-4 text-sm font-semibold text-white shadow-[var(--shadow-button)]"
        >
          <Plus size={16} aria-hidden="true" />
          Create announcement
        </Link>
      )}
    </div>
  )
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
  let recentAnnouncements: RecentAnnouncement[] = []
  const scopeToMembership = shouldScopeAnnouncementsToMembership(access)
  const hasAnnouncementScope = !scopeToMembership || access.orgIds.length > 0

  if (hasAnnouncementScope) {
    let statsQuery = supabase
      .from('announcements')
      .select('status, published_at, scheduled_publish_at, view_count')

    if (scopeToMembership) {
      statsQuery = statsQuery.in('organization_id', access.orgIds)
    }

    const { data: statsRows } = await statsQuery

    if (statsRows) {
      const now = new Date()
      const nowMs = now.getTime()
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

      totalManaged = statsRows.length
      inDraft = statsRows.filter((r) => r.status === 'draft').length
      publishedThisMonth = statsRows.filter(
        (r) =>
          r.status === 'published' &&
          r.published_at != null &&
          r.published_at >= startOfMonth &&
          (r.scheduled_publish_at == null || new Date(r.scheduled_publish_at).getTime() <= nowMs)
      ).length
      scheduled = statsRows.filter(
        (r) =>
          r.status === 'published' &&
          r.scheduled_publish_at != null &&
          new Date(r.scheduled_publish_at).getTime() > nowMs
      ).length
      totalViews = statsRows.reduce((sum, row) => sum + (row.view_count ?? 0), 0)
    }

    let recentQuery = supabase
      .from('announcements')
      .select('id, title, status, view_count, updated_at, categories(name)')
      .order('updated_at', { ascending: false })
      .limit(5)

    if (scopeToMembership) {
      recentQuery = recentQuery.in('organization_id', access.orgIds)
    }

    const { data: recent } = await recentQuery

    if (recent) {
      recentAnnouncements = recent as unknown as RecentAnnouncement[]
    }
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
    { label: 'Live this month', value: publishedThisMonth },
    { label: 'Scheduled', value: scheduled },
    { label: 'Drafts', value: inDraft },
    { label: 'Total views', value: totalViews },
  ]

  return (
    <div className="dashboard-page mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
      <section className="grid gap-3 xl:grid-cols-12">
        <div className="dashboard-command-card rounded-[1.5rem] p-6 sm:p-8 xl:col-span-7 xl:row-span-2">
          <p className="future-kicker">Publisher desk</p>
          <h1 className="font-display mt-5 max-w-[42rem] text-4xl leading-[0.95] font-extrabold text-[var(--color-text-primary)] sm:text-5xl">
            {greeting}, {displayName ?? 'Publisher'}
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-[var(--color-text-secondary)] sm:text-base">
            {isInheritedWorkspace
              ? 'You have full publishing access here alongside your other workspace tools.'
              : 'Draft, schedule, and keep campus announcements readable from one focused workspace.'}
          </p>
          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            <div className="rounded-[1rem] bg-[color-mix(in_oklab,var(--color-surface)_72%,transparent)] p-4">
              <CalendarDays size={18} className="text-[var(--color-accent)]" aria-hidden="true" />
              <p className="mt-3 text-sm font-semibold text-[var(--color-text-primary)]">
                {todayLabel}
              </p>
              <p className="mt-1 text-xs leading-5 text-[var(--color-text-muted)]">
                Verify your post date is correct before publishing.
              </p>
            </div>
            <div className="rounded-[1rem] bg-[color-mix(in_oklab,var(--color-surface)_72%,transparent)] p-4">
              <Send size={18} className="text-[var(--color-accent)]" aria-hidden="true" />
              <p className="mt-3 text-sm font-semibold text-[var(--color-text-primary)]">
                {hasAnnouncementScope ? 'Ready to publish' : 'Access pending'}
              </p>
              <p className="mt-1 text-xs leading-5 text-[var(--color-text-muted)]">
                {hasAnnouncementScope
                  ? 'When ready, submit a draft for admin review.'
                  : 'Ask an admin to assign you to an organization first.'}
              </p>
            </div>
            <div className="rounded-[1rem] bg-[color-mix(in_oklab,var(--color-surface)_72%,transparent)] p-4">
              <Timer size={18} className="text-[var(--color-accent)]" aria-hidden="true" />
              <p className="mt-3 text-sm font-semibold text-[var(--color-text-primary)]">
                {scheduled} scheduled
              </p>
              <p className="mt-1 text-xs leading-5 text-[var(--color-text-muted)]">
                Posts set to go live at a future date and time.
              </p>
            </div>
          </div>
        </div>

        <Link
          href="/dashboard/announcements/new"
          className="dashboard-command-card action-lift group rounded-[1.5rem] p-5 xl:col-span-3"
        >
          <div className="flex h-full min-h-52 flex-col justify-between gap-8">
            <div className="flex h-12 w-12 items-center justify-center rounded-[1rem] bg-[var(--color-accent-inti)] text-white shadow-[var(--shadow-button)]">
              <Plus size={22} className="transition-transform duration-300 group-hover:rotate-90" />
            </div>
            <div>
              <p className="text-xl font-bold text-[var(--color-text-primary)]">
                Create announcement
              </p>
              <p className="mt-2 text-sm leading-6 text-[var(--color-text-muted)]">
                Add a notice, event, deadline, or student opportunity.
              </p>
            </div>
          </div>
        </Link>

        <div className="dashboard-command-card rounded-[1.5rem] p-5 xl:col-span-2">
          <p className="future-kicker">Managed</p>
          <CountUp
            value={totalManaged}
            className="mt-5 block font-mono text-4xl font-bold text-[var(--color-text-primary)]"
          />
          <p className="mt-2 text-sm leading-6 text-[var(--color-text-muted)]">
            Total announcements in your workspace.
          </p>
        </div>

        {stats.map(({ label, value }) => (
          <div
            key={label}
            className="dashboard-command-card rounded-[1.2rem] px-4 py-5 xl:col-span-3"
          >
            <CountUp
              value={value}
              className="font-mono text-2xl font-bold text-[var(--color-accent)] sm:text-3xl"
            />
            <p className="mt-2 text-[0.68rem] font-bold tracking-[0.14em] text-[var(--color-text-muted)] uppercase">
              {label}
            </p>
          </div>
        ))}
      </section>

      <section className="mt-3 grid gap-3 lg:grid-cols-12">
        <div className="dashboard-command-card rounded-[1.5rem] p-4 sm:p-5 lg:col-span-8">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="future-kicker">Recent work</p>
              <h2 className="mt-2 text-xl font-bold text-[var(--color-text-primary)]">
                Recently updated
              </h2>
            </div>
            <Link
              href="/dashboard/announcements"
              className="inline-flex min-h-11 items-center gap-1.5 rounded-[0.9rem] px-3 text-sm font-semibold text-[var(--color-accent)] transition-colors hover:bg-[var(--color-accent-surface)]"
            >
              View all
              <ArrowRight size={14} aria-hidden="true" />
            </Link>
          </div>
          {recentAnnouncements.length === 0 ? (
            <EmptyState hasAnnouncementScope={hasAnnouncementScope} />
          ) : (
            <div className="space-y-3">
              {recentAnnouncements.map((announcement) => (
                <RecentRow key={announcement.id} announcement={announcement} />
              ))}
            </div>
          )}
        </div>

        <aside className="dashboard-command-card rounded-[1.5rem] p-5 lg:col-span-4">
          <p className="future-kicker">Publishing rhythm</p>
          <h2 className="mt-3 text-xl font-bold text-[var(--color-text-primary)]">
            What to check before sending
          </h2>
          <div className="mt-5 space-y-3">
            {[
              'Poster image reads clearly on mobile.',
              'Deadline, registration link, and venue are current.',
              'Urgency is reserved for genuinely time-sensitive posts.',
            ].map((item, index) => (
              <div
                key={item}
                className="flex gap-3 rounded-[1rem] bg-[color-mix(in_oklab,var(--color-surface)_70%,transparent)] p-3"
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[0.75rem] bg-[var(--color-accent-surface)] font-mono text-xs font-bold text-[var(--color-accent)]">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <p className="text-sm leading-6 text-[var(--color-text-secondary)]">{item}</p>
              </div>
            ))}
          </div>
        </aside>
      </section>

      <Link
        href="/dashboard/announcements/new"
        className="action-lift fixed right-6 bottom-8 z-20 hidden h-14 w-14 items-center justify-center rounded-[1.1rem] bg-[var(--color-accent)] text-white shadow-[var(--shadow-button-hover)] sm:flex"
        aria-label="New announcement"
      >
        <Plus size={24} className="shrink-0 transition-transform duration-300" />
      </Link>
    </div>
  )
}
