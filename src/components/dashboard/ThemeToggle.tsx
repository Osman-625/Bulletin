'use client'

import { useTheme } from 'next-themes'
import { Sun, Moon } from 'lucide-react'
import { useSyncExternalStore } from 'react'

const emptySubscribe = () => () => {}
const getClientSnapshot = () => true
const getServerSnapshot = () => false

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const mounted = useSyncExternalStore(emptySubscribe, getClientSnapshot, getServerSnapshot)

  if (!mounted) return <div className="h-11 w-11" />

  const isDark = resolvedTheme === 'dark'

  return (
    <button
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className="flex h-11 w-11 items-center justify-center rounded-lg text-[var(--color-text-muted)] transition-all duration-200 hover:bg-[var(--color-surface-elevated)] hover:text-[var(--color-text-primary)]"
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      <span className="transition-opacity duration-200">
        {isDark ? <Sun size={16} /> : <Moon size={16} />}
      </span>
    </button>
  )
}
