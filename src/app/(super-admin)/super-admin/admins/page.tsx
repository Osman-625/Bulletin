import Link from 'next/link'
import { ShieldCheck } from 'lucide-react'
import { GlassCard } from '@/components/dashboard/GlassCard'
import {
  DashboardBoardHeader,
  DashboardBoardPage,
  DashboardBoardPanel,
} from '@/components/dashboard/DashboardBoard'
import { formatCampusShortDate } from '@/modules/announcements/public-board'
import { getAllAdmins } from '@/infrastructure/database/data'

export const metadata = { title: 'Admins — Bulletin Super Admin' }

const roleBadge = (role: string) =>
  role === 'super_admin'
    ? 'bg-[var(--color-role-super-admin-bg)] text-[var(--color-role-super-admin-text)]'
    : 'bg-[var(--color-role-admin-bg)] text-[var(--color-role-admin-text)]'

export default async function AdminsPage() {
  const admins = await getAllAdmins()

  return (
    <DashboardBoardPage className="flex flex-col gap-5">
      <DashboardBoardHeader
        kicker="Super directory"
        title="Admins"
        description={`${admins.length} admin user${admins.length === 1 ? '' : 's'} with review and management access.`}
        action={{ href: '/super-admin/admins/invite', label: 'Invite admin', icon: ShieldCheck }}
      />

      <DashboardBoardPanel
        title="Admin directory"
        count={`${admins.length} total`}
        bodyClassName="board-panel-body"
      >
        {admins.length === 0 ? (
          <output className="mx-auto block max-w-md py-12 text-center">
            <p className="text-sm font-semibold text-[var(--color-text-primary)]">No admins yet</p>
            <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
              Invite the first admin to help review announcements and manage publishers.
            </p>
            <Link
              href="/super-admin/admins/invite"
              className="mt-4 inline-flex min-h-10 items-center rounded-[var(--radius-control)] bg-[var(--color-accent)] px-4 text-xs font-semibold text-white transition-colors hover:bg-[var(--color-accent-hover)]"
            >
              Invite the first admin
            </Link>
          </output>
        ) : (
          <div className="grid gap-2">
            {admins.map((a) => (
              <GlassCard key={a.id} hover={false} className="flex items-center gap-4 px-5 py-4">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[var(--color-accent-surface)]">
                  <span className="text-sm font-bold text-[var(--color-accent)]">
                    {a.display_name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-[var(--color-text-primary)]">
                      {a.display_name}
                    </p>
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold uppercase ${roleBadge(a.role)}`}
                    >
                      {a.role.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-xs text-[var(--color-text-muted)]">{a.email}</p>
                </div>
                <p className="shrink-0 font-mono text-xs text-[var(--color-text-muted)]">
                  {formatCampusShortDate(a.created_at)}
                </p>
              </GlassCard>
            ))}
          </div>
        )}
      </DashboardBoardPanel>
    </DashboardBoardPage>
  )
}
