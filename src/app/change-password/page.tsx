import { BrandMark } from '@/components/layout/BrandMark'
import { ThemeToggle } from '@/components/layout/ThemeToggle'
import { changePassword } from './actions'

export const metadata = { title: 'Change Password — Bulletin' }

export default async function ChangePasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error } = await searchParams

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-canvas)] p-4">
      <div className="future-panel relative w-full max-w-md space-y-8 rounded-[1.5rem] p-6 pt-20 shadow-[var(--shadow-soft)] sm:p-8 sm:pt-20">
        <div className="absolute top-4 right-4">
          <ThemeToggle />
        </div>
        <BrandMark size="lg" preload className="justify-center" textClassName="text-center" />

        <div className="text-center">
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Set a new password</h1>
          <p className="text-sm text-[var(--color-text-secondary)] mt-1">
            You must change your password before continuing.
          </p>
        </div>

        {error && (
          <div className="px-4 py-3 rounded-xl bg-[var(--color-status-rejected-bg)] text-[var(--color-status-rejected-text)] text-sm text-center">
            {error}
          </div>
        )}

        <form action={changePassword} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="password" className="block text-sm font-medium text-[var(--color-text-secondary)]">New Password</label>
            <input
              id="password"
              name="password"
              type="password"
              required
              minLength={8}
              placeholder="At least 8 characters"
              className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2.5 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none input-inti"
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="confirm" className="block text-sm font-medium text-[var(--color-text-secondary)]">Confirm Password</label>
            <input
              id="confirm"
              name="confirm"
              type="password"
              required
              minLength={8}
              placeholder="Repeat your new password"
              className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2.5 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none input-inti"
            />
          </div>
          <button
            type="submit"
            className="w-full py-2.5 rounded-xl text-sm font-semibold bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white transition-colors"
          >
            Update Password
          </button>
        </form>
      </div>
    </div>
  )
}
