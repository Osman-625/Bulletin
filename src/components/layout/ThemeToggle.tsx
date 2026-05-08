'use client'

import { Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useSyncExternalStore } from 'react'

const emptySubscribe = () => () => {}
const getClientSnapshot = () => true
const getServerSnapshot = () => false

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const mounted = useSyncExternalStore(
    emptySubscribe,
    getClientSnapshot,
    getServerSnapshot
  )

  if (!mounted) return <div className="h-10 w-10 rounded-full sm:h-11 sm:w-11" />

  const isDark = resolvedTheme === 'dark'

  return (
    <button
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className="action-lift flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-inti)] disabled:pointer-events-none sm:h-11 sm:w-11"
      style={{
        background: 'var(--color-surface-elevated)',
        borderColor: 'var(--color-border)',
        color: 'var(--color-text-muted)',
        boxShadow: 'var(--shadow-button)',
      }}
    >
      {isDark ? (
        <Sun size={18} strokeWidth={2.2} aria-hidden="true" />
      ) : (
        <Moon size={18} strokeWidth={2.2} aria-hidden="true" />
      )}
    </button>
  )
}
