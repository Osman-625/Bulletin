import { login } from './actions'
import { GlassCard } from '@/components/dashboard/GlassCard'
import { SubmitButton } from '@/components/dashboard/SubmitButton'

export const metadata = { title: 'Sign In' }

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error } = await searchParams
  const hasError = error === 'invalid_credentials'

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <GlassCard hover={false} className="animate-fade-up w-full max-w-[440px] p-10">
        {/* Wordmark */}
        <p className="text-[10px] font-sans uppercase tracking-widest text-[var(--color-accent)]">
          BULLETIN
        </p>
        <p className="text-[10px] text-[var(--color-text-muted)] mt-0.5">
          INTI International University
        </p>

        {/* Divider */}
        <div className="border-t border-[var(--color-border)] my-6" />

        {/* Heading */}
        <h1 className="text-xl font-semibold text-[var(--color-text-primary)]">Sign in</h1>
        <p className="text-sm text-[var(--color-text-secondary)] mt-1 mb-6">
          Publisher access for INTI organizations
        </p>

        <form action={login}>
          {/* Email */}
          <div>
            <label
              htmlFor="email"
              className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1.5"
            >
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder="you@example.com"
              className="w-full px-4 py-3 rounded-xl text-sm bg-[var(--color-surface-elevated)] border border-[var(--color-border)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/40 focus:border-[var(--color-accent)]/60 transition-all duration-200"
            />
          </div>

          {/* Password */}
          <div className="mt-4">
            <label
              htmlFor="password"
              className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1.5"
            >
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              placeholder="••••••••"
              className="w-full px-4 py-3 rounded-xl text-sm bg-[var(--color-surface-elevated)] border border-[var(--color-border)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/40 focus:border-[var(--color-accent)]/60 transition-all duration-200"
            />
          </div>

          {/* Error */}
          {hasError && (
            <p className="mt-3 text-sm text-[var(--color-destructive)]" role="alert">
              Invalid email or password. Please try again.
            </p>
          )}

          {/* Submit */}
          <div className="mt-6">
            <SubmitButton />
          </div>
        </form>
      </GlassCard>
    </div>
  )
}
