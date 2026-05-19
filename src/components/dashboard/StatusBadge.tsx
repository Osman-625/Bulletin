type Status = 'draft' | 'submitted' | 'published' | 'rejected' | 'expired' | 'archived'

const statusLabels: Record<Status, string> = {
  published: 'Published',
  draft: 'Draft',
  submitted: 'In review',
  rejected: 'Needs edits',
  expired: 'Expired',
  archived: 'Archived',
}

const statusStyles: Record<Status, string> = {
  published: 'bg-[var(--color-status-published-bg)] text-[var(--color-status-published-text)]',
  draft: 'bg-[var(--color-status-draft-bg)] text-[var(--color-status-draft-text)]',
  submitted: 'bg-[var(--color-status-submitted-bg)] text-[var(--color-status-submitted-text)]',
  rejected: 'bg-[var(--color-status-rejected-bg)] text-[var(--color-status-rejected-text)]',
  expired: 'bg-[var(--color-status-expired-bg)] text-[var(--color-status-expired-text)]',
  archived: 'bg-[var(--color-status-archived-bg)] text-[var(--color-status-archived-text)]',
}

export function StatusBadge({ status }: { status: Status }) {
  return (
    <span
      className={`inline-flex items-center rounded-[0.4rem] px-2 py-1 font-mono text-[0.68rem] font-bold tracking-[0.12em] uppercase ${statusStyles[status] ?? statusStyles.draft}`}
    >
      {statusLabels[status]}
    </span>
  )
}
