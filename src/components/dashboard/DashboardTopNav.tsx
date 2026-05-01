'use client'

import { useState } from 'react'
import { Bell, Menu } from 'lucide-react'
import { cn } from '@/lib/utils'

interface DashboardTopNavProps {
  userName?: string | null
  onMenuClick?: () => void
}

export function DashboardTopNav({ userName, onMenuClick }: DashboardTopNavProps) {
  const initials = userName ? userName.charAt(0).toUpperCase() : '?'
  const [search, setSearch] = useState('')

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-30 h-16',
        'md:left-12 lg:left-64',
        'flex items-center justify-between px-4 md:px-6',
        'bg-white/80 dark:bg-slate-950/75 backdrop-blur-xl dark:backdrop-blur-2xl',
        'border-b border-[var(--color-border)]',
        'transition-[left] duration-200'
      )}
    >
      {/* Left: hamburger (mobile only) + search */}
      <div className="flex items-center gap-3 flex-1">
        <button
          type="button"
          onClick={onMenuClick}
          className="flex items-center justify-center w-8 h-8 rounded-lg text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-elevated)] transition-colors md:hidden"
          aria-label="Open menu"
        >
          <Menu size={20} />
        </button>

        <input
          type="search"
          placeholder="Search announcements..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={cn(
            'hidden sm:block w-72 px-4 py-2 text-sm',
            'bg-[var(--color-surface-elevated)] rounded-full',
            'text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)]',
            'border-none outline-none',
            'focus:ring-1 focus:ring-[var(--color-accent)]/40',
            'transition-all duration-150'
          )}
        />
      </div>

      {/* Right: bell + avatar */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          className="flex items-center justify-center w-8 h-8 rounded-full text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-elevated)] transition-colors"
          aria-label="Notifications"
        >
          <Bell size={18} />
        </button>

        <div
          className="flex items-center justify-center w-8 h-8 rounded-full bg-[var(--color-accent-surface)] text-[var(--color-accent)] text-xs font-semibold select-none"
          aria-label={userName ?? 'User avatar'}
        >
          {initials}
        </div>
      </div>
    </header>
  )
}
