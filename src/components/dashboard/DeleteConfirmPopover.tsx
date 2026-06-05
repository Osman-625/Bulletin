'use client'

import { Trash2 } from 'lucide-react'

interface DeleteConfirmPopoverProps {
  showDeleteConfirm: boolean
  isPending: boolean
  deleteConfirmRef: React.RefObject<HTMLDivElement | null>
  deleteCancelRef: React.RefObject<HTMLButtonElement | null>
  deleteTriggerRef: React.RefObject<HTMLButtonElement | null>
  onOpen: () => void
  onClose: () => void
  onConfirm: () => void
}

export function DeleteConfirmPopover({
  showDeleteConfirm,
  isPending,
  deleteConfirmRef,
  deleteCancelRef,
  deleteTriggerRef,
  onOpen,
  onClose,
  onConfirm,
}: DeleteConfirmPopoverProps) {
  return (
    <div className="relative">
      {showDeleteConfirm ? (
        <div
          ref={deleteConfirmRef}
          aria-labelledby="delete-announcement-title"
          aria-describedby="delete-announcement-description"
          className="flex flex-wrap items-center gap-2 rounded-xl border border-[var(--color-destructive)]/30 bg-[var(--color-surface)] p-2 shadow-[var(--shadow-soft)]"
        >
          <span
            id="delete-announcement-title"
            className="text-xs font-semibold text-[var(--color-destructive)]"
          >
            Delete this?
          </span>
          <span id="delete-announcement-description" className="sr-only">
            This permanently deletes the announcement and cannot be undone.
          </span>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isPending}
            className="min-h-11 rounded-lg bg-[var(--color-destructive)] px-3 text-xs font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {isPending ? 'Deleting…' : 'Confirm'}
          </button>
          <button
            ref={deleteCancelRef}
            type="button"
            onClick={onClose}
            className="min-h-11 rounded-lg border border-[var(--color-glass-border)] px-3 text-xs font-medium text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-surface-elevated)]"
          >
            Cancel
          </button>
        </div>
      ) : (
        <button
          ref={deleteTriggerRef}
          type="button"
          onClick={onOpen}
          className="flex min-h-11 items-center gap-1.5 rounded-lg text-xs text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-destructive)]"
        >
          <Trash2 size={14} aria-hidden="true" />
          Delete
        </button>
      )}
    </div>
  )
}
