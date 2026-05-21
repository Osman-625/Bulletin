import Link from 'next/link'
import { Plus } from 'lucide-react'
import { GlassCard } from '@/components/dashboard/GlassCard'
import { getAllPublishers } from '@/lib/data'

export const metadata = { title: 'Publishers — Bulletin Admin' }

export default async function PublishersPage() {
  const publishers = await getAllPublishers()

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-6 py-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[var(--color-text-primary)]">
            Publishers
          </h1>
          <p className="mt-1 text-[var(--color-text-secondary)]">{publishers.length} registered</p>
        </div>
        <Link
          href="/admin/publishers/invite"
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[var(--color-accent)] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[var(--color-accent-hover)]"
        >
          <Plus size={15} /> Invite Publisher
        </Link>
      </div>

      {publishers.length === 0 ? (
        <GlassCard hover={false} className="p-8">
          <div role="status" className="mx-auto max-w-md text-center">
            <p className="text-sm font-semibold text-[var(--color-text-primary)]">
              No publishers yet
            </p>
            <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
              Invite the first publisher once their organization workspace exists.
            </p>
            <Link
              href="/admin/publishers/invite"
              className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[var(--color-accent)] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[var(--color-accent-hover)]"
            >
              <Plus size={15} /> Invite the first publisher
            </Link>
          </div>
        </GlassCard>
      ) : (
        <div className="space-y-2">
          {publishers.map((p) => {
            const orgs = (p.organization_members ?? []) as Array<{
              organization_id: string
              member_role: string
              organizations?: { name: string; slug: string } | null
            }>
            return (
              <GlassCard
                key={p.id}
                hover={false}
                className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:gap-4"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--color-accent-surface)]">
                  <span className="text-sm font-bold text-[var(--color-accent)]">
                    {p.display_name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-[var(--color-text-primary)]">
                    {p.display_name}
                  </p>
                  <p className="text-xs text-[var(--color-text-muted)]">{p.email}</p>
                  {orgs.length > 0 && (
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {orgs.map((m) => (
                        <span
                          key={m.organization_id}
                          className="inline-flex items-center rounded bg-[var(--color-surface-elevated)] px-2 py-0.5 text-[15px] font-medium text-[var(--color-text-secondary)]"
                        >
                          {m.organizations?.name} · {m.member_role}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <p className="shrink-0 font-mono text-xs text-[var(--color-text-muted)]">
                  {new Date(p.created_at).toLocaleDateString('en-MY', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </p>
              </GlassCard>
            )
          })}
        </div>
      )}
    </div>
  )
}
