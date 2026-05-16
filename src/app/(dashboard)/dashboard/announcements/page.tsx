import Link from 'next/link'
import { Archive, CheckCircle2, Clock3, FileText, Plus } from 'lucide-react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AnnouncementsClient } from './AnnouncementsClient'
import { CountUp } from '@/components/dashboard/CountUp'
import { getCurrentAccessContext } from '@/lib/auth/authz'
import { shouldScopeAnnouncementsToMembership } from '@/lib/announcements/access'
import type { AnnouncementRowData } from '@/components/dashboard/AnnouncementRow'
import type { DbAnnouncement } from '@/lib/types'

export const metadata = { title: 'Announcements' }

type QueryRow = Pick<
  DbAnnouncement,
  | 'id'
  | 'title'
  | 'status'
  | 'urgency'
  | 'banner_url'
  | 'published_at'
  | 'scheduled_publish_at'
  | 'pinned_until'
  | 'rejection_comment'
  | 'view_count'
  | 'expires_at'
  | 'archived_at'
  | 'updated_at'
> & {
  categories: { id: string; name: string; color: string | null } | null
  organizations: { id: string; name: string } | null
  author: { display_name: string } | null
}

export default async function AnnouncementsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>
}) {
  const { search } = await searchParams
  const access = await getCurrentAccessContext()
  if (!access) redirect('/login')

  const supabase = await createClient()
  const scopeToMembership = shouldScopeAnnouncementsToMembership(access)

  let announcements: AnnouncementRowData[] = []
  let totalPublished = 0
  let pendingDrafts = 0
  let scheduled = 0
  let archived = 0

  let query = supabase
    .from('announcements')
    .select(
      `
      id,
      title,
      status,
      urgency,
      banner_url,
      published_at,
      scheduled_publish_at,
      pinned_until,
      rejection_comment,
      view_count,
      expires_at,
      archived_at,
      updated_at,
      categories ( id, name, color ),
      organizations ( id, name ),
      author:users!announcements_author_id_fkey ( display_name )
    `
    )
    .order('updated_at', { ascending: false })

  if (scopeToMembership) {
    if (access.orgIds.length === 0) {
      query = query.eq('organization_id', '00000000-0000-0000-0000-000000000000')
    } else {
      query = query.in('organization_id', access.orgIds)
    }
  }

  const { data: rows } = await query

  if (rows) {
    const rawRows = rows as unknown as QueryRow[]
    const nowMs = new Date().getTime()
    announcements = rawRows.map((r) => ({
      id: r.id,
      title: r.title,
      status: r.status as AnnouncementRowData['status'],
      urgency: r.urgency,
      banner_url: r.banner_url,
      published_at: r.published_at,
      scheduled_publish_at: r.scheduled_publish_at,
      pinned_until: r.pinned_until,
      rejection_comment: r.rejection_comment,
      view_count: r.view_count ?? 0,
      updated_at: r.updated_at,
      categories: r.categories,
      organizations: r.organizations,
      author: r.author,
    }))

    totalPublished = rawRows.filter(
      (r) =>
        r.status === 'published' &&
        (r.scheduled_publish_at === null || new Date(r.scheduled_publish_at).getTime() <= nowMs)
    ).length
    pendingDrafts = rawRows.filter((r) => r.status === 'draft').length
    scheduled = rawRows.filter(
      (r) =>
        r.status === 'published' &&
        r.scheduled_publish_at !== null &&
        new Date(r.scheduled_publish_at).getTime() > nowMs
    ).length
    archived = rawRows.filter((r) => r.status === 'archived').length
  }

  const stats = [
    { label: 'Live', value: totalPublished, icon: CheckCircle2 },
    { label: 'Drafts', value: pendingDrafts, icon: FileText },
    { label: 'Scheduled', value: scheduled, icon: Clock3 },
    { label: 'Archived', value: archived, icon: Archive },
  ]

  return (
    <div className="dashboard-page mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
      <section className="grid gap-3 xl:grid-cols-12">
        <div className="dashboard-command-card rounded-[1.5rem] p-6 sm:p-8 xl:col-span-8">
          <p className="future-kicker">Announcements</p>
          <div className="mt-4 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="font-display text-4xl leading-none font-extrabold text-[var(--color-text-primary)] sm:text-5xl">
                Manage campus posts
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--color-text-secondary)] sm:text-base">
                {scopeToMembership
                  ? "Search, filter, and update your organization's announcements."
                  : 'Search, filter, and update announcements across approved organizations.'}
              </p>
            </div>
            <Link
              href="/dashboard/announcements/new"
              className="action-lift inline-flex min-h-11 w-full shrink-0 items-center justify-center gap-2 rounded-[0.95rem] bg-[var(--color-accent)] px-5 text-sm font-semibold text-white shadow-[var(--shadow-button)] sm:w-auto"
            >
              <Plus size={16} aria-hidden="true" />
              New announcement
            </Link>
          </div>
        </div>

        <div className="dashboard-command-card rounded-[1.5rem] p-5 xl:col-span-4">
          <p className="future-kicker">Total</p>
          <CountUp
            value={announcements.length}
            className="mt-5 block font-mono text-4xl font-bold text-[var(--color-text-primary)]"
          />
          <p className="mt-2 text-sm leading-6 text-[var(--color-text-muted)]">
            Total announcements in your workspace.
          </p>
        </div>

        {stats.map(({ label, value, icon: Icon }) => (
          <div
            key={label}
            className="dashboard-command-card rounded-[1.2rem] p-4 sm:p-5 xl:col-span-3"
          >
            <Icon size={18} className="text-[var(--color-accent)]" aria-hidden="true" />
            <CountUp
              value={value}
              className="mt-4 block font-mono text-3xl font-bold text-[var(--color-text-primary)]"
            />
            <p className="mt-1 text-[0.68rem] font-bold tracking-[0.14em] text-[var(--color-text-muted)] uppercase">
              {label}
            </p>
          </div>
        ))}
      </section>

      <section className="dashboard-command-card mt-3 rounded-[1.5rem] p-4 sm:p-5">
        <AnnouncementsClient announcements={announcements} initialQuery={search?.trim() ?? ''} />
      </section>
    </div>
  )
}
