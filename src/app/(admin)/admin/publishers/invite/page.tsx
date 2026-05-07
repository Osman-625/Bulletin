import Link from 'next/link'
import { ArrowLeft, Copy } from 'lucide-react'
import { GlassCard } from '@/components/dashboard/GlassCard'
import { getAllOrganizations } from '@/lib/data'
import { invitePublisher } from './actions'

export const metadata = { title: 'Invite Publisher — Bulletin Admin' }

export default async function InvitePublisherPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; token?: string; email?: string }>
}) {
  const { error, token, email } = await searchParams
  const orgs = await getAllOrganizations()
  const approvedOrgs = orgs.filter((o) => o.status === 'approved')

  const inviteLink = token
    ? `${process.env.NEXT_PUBLIC_APP_URL ?? ''}/register?token=${token}`
    : null

  return (
    <div className="max-w-2xl mx-auto px-6 py-8 space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/publishers" className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] flex items-center gap-1 transition-colors">
          <ArrowLeft size={14} /> Back to publishers
        </Link>
      </div>

      <h1 className="text-3xl font-bold text-[var(--color-text-primary)] tracking-tight">Invite Publisher</h1>

      {error && (
        <div className="px-4 py-3 rounded-xl bg-[var(--color-status-rejected-bg)] text-[var(--color-status-rejected-text)] text-sm">
          {error}
        </div>
      )}

      {inviteLink ? (
        <GlassCard hover={false} className="p-6 space-y-4">
          <div className="flex items-center gap-2 text-[var(--color-status-published-text)]">
            <span className="text-xl">✓</span>
            <p className="font-semibold">Invite created for {email}</p>
          </div>
          <p className="text-sm text-[var(--color-text-secondary)]">
            Share this link with the invitee. It expires in 7 days.
          </p>
          <div className="flex items-center gap-2 p-3 rounded-xl bg-[var(--color-surface-elevated)] border border-[var(--color-border)]">
            <code className="flex-1 text-xs text-[var(--color-text-primary)] break-all font-mono">{inviteLink}</code>
            <button
              type="button"
              aria-label="Copy link"
              onClick={undefined}
              className="shrink-0 p-2 rounded-lg hover:bg-[var(--color-surface-high)] transition-colors"
            >
              <Copy size={14} className="text-[var(--color-text-muted)]" />
            </button>
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
              <label htmlFor="email" className="block text-sm font-medium text-[var(--color-text-secondary)]">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                required
                placeholder="publisher@example.com"
                className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2.5 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none input-inti"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-[var(--color-text-secondary)]">
                Organizations <span className="text-[var(--color-text-muted)] font-normal">(select all that apply)</span>
              </label>
              {approvedOrgs.length === 0 ? (
                <p className="text-sm text-[var(--color-text-muted)]">No approved organizations. <Link href="/admin/orgs/new" className="text-[var(--color-accent)] hover:underline">Create one first.</Link></p>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {approvedOrgs.map((org) => (
                    <label key={org.id} className="flex items-center gap-3 cursor-pointer p-2.5 rounded-xl hover:bg-[var(--color-surface-elevated)] transition-colors">
                      <input type="checkbox" name="org_ids" value={org.id} className="accent-[var(--color-accent)] h-4 w-4" />
                      <div>
                        <p className="text-sm text-[var(--color-text-primary)]">{org.name}</p>
                        <p className="text-[15px] text-[var(--color-text-muted)] capitalize">{org.org_type}</p>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="member_role" className="block text-sm font-medium text-[var(--color-text-secondary)]">Org Role</label>
              <select
                id="member_role"
                name="member_role"
                className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2.5 text-sm text-[var(--color-text-primary)] focus:outline-none input-inti"
              >
                <option value="publisher">Publisher — can create announcements</option>
                <option value="admin">Admin — can manage org settings</option>
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
