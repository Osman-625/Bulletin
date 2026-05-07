import Link from 'next/link'
import { Plus } from 'lucide-react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { GlassCard } from '@/components/dashboard/GlassCard'
import { StatusBadge } from '@/components/dashboard/StatusBadge'
import { CountUp } from '@/components/dashboard/CountUp'
import { getCurrentAccessContext } from '@/lib/auth/authz'
import { shouldScopeAnnouncementsToMembership } from '@/lib/announcements/access'

export const metadata = { title: 'Dashboard — Bulletin' }

type RecentAnnouncement = {
  id: string
  title: string
  status: string
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
    <GlassCard hover={false} className="px-5 py-4 flex items-center gap-4">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <StatusBadge status={announcement.status as 'draft' | 'published' | 'archived'} />
          <span className="text-sm font-medium text-[var(--color-text-primary)] truncate">
            {announcement.title}
          </span>
        </div>
        <p className="text-xs text-[var(--color-text-muted)]">
          {announcement.categories?.name ?? 'Uncategorized'}
        </p>
      </div>
      <p className="text-xs font-mono text-[var(--color-text-muted)] shrink-0">
        {new Date(announcement.updated_at).toLocaleDateString('en-MY', { day: 'numeric', month: 'short' })}
      </p>
    </GlassCard>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <svg width="48" height="48" viewBox="0 0 48 48" fill="none" className="mb-4 text-[var(--color-border)]">
        <rect x="8" y="12" width="32" height="4" rx="2" fill="currentColor" />
        <rect x="8" y="22" width="24" height="4" rx="2" fill="currentColor" />
        <rect x="8" y="32" width="16" height="4" rx="2" fill="currentColor" />
      </svg>
      <h3 className="text-base font-medium text-[var(--color-text-primary)]">Nothing published yet</h3>
      <p className="text-sm text-[var(--color-text-muted)] mt-1">Create your first announcement to get started.</p>
      <Link
        href="/dashboard/announcements/new"
        className="mt-4 px-4 py-2 rounded-xl text-sm font-medium bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white transition-colors"
      >
        Create announcement
      </Link>
    </div>
  )
}

export default async function DashboardPage() {
  const access = await getCurrentAccessContext()
  if (!access) redirect('/login')

  const supabase = await createClient()

  // 3. Stats + recent announcements (only if org exists)
  let total = 0
  let inDraft = 0
  let publishedThisMonth = 0
  let recentAnnouncements: RecentAnnouncement[] = []
  const scopeToMembership = shouldScopeAnnouncementsToMembership(access)
  const hasAnnouncementScope = !scopeToMembership || access.orgIds.length > 0

  if (hasAnnouncementScope) {
    // Fetch all rows for stats in one query
    let statsQuery = supabase
      .from('announcements')
      .select('status, published_at')

    if (scopeToMembership) {
      statsQuery = statsQuery.in('organization_id', access.orgIds)
    }

    const { data: statsRows } = await statsQuery

    if (statsRows) {
      const now = new Date()
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

      total = statsRows.length
      inDraft = statsRows.filter((r) => r.status === 'draft').length
      publishedThisMonth = statsRows.filter(
        (r) => r.status === 'published' && r.published_at != null && r.published_at >= startOfMonth
      ).length
    }

    // Fetch recent 5
    let recentQuery = supabase
      .from('announcements')
      .select('id, title, status, updated_at, categories(name)')
      .order('updated_at', { ascending: false })
      .limit(5)

    if (scopeToMembership) {
      recentQuery = recentQuery.in('organization_id', access.orgIds)
    }

    const { data: recent } = await recentQuery

    if (recent) {
      recentAnnouncements = (recent as unknown) as RecentAnnouncement[]
    }
  }

  const greeting = getGreeting()
  const displayName = access.displayName
  const isInheritedWorkspace = access.role !== 'publisher'

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8">
      {/* Section 1 — Greeting */}
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text-primary)] sm:text-3xl">
          {greeting}, {displayName ?? 'Publisher'}
        </h1>
        <p className="max-w-2xl text-sm text-[var(--color-text-secondary)] sm:text-base">
          {isInheritedWorkspace
            ? 'Use the announcement creator tools alongside your higher-level workspace.'
            : 'Manage INTI&apos;s announcements from here.'}
        </p>
      </div>

      {/* Section 2 — Stats strip */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-0 sm:divide-x sm:divide-[var(--color-border)]">
        {[
          { label: 'Published this month', value: publishedThisMonth },
          { label: 'In draft', value: inDraft },
          { label: 'Total all-time', value: total },
        ].map(({ label, value }) => (
          <div
            key={label}
            className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-4 sm:rounded-none sm:border-0 sm:bg-transparent sm:px-6 sm:first:pl-0 sm:last:pr-0"
          >
            <CountUp value={value} className="text-3xl font-bold font-mono text-[var(--color-accent)]" />
            <p className="text-xs uppercase tracking-widest text-[var(--color-text-muted)] mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Section 3 — Recent announcements */}
      <div>
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Recent</h2>
          <Link href="/dashboard/announcements" className="text-sm text-[var(--color-accent)] hover:underline">
            View all →
          </Link>
        </div>
        {recentAnnouncements.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="space-y-3">
            {recentAnnouncements.map((a) => (
              <RecentRow key={a.id} announcement={a} />
            ))}
          </div>
        )}
      </div>

      {/* Section 4 — FAB */}
      <Link
        href="/dashboard/announcements/new"
        className="fixed right-4 bottom-[calc(env(safe-area-inset-bottom,0px)+5.5rem)] z-50 flex h-14 min-w-14 items-center justify-center rounded-full bg-[var(--color-accent)] px-4 text-white shadow-lg transition-all duration-300 active:scale-95 group sm:right-6 sm:bottom-8 sm:w-14 sm:px-0"
        aria-label="New announcement"
      >
        <Plus size={24} className="shrink-0 transition-transform duration-300 group-hover:rotate-90" />
        <span className="ml-2 text-sm font-semibold sm:hidden">New</span>
      </Link>
    </div>
  )
}
