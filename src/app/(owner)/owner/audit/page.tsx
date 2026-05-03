import { GlassCard } from '@/components/dashboard/GlassCard'
import { createServiceClient } from '@/lib/supabase/server'

export const metadata = { title: 'Audit Log — Bulletin Owner' }

export default async function AuditLogPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  const { page } = await searchParams
  const currentPage = Math.max(1, parseInt(page ?? '1', 10))
  const pageSize = 50
  const from = (currentPage - 1) * pageSize

  const supabase = await createServiceClient()

  const { data: entries, count } = await supabase
    .from('audit_log')
    .select('*, users(display_name, role)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, from + pageSize - 1)

  const totalPages = Math.ceil((count ?? 0) / pageSize)

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[var(--color-text-primary)] tracking-tight">Audit Log</h1>
        <p className="text-[var(--color-text-secondary)] mt-1">{count ?? 0} total entries</p>
      </div>

      <div className="space-y-2">
        {(entries ?? []).length === 0 ? (
          <div className="py-16 text-center text-sm text-[var(--color-text-muted)]">No audit entries yet.</div>
        ) : (entries ?? []).map((entry) => {
          const actor = (entry as { users?: { display_name?: string; role?: string } | null }).users
          return (
            <GlassCard key={entry.id} hover={false} className="px-5 py-3 flex items-start gap-4">
              <div className="h-8 w-8 rounded-full bg-[var(--color-surface-elevated)] flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-xs font-bold text-[var(--color-text-secondary)]">
                  {(actor?.display_name ?? 'S').charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-semibold text-[var(--color-text-primary)]">{entry.action}</p>
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-[var(--color-surface-elevated)] text-[var(--color-text-muted)] uppercase tracking-wide">
                    {entry.target_type}
                  </span>
                </div>
                <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                  {actor?.display_name ?? 'System'} · {(actor?.role as string | undefined)?.replace('_', ' ') ?? '—'}
                </p>
                {entry.metadata && (
                  <p className="text-[11px] font-mono text-[var(--color-text-muted)] mt-1 truncate">
                    {JSON.stringify(entry.metadata)}
                  </p>
                )}
              </div>
              <p className="text-xs font-mono text-[var(--color-text-muted)] shrink-0 pt-0.5">
                {new Date(entry.created_at).toLocaleDateString('en-MY', {
                  day: 'numeric', month: 'short', year: 'numeric',
                })}
              </p>
            </GlassCard>
          )
        })}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          {currentPage > 1 && (
            <a
              href={`?page=${currentPage - 1}`}
              className="px-4 py-2 rounded-xl text-sm font-medium bg-[var(--color-surface-elevated)] text-[var(--color-text-primary)] hover:bg-[var(--color-surface)] transition-colors"
            >
              Previous
            </a>
          )}
          <span className="text-sm text-[var(--color-text-muted)]">
            {currentPage} / {totalPages}
          </span>
          {currentPage < totalPages && (
            <a
              href={`?page=${currentPage + 1}`}
              className="px-4 py-2 rounded-xl text-sm font-medium bg-[var(--color-surface-elevated)] text-[var(--color-text-primary)] hover:bg-[var(--color-surface)] transition-colors"
            >
              Next
            </a>
          )}
        </div>
      )}
    </div>
  )
}
