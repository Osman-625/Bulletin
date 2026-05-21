'use client'

import type { ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { cn } from '@/lib/utils'

type BackNavButtonProps = {
  fallbackHref?: string
  className?: string
  children?: ReactNode
  'aria-label'?: string
}

type HistoryStateWithIndex = {
  idx?: unknown
}

export function BackNavButton({
  fallbackHref = '/',
  className,
  children,
  'aria-label': ariaLabel,
}: BackNavButtonProps) {
  const router = useRouter()
  const resolvedAriaLabel = ariaLabel ?? (children ? undefined : 'Go back')

  function hasKnownExternalReferrer() {
    if (!document.referrer) return false

    try {
      return new URL(document.referrer).origin !== window.location.origin
    } catch {
      return true
    }
  }

  function hasInternalHistoryState() {
    const state = window.history.state as HistoryStateWithIndex | null
    return typeof state?.idx === 'number' && state.idx > 0
  }

  function canUseBrowserBack() {
    if (hasInternalHistoryState()) return true
    return window.history.length > 1 && !hasKnownExternalReferrer()
  }

  function handleBack() {
    if (canUseBrowserBack()) {
      router.back()
      return
    }

    router.push(fallbackHref)
  }

  return (
    <button
      type="button"
      aria-label={resolvedAriaLabel}
      onClick={handleBack}
      className={cn(
        'inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-muted)] shadow-[var(--shadow-button)]',
        'transition-[transform,background,border-color,color,box-shadow] duration-200 ease-[var(--ease-ui)] hover:-translate-y-0.5 hover:border-[var(--color-accent-inti)] hover:bg-[var(--color-surface-elevated)] hover:text-[var(--color-text-primary)] hover:shadow-[var(--shadow-button-hover)] active:scale-[0.98]',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-inti)]',
        className
      )}
    >
      <ArrowLeft className="h-4 w-4" aria-hidden="true" />
      {children ? <span className="ml-2">{children}</span> : null}
    </button>
  )
}
