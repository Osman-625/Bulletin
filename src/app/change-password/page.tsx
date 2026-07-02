import { BrandMark } from '@/components/layout/BrandMark'
import { ThemeToggle } from '@/components/layout/ThemeToggle'
import { PASSWORD_MIN_LENGTH } from '@/modules/auth/password-policy'
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
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
            Set a new password
          </h1>
          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
            You must change your password before continuing.
          </p>
        </div>

        {error && (
          <div className="rounded-xl bg-[var(--color-status-rejected-bg)] px-4 py-3 text-center text-sm text-[var(--color-status-rejected-text)]">
            {error}
          </div>
        )}

        <form action={changePassword} className="space-y-4">
          <div className="space-y-1.5">
            <label
              htmlFor="password"
              className="block text-sm font-medium text-[var(--color-text-secondary)]"
            >
              New Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              minLength={PASSWORD_MIN_LENGTH}
              placeholder={`At least ${PASSWORD_MIN_LENGTH} characters`}
              className="input-inti w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2.5 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none"
            />
          </div>
          <div className="space-y-1.5">
            <label
              htmlFor="confirm"
              className="block text-sm font-medium text-[var(--color-text-secondary)]"
            >
              Confirm Password
            </label>
            <input
              id="confirm"
              name="confirm"
              type="password"
              required
              minLength={PASSWORD_MIN_LENGTH}
              placeholder="Repeat your new password"
              className="input-inti w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2.5 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none"
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-xl bg-[var(--color-accent)] py-2.5 text-sm font-semibold text-[var(--color-on-accent)] transition-colors hover:bg-[var(--color-accent-hover)]"
          >
            Update Password
          </button>
        </form>
      </div>
    </div>
  )
}
