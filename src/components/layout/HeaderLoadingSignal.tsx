'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import { cn } from '@/shared/utils'

export function HeaderLoadingSignal() {
  const pathname = usePathname()
  const previousPathnameRef = useRef(pathname)
  const [isActive, setIsActive] = useState(false)

  useEffect(() => {
    if (previousPathnameRef.current === pathname) return
    previousPathnameRef.current = pathname

    const startTimer = window.setTimeout(() => setIsActive(true), 0)
    const stopTimer = window.setTimeout(() => setIsActive(false), 600)
    return () => {
      window.clearTimeout(startTimer)
      window.clearTimeout(stopTimer)
    }
  }, [pathname])

  return (
    <div
      className={cn(
        'loading-signal h-1.5 bg-[var(--color-accent-inti)]',
        isActive && 'loading-signal-active'
      )}
      aria-hidden="true"
    />
  )
}
