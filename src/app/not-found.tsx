import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="flex min-h-[100dvh] items-center justify-center bg-[var(--color-canvas)] px-6 py-16 text-center">
      <div className="w-full max-w-md rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-10 shadow-[var(--shadow-soft)]">
        <p className="text-xs font-semibold tracking-[0.22em] text-[var(--color-accent-inti)] uppercase">
          404
        </p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-[var(--color-text-primary)]">
          Page not found
        </h1>
        <p className="mt-3 text-sm leading-6 text-[var(--color-text-muted)]">
          This page may have moved, expired, or requires access from a different workspace.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex min-h-11 items-center justify-center rounded-xl bg-[var(--color-accent-inti)] px-5 text-sm font-semibold text-white transition-transform active:scale-[0.98]"
        >
          Back to Bulletin
        </Link>
      </div>
    </main>
  )
}
