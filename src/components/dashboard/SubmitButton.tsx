'use client'
import { useFormStatus } from 'react-dom'

export function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      className="action-lift w-full rounded-xl bg-[var(--color-accent)] px-4 py-3 text-sm font-medium text-white shadow-[var(--shadow-button)] hover:bg-[var(--color-accent-hover)] disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none disabled:hover:translate-y-0"
    >
      {pending ? 'Signing in...' : 'Sign in'}
    </button>
  )
}
