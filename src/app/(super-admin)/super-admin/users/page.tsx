import { GlassCard } from '@/components/dashboard/GlassCard'
import { getAllUsers } from '@/lib/data'
import { ResetButton } from './_ResetButton'

export const metadata = { title: 'Users — Bulletin Super Admin' }

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string }>
}) {
  const { error, success } = await searchParams
  const users = await getAllUsers()

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[var(--color-text-primary)] tracking-tight">Users</h1>
        <p className="text-[var(--color-text-secondary)] mt-1">{users.length} registered users</p>
      </div>

      {error && (
        <div className="px-4 py-3 rounded-xl bg-[var(--color-status-rejected-bg)] text-[var(--color-status-rejected-text)] text-sm">{error}</div>
      )}
      {success && (
        <div className="px-4 py-3 rounded-xl bg-[var(--color-status-published-bg)] text-[var(--color-status-published-text)] text-sm">{success}</div>
      )}

      <div className="space-y-2">
        {users.map((u) => (
          <GlassCard key={u.id} hover={false} className="px-5 py-4 flex items-center gap-4">
            <div className="h-9 w-9 rounded-full bg-[var(--color-surface-elevated)] flex items-center justify-center shrink-0">
              <span className="text-sm font-bold text-[var(--color-text-secondary)]">
                {u.display_name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-sm font-semibold text-[var(--color-text-primary)]">{u.display_name}</p>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[var(--color-surface-elevated)] text-[var(--color-text-muted)]">
                  {u.role.replace('_', ' ')}
                </span>
                {u.force_password_change && (
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[var(--color-status-submitted-bg)] text-[var(--color-status-submitted-text)]">
                    Must change password
                  </span>
                )}
              </div>
              <p className="text-xs text-[var(--color-text-muted)]">{u.email}</p>
            </div>
            <ResetButton user={{ id: u.id, display_name: u.display_name }} />
          </GlassCard>
        ))}
      </div>
    </div>
  )
}
