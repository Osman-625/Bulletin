'use client'

import { Check, Copy } from 'lucide-react'
import { useState } from 'react'

export function CopyInviteLink({ value }: { value: string }) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    await navigator.clipboard.writeText(value)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1600)
  }

  return (
    <button
      type="button"
      aria-label={copied ? 'Invite link copied' : 'Copy invite link'}
      onClick={handleCopy}
      className="shrink-0 rounded-lg p-2 transition-colors hover:bg-[var(--color-surface-high)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
    >
      {copied ? (
        <Check size={14} className="text-[var(--color-status-published-text)]" aria-hidden="true" />
      ) : (
        <Copy size={14} className="text-[var(--color-text-muted)]" aria-hidden="true" />
      )}
    </button>
  )
}
