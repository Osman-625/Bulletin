import Link from 'next/link'
import { GlassCard } from '@/components/dashboard/GlassCard'
import { BackNavButton } from '@/components/navigation/BackNavButton'
import { getCurrentAccessContext } from '@/lib/auth/authz'
import { createClient } from '@/lib/supabase/server'
import { inviteAdmin } from './actions'

export const metadata = { title: 'Invite Admin — Bulletin Super Admin' }

async function getCreatedInvite(created?: string) {
  if (!created) return null

  const access = await getCurrentAccessContext()
  if (!access) return null

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('invitations')
    .select('email, token')
    .eq('id', created)
    .eq('invited_by', access.userId)
    .maybeSingle()

  if (error) return null
  return data
}

export default async function InviteAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; created?: string }>
}) {
  const { error, created } = await searchParams
  const createdInvite = await getCreatedInvite(created)
  const inviteLink = createdInvite
    ? `${process.env.NEXT_PUBLIC_APP_URL ?? ''}/register?token=${createdInvite.token}`
    : null

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-6 py-8">
      <BackNavButton
        fallbackHref="/super-admin/admins"
        className="min-w-0 rounded-lg border-transparent bg-transparent px-0 text-sm text-[var(--color-text-muted)] shadow-none hover:border-transparent hover:bg-transparent hover:text-[var(--color-text-primary)] hover:shadow-none"
      >
        Back to admins
      </BackNavButton>

      <h1 className="text-3xl font-bold tracking-tight text-[var(--color-text-primary)]">
        Invite Admin
      </h1>

      {error && (
        <div className="rounded-xl bg-[var(--color-status-rejected-bg)] px-4 py-3 text-sm text-[var(--color-status-rejected-text)]">
          {error}
        </div>
      )}

      {inviteLink && createdInvite ? (
        <GlassCard hover={false} className="space-y-4 p-6">
          <div className="flex items-center gap-2 text-[var(--color-status-published-text)]">
            <span className="text-xl">✓</span>
            <p className="font-semibold">Invite created for {createdInvite.email}</p>
          </div>
          <p className="text-sm text-[var(--color-text-secondary)]">
            Share this link. It expires in 7 days.
          </p>
          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-3">
            <code className="font-mono text-xs break-all text-[var(--color-text-primary)]">
              {inviteLink}
            </code>
          </div>
          <Link
            href="/super-admin/admins/invite"
            className="block text-center text-sm text-[var(--color-accent)] hover:underline"
          >
            Create another invite
          </Link>
        </GlassCard>
      ) : (
        <GlassCard hover={false} className="p-6">
          <form action={inviteAdmin} className="space-y-5">
            <div className="space-y-1.5">
              <label
                htmlFor="email"
                className="block text-sm font-medium text-[var(--color-text-secondary)]"
              >
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                placeholder="admin@inti.edu.my"
                className="input-inti w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2.5 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none"
              />
            </div>
            <div className="space-y-1.5">
              <label
                htmlFor="role"
                className="block text-sm font-medium text-[var(--color-text-secondary)]"
              >
                Role
              </label>
              <select
                id="role"
                name="role"
                className="input-inti w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2.5 text-sm text-[var(--color-text-primary)] focus:outline-none"
              >
                <option value="admin">Admin</option>
                <option value="super_admin">Super Admin</option>
              </select>
            </div>
            <button
              type="submit"
              className="w-full rounded-xl bg-[var(--color-accent)] py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--color-accent-hover)]"
            >
              Generate Invite Link
            </button>
          </form>
        </GlassCard>
      )}
    </div>
  )
}
