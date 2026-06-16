'use client'

import { useFeedNavigation } from './FeedNavigation'

export function FeedPendingStatus() {
  const { isPending } = useFeedNavigation()

  if (!isPending) return null

  return (
    <p
      role="status"
      className="feed-pending-indicator inline-flex min-h-8 items-center gap-2 rounded-[10px] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-xs font-semibold text-[var(--color-text-primary)] shadow-[var(--shadow-soft)]"
    >
      <span
        className="size-2 animate-pulse rounded-full bg-[var(--color-accent-inti)]"
        aria-hidden="true"
      />
      Updating notices...
    </p>
  )
}
