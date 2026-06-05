'use client'

import { useEffect, useRef, useState, type SyntheticEvent } from 'react'
import { KeyRound, X } from 'lucide-react'
import { GlassCard } from '@/components/dashboard/GlassCard'
import { TEMPORARY_PASSWORD_MIN_LENGTH } from '@/lib/auth/password-policy'
import { resetUserPassword } from './actions'

type UserInfo = { id: string; display_name: string }

function ResetModal({ user, closeModal }: { user: UserInfo; closeModal: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const firstFocusRef = useRef<HTMLInputElement>(null)
  const previousFocusedElementRef = useRef<HTMLElement | null>(null)
  const titleId = `reset-password-title-${user.id}`
  const passwordId = `temp-password-${user.id}`

  useEffect(() => {
    previousFocusedElementRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null

    const dialog = dialogRef.current
    if (dialog && !dialog.open) {
      dialog.showModal()
    }

    const frame = window.requestAnimationFrame(() => firstFocusRef.current?.focus())

    return () => {
      window.cancelAnimationFrame(frame)
      if (dialog?.open) {
        dialog.close()
      }
      if (
        previousFocusedElementRef.current &&
        document.contains(previousFocusedElementRef.current)
      ) {
        previousFocusedElementRef.current.focus()
      }
    }
  }, [])

  function handleDialogCancel(event: SyntheticEvent<HTMLDialogElement>) {
    event.preventDefault()
    closeModal()
  }

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      onCancel={handleDialogCancel}
      className="fixed inset-0 z-50 m-0 h-full max-h-none w-full max-w-none bg-transparent p-4 text-[var(--color-text-primary)] backdrop:bg-[color-mix(in_oklab,var(--color-text-primary)_50%,transparent)] backdrop:backdrop-blur-sm"
    >
      <div className="flex min-h-full items-center justify-center">
        <GlassCard hover={false} className="w-full max-w-md space-y-4 p-6">
          <div className="flex items-center justify-between">
            <h2 id={titleId} className="font-semibold text-[var(--color-text-primary)]">
              Reset Password
            </h2>
            <button
              type="button"
              onClick={closeModal}
              className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-surface-elevated)] hover:text-[var(--color-text-primary)]"
              aria-label="Close"
            >
              <X size={16} aria-hidden="true" />
            </button>
          </div>
          <p className="text-sm text-[var(--color-text-secondary)]">
            Set a temporary password for <strong>{user.display_name}</strong>. They will be required
            to change it on next login.
          </p>
          <form action={resetUserPassword} className="space-y-4">
            <input type="hidden" name="user_id" value={user.id} />
            <div className="space-y-1.5">
              <label
                htmlFor={passwordId}
                className="block text-sm font-medium text-[var(--color-text-secondary)]"
              >
                Temporary Password
              </label>
              <input
                ref={firstFocusRef}
                id={passwordId}
                name="temp_password"
                type="text"
                required
                minLength={TEMPORARY_PASSWORD_MIN_LENGTH}
                placeholder={`At least ${TEMPORARY_PASSWORD_MIN_LENGTH} characters`}
                className="input-inti w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2.5 font-mono text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none"
              />
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={closeModal}
                className="min-h-11 flex-1 rounded-xl border border-[var(--color-border)] px-4 text-sm font-medium text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-surface-elevated)]"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="min-h-11 flex-1 rounded-xl bg-[var(--color-accent)] px-4 text-sm font-semibold text-white transition-colors hover:bg-[var(--color-accent-hover)]"
              >
                Reset Password
              </button>
            </div>
          </form>
        </GlassCard>
      </div>
    </dialog>
  )
}

export function ResetButton({ user }: { user: UserInfo }) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-accent-surface)] hover:text-[var(--color-accent)]"
      >
        <KeyRound size={13} aria-hidden="true" /> Reset password
      </button>
      {open && <ResetModal user={user} closeModal={() => setOpen(false)} />}
    </>
  )
}
