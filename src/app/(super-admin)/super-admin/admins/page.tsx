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
    <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[var(--color-text-primary)] tracking-tight">Admins</h1>
          <p className="text-[var(--color-text-secondary)] mt-1">{admins.length} admin users</p>
        </div>
        <Link
          href="/super-admin/admins/invite"
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white transition-colors"
        >
          <Plus size={15} /> Invite Admin
        </Link>
      </div>

      <div className="space-y-2">
        {admins.map((a) => (
          <GlassCard key={a.id} hover={false} className="px-5 py-4 flex items-center gap-4">
            <div className="h-9 w-9 rounded-full bg-[var(--color-accent-surface)] flex items-center justify-center shrink-0">
              <span className="text-sm font-bold text-[var(--color-accent)]">
                {a.display_name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-[var(--color-text-primary)]">{a.display_name}</p>
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${roleBadge(a.role)}`}>
                  {a.role.replace('_', ' ')}
                </span>
              </div>
              <p className="text-xs text-[var(--color-text-muted)]">{a.email}</p>
            </div>
            <p className="text-xs font-mono text-[var(--color-text-muted)] shrink-0">
              {new Date(a.created_at).toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' })}
            </p>
          </GlassCard>
        ))}
      </div>
    </div>
  )
}
