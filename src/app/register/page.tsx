import Link from 'next/link'
import { BrandMark } from '@/components/layout/BrandMark'
import { ThemeToggle } from '@/components/layout/ThemeToggle'
import { createAdminClient } from '@/lib/supabase/admin'
import { completeRegistration } from './actions'

export const metadata = { title: 'Create Account — Bulletin' }

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; error?: string }>
}) {
  const { token, error } = await searchParams

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--color-canvas)] p-4">
        <div className="future-panel max-w-md space-y-3 rounded-[1.5rem] p-7 text-center">
          <p className="text-lg font-semibold text-[var(--color-text-primary)]">
            Invalid invite link
          </p>
          <p className="text-sm text-[var(--color-text-muted)]">
            This link is missing a token. Please request a new invite.
          </p>
          <Link
            href="/login"
            className="inline-flex min-h-11 items-center text-sm text-[var(--color-accent-inti)] hover:text-[var(--color-accent-hover)] hover:underline"
          >
            Go to login
          </Link>
        </div>
      </div>
    )
  }

  // Validate token server-side
  const admin = createAdminClient()
  const { data: invitation } = await admin
    .from('invitations')
    .select('email, role, expires_at, accepted_at')
    .eq('token', token)
    .single()

  const isExpired = !invitation || new Date(invitation.expires_at) < new Date()
  const isUsed = invitation?.accepted_at != null

  if (!invitation || isExpired || isUsed) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--color-canvas)] p-4">
        <div className="future-panel max-w-md space-y-3 rounded-[1.5rem] p-7 text-center">
          <p className="text-lg font-semibold text-[var(--color-text-primary)]">
            {isUsed ? 'Invite already used' : 'Invite link expired'}
          </p>
          <p className="text-sm text-[var(--color-text-muted)]">
            Please request a new invite from your administrator.
          </p>
          <Link
            href="/login"
            className="inline-flex min-h-11 items-center text-sm text-[var(--color-accent-inti)] hover:text-[var(--color-accent-hover)] hover:underline"
          >
            Go to login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-canvas)] p-4">
      <div className="future-panel relative w-full max-w-md space-y-8 rounded-[1.5rem] p-6 pt-20 shadow-[var(--shadow-soft)] sm:p-8 sm:pt-20">
        <div className="absolute top-4 right-4">
          <ThemeToggle />
        </div>
        <BrandMark size="lg" preload className="justify-center" textClassName="text-center" />

        <div className="text-center">
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
            Create your account
          </h1>
          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
            Invited as <strong>{invitation.email}</strong> ·{' '}
            {(
              {
                publisher: 'Publisher',
                admin: 'Admin',
                super_admin: 'Super admin',
                owner: 'Owner',
              } as Record<string, string>
            )[invitation.role] ?? invitation.role}
          </p>
        </div>

        {error && (
          <div className="rounded-xl bg-[var(--color-status-rejected-bg)] px-4 py-3 text-center text-sm text-[var(--color-status-rejected-text)]">
            {error}
          </div>
        )}

        <form action={completeRegistration} className="space-y-4">
          <input type="hidden" name="token" value={token} />

          <div className="space-y-1.5">
            <label
              htmlFor="display_name"
              className="block text-sm font-medium text-[var(--color-text-secondary)]"
            >
              Display Name
            </label>
            <input
              id="display_name"
              name="display_name"
              type="text"
              required
              placeholder="Your full name"
              className="input-inti w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2.5 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="password"
              className="block text-sm font-medium text-[var(--color-text-secondary)]"
            >
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              minLength={8}
              placeholder="At least 8 characters"
              className="input-inti w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2.5 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none"
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-xl bg-[var(--color-accent)] py-2.5 text-sm font-semibold text-[var(--color-on-accent)] transition-colors hover:bg-[var(--color-accent-hover)]"
          >
            Create account
          </button>
        </form>

        <p className="text-center text-xs text-[var(--color-text-muted)]">
          Already have an account?{' '}
          <Link
            href="/login"
            className="text-[var(--color-accent-inti)] hover:text-[var(--color-accent-hover)] hover:underline"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
