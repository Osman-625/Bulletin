import Link from 'next/link'
import { Plus } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { GlassCard } from '@/components/dashboard/GlassCard'
import { AnnouncementsClient } from './AnnouncementsClient'
import type { AnnouncementRowData } from '@/components/dashboard/AnnouncementRow'

export const metadata = { title: 'Announcements — Bulletin' }

type RawRow = {
  id: string
  title: string
  status: string
  banner_url: string | null
  published_at: string | null
  expires_at: string | null
  archived_at: string | null
  updated_at: string
  categories: { id: string; name: string; color: string | null } | null
  organizations: { id: string; name: string } | null
  author: { display_name: string } | null
}

export default async function AnnouncementsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  // Get org membership
  const { data: membership } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user!.id)
    .single()

  const orgId = membership?.organization_id ?? null

  let announcements: AnnouncementRowData[] = []
  let totalPublished = 0
  let pendingDrafts = 0
  let scheduled = 0
  let archived = 0

  if (orgId) {
    const { data: rows } = await supabase
      .from('announcements')
      .select(`
        id,
        title,
        status,
        banner_url,
        published_at,
        expires_at,
        archived_at,
        updated_at,
        categories ( id, name, color ),
        organizations ( id, name ),
        author:users!announcements_author_id_fkey ( display_name )
      `)
      .eq('organization_id', orgId)
      .order('updated_at', { ascending: false })

    if (rows) {
      const rawRows = rows as unknown as RawRow[]
      announcements = rawRows.map((r) => ({
        id: r.id,
        title: r.title,
        status: r.status as AnnouncementRowData['status'],
        banner_url: r.banner_url,
        published_at: r.published_at,
        updated_at: r.updated_at,
        categories: r.categories,
        organizations: r.organizations,
        author: r.author,
      }))

      totalPublished = rawRows.filter((r) => r.status === 'published').length
      pendingDrafts = rawRows.filter((r) => r.status === 'draft').length
      scheduled = rawRows.filter((r) => r.expires_at !== null && r.status === 'published').length
      archived = rawRows.filter((r) => r.status === 'archived').length
    }
  }

  const stats = [
    { label: 'Total Published', value: totalPublished },
    { label: 'Pending Drafts', value: pendingDrafts },
    { label: 'Scheduled', value: scheduled },
    { label: 'Archived', value: archived },
  ]

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">
      {/* Page header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-4xl font-bold text-[var(--color-text-primary)] tracking-tight">
            Announcements
          </h1>
          <p className="text-[var(--color-text-secondary)] mt-1">
            Manage your organization&apos;s updates.
          </p>
        </div>
        <Link
          href="/dashboard/announcements/new"
          className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white text-sm font-semibold transition-colors shrink-0"
        >
          <Plus size={16} />
          New Announcement
        </Link>
      </div>

      {/* Stats mini-bento */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {stats.map(({ label, value }) => (
          <GlassCard key={label} hover={false} className="p-5">
            <p className="text-xs uppercase tracking-widest text-[var(--color-text-muted)] mb-2">
              {label}
            </p>
            <p className="text-3xl font-bold font-mono text-[var(--color-accent)]">{value}</p>
          </GlassCard>
        ))}
      </div>

      {/* Client component handles tabs, search, list, pagination */}
      <AnnouncementsClient announcements={announcements} />
    </div>
  )
}
