'use client'

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
  return (
    <div
      className={cn(
        'sticky bottom-0 z-20',
        'bg-[var(--color-surface)]/95 backdrop-blur-sm',
        'border-t border-[var(--color-border)]',
        'py-3 px-6 flex items-center justify-between'
      )}
    >
      {/* Left: autosave indicator + status badge */}
      <div className="flex items-center gap-3">
        <AutosaveIndicator saveState={saveState} />
        <StatusBadge status={status} />
      </div>

      {/* Right: action buttons */}
      <div className="flex items-center gap-2">
        {isPublished ? (
          <>
            {onUnpublish && (
              <button
                type="button"
                onClick={onUnpublish}
                disabled={isPublishing}
                className={cn(
                  'px-4 py-2 rounded-xl text-sm font-medium transition-all duration-150',
                  'border border-[var(--color-destructive)]/30 text-[var(--color-destructive)]',
                  'hover:bg-[var(--color-destructive)]/10',
                  'active:scale-[0.98]',
                  'disabled:opacity-50 disabled:cursor-not-allowed'
                )}
              >
                Unpublish
              </button>
            )}
            <button
              type="button"
              onClick={onSaveDraft}
              disabled={isSaving}
              className={cn(
                'px-5 py-2 rounded-xl text-sm font-semibold transition-all duration-150',
                'bg-[var(--color-accent)] text-white',
                'hover:bg-[var(--color-accent-hover)]',
                'active:scale-[0.98]',
                'disabled:opacity-50 disabled:cursor-not-allowed',
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
                'px-4 py-2 rounded-xl text-sm font-medium transition-all duration-150',
                'border border-[var(--color-glass-border)] text-[var(--color-text-secondary)]',
                'hover:bg-[var(--color-surface-elevated)]',
                'active:scale-[0.98]',
                'disabled:opacity-50 disabled:cursor-not-allowed',
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
                'px-5 py-2 rounded-xl text-sm font-semibold transition-all duration-150',
                'bg-[var(--color-accent)] text-white',
                'hover:bg-[var(--color-accent-hover)]',
                'active:scale-[0.98]',
                'disabled:opacity-50 disabled:cursor-not-allowed',
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
