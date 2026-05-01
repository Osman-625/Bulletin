import Link from 'next/link'
import { Plus } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { GlassCard } from '@/components/dashboard/GlassCard'
import { StatusBadge } from '@/components/dashboard/StatusBadge'
import { CountUp } from '@/components/dashboard/CountUp'

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
  const supabase = await createClient()

  // 1. Auth + user profile
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('users')
    .select('display_name')
    .eq('id', user!.id)
    .single()

  // 2. Get organization_id via organization_members
  const { data: membership } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user!.id)
    .single()

  const orgId = membership?.organization_id ?? null

  // 3. Stats + recent announcements (only if org exists)
  let total = 0
  let inDraft = 0
  let publishedThisMonth = 0
  let recentAnnouncements: RecentAnnouncement[] = []

  if (orgId) {
    // Fetch all rows for stats in one query
    const { data: statsRows } = await supabase
      .from('announcements')
      .select('status, published_at')
      .eq('organization_id', orgId)

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
    const { data: recent } = await supabase
      .from('announcements')
      .select('id, title, status, updated_at, categories(name)')
      .eq('organization_id', orgId)
      .order('updated_at', { ascending: false })
      .limit(5)

    if (recent) {
      recentAnnouncements = (recent as unknown) as RecentAnnouncement[]
    }
  }

  const greeting = getGreeting()
  const displayName = profile?.display_name ?? null

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">
      {/* Section 1 — Greeting */}
      <div>
        <h1 className="text-3xl font-bold text-[var(--color-text-primary)] tracking-tight">
          {greeting}, {displayName ?? 'Publisher'}
        </h1>
        <p className="text-[var(--color-text-secondary)] mt-1">
          Manage INTI&apos;s announcements from here.
        </p>
      </div>

      {/* Section 2 — Stats strip */}
      <div className="flex items-center gap-0 divide-x divide-[var(--color-border)]">
        {[
          { label: 'Published this month', value: publishedThisMonth },
          { label: 'In draft', value: inDraft },
          { label: 'Total all-time', value: total },
        ].map(({ label, value }) => (
          <div key={label} className="flex-1 px-6 first:pl-0 last:pr-0">
            <CountUp value={value} className="text-3xl font-bold font-mono text-[var(--color-accent)]" />
            <p className="text-xs uppercase tracking-widest text-[var(--color-text-muted)] mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Section 3 — Recent announcements */}
      <div>
        <div className="flex items-center justify-between mb-4">
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
        className="fixed bottom-8 right-8 z-50 flex items-center justify-center w-14 h-14 rounded-full bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white shadow-lg transition-all duration-300 active:scale-95 group"
        aria-label="New announcement"
      >
        <Plus size={24} className="transition-transform duration-300 group-hover:rotate-90" />
      </Link>
    </div>
  )
}
