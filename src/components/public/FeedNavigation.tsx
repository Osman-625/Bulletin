'use client'

import { createContext, use, useCallback, useMemo, useTransition } from 'react'
import { useRouter } from 'next/navigation'

import type { ReactNode } from 'react'

type FeedNavigationValue = {
  isPending: boolean
  navigate: (href: string, options?: { scroll?: boolean }) => void
}

const FeedNavigationContext = createContext<FeedNavigationValue | null>(null)

// Filter, sort, and pagination changes navigate inside one shared transition so
// the already-rendered board (hero, search, cards) stays visible instead of the
// route-level loading skeleton, while `isPending` scopes feedback to the feed.
export function FeedNavigationProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const navigate = useCallback(
    (href: string, options?: { scroll?: boolean }) => {
      startTransition(() => {
        router.push(href, { scroll: options?.scroll ?? false })
      })
    },
    [router]
  )

  const value = useMemo(() => ({ isPending, navigate }), [isPending, navigate])

  return <FeedNavigationContext.Provider value={value}>{children}</FeedNavigationContext.Provider>
}

export function useFeedNavigation(): FeedNavigationValue {
  const context = use(FeedNavigationContext)
  const router = useRouter()

  const fallbackNavigate = useCallback(
    (href: string, options?: { scroll?: boolean }) => {
      router.push(href, { scroll: options?.scroll ?? false })
    },
    [router]
  )

  return context ?? { isPending: false, navigate: fallbackNavigate }
}
