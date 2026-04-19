type Status = 'draft' | 'published' | 'archived'

const statusStyles: Record<Status, string> = {
  published: 'bg-[var(--color-status-published-bg)] text-[var(--color-status-published-text)]',
  draft: 'bg-[var(--color-status-draft-bg)] text-[var(--color-status-draft-text)]',
  archived: 'bg-[var(--color-status-archived-bg)] text-[var(--color-status-archived-text)]',
}

export function StatusBadge({ status }: { status: Status }) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold font-mono uppercase tracking-wider ${statusStyles[status]}`}
    >
      {status}
    </span>
  )
}
