import Link from 'next/link'
import { Plus } from 'lucide-react'
import { GlassCard } from '@/components/dashboard/GlassCard'
import { getAllAdmins } from '@/lib/data'

export const metadata = { title: 'Admins — Bulletin Super Admin' }

const roleBadge = (role: string) =>
  role === 'super_admin'
    ? 'bg-[var(--color-accent-surface)] text-[var(--color-accent)]'
    : 'bg-[var(--color-surface-elevated)] text-[var(--color-text-secondary)]'

export default async function AdminsPage() {
  const admins = await getAllAdmins()

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-6 py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[var(--color-text-primary)]">
            Admins
          </h1>
          <p className="mt-1 text-[var(--color-text-secondary)]">{admins.length} admin users</p>
        </div>
        <Link
          href="/super-admin/admins/invite"
          className="flex items-center gap-2 rounded-xl bg-[var(--color-accent)] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[var(--color-accent-hover)]"
        >
          <Plus size={15} /> Invite Admin
        </Link>
      </div>

      <div className="space-y-2">
        {admins.length === 0 && (
          <GlassCard hover={false} className="p-8">
            <div role="status" className="mx-auto max-w-md text-center">
              <p className="text-sm font-semibold text-[var(--color-text-primary)]">
                No admins yet
              </p>
              <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                Invite the first admin to help review announcements and manage publishers.
              </p>
              <Link
                href="/super-admin/admins/invite"
                className="mt-4 inline-flex min-h-10 items-center rounded-xl bg-[var(--color-accent)] px-4 text-xs font-semibold text-white transition-colors hover:bg-[var(--color-accent-hover)]"
              >
                Invite the first admin
              </Link>
            </div>
          </GlassCard>
        )}
        {admins.map((a) => (
          <GlassCard key={a.id} hover={false} className="flex items-center gap-4 px-5 py-4">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--color-accent-surface)]">
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
                  className={`inline-flex items-center rounded px-2 py-0.5 text-[15px] font-bold tracking-wider uppercase ${roleBadge(a.role)}`}
                >
                  {a.role.replace('_', ' ')}
                </span>
              </div>
              <p className="text-xs text-[var(--color-text-muted)]">{a.email}</p>
            </div>
            <p className="shrink-0 font-mono text-xs text-[var(--color-text-muted)]">
              {new Date(a.created_at).toLocaleDateString('en-MY', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
            </p>
          </GlassCard>
        ))}
      </div>
    </div>
  )
}
