'use client'

import { Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useSyncExternalStore } from 'react'
import { cn } from '@/lib/utils'

const emptySubscribe = () => () => {}
const getClientSnapshot = () => true
const getServerSnapshot = () => false

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const mounted = useSyncExternalStore(emptySubscribe, getClientSnapshot, getServerSnapshot)

  if (!mounted) {
    return (
      <div
        className="relative inline-flex h-11 w-[5.75rem] items-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-1 text-[var(--color-text-muted)] shadow-[var(--shadow-button)] max-[360px]:w-11"
        aria-hidden="true"
      >
        <span className="absolute left-3.5 text-[var(--color-gold-text)] max-[360px]:hidden">
          <Sun size={15} strokeWidth={2.2} aria-hidden="true" />
        </span>
        <span className="absolute right-3.5 text-[var(--color-text-muted)] max-[360px]:hidden">
          <Moon size={15} strokeWidth={2.2} aria-hidden="true" />
        </span>
        <span className="relative z-10 flex size-9 items-center justify-center rounded-full bg-[var(--color-surface)] text-[var(--color-text-primary)] shadow-[var(--shadow-button)]">
          <Sun size={16} strokeWidth={2.3} aria-hidden="true" />
        </span>
      </div>
    )
  }

  const isDark = resolvedTheme === 'dark'

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isDark}
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      aria-label={isDark ? 'Theme: switch to light mode' : 'Theme: switch to dark mode'}
      className="group relative inline-flex h-11 w-[5.75rem] cursor-pointer items-center rounded-full border p-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-inti)] disabled:pointer-events-none max-[360px]:w-11"
      style={{
        background: isDark ? 'var(--color-surface-high)' : 'var(--color-surface-elevated)',
        borderColor: 'var(--color-border)',
        color: 'var(--color-text-muted)',
        boxShadow: 'var(--shadow-button)',
      }}
    >
      <span className="absolute left-3.5 text-[var(--color-gold-text)] transition-opacity duration-300 max-[360px]:hidden">
        <Sun size={15} strokeWidth={2.2} aria-hidden="true" />
      </span>
      <span className="absolute right-3.5 text-[var(--color-text-muted)] transition-opacity duration-300 max-[360px]:hidden">
        <Moon size={15} strokeWidth={2.2} aria-hidden="true" />
      </span>
      <span
        data-testid="theme-switch-knob"
        className={cn(
          'relative z-10 flex size-9 items-center justify-center rounded-full bg-[var(--color-surface)] text-[var(--color-text-primary)] shadow-[0_6px_16px_rgba(30,26,23,0.18)] transition-transform duration-300 ease-[var(--ease-ui)]',
          isDark ? 'translate-x-12 max-[360px]:translate-x-0' : 'translate-x-0'
        )}
      >
        {isDark ? (
          <Moon size={16} strokeWidth={2.3} aria-hidden="true" />
        ) : (
          <Sun size={16} strokeWidth={2.3} aria-hidden="true" />
        )}
      </span>
    </button>
  )
}
