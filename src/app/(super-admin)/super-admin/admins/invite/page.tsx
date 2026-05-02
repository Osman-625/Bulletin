import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { GlassCard } from '@/components/dashboard/GlassCard'
import { inviteAdmin } from './actions'

export const metadata = { title: 'Invite Admin — Bulletin Super Admin' }

export default async function InviteAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; token?: string; email?: string }>
}) {
  const { error, token, email } = await searchParams
  const inviteLink = token ? `${process.env.NEXT_PUBLIC_APP_URL ?? ''}/register?token=${token}` : null

  return (
    <div className="max-w-2xl mx-auto px-6 py-8 space-y-6">
      <Link href="/super-admin/admins" className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] flex items-center gap-1 transition-colors">
        <ArrowLeft size={14} /> Back to admins
      </Link>

      <h1 className="text-3xl font-bold text-[var(--color-text-primary)] tracking-tight">Invite Admin</h1>

      {error && (
        <div className="px-4 py-3 rounded-xl bg-[var(--color-status-rejected-bg)] text-[var(--color-status-rejected-text)] text-sm">{error}</div>
      )}

      {inviteLink ? (
        <GlassCard hover={false} className="p-6 space-y-4">
          <div className="flex items-center gap-2 text-[var(--color-status-published-text)]">
            <span className="text-xl">✓</span>
            <p className="font-semibold">Invite created for {email}</p>
          </div>
          <p className="text-sm text-[var(--color-text-secondary)]">Share this link. It expires in 7 days.</p>
          <div className="p-3 rounded-xl bg-[var(--color-surface-elevated)] border border-[var(--color-border)]">
            <code className="text-xs text-[var(--color-text-primary)] break-all font-mono">{inviteLink}</code>
          </div>
          <Link href="/super-admin/admins/invite" className="block text-center text-sm text-[var(--color-accent)] hover:underline">
            Create another invite
          </Link>
        </GlassCard>
      ) : (
        <GlassCard hover={false} className="p-6">
          <form action={inviteAdmin} className="space-y-5">
            <div className="space-y-1.5">
              <label htmlFor="email" className="block text-sm font-medium text-[var(--color-text-secondary)]">Email</label>
              <input
                id="email" name="email" type="email" required
                placeholder="admin@inti.edu.my"
                className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2.5 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none input-inti"
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="role" className="block text-sm font-medium text-[var(--color-text-secondary)]">Role</label>
              <select
                id="role" name="role"
                className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2.5 text-sm text-[var(--color-text-primary)] focus:outline-none input-inti"
              >
                <option value="admin">Admin</option>
                <option value="super_admin">Super Admin</option>
              </select>
            </div>
            <button
              type="submit"
              className="w-full py-2.5 rounded-xl text-sm font-semibold bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white transition-colors"
            >
              Generate Invite Link
            </button>
          </form>
        </GlassCard>
      )}
    </div>
  )
}
