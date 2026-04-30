'use client'

import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'

export type AutosaveStatus = 'idle' | 'saving' | 'saved' | 'error'

interface AutosaveIndicatorProps {
  saveState: AutosaveStatus
}

export function AutosaveIndicator({ saveState }: AutosaveIndicatorProps) {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    if (saveState === 'saved') {
      setVisible(true)
      const timer = setTimeout(() => setVisible(false), 2000)
      return () => clearTimeout(timer)
    } else {
      setVisible(true)
    }
  }, [saveState])

  if (saveState === 'idle') return null

  if (saveState === 'saving') {
    return (
      <span className="flex items-center gap-1.5 text-xs font-mono text-[var(--color-text-muted)]">
        <Loader2 size={12} className="animate-spin" />
        Saving...
      </span>
    )
  }

  if (saveState === 'saved' && visible) {
    return (
      <span className="text-xs font-mono text-[var(--color-text-muted)] transition-opacity duration-300">
        Saved ✓
      </span>
    )
  }

  if (saveState === 'error') {
    return (
      <span className="text-xs font-mono text-[var(--color-destructive)]">
        Save failed
      </span>
    )
  }

  return null
}
