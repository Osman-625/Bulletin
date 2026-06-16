import Link from 'next/link'
import { Plus, Users } from 'lucide-react'
import { GlassCard } from '@/components/dashboard/GlassCard'
import {
  DashboardBoardHeader,
  DashboardBoardPage,
  DashboardBoardPanel,
} from '@/components/dashboard/DashboardBoard'
import { formatCampusShortDate } from '@/lib/announcements/public-board'
import { getAllPublishers } from '@/lib/data'

export const metadata = { title: 'Publishers — Bulletin Admin' }

export default async function PublishersPage() {
  const publishers = await getAllPublishers()

  return (
    <DashboardBoardPage className="flex flex-col gap-5">
      <DashboardBoardHeader
        kicker="Admin directory"
        title="Publishers"
        description={`${publishers.length} publisher account${publishers.length === 1 ? '' : 's'} with organization assignments.`}
        action={{ href: '/admin/publishers/invite', label: 'Invite publisher', icon: Users }}
      />

      <DashboardBoardPanel
        title="Publisher directory"
        count={`${publishers.length} total`}
        bodyClassName="board-panel-body"
      >
        {publishers.length === 0 ? (
          <output className="mx-auto block max-w-md py-12 text-center">
            <p className="text-sm font-semibold text-[var(--color-text-primary)]">
              No publishers yet
            </p>
            <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
              Invite the first publisher once their organization workspace exists.
            </p>
            <Link
              href="/admin/publishers/invite"
              className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--radius-control)] bg-[var(--color-accent)] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[var(--color-accent-hover)]"
            >
              <Plus size={15} /> Invite the first publisher
            </Link>
          </output>
        ) : (
          <div className="grid gap-2">
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
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[var(--color-accent-surface)]">
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
                    {formatCampusShortDate(p.created_at)}
                  </p>
                </GlassCard>
              )
            })}
          </div>
        )}
      </DashboardBoardPanel>
    </DashboardBoardPage>
  )
}
