import Link from 'next/link'
import { LockKeyhole, Mail } from 'lucide-react'
import { BrandMark } from '@/components/layout/BrandMark'
import { ThemeToggle } from '@/components/layout/ThemeToggle'
import { BackNavButton } from '@/components/navigation/BackNavButton'
import { login } from './actions'

export const metadata = { title: 'Sign In' }

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; registered?: string }>
}) {
  const { error, registered } = await searchParams

  return (
    <main id="main-content" className="relative w-[min(1200px,calc(100vw-2rem))]">
      <div
        data-testid="login-card"
        className="animate-fade-up relative grid min-h-[min(640px,calc(100dvh-1.5rem))] w-full overflow-hidden rounded-[1.75rem] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[0_24px_90px_rgba(30,26,23,0.14)] md:min-h-[720px] lg:h-[800px] lg:grid-cols-[1.08fr_0.92fr]"
      >
        <BackNavButton
          aria-label="Go back"
          className="absolute top-4 left-4 z-20 sm:top-5 sm:left-5"
        />
        <div className="absolute top-4 right-4 z-20 sm:top-5 sm:right-5">
          <ThemeToggle />
        </div>

        <section className="relative flex flex-col justify-between gap-5 bg-[linear-gradient(140deg,var(--color-surface-elevated),var(--color-surface)_58%,var(--color-accent-surface))] px-6 py-6 pt-20 sm:gap-10 sm:px-10 sm:py-10 sm:pt-24 lg:px-14 lg:py-14">
          <div
            className="absolute inset-0 bg-[radial-gradient(circle_at_20%_18%,color-mix(in_oklab,var(--color-accent-inti)_13%,transparent),transparent_24%),radial-gradient(circle_at_88%_82%,color-mix(in_oklab,var(--color-gold)_12%,transparent),transparent_26%)]"
            aria-hidden="true"
          />
          <div className="relative">
            <BrandMark size="xl" preload className="gap-4" textClassName="block" />
          </div>

          <div className="relative max-w-[34rem]">
            <h1 className="font-display text-4xl leading-none font-semibold tracking-tight text-[var(--color-text-primary)] sm:text-6xl lg:text-7xl">
              Welcome back
            </h1>
            <p className="mt-4 hidden text-base leading-7 text-[var(--color-text-secondary)] sm:block sm:text-lg lg:mt-5">
              Sign in to post notices, review submissions, and keep campus informed.
            </p>
          </div>

          <p className="hidden text-xs font-semibold tracking-[0.22em] text-[var(--color-text-muted)] uppercase sm:block">
            Independent campus publishing workspace
          </p>
        </section>

        <section className="flex flex-col justify-center px-6 py-6 sm:px-10 sm:py-10 lg:px-14">
          <div className="mx-auto w-full max-w-[27rem]">
            <div className="mb-7">
              <h2 className="text-2xl font-semibold tracking-tight text-[var(--color-text-primary)]">
                Sign in
              </h2>
              <p className="mt-2 text-sm leading-6 text-[var(--color-text-muted)]">
                Use your Bulletin username or email address.
              </p>
            </div>

            {error && (
              <div
                className="mb-5 rounded-lg border border-[var(--color-status-rejected-text)]/25 bg-[var(--color-status-rejected-bg)] px-4 py-3 text-sm text-[var(--color-status-rejected-text)]"
                role="alert"
                aria-live="polite"
              >
                {error === 'too_many_attempts'
                  ? 'Too many attempts. Please wait a moment and try again.'
                  : error === 'profile_missing'
                    ? 'Your account is not fully set up. Contact your administrator.'
                    : 'Invalid email, username, or password. Please try again.'}
              </div>
            )}

            {registered && (
              <output
                className="mb-5 block rounded-lg border border-[var(--color-status-published-text)]/25 bg-[var(--color-status-published-bg)] px-4 py-3 text-sm text-[var(--color-status-published-text)]"
                aria-live="polite"
              >
                Account created. Sign in with your new credentials.
              </output>
            )}

            <form action={login} className="flex flex-col gap-4">
              <div className="relative">
                <label htmlFor="email" className="sr-only">
                  Email or username
                </label>
                <Mail
                  size={18}
                  strokeWidth={1.8}
                  className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-[var(--color-text-muted)]"
                  aria-hidden="true"
                />
                <input
                  id="email"
                  name="email"
                  type="text"
                  required
                  autoComplete="username"
                  placeholder="Email or username"
                  className="input-inti h-14 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 pl-12 text-base text-[var(--color-text-primary)] transition-[border-color,box-shadow,background] duration-200 outline-none placeholder:text-[var(--color-text-muted)]"
                />
              </div>

              <div className="relative">
                <label htmlFor="password" className="sr-only">
                  Password
                </label>
                <LockKeyhole
                  size={18}
                  strokeWidth={1.8}
                  className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-[var(--color-text-muted)]"
                  aria-hidden="true"
                />
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  autoComplete="current-password"
                  placeholder="Password"
                  className="input-inti h-14 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 pl-12 text-base text-[var(--color-text-primary)] transition-[border-color,box-shadow,background] duration-200 outline-none placeholder:text-[var(--color-text-muted)]"
                />
              </div>

              <button
                type="submit"
                className="mt-1 h-14 w-full cursor-pointer rounded-xl bg-[var(--color-accent-inti)] text-base font-semibold text-[var(--color-on-accent)] shadow-[0_12px_30px_color-mix(in_oklab,var(--color-accent-inti)_28%,transparent)] transition-[transform,background,box-shadow] duration-200 hover:-translate-y-0.5 hover:bg-[var(--color-accent-hover)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-inti)]/50 active:translate-y-0 active:scale-[0.99]"
              >
                Sign in
              </button>
            </form>

            <Link
              href="/forgot-password"
              className="mt-5 inline-flex w-full items-center justify-center rounded-xl p-3 text-sm font-semibold text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-surface-elevated)] hover:text-[var(--color-text-primary)]"
            >
              Forgot password?
            </Link>
          </div>
        </section>
      </div>
    </main>
  )
}
