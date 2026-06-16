import Link from 'next/link'
import { ArrowLeft, Mail } from 'lucide-react'
import { BrandMark } from '@/components/layout/BrandMark'
import { ThemeToggle } from '@/components/layout/ThemeToggle'
import { BackNavButton } from '@/components/navigation/BackNavButton'
import { requestPasswordReset } from './actions'

export const metadata = { title: 'Forgot Password - Bulletin' }

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ sent?: string }>
}) {
  const { sent } = await searchParams

  return (
    <main id="main-content" className="relative w-full max-w-[22rem]">
      <div className="animate-fade-up relative overflow-hidden rounded-[1.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-8 pt-20 shadow-[var(--shadow-soft)]">
        <BackNavButton
          aria-label="Go back"
          fallbackHref="/login"
          className="absolute top-4 left-4 z-20"
        />
        <div className="absolute top-4 right-4 z-20">
          <ThemeToggle />
        </div>

        <div className="mb-6 flex flex-col items-center gap-4">
          <BrandMark size="lg" showText={false} preload />

          <div className="text-center">
            <h1 className="font-sans text-xl font-semibold tracking-[-0.02em] text-[var(--color-text-primary)]">
              Forgot your password?
            </h1>
            <p className="mt-1 text-xs leading-5 text-[var(--color-text-muted)]">
              Enter your email and we&apos;ll pass your reset request to an administrator.
            </p>
          </div>
        </div>

        {sent ? (
          <output className="block rounded-lg border border-[var(--color-status-published-text)]/25 bg-[var(--color-status-published-bg)] p-3 text-xs leading-5 text-[var(--color-status-published-text)]">
            If this email belongs to a Bulletin account, your request has been submitted. An
            administrator will be in touch.
          </output>
        ) : (
          <form action={requestPasswordReset} className="flex flex-col gap-3">
            <div className="relative">
              <label htmlFor="email" className="sr-only">
                Email address
              </label>
              <Mail
                size={15}
                strokeWidth={1.8}
                className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-[var(--color-text-muted)]"
                aria-hidden="true"
              />
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="Email address"
                className="input-inti h-11 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 pl-9 text-sm text-[var(--color-text-primary)] transition-[border-color,box-shadow,background] duration-200 outline-none placeholder:text-[var(--color-text-muted)]"
              />
            </div>

            <button
              type="submit"
              className="h-11 w-full cursor-pointer rounded-lg bg-[var(--color-accent-inti)] text-sm font-semibold text-[var(--color-on-accent)] shadow-[0_8px_24px_color-mix(in_oklab,var(--color-accent-inti)_30%,transparent)] transition-[transform,background,box-shadow] duration-200 hover:-translate-y-0.5 hover:bg-[var(--color-accent-hover)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-inti)]/50 active:translate-y-0 active:scale-[0.99]"
            >
              Request reset
            </button>
          </form>
        )}

        <Link
          href="/login"
          className="mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg px-3 text-xs font-semibold text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-surface-elevated)] hover:text-[var(--color-text-primary)]"
        >
          <ArrowLeft size={14} aria-hidden="true" />
          Back to sign in
        </Link>
      </div>
    </main>
  )
}
