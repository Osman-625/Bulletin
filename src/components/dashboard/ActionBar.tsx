'use client'

import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import { AutosaveIndicator } from './AutosaveIndicator'
import { StatusBadge } from './StatusBadge'
import type { AutosaveStatus } from './AutosaveIndicator'
import { Loader2 } from 'lucide-react'

interface ActionBarProps {
  status: 'draft' | 'submitted' | 'published' | 'rejected' | 'expired' | 'archived'
  saveState: AutosaveStatus
  isPublished: boolean
  onSaveDraft: () => void
  onPublish: () => void
  onUnpublish?: () => void
  isSaving: boolean
  isPublishing: boolean
  saveLabel?: string
  publishLabel?: string
}

export function ActionBar({
  status,
  saveState,
  isPublished,
  onSaveDraft,
  onPublish,
  onUnpublish,
  isSaving,
  isPublishing,
  saveLabel = 'Save Draft',
  publishLabel = 'Submit for Review',
}: ActionBarProps) {
  const [showUnpublishConfirm, setShowUnpublishConfirm] = useState(false)
  const unpublishConfirmRef = useRef<HTMLDivElement | null>(null)
  const unpublishCancelRef = useRef<HTMLButtonElement | null>(null)
  const unpublishTriggerRef = useRef<HTMLButtonElement | null>(null)

  useEffect(() => {
    if (!showUnpublishConfirm) return

    const focusTimer = window.setTimeout(() => {
      unpublishCancelRef.current?.focus()
    }, 0)

    return () => window.clearTimeout(focusTimer)
  }, [showUnpublishConfirm])

  function closeUnpublishConfirm() {
    setShowUnpublishConfirm(false)

    window.setTimeout(() => {
      unpublishTriggerRef.current?.focus()
    }, 0)
  }

  function handleUnpublishConfirmKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Escape') {
      event.preventDefault()
      closeUnpublishConfirm()
    }
  }

  function handleConfirmUnpublish() {
    if (!onUnpublish) return
    setShowUnpublishConfirm(false)
    onUnpublish()
  }

  return (
    <div
      className={cn(
        'sticky bottom-0 z-20',
        'bg-[var(--color-header-bg)]/95 backdrop-blur-xl',
        'border-t border-[var(--color-border)]',
        'shadow-[0_-10px_30px_rgba(36,24,21,0.06)]',
        'flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6'
      )}
    >
      {/* Left: autosave indicator + status badge */}
      <div className="flex items-center gap-3">
        <AutosaveIndicator saveState={saveState} />
        <StatusBadge status={status} />
      </div>

      {/* Right: action buttons */}
      <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:justify-end">
        {isPublished ? (
          <>
            {onUnpublish &&
              (showUnpublishConfirm ? (
                <div
                  ref={unpublishConfirmRef}
                  role="alertdialog"
                  aria-modal="false"
                  aria-labelledby="unpublish-confirm-title"
                  aria-describedby="unpublish-confirm-description"
                  onKeyDown={handleUnpublishConfirmKeyDown}
                  className="flex w-full flex-col gap-2 rounded-xl border border-[var(--color-destructive)]/30 bg-[var(--color-surface)] p-3 sm:w-auto sm:flex-row sm:items-center"
                >
                  <div className="min-w-0">
                    <p
                      id="unpublish-confirm-title"
                      className="text-sm font-semibold text-[var(--color-text-primary)]"
                    >
                      Unpublish announcement?
                    </p>
                    <p
                      id="unpublish-confirm-description"
                      className="text-xs text-[var(--color-text-muted)]"
                    >
                      Unpublishing will hide this announcement from the public feed.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 sm:ml-2">
                    <button
                      ref={unpublishCancelRef}
                      type="button"
                      onClick={closeUnpublishConfirm}
                      className={cn(
                        'min-h-11 rounded-xl px-4 text-sm font-medium transition-all duration-150',
                        'border border-[var(--color-glass-border)] text-[var(--color-text-secondary)]',
                        'hover:bg-[var(--color-surface-elevated)] active:scale-[0.98]'
                      )}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirmUnpublish}
                      disabled={isPublishing}
                      className={cn(
                        'min-h-11 rounded-xl px-4 text-sm font-medium transition-all duration-150',
                        'bg-[var(--color-destructive)] text-white hover:opacity-90',
                        'active:scale-[0.98]',
                        'disabled:cursor-not-allowed disabled:opacity-50'
                      )}
                    >
                      Unpublish
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  ref={unpublishTriggerRef}
                  type="button"
                  onClick={() => setShowUnpublishConfirm(true)}
                  disabled={isPublishing}
                  className={cn(
                    'min-h-11 rounded-xl px-4 text-sm font-medium transition-all duration-150',
                    'border border-[var(--color-destructive)]/30 text-[var(--color-destructive)]',
                    'hover:bg-[var(--color-destructive)]/10',
                    'active:scale-[0.98]',
                    'disabled:cursor-not-allowed disabled:opacity-50'
                  )}
                >
                  Unpublish
                </button>
              ))}
            <button
              type="button"
              onClick={onSaveDraft}
              disabled={isSaving}
              className={cn(
                'min-h-11 rounded-xl px-5 text-sm font-semibold transition-all duration-150',
                'bg-[var(--color-accent)] text-white',
                'hover:bg-[var(--color-accent-hover)]',
                'active:scale-[0.98]',
                'disabled:cursor-not-allowed disabled:opacity-50',
                'flex items-center gap-2'
              )}
            >
              {isSaving && <Loader2 size={14} className="animate-spin" />}
              Save Changes
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={onSaveDraft}
              disabled={isSaving}
              className={cn(
                'min-h-11 rounded-xl px-4 text-sm font-medium transition-all duration-150',
                'border border-[var(--color-glass-border)] text-[var(--color-text-secondary)]',
                'hover:bg-[var(--color-surface-elevated)]',
                'active:scale-[0.98]',
                'disabled:cursor-not-allowed disabled:opacity-50',
                'flex items-center gap-2'
              )}
            >
              {isSaving && <Loader2 size={14} className="animate-spin" />}
              {saveLabel}
            </button>
            <button
              type="button"
              onClick={onPublish}
              disabled={isPublishing}
              className={cn(
                'min-h-11 rounded-xl px-5 text-sm font-semibold transition-all duration-150',
                'bg-[var(--color-accent)] text-white',
                'hover:bg-[var(--color-accent-hover)]',
                'active:scale-[0.98]',
                'disabled:cursor-not-allowed disabled:opacity-50',
                'flex items-center gap-2'
              )}
            >
              {isPublishing && <Loader2 size={14} className="animate-spin" />}
              {publishLabel}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
