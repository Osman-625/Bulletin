'use client'

import { useState } from 'react'
import { KeyRound, X } from 'lucide-react'
import { GlassCard } from '@/components/dashboard/GlassCard'
import { resetUserPassword } from './actions'

type UserInfo = { id: string; display_name: string }

function ResetModal({ user, onClose }: { user: UserInfo; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <GlassCard hover={false} className="w-full max-w-md p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-[var(--color-text-primary)]">Reset Password</h2>
          <button onClick={onClose} className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors" aria-label="Close">
            <X size={16} />
          </button>
        </div>
        <p className="text-sm text-[var(--color-text-secondary)]">
          Set a temporary password for <strong>{user.display_name}</strong>. They will be required to change it on next login.
        </p>
        <form action={resetUserPassword} className="space-y-4">
          <input type="hidden" name="user_id" value={user.id} />
          <div className="space-y-1.5">
            <label htmlFor="temp_password" className="block text-sm font-medium text-[var(--color-text-secondary)]">
              Temporary Password
            </label>
            <input
              id="temp_password"
              name="temp_password"
              type="text"
              required
              minLength={8}
              placeholder="At least 8 characters"
              className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2.5 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none input-inti font-mono"
            />
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-elevated)] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white transition-colors"
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
        className="flex items-center gap-1.5 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-accent)] hover:bg-[var(--color-accent-surface)] px-3 py-1.5 rounded-xl transition-colors shrink-0"
      >
        <KeyRound size={13} /> Reset password
      </button>
      {open && <ResetModal user={user} onClose={() => setOpen(false)} />}
    </>
  )
}
