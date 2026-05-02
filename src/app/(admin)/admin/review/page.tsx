import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { GlassCard } from '@/components/dashboard/GlassCard'
import { getSubmittedAnnouncements } from '@/lib/data'

export const metadata = { title: 'Review Queue — Bulletin Admin' }

export default async function ReviewQueuePage() {
  const queue = await getSubmittedAnnouncements()

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[var(--color-text-primary)] tracking-tight">Review Queue</h1>
        <p className="text-[var(--color-text-secondary)] mt-1">
          {queue.length === 0 ? 'Nothing pending.' : `${queue.length} announcement${queue.length === 1 ? '' : 's'} awaiting review.`}
        </p>
      </div>

      {queue.length === 0 ? (
        <div className="text-center py-20 text-[var(--color-text-muted)]">
          <p className="text-4xl mb-3">✓</p>
          <p className="font-medium text-[var(--color-text-primary)]">All caught up</p>
          <p className="text-sm mt-1">No submissions pending review.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {queue.map((a) => (
            <Link key={a.id} href={`/admin/review/${a.id}`}>
              <GlassCard hover className="px-5 py-4 flex items-center gap-4 group">
                <div
                  className="h-10 w-1 rounded-full shrink-0 opacity-60"
                  style={{ background: a.categories?.color ?? 'var(--color-accent)' }}
                  aria-hidden="true"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[var(--color-text-primary)] truncate">{a.title}</p>
                  <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                    {a.organizations?.name ?? '—'} · {a.categories?.name ?? 'Uncategorized'} · {a.users?.display_name ?? '—'}
                  </p>
                </div>
                <p className="text-xs font-mono text-[var(--color-text-muted)] shrink-0">
                  {new Date(a.updated_at).toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
                <ArrowRight size={14} className="text-[var(--color-text-muted)] group-hover:text-[var(--color-accent)] transition-colors shrink-0" />
              </GlassCard>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
