import Link from 'next/link'
import { Plus, ArrowRight } from 'lucide-react'
import { GlassCard } from '@/components/dashboard/GlassCard'
import { getAllOrganizations } from '@/lib/data'

export const metadata = { title: 'Organizations — Bulletin Admin' }

const orgStatusStyles: Record<string, string> = {
  approved:  'bg-[var(--color-status-published-bg)] text-[var(--color-status-published-text)]',
  pending:   'bg-[var(--color-status-submitted-bg)] text-[var(--color-status-submitted-text)]',
  rejected:  'bg-[var(--color-status-rejected-bg)] text-[var(--color-status-rejected-text)]',
  suspended: 'bg-[var(--color-status-archived-bg)] text-[var(--color-status-archived-text)]',
}

export default async function OrgsPage() {
  const orgs = await getAllOrganizations()

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[var(--color-text-primary)] tracking-tight">Organizations</h1>
          <p className="text-[var(--color-text-secondary)] mt-1">{orgs.length} registered</p>
        </div>
        <Link
          href="/admin/orgs/new"
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white transition-colors"
        >
          <Plus size={15} /> New Organization
        </Link>
      </div>

      {orgs.length === 0 ? (
        <div className="text-center py-16 text-[var(--color-text-muted)] text-sm">No organizations yet.</div>
      ) : (
        <div className="space-y-2">
          {orgs.map((org) => (
            <GlassCard key={org.id} hover className="px-5 py-4 flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${orgStatusStyles[org.status] ?? orgStatusStyles.pending}`}>
                    {org.status}
                  </span>
                  <span className="text-xs text-[var(--color-text-muted)] capitalize">{org.org_type}</span>
                </div>
                <p className="text-sm font-semibold text-[var(--color-text-primary)] truncate">{org.name}</p>
                <p className="text-xs text-[var(--color-text-muted)]">
                  Owner: {(org as { users?: { display_name?: string } }).users?.display_name ?? '—'}
                </p>
              </div>
              <p className="text-xs font-mono text-[var(--color-text-muted)] shrink-0">
                {new Date(org.created_at).toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
              <ArrowRight size={14} className="text-[var(--color-text-muted)] shrink-0" />
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  )
}
