import Link from 'next/link'
import { FileText, Plus } from 'lucide-react'

export function DashboardEmptyState({ hasAnnouncementScope }: { hasAnnouncementScope: boolean }) {
  return (
    <div
      className="rounded-[1.4rem] border border-dashed border-[var(--color-border)] px-5 py-12 text-center"
      role="status"
    >
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-[1rem] bg-[var(--color-accent-surface)] text-[var(--color-accent)]">
        <FileText size={20} aria-hidden="true" />
      </div>
      <h3 className="mt-4 text-base font-semibold text-[var(--color-text-primary)]">
        {hasAnnouncementScope ? 'Nothing published yet' : 'No organization assigned yet'}
      </h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[var(--color-text-muted)]">
        {hasAnnouncementScope
          ? 'Create the first draft for your campus board. Keep the title direct, add a readable summary, then send it for review.'
          : 'Ask an admin to assign your publisher account to an organization before drafting announcements.'}
      </p>
      {hasAnnouncementScope && (
        <Link
          href="/dashboard/announcements/new"
          className="action-lift mt-5 inline-flex min-h-11 items-center gap-2 rounded-[0.95rem] bg-[var(--color-accent)] px-4 text-sm font-semibold text-white shadow-[var(--shadow-button)]"
        >
          <Plus size={16} aria-hidden="true" />
          Create announcement
        </Link>
      )}
    </div>
  )
}
