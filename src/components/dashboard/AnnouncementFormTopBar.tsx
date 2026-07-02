'use client'

import { useRef, type SyntheticEvent } from 'react'
import { Trash2 } from 'lucide-react'
import { BackNavButton } from '@/components/navigation/BackNavButton'

export type DeleteAnnouncementHandler = (closeAfterError: () => void) => void

export function AnnouncementFormTopBar({
  backHref,
  isPending,
  onDelete,
}: {
  backHref: string
  isPending: boolean
  onDelete?: DeleteAnnouncementHandler
}) {
  const deleteDialogRef = useRef<HTMLDialogElement | null>(null)
  const deleteCancelRef = useRef<HTMLButtonElement | null>(null)
  const deleteTriggerRef = useRef<HTMLButtonElement | null>(null)

  function openDeleteDialog() {
    const dialog = deleteDialogRef.current
    if (!dialog || dialog.open) return

    dialog.showModal()
    window.setTimeout(() => {
      deleteCancelRef.current?.focus()
    }, 0)
  }

  function closeDeleteDialog() {
    const dialog = deleteDialogRef.current
    if (dialog?.open) {
      dialog.close()
    }

    window.setTimeout(() => {
      deleteTriggerRef.current?.focus()
    }, 0)
  }

  function handleDeleteDialogCancel(event: SyntheticEvent<HTMLDialogElement>) {
    event.preventDefault()
    closeDeleteDialog()
  }

  return (
    <div className="mx-auto flex w-full max-w-[82rem] items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
      <BackNavButton
        fallbackHref={backHref}
        className="min-w-0 rounded-lg border-transparent bg-transparent px-0 text-sm text-[var(--color-text-secondary)] shadow-none hover:border-transparent hover:bg-transparent hover:text-[var(--color-text-primary)] hover:shadow-none"
      >
        Back to announcements
      </BackNavButton>

      {onDelete && (
        <div className="relative">
          <button
            ref={deleteTriggerRef}
            type="button"
            onClick={openDeleteDialog}
            className="flex min-h-11 items-center gap-1.5 rounded-lg text-xs text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-destructive)]"
          >
            <Trash2 size={14} aria-hidden="true" />
            Delete
          </button>
          <dialog
            ref={deleteDialogRef}
            aria-labelledby="delete-announcement-title"
            aria-describedby="delete-announcement-description"
            onCancel={handleDeleteDialogCancel}
            className="m-0 rounded-xl border border-[var(--color-destructive)]/30 bg-[var(--color-surface)] p-2 text-[var(--color-text-primary)] shadow-[var(--shadow-soft)] backdrop:bg-[color-mix(in_oklab,var(--color-text-primary)_30%,transparent)]"
          >
            <div className="flex flex-wrap items-center gap-2">
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
                onClick={() => onDelete(closeDeleteDialog)}
                disabled={isPending}
                className="min-h-11 rounded-lg bg-[var(--color-destructive)] px-3 text-xs font-medium text-[var(--color-surface)] transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {isPending ? 'Deleting...' : 'Confirm'}
              </button>
              <button
                ref={deleteCancelRef}
                type="button"
                onClick={closeDeleteDialog}
                className="min-h-11 rounded-lg border border-[var(--color-glass-border)] px-3 text-xs font-medium text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-surface-elevated)]"
              >
                Cancel
              </button>
            </div>
          </dialog>
        </div>
      )}
    </div>
  )
}
