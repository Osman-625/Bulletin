import Link from 'next/link'
import { Plus, ArrowRight, Building2 } from 'lucide-react'
import { GlassCard } from '@/components/dashboard/GlassCard'
import {
  DashboardBoardHeader,
  DashboardBoardPage,
  DashboardBoardPanel,
} from '@/components/dashboard/DashboardBoard'
import { formatCampusShortDate } from '@/modules/announcements/public-board'
import { getAllOrganizations } from '@/infrastructure/database/data'

export const metadata = { title: 'Organizations — Bulletin Admin' }

const orgStatusStyles: Record<string, string> = {
  approved: 'bg-[var(--color-status-published-bg)] text-[var(--color-status-published-text)]',
  pending: 'bg-[var(--color-status-submitted-bg)] text-[var(--color-status-submitted-text)]',
  rejected: 'bg-[var(--color-status-rejected-bg)] text-[var(--color-status-rejected-text)]',
  suspended: 'bg-[var(--color-status-archived-bg)] text-[var(--color-status-archived-text)]',
}

export default async function OrgsPage() {
  const orgs = await getAllOrganizations()

  return (
    <DashboardBoardPage className="flex flex-col gap-5">
      <DashboardBoardHeader
        kicker="Admin directory"
        title="Organizations"
        description={`${orgs.length} registered organization${orgs.length === 1 ? '' : 's'} with publisher workspaces and approval state.`}
        action={{ href: '/admin/orgs/new', label: 'New organization', icon: Building2 }}
      />

      <DashboardBoardPanel
        title="Organization directory"
        count={`${orgs.length} total`}
        bodyClassName="board-panel-body"
      >
        {orgs.length === 0 ? (
          <output className="mx-auto block max-w-md py-12 text-center">
            <p className="text-sm font-semibold text-[var(--color-text-primary)]">
              No organizations yet
            </p>
            <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
              Create the first organization so publishers have a scoped workspace.
            </p>
            <Link
              href="/admin/orgs/new"
              className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--radius-control)] bg-[var(--color-accent)] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[var(--color-accent-hover)]"
            >
              <Plus size={15} /> Create the first organization
            </Link>
          </output>
        ) : (
          <div className="grid gap-2">
            {orgs.map((org) => (
              <GlassCard
                key={org.id}
                hover
                className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:gap-4"
              >
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex items-center gap-2">
                    <span
                      className={`inline-flex items-center rounded px-2 py-0.5 text-[15px] font-bold tracking-wider uppercase ${orgStatusStyles[org.status] ?? orgStatusStyles.pending}`}
                    >
                      {org.status}
                    </span>
                    <span className="text-xs text-[var(--color-text-muted)] capitalize">
                      {org.org_type}
                    </span>
                  </div>
                  <p className="truncate text-sm font-semibold text-[var(--color-text-primary)]">
                    {org.name}
                  </p>
                  <p className="text-xs text-[var(--color-text-muted)]">
                    Owner: {org.owner?.display_name ?? '—'}
                  </p>
                </div>
                <p className="shrink-0 font-mono text-xs text-[var(--color-text-muted)]">
                  {formatCampusShortDate(org.created_at)}
                </p>
                <ArrowRight size={14} className="shrink-0 text-[var(--color-text-muted)]" />
              </GlassCard>
            ))}
          </div>
        )}
      </DashboardBoardPanel>
    </DashboardBoardPage>
  )
}
