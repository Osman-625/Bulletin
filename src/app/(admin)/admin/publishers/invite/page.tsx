import Link from 'next/link'
import { Check } from 'lucide-react'
import { GlassCard } from '@/components/dashboard/GlassCard'
import { BackNavButton } from '@/components/navigation/BackNavButton'
import { getCurrentAccessContext } from '@/lib/auth/authz'
import { getAllOrganizations } from '@/lib/data'
import { createClient } from '@/lib/supabase/server'
import { invitePublisher } from './actions'
import { CopyInviteLink } from './CopyInviteLink'

export const metadata = { title: 'Invite Publisher — Bulletin Admin' }

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

export default async function InvitePublisherPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; created?: string }>
}) {
  const { error, created } = await searchParams
  const [orgs, createdInvite] = await Promise.all([
    getAllOrganizations(),
    getCreatedInvite(created),
  ])
  const approvedOrgs = orgs.filter((o) => o.status === 'approved')
  const canInvitePublisher = approvedOrgs.length > 0

  const inviteLink = createdInvite
    ? `${process.env.NEXT_PUBLIC_APP_URL ?? ''}/register?token=${createdInvite.token}`
    : null

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-6 py-8">
      <div className="flex items-center gap-3">
        <BackNavButton
          fallbackHref="/admin/publishers"
          className="min-w-0 rounded-lg border-transparent bg-transparent px-0 text-sm text-[var(--color-text-muted)] shadow-none hover:border-transparent hover:bg-transparent hover:text-[var(--color-text-primary)] hover:shadow-none"
        >
          Back to publishers
        </BackNavButton>
      </div>

      <h1 className="text-3xl font-bold tracking-tight text-[var(--color-text-primary)]">
        Invite Publisher
      </h1>

      {error && (
        <div className="rounded-xl bg-[var(--color-status-rejected-bg)] px-4 py-3 text-sm text-[var(--color-status-rejected-text)]">
          {error}
        </div>
      )}

      {inviteLink && createdInvite ? (
        <GlassCard hover={false} className="space-y-4 p-6">
          <div className="flex items-center gap-2 text-[var(--color-status-published-text)]">
            <Check size={18} aria-hidden="true" />
            <p className="font-semibold">Invite created for {createdInvite.email}</p>
          </div>
          <p className="text-sm text-[var(--color-text-secondary)]">
            Share this link with the invitee. It expires in 7 days.
          </p>
          <div className="flex items-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-3">
            <code className="flex-1 font-mono text-xs break-all text-[var(--color-text-primary)]">
              {inviteLink}
            </code>
            <CopyInviteLink value={inviteLink} />
          </div>
          <Link
            href="/admin/publishers/invite"
            className="block text-center text-sm text-[var(--color-accent)] hover:underline"
          >
            Create another invite
          </Link>
        </GlassCard>
      ) : (
        <GlassCard hover={false} className="p-6">
          <form action={invitePublisher} className="space-y-5">
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
                placeholder="publisher@example.com"
                className="input-inti w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2.5 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none"
              />
            </div>

            <div className="space-y-1.5" aria-describedby="publisher-invite-org-help">
              <label className="block text-sm font-medium text-[var(--color-text-secondary)]">
                Organizations{' '}
                <span className="font-normal text-[var(--color-text-muted)]">
                  (select all that apply)
                </span>
              </label>
              {approvedOrgs.length === 0 ? (
                <p
                  id="publisher-invite-org-help"
                  className="text-sm text-[var(--color-text-muted)]"
                >
                  Create an approved organization before inviting publishers.{' '}
                  <Link
                    href="/admin/orgs/new"
                    className="text-[var(--color-accent)] hover:underline"
                  >
                    Create one first.
                  </Link>
                </p>
              ) : (
                <div className="max-h-48 space-y-2 overflow-y-auto" id="publisher-invite-org-help">
                  {approvedOrgs.map((org) => (
                    <label
                      key={org.id}
                      className="flex cursor-pointer items-center gap-3 rounded-xl p-2.5 transition-colors hover:bg-[var(--color-surface-elevated)]"
                    >
                      <input
                        type="checkbox"
                        name="org_ids"
                        value={org.id}
                        className="h-4 w-4 accent-[var(--color-accent)]"
                      />
                      <div>
                        <p className="text-sm text-[var(--color-text-primary)]">{org.name}</p>
                        <p className="text-[15px] text-[var(--color-text-muted)] capitalize">
                          {org.org_type}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="member_role"
                className="block text-sm font-medium text-[var(--color-text-secondary)]"
              >
                Org Role
              </label>
              <select
                id="member_role"
                name="member_role"
                className="input-inti w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2.5 text-sm text-[var(--color-text-primary)] focus:outline-none"
              >
                <option value="publisher">Publisher — can create announcements</option>
                <option value="admin">Admin — can manage org settings</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={!canInvitePublisher}
              className="w-full rounded-xl bg-[var(--color-accent)] py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--color-accent-hover)] disabled:cursor-not-allowed disabled:opacity-55 disabled:hover:bg-[var(--color-accent)]"
            >
              Generate Invite Link
            </button>
          </form>
        </GlassCard>
      )}
    </div>
  )
}
