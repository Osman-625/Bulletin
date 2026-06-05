'use client'

import { useActionState, useEffect, useRef } from 'react'
import { KeyRound } from 'lucide-react'
import { TEMPORARY_PASSWORD_MIN_LENGTH } from '@/lib/auth/password-policy'
import { fulfillPasswordResetRequest, type PasswordResetRequestState } from './actions'

const initialState: PasswordResetRequestState = {}

export function PasswordResetRequestButton({ requestId }: { requestId: string }) {
  const formRef = useRef<HTMLFormElement>(null)
  const [state, formAction, pending] = useActionState(fulfillPasswordResetRequest, initialState)

  useEffect(() => {
    if (state.success) formRef.current?.reset()
  }, [state.success])

  return (
    <div className="space-y-2">
      <form
        ref={formRef}
        action={formAction}
        className="flex flex-col gap-2 sm:flex-row sm:items-center"
      >
        <input type="hidden" name="request_id" value={requestId} />
        <label htmlFor={`temp-password-${requestId}`} className="sr-only">
          Temporary password
        </label>
        <input
          id={`temp-password-${requestId}`}
          name="temp_password"
          type="password"
          aria-label="Temporary password for reset request"
          required
          minLength={TEMPORARY_PASSWORD_MIN_LENGTH}
          autoComplete="new-password"
          placeholder={`At least ${TEMPORARY_PASSWORD_MIN_LENGTH} characters`}
          className="input-inti min-h-9 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-xs text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] sm:w-48"
        />
        <button
          type="submit"
          disabled={pending}
          className="inline-flex min-h-9 items-center gap-2 rounded-xl bg-[var(--color-accent-inti)] px-3 text-xs font-semibold text-white transition-colors hover:bg-[var(--color-accent-hover)] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <KeyRound size={14} aria-hidden="true" />
          {pending ? 'Setting...' : 'Set temp password'}
        </button>
      </form>

      {state.error && (
        <p className="max-w-sm rounded-lg bg-[var(--color-status-rejected-bg)] px-3 py-2 text-xs text-[var(--color-status-rejected-text)]">
          {state.error}
        </p>
      )}

      {state.success && (
        <p className="max-w-sm rounded-lg bg-[var(--color-status-published-bg)] px-3 py-2 text-xs text-[var(--color-status-published-text)]">
          {state.success}
        </p>
      )}
    </div>
  )
}
