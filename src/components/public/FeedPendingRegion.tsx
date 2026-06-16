'use client'

import type { ReactNode } from 'react'
import { useFeedNavigation } from './FeedNavigation'

export function FeedPendingRegion({ children }: { children: ReactNode }) {
  const { isPending } = useFeedNavigation()

  return (
    <div
      className="feed-pending-region"
      data-pending={isPending ? 'true' : undefined}
      aria-busy={isPending}
    >
      {children}
    </div>
  )
}
