import Image from 'next/image'
import Link from 'next/link'
import { LockKeyhole, Mail } from 'lucide-react'
import { login } from './actions'

export const metadata = { title: 'Sign In' }

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; registered?: string }>
}) {
  const { error, registered } = await searchParams

  return (
    <main className="relative w-[min(1200px,calc(100vw-2rem))]">
      <div
        data-testid="login-card"
        className="animate-fade-up relative grid min-h-[min(620px,calc(100dvh-1.5rem))] w-full overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-soft)] md:min-h-[720px] lg:h-[800px] lg:grid-cols-[1.08fr_0.92fr]"
      >
        {/* Top edge highlight */}
        <div
          className="absolute inset-x-0 top-0 h-px bg-[var(--color-border-subtle)]"
          aria-hidden="true"
        />

        <section className="flex flex-col justify-between gap-5 bg-[var(--color-surface-elevated)] px-6 py-6 sm:gap-10 sm:px-10 sm:py-10 lg:px-14 lg:py-14">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-button)] sm:h-24 sm:w-24 lg:h-32 lg:w-32">
              <Image
                src="/bulletin_logo.png"
                alt="Bulletin"
                width={112}
                height={112}
                className="h-12 w-12 object-contain sm:h-16 sm:w-16 lg:h-24 lg:w-24"
                priority
              />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold tracking-[0.28em] text-[var(--color-accent-inti)] uppercase">
                Bulletin
              </p>
              <p className="mt-2 max-w-[20rem] text-sm leading-6 text-[var(--color-text-muted)] sm:text-base">
                INTI International University
              </p>
            </div>
          </div>

          <div className="max-w-[34rem]">
            <h1 className="font-display text-4xl leading-none font-semibold tracking-tight text-[var(--color-text-primary)] sm:text-6xl lg:text-7xl">
              Welcome back
            </h1>
            <p className="mt-4 hidden text-base leading-7 text-[var(--color-text-secondary)] sm:block sm:text-lg lg:mt-5">
              Sign in to manage announcements, approvals, and campus communications.
            </p>
          </div>

          <p className="hidden text-xs font-semibold tracking-[0.22em] text-[var(--color-text-muted)] uppercase sm:block">
            Authorized personnel only
          </p>
        </section>

        <section className="flex flex-col justify-center px-6 py-6 sm:px-10 sm:py-10 lg:px-14">
          <div className="mx-auto w-full max-w-[27rem]">
            <div className="mb-7">
              <h2 className="text-2xl font-semibold tracking-tight text-[var(--color-text-primary)]">
                Sign in
              </h2>
              <p className="mt-2 text-sm leading-6 text-[var(--color-text-muted)]">
                Use your Bulletin account credentials.
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
                    ? 'This account is missing a Bulletin profile. Contact a super admin.'
                    : 'Invalid email, username, or password. Please try again.'}
              </div>
            )}

            {registered && (
              <div
                className="mb-5 rounded-lg border border-[var(--color-status-published-text)]/25 bg-[var(--color-status-published-bg)] px-4 py-3 text-sm text-[var(--color-status-published-text)]"
                role="status"
                aria-live="polite"
              >
                Account created. Sign in with your new credentials.
              </div>
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
                className="mt-1 h-14 w-full cursor-pointer rounded-xl bg-[var(--color-accent-inti)] text-base font-semibold text-white shadow-[0_12px_30px_color-mix(in_oklab,var(--color-accent-inti)_28%,transparent)] transition-[transform,background,box-shadow] duration-200 hover:-translate-y-0.5 hover:bg-[var(--color-accent-hover)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-inti)]/50 active:translate-y-0 active:scale-[0.99]"
              >
                Sign in
              </button>
            </form>

            <Link
              href="/forgot-password"
              className="mt-5 inline-flex w-full items-center justify-center rounded-xl px-3 py-3 text-sm font-semibold text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-surface-elevated)] hover:text-[var(--color-text-primary)]"
            >
              Forgot password?
            </Link>

            <p className="mt-8 text-center text-xs text-[var(--color-text-muted)]">
              Bulletin System
            </p>
          </div>
        </section>
      </div>
    </main>
  )
}
