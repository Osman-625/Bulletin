import Link from 'next/link'
import { ArrowLeft, Check, ShieldCheck } from 'lucide-react'
import { DashboardBoardHeader, DashboardBoardPage } from '@/components/dashboard/DashboardBoard'
import { GlassCard } from '@/components/dashboard/GlassCard'
import { getCurrentAccessContext } from '@/lib/auth/authz'
import { createClient } from '@/lib/supabase/server'
import { inviteAdmin } from './actions'

export const metadata = { title: 'Invite Admin, Bulletin Super Admin' }

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
    <DashboardBoardPage className="flex flex-col gap-5">
      <DashboardBoardHeader
        kicker="Super directory"
        title="Invite admin"
        description="Generate an invite for admin or super-admin access."
        action={{
          href: '/super-admin/admins',
          label: 'Back to admins',
          icon: ArrowLeft,
          variant: 'secondary',
        }}
      />

      {error && (
        <div className="rounded-[var(--radius-control)] bg-[var(--color-status-rejected-bg)] px-4 py-3 text-sm text-[var(--color-status-rejected-text)]">
          {error}
        </div>
      )}

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div>
          {inviteLink && createdInvite ? (
            <GlassCard hover={false} className="space-y-4 p-6">
              <div className="flex items-center gap-2 text-[var(--color-status-published-text)]">
                <Check size={18} aria-hidden="true" />
                <p className="font-semibold">Invite created for {createdInvite.email}</p>
              </div>
              <p className="text-sm text-[var(--color-text-secondary)]">
                Share this link. It expires in 7 days.
              </p>
              <div className="rounded-[var(--radius-control)] border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-3">
                <code className="font-mono text-xs break-all text-[var(--color-text-primary)]">
                  {inviteLink}
                </code>
              </div>
              <Link href="/super-admin/admins/invite" className="pub-public-link justify-center">
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
                    className="input-inti w-full rounded-[var(--radius-control)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2.5 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none"
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
                    className="input-inti w-full rounded-[var(--radius-control)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2.5 text-sm text-[var(--color-text-primary)] focus:outline-none"
                  >
                    <option value="admin">Admin</option>
                    <option value="super_admin">Super Admin</option>
                  </select>
                </div>
                <button type="submit" className="pub-btn-primary w-full justify-center">
                  Generate invite link
                </button>
              </form>
            </GlassCard>
          )}
        </div>

        <GlassCard hover={false} className="h-fit p-5 xl:sticky xl:top-5">
          <div className="mb-4 flex size-10 items-center justify-center rounded-[var(--radius-control)] bg-[var(--color-accent-surface)] text-[var(--color-accent-inti)]">
            <ShieldCheck size={18} aria-hidden="true" />
          </div>
          <h2 className="text-base font-semibold text-[var(--color-text-primary)]">Access level</h2>
          <p className="mt-2 text-sm leading-6 text-[var(--color-text-secondary)]">
            Admins review submissions and manage publishers. Super admins can also manage platform
            structure and access.
          </p>
        </GlassCard>
      </div>
    </DashboardBoardPage>
  )
}
