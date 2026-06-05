'use client'

import { Loader2 } from 'lucide-react'

export type AutosaveStatus = 'idle' | 'saving' | 'saved' | 'error'

interface AutosaveIndicatorProps {
  saveState: AutosaveStatus
}

export function AutosaveIndicator({ saveState }: AutosaveIndicatorProps) {
  if (saveState === 'idle') return null

  if (saveState === 'saving') {
    return (
      <span className="flex items-center gap-1.5 font-mono text-xs text-[var(--color-text-muted)]">
        <Loader2 size={12} className="animate-spin" />
        Saving…
      </span>
    )
  }

  if (saveState === 'saved') {
    return (
      <span className="font-mono text-xs text-[var(--color-text-muted)] transition-opacity duration-300">
        Saved ✓
      </span>
    )
  }

  if (saveState === 'error') {
    return <span className="font-mono text-xs text-[var(--color-destructive)]">Save failed</span>
  }

  return null
}
