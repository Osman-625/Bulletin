import Link from 'next/link'
import {
  Activity,
  AlertTriangle,
  Clock3,
  FileText,
  Fingerprint,
  Search,
  ShieldCheck,
  UserRound,
} from 'lucide-react'
import type { Database, Json, Tables } from '@/lib/database.types'
import { reportServerError } from '@/lib/error-reporting'
import { createServiceClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Audit Log — Bulletin Owner' }

type AuditActor = {
  display_name: string | null
  email: string | null
  role: string | null
}

type AuditEntry = Tables<'audit_log'> & {
  users?: AuditActor | null
}

type AuditSearchRow = Database['public']['Functions']['search_audit_log']['Returns'][number]

type SearchParams = {
  page?: string
  q?: string
  target?: string
  actor?: string
}

const PAGE_SIZE = 30

const ACTION_LABELS: Record<string, string> = {
  'auth.login': 'Signed in',
  'auth.logout': 'Signed out',
  'announcement.created_draft': 'Created draft',
  'announcement.created_submitted': 'Created and submitted',
  'announcement.updated': 'Updated announcement',
  'announcement.submitted': 'Submitted for review',
  'announcement.published': 'Published announcement',
  'announcement.scheduled': 'Scheduled announcement',
  'announcement.unpublished': 'Unpublished announcement',
  'announcement.deleted': 'Deleted announcement',
  'review.approved': 'Approved announcement',
  'review.rejected': 'Rejected announcement',
  'invitation.created': 'Created invitation',
  'invitation.accepted': 'Accepted invitation',
  'organization.created': 'Created organization',
  'category.created': 'Created category',
  'category.updated': 'Updated category',
  'category.activated': 'Activated category',
  'category.deactivated': 'Deactivated category',
  'category.deleted': 'Deleted category',
  'category.force_deleted': 'Force deleted category',
  'user.created': 'Created user',
  'user.display_name_changed': 'Changed display name',
  'user.role_changed': 'Changed user role',
  'user.role_confirmed': 'Confirmed user role',
  'user.password_reset_requested': 'Requested password reset',
  'user.password_reset': 'Reset password',
  'user.password_changed': 'Changed password',
  'user.deleted': 'Deleted user',
}

const TARGET_LABELS: Record<string, string> = {
  announcement: 'Announcements',
  category: 'Categories',
  invitation: 'Invitations',
  organization: 'Organizations',
  session: 'Auth',
  user: 'Users',
}

const METADATA_LABELS: Record<string, string> = {
  title: 'Title',
  name: 'Name',
  email: 'Email',
  display_name: 'User',
  role: 'Role',
  previous_role: 'Was',
  new_role: 'Now',
  previous_status: 'Was',
  organization_id: 'Org',
  category_id: 'Category',
  scheduled_publish_at: 'Scheduled',
  published_at: 'Published',
  expires_at: 'Expires',
  pinned_until: 'Pinned until',
  linked_announcements: 'Linked',
  comment: 'Note',
}

const METADATA_ORDER = [
  'title',
  'name',
  'email',
  'display_name',
  'role',
  'previous_role',
  'new_role',
  'previous_status',
  'scheduled_publish_at',
  'published_at',
  'expires_at',
  'pinned_until',
  'linked_announcements',
  'comment',
  'organization_id',
  'category_id',
]

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function normalizeAuditSearch(value: string | undefined) {
  return (value ?? '').trim().replace(/\s+/g, ' ').slice(0, 80)
}

function normalizeUuidFilter(value: string) {
  return UUID_PATTERN.test(value) ? value : null
}

function auditSearchRowToEntry(row: AuditSearchRow): AuditEntry {
  return {
    id: row.id,
    actor_id: row.actor_id,
    action: row.action,
    target_type: row.target_type,
    target_id: row.target_id,
    metadata: row.metadata,
    created_at: row.created_at,
    users:
      row.actor_display_name || row.actor_email || row.actor_role
        ? {
            display_name: row.actor_display_name,
            email: row.actor_email,
            role: row.actor_role,
          }
        : null,
  }
}

function asMetadata(value: Json | null): Record<string, Json | undefined> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
  return value
}

