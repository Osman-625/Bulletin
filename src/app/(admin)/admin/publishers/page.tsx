import Link from 'next/link'
import { Plus } from 'lucide-react'
import { GlassCard } from '@/components/dashboard/GlassCard'
import { getAllPublishers } from '@/lib/data'

export const metadata = { title: 'Publishers — Bulletin Admin' }

export default async function PublishersPage() {
  const publishers = await getAllPublishers()

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[var(--color-text-primary)] tracking-tight">Publishers</h1>
          <p className="text-[var(--color-text-secondary)] mt-1">{publishers.length} registered</p>
        </div>
        <Link
          href="/admin/publishers/invite"
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white transition-colors"
        >
          <Plus size={15} /> Invite Publisher
        </Link>
      </div>

      {publishers.length === 0 ? (
        <div className="text-center py-16 text-[var(--color-text-muted)] text-sm">No publishers yet. Invite one to get started.</div>
      ) : (
        <div className="space-y-2">
          {publishers.map((p) => {
            const orgs = (p.organization_members ?? []) as Array<{ organization_id: string; member_role: string; organizations?: { name: string; slug: string } | null }>
            return (
              <GlassCard key={p.id} hover={false} className="px-5 py-4 flex items-center gap-4">
                <div className="h-9 w-9 rounded-full bg-[var(--color-accent-surface)] flex items-center justify-center shrink-0">
                  <span className="text-sm font-bold text-[var(--color-accent)]">
                    {p.display_name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[var(--color-text-primary)]">{p.display_name}</p>
                  <p className="text-xs text-[var(--color-text-muted)]">{p.email}</p>
                  {orgs.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {orgs.map((m) => (
                        <span
                          key={m.organization_id}
                          className="inline-flex items-center px-2 py-0.5 rounded text-[15px] font-medium bg-[var(--color-surface-elevated)] text-[var(--color-text-secondary)]"
                        >
                          {m.organizations?.name} · {m.member_role}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <p className="text-xs font-mono text-[var(--color-text-muted)] shrink-0">
                  {new Date(p.created_at).toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
              </GlassCard>
            )
          })}
        </div>
      )}
    </div>
  )
}
