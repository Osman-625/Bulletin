'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'

export default function BackButton() {
  const router = useRouter()

  function handleBack() {
    if (window.history.length > 1) {
      router.back()
      return
    }

    router.push('/')
  }

  return (
    <button
      type="button"
      onClick={handleBack}
      className="mb-8 inline-flex min-h-11 items-center gap-2 rounded-[10px] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 text-sm font-medium text-[var(--color-text-muted)] transition-[transform,border-color,color,box-shadow] duration-200 hover:-translate-y-0.5 hover:border-[var(--color-accent-inti)] hover:text-[var(--color-text-primary)] hover:shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-inti)] active:scale-[0.98]"
    >
      <ArrowLeft className="h-4 w-4" />
      Back
    </button>
  )
}
