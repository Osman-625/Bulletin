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

export function BackNavButton({
  fallbackHref = '/',
  className,
  children,
  'aria-label': ariaLabel = 'Go back',
}: BackNavButtonProps) {
  const router = useRouter()

  function handleBack() {
    if (window.history.length > 1) {
      router.back()
      return
    }

    router.push(fallbackHref)
  }

  return (
    <button
      type="button"
      aria-label={ariaLabel}
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
