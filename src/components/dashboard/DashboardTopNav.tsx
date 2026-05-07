'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Bell, Menu, Newspaper } from 'lucide-react'
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
        'bg-[var(--color-canvas)]/80 backdrop-blur-xl',
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

        <label htmlFor="topnav-search" className="sr-only">Search announcements</label>
        <input
          id="topnav-search"
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
        <Link
          href="/"
          className="hidden min-h-9 items-center gap-2 rounded-full border border-[var(--color-border)] px-3 text-xs font-semibold text-[var(--color-text-secondary)] transition-colors hover:border-[var(--color-accent)]/40 hover:bg-[var(--color-surface-elevated)] hover:text-[var(--color-text-primary)] sm:inline-flex"
        >
          <Newspaper size={15} />
          Public Feed
        </Link>
        <Link
          href="/"
          className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-surface-elevated)] sm:hidden"
          aria-label="Open public announcements"
        >
          <Newspaper size={18} />
        </Link>

        <button
          type="button"
          className="flex items-center justify-center w-8 h-8 rounded-full text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-elevated)] transition-colors"
          aria-label="Notifications"
        >
          <Bell size={18} />
        </button>

        <button
          type="button"
          className="flex items-center justify-center w-8 h-8 rounded-full bg-[var(--color-accent-surface)] text-[var(--color-accent)] text-xs font-semibold select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]/50"
          aria-label={userName ? `${userName} — account` : 'Account'}
        >
          {initials}
        </button>
      </div>
    </header>
  )
}
