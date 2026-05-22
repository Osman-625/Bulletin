import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Terms',
  description: 'Basic use terms for the Bulletin campus announcement board.',
}

export default function TermsPage() {
  return (
    <main id="main-content" className="future-warm-plane min-h-[72dvh] px-4 py-10 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-[860px] rounded-[1.35rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-soft)] sm:p-8">
        <p className="future-kicker">Terms</p>
        <h1 className="font-display mt-3 text-4xl leading-tight font-bold text-[var(--color-text-primary)] sm:text-5xl">
          Use Bulletin as a campus notice board.
        </h1>
        <div className="mt-6 grid gap-5 text-base leading-8 text-[var(--color-text-muted)]">
          <p>
            Bulletin is intended for campus announcements, student opportunities, events, deadlines,
            and related INTI community notices.
          </p>
          <p>
            Publishers are responsible for submitting accurate content, valid links, and appropriate
            images. Admin review may approve, reject, edit, unpublish, or remove notices that do not
            fit the board.
          </p>
          <p>
            Public readers should verify important dates, registration requirements, and event
            changes with the listed organizer when needed.
          </p>
        </div>
        <Link
          href="/"
          className="action-lift mt-8 inline-flex min-h-11 items-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-4 text-sm font-semibold text-[var(--color-text-primary)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-inti)]"
        >
          Back to board
        </Link>
      </section>
    </main>
  )
}
