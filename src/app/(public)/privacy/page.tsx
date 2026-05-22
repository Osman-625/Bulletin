import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Privacy',
  description: 'How Bulletin handles campus announcement data and public analytics.',
}

export default function PrivacyPage() {
  return (
    <main id="main-content" className="future-warm-plane min-h-[72dvh] px-4 py-10 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-[860px] rounded-[1.35rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-soft)] sm:p-8">
        <p className="future-kicker">Privacy</p>
        <h1 className="font-display mt-3 text-4xl leading-tight font-bold text-[var(--color-text-primary)] sm:text-5xl">
          Bulletin keeps public browsing simple.
        </h1>
        <div className="mt-6 grid gap-5 text-base leading-8 text-[var(--color-text-muted)]">
          <p>
            Public announcement pages can be viewed without signing in. Bulletin tracks basic
            announcement views so campus publishers can understand which notices are being read.
          </p>
          <p>
            Account, publishing, review, and audit data is used to operate the announcement
            workflow. Protected workspace data is limited by role-based access and Supabase Row
            Level Security.
          </p>
          <p>For questions about data handling or to report a concern, contact Student Affairs.</p>
        </div>
        <Link
          href="mailto:studentaffairs@newinti.edu.my"
          className="action-lift mt-8 inline-flex min-h-11 items-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-4 text-sm font-semibold text-[var(--color-text-primary)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-inti)]"
        >
          Contact Student Affairs
        </Link>
      </section>
    </main>
  )
}