function stringifyMeta(value: Json | undefined): string | null {
  if (value === undefined || value === null || value === '') return null
  if (Array.isArray(value))
    return value.length
      ? value
          .map((item) => stringifyMeta(item))
          .filter(Boolean)
          .join(', ')
      : null
  if (typeof value === 'object') return JSON.stringify(value)
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  return String(value)
}

function humanizeAction(action: string) {
  return (
    ACTION_LABELS[action] ??
    action.replace(/[._-]/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
  )
}

function formatRole(role: string | null | undefined) {
  return role ? role.replace(/_/g, ' ') : 'System'
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString('en-MY', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatRelative(value: string) {
  const diff = Date.now() - new Date(value).getTime()
  const minutes = Math.max(1, Math.floor(diff / 60000))
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

function eventTone(action: string) {
  if (action.includes('deleted') || action.includes('password') || action.includes('role')) {
    return {
      icon: AlertTriangle,
      label: 'Sensitive',
      badge: 'bg-[var(--color-status-rejected-bg)] text-[var(--color-status-rejected-text)]',
      mark: 'bg-[var(--color-status-rejected-text)]',
    }
  }

  if (action.includes('approved') || action.includes('published') || action.includes('accepted')) {
    return {
      icon: ShieldCheck,
      label: 'Cleared',
      badge: 'bg-[var(--color-status-published-bg)] text-[var(--color-status-published-text)]',
      mark: 'bg-[var(--color-status-published-text)]',
    }
  }

  if (
    action.includes('submitted') ||
    action.includes('scheduled') ||
    action.includes('invitation')
  ) {
    return {
      icon: Clock3,
      label: 'Workflow',
      badge: 'bg-[var(--color-status-submitted-bg)] text-[var(--color-status-submitted-text)]',
      mark: 'bg-[var(--color-status-submitted-text)]',
    }
  }

  return {
    icon: Activity,
    label: 'Activity',
    badge: 'bg-[var(--color-surface-elevated)] text-[var(--color-text-secondary)]',
    mark: 'bg-[var(--color-accent)]',
  }
}

function eventSubject(entry: AuditEntry) {
  const metadata = asMetadata(entry.metadata)
  return (
    stringifyMeta(metadata.title) ??
    stringifyMeta(metadata.name) ??
    stringifyMeta(metadata.display_name) ??
    stringifyMeta(metadata.email) ??
    TARGET_LABELS[entry.target_type] ??
    entry.target_type
  )
}

function metadataChips(metadata: Json | null) {
  const record = asMetadata(metadata)
  const keys = [
    ...METADATA_ORDER.filter((key) => record[key] !== undefined),
    ...Object.keys(record).filter((key) => !METADATA_ORDER.includes(key)),
  ]

  return keys
    .map((key) => ({
      key,
      label: METADATA_LABELS[key] ?? key.replace(/_/g, ' '),
      value: stringifyMeta(record[key]),
    }))
    .filter((item): item is { key: string; label: string; value: string } => Boolean(item.value))
    .slice(0, 8)
}

function auditHref(page: number, params: { q: string; target: string; actor: string }) {
  const search = new URLSearchParams()
  if (params.q) search.set('q', params.q)
  if (params.target !== 'all') search.set('target', params.target)
  if (params.actor !== 'all') search.set('actor', params.actor)
  search.set('page', String(page))
  return `/owner/audit?${search.toString()}`
}

function filterHref(params: { q?: string; target?: string; actor?: string }) {
  const search = new URLSearchParams()
  if (params.q) search.set('q', params.q)
  if (params.target && params.target !== 'all') search.set('target', params.target)
  if (params.actor && params.actor !== 'all') search.set('actor', params.actor)
  const query = search.toString()
  return query ? `/owner/audit?${query}` : '/owner/audit'
}

export default async function AuditLogPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const { page, q, target, actor } = await searchParams
  const currentPage = Math.max(1, parseInt(page ?? '1', 10) || 1)
  const targetFilter = target || 'all'
  const actorFilter = actor || 'all'
  const searchQuery = normalizeAuditSearch(q)
  const actorIdFilter =
    actorFilter === 'all' || actorFilter === 'system' ? null : normalizeUuidFilter(actorFilter)
  const from = (currentPage - 1) * PAGE_SIZE

  const supabase = await createServiceClient()
  const since = new Date()
  since.setDate(since.getDate() - 1)
  const since24h = since.toISOString()

  const [
    { count: totalCount },
    { count: dayCount },
    { count: securityCount },
    { count: sensitiveCount },
    { data: recentRows },
  ] = await Promise.all([
    supabase.from('audit_log').select('id', { count: 'exact', head: true }),
    supabase
      .from('audit_log')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', since24h),
    supabase
      .from('audit_log')
      .select('id', { count: 'exact', head: true })
      .or('target_type.eq.session,target_type.eq.user,target_type.eq.invitation'),
    supabase
      .from('audit_log')
      .select('id', { count: 'exact', head: true })
      .or(
        'action.ilike.%deleted%,action.ilike.%password%,action.ilike.%role%,action.ilike.%force%'
      ),
    supabase
      .from('audit_log')
      .select('actor_id, target_type, users(display_name, email, role)')
      .order('created_at', { ascending: false })
      .limit(500),
  ])

  const { data: auditRows, error: auditSearchError } = await supabase.rpc('search_audit_log', {
    p_search: searchQuery || null,
    p_target_type: targetFilter === 'all' ? null : targetFilter,
    p_actor_id: actorIdFilter,
    p_system_actor: actorFilter === 'system',
    p_limit: PAGE_SIZE,
    p_offset: from,
  })

  if (auditSearchError) {
    reportServerError('owner.audit.search_failed', auditSearchError, {
      hasSearch: Boolean(searchQuery),
      targetFilter,
      actorFilter: actorFilter === 'all' ? 'all' : actorFilter === 'system' ? 'system' : 'user',
      page: currentPage,
    })
  }

  const entries = (auditRows ?? []).map(auditSearchRowToEntry)
  const count = auditRows?.[0]?.total_count ?? 0
  const totalPages = Math.max(1, Math.ceil(count / PAGE_SIZE))

  const targetTypes = Array.from(new Set((recentRows ?? []).map((row) => row.target_type))).sort()
  const actorOptions = Array.from(
    (recentRows ?? [])
      .filter((row) => row.actor_id)
      .reduce<Map<string, AuditActor>>((actors, row) => {
        const actorData = Array.isArray(row.users) ? row.users[0] : row.users
        if (row.actor_id && actorData) actors.set(row.actor_id, actorData as AuditActor)
        return actors
      }, new Map())
  )

  const stats = [
    {
      label: 'Total events',
      value: totalCount ?? 0,
      detail: 'all recorded actions',
      icon: Fingerprint,
    },
    { label: 'Last 24h', value: dayCount ?? 0, detail: 'fresh operational activity', icon: Clock3 },
    {
      label: 'Identity trail',
      value: securityCount ?? 0,
      detail: 'auth, invites and users',
      icon: UserRound,
    },
    {
      label: 'Sensitive actions',
      value: sensitiveCount ?? 0,
      detail: 'delete, password and role changes',
      icon: AlertTriangle,
    },
  ]

  const hasFilters = Boolean(searchQuery || targetFilter !== 'all' || actorFilter !== 'all')

  return (
    <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
      <section className="mb-6 grid gap-5 lg:grid-cols-[1.3fr_0.7fr]">
        <div>
          <p className="text-xs font-semibold tracking-[0.18em] text-[var(--color-text-muted)] uppercase">
            Owner control
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-[var(--color-text-primary)] sm:text-4xl">
            Audit trail
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--color-text-secondary)]">
            Tracks logins, invitations, publishing decisions, category edits, user changes, password
            resets, and destructive actions across Bulletin.
          </p>
        </div>

        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--color-accent-surface)] text-[var(--color-accent)]">
              <ShieldCheck size={20} strokeWidth={1.8} />
            </div>
            <div>
              <p className="text-sm font-semibold text-[var(--color-text-primary)]">
                Now writing real events
              </p>
              <p className="mt-0.5 text-xs leading-5 text-[var(--color-text-secondary)]">
                New changes are recorded at the mutation source, not just displayed here.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <div
              key={stat.label}
              className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4"
            >
              <div className="mb-4 flex items-center justify-between gap-3">
                <p className="text-xs font-medium text-[var(--color-text-secondary)]">
                  {stat.label}
                </p>
                <Icon size={17} strokeWidth={1.8} className="text-[var(--color-text-muted)]" />
              </div>
              <p className="font-mono text-3xl font-semibold text-[var(--color-text-primary)] tabular-nums">
                {stat.value}
              </p>
              <p className="mt-1 text-xs text-[var(--color-text-muted)]">{stat.detail}</p>
            </div>
          )
        })}
      </section>

      <section className="mb-5 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3 sm:p-4">
        <form action="/owner/audit" className="grid gap-3 lg:grid-cols-[1fr_13rem_13rem_auto]">
          <label className="relative block">
            <span className="sr-only">Search audit events</span>
            <Search
              size={17}
              strokeWidth={1.8}
              className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-[var(--color-text-muted)]"
            />
            <input
              name="q"
              defaultValue={searchQuery}
              placeholder="Search action or target"
              className="h-11 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] py-2 pr-3 pl-10 text-sm text-[var(--color-text-primary)] transition-colors outline-none placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-accent)]"
            />
          </label>

          <label>
            <span className="sr-only">Target type</span>
            <select
              name="target"
              defaultValue={targetFilter}
              className="h-11 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-3 text-sm text-[var(--color-text-primary)] transition-colors outline-none focus:border-[var(--color-accent)]"
            >
              <option value="all">All targets</option>
              {targetTypes.map((targetType) => (
                <option key={targetType} value={targetType}>
                  {TARGET_LABELS[targetType] ?? targetType}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span className="sr-only">Actor</span>
            <select
              name="actor"
              defaultValue={actorFilter}
              className="h-11 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-3 text-sm text-[var(--color-text-primary)] transition-colors outline-none focus:border-[var(--color-accent)]"
            >
              <option value="all">All actors</option>
              <option value="system">System</option>
              {actorOptions.map(([actorId, actorData]) => (
                <option key={actorId} value={actorId}>
                  {actorData.display_name ?? actorData.email ?? 'Unknown user'}
                </option>
              ))}
            </select>
          </label>

          <button
            type="submit"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[var(--color-accent)] px-4 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5 active:translate-y-0"
          >
            <Search size={16} strokeWidth={1.8} />
            Filter
          </button>
        </form>

        {hasFilters && (
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-[var(--color-text-secondary)]">
            <span>Filtered results</span>
            <Link
              href="/owner/audit"
              className="rounded-lg bg-[var(--color-surface-elevated)] px-2.5 py-1 font-medium text-[var(--color-text-primary)] transition-colors hover:text-[var(--color-accent)]"
            >
              Clear filters
            </Link>
          </div>
        )}
      </section>

      <section className="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]">
        <div className="flex flex-col gap-2 border-b border-[var(--color-border)] px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">Events</h2>
            <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">
              {count ?? 0} matching event{(count ?? 0) === 1 ? '' : 's'}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {['all', 'user', 'announcement', 'category', 'invitation'].map((targetType) => (
              <Link
                key={targetType}
                href={filterHref({ q: searchQuery, target: targetType, actor: actorFilter })}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  targetFilter === targetType
                    ? 'bg-[var(--color-accent)] text-white'
                    : 'bg-[var(--color-surface-elevated)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                }`}
              >
                {targetType === 'all' ? 'All' : (TARGET_LABELS[targetType] ?? targetType)}
              </Link>
            ))}
          </div>
        </div>

        {entries.length === 0 ? (
          <div className="flex min-h-64 flex-col items-center justify-center px-6 py-14 text-center">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--color-surface-elevated)] text-[var(--color-text-muted)]">
              <FileText size={22} strokeWidth={1.8} />
            </div>
            <p className="text-sm font-semibold text-[var(--color-text-primary)]">
              No audit events found
            </p>
            <p className="mt-2 max-w-sm text-sm leading-6 text-[var(--color-text-secondary)]">
              {hasFilters
                ? 'Try clearing the filters or searching for a broader action.'
                : 'New login, publishing, review, invite, category and user-management actions will appear here.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[var(--color-border)]">
            {entries.map((entry) => {
              const tone = eventTone(entry.action)
              const Icon = tone.icon
              const actorData = entry.users
              const chips = metadataChips(entry.metadata)
              const actorName = actorData?.display_name ?? actorData?.email ?? 'System'

              return (
                <article
                  key={entry.id}
                  className="grid gap-4 px-4 py-4 transition-colors hover:bg-[var(--color-surface-elevated)]/60 md:grid-cols-[1fr_auto]"
                >
                  <div className="flex min-w-0 gap-3">
                    <div className="relative mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--color-surface-elevated)]">
                      <span
                        className={`absolute -top-1 -right-1 h-3 w-3 rounded-full ring-2 ring-[var(--color-surface)] ${tone.mark}`}
                      />
                      <Icon
                        size={18}
                        strokeWidth={1.8}
                        className="text-[var(--color-text-secondary)]"
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`rounded-lg px-2 py-1 text-[11px] font-semibold ${tone.badge}`}
                        >
                          {tone.label}
                        </span>
                        <span className="rounded-lg bg-[var(--color-surface-elevated)] px-2 py-1 text-[11px] font-medium tracking-[0.12em] text-[var(--color-text-muted)] uppercase">
                          {TARGET_LABELS[entry.target_type] ?? entry.target_type}
                        </span>
                      </div>

                      <h3 className="mt-2 text-sm font-semibold text-[var(--color-text-primary)]">
                        {humanizeAction(entry.action)}
                        <span className="font-normal text-[var(--color-text-secondary)]">
                          {' '}
                          · {eventSubject(entry)}
                        </span>
                      </h3>

                      <p className="mt-1 text-xs leading-5 text-[var(--color-text-muted)]">
                        By {actorName} · {formatRole(actorData?.role)}
                      </p>

                      {chips.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {chips.map((chip) => (
                            <span
                              key={`${entry.id}-${chip.key}`}
                              className="max-w-full truncate rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-2.5 py-1 text-xs text-[var(--color-text-secondary)]"
                              title={`${chip.label}: ${chip.value}`}
                            >
                              <span className="text-[var(--color-text-muted)]">{chip.label}</span>{' '}
                              <span className="font-medium text-[var(--color-text-primary)]">
                                {chip.value}
                              </span>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-start justify-between gap-3 pl-[3.25rem] md:block md:pl-0 md:text-right">
                    <p className="font-mono text-xs text-[var(--color-text-primary)] tabular-nums">
                      {formatRelative(entry.created_at)}
                    </p>
                    <p className="mt-1 font-mono text-[11px] text-[var(--color-text-muted)] tabular-nums">
                      {formatDateTime(entry.created_at)}
                    </p>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </section>

      {totalPages > 1 && (
        <nav className="mt-5 flex items-center justify-center gap-3" aria-label="Audit pagination">
          {currentPage > 1 ? (
            <Link
              href={auditHref(currentPage - 1, {
                q: searchQuery,
                target: targetFilter,
                actor: actorFilter,
              })}
              className="rounded-xl bg-[var(--color-surface-elevated)] px-4 py-2 text-sm font-medium text-[var(--color-text-primary)] transition-colors hover:text-[var(--color-accent)]"
            >
              Previous
            </Link>
          ) : null}
          <span className="font-mono text-xs text-[var(--color-text-muted)]">
            {currentPage} / {totalPages}
          </span>
          {currentPage < totalPages ? (
            <Link
              href={auditHref(currentPage + 1, {
                q: searchQuery,
                target: targetFilter,
                actor: actorFilter,
              })}
              className="rounded-xl bg-[var(--color-surface-elevated)] px-4 py-2 text-sm font-medium text-[var(--color-text-primary)] transition-colors hover:text-[var(--color-accent)]"
            >
              Next
            </Link>
          ) : null}
        </nav>
      )}
    </main>
  )
}
