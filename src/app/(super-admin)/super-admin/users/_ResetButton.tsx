'use client'

import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { KeyRound, X } from 'lucide-react'
import { GlassCard } from '@/components/dashboard/GlassCard'
import { resetUserPassword } from './actions'

type UserInfo = { id: string; display_name: string }

function ResetModal({ user, onClose }: { user: UserInfo; onClose: () => void }) {
  const dialogRef = useRef<HTMLDivElement>(null)
  const firstFocusRef = useRef<HTMLInputElement>(null)
  const previousFocusedElementRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    previousFocusedElementRef.current = document.activeElement as HTMLElement | null
    const frame = window.requestAnimationFrame(() => firstFocusRef.current?.focus())

    return () => {
      window.cancelAnimationFrame(frame)
      previousFocusedElementRef.current?.focus()
    }
  }, [])

  function handleDialogKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Escape') {
      event.preventDefault()
      onClose()
      return
    }

    if (event.key === 'Tab') {
      const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
      if (!focusable?.length) return

      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }
  }

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="reset-password-title"
      onKeyDown={handleDialogKeyDown}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
    >
      <GlassCard hover={false} className="w-full max-w-md space-y-4 p-6">
        <div className="flex items-center justify-between">
          <h2 id="reset-password-title" className="font-semibold text-[var(--color-text-primary)]">
            Reset Password
          </h2>
          <button
            onClick={onClose}
            className="text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text-primary)]"
            aria-label="Close"
          >
            <X size={16} />
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
              htmlFor="temp_password"
              className="block text-sm font-medium text-[var(--color-text-secondary)]"
            >
              Temporary Password
            </label>
            <input
              ref={firstFocusRef}
              id="temp_password"
              name="temp_password"
              type="text"
              required
              minLength={8}
              placeholder="At least 8 characters"
              className="input-inti w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2.5 font-mono text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none"
            />
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-[var(--color-border)] py-2.5 text-sm font-medium text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-surface-elevated)]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 rounded-xl bg-[var(--color-accent)] py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--color-accent-hover)]"
            >
              Reset Password
            </button>
          </div>
        </form>
      </GlassCard>
    </div>
  )
}

export function ResetButton({ user }: { user: UserInfo }) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-accent-surface)] hover:text-[var(--color-accent)]"
      >
        <KeyRound size={13} /> Reset password
      </button>
      {open && <ResetModal user={user} onClose={() => setOpen(false)} />}
    </>
  )
}
