'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Bell, Menu, Newspaper } from 'lucide-react'
import { cn } from '@/lib/utils'

interface DashboardTopNavProps {
  userName?: string | null
  onMenuClick?: () => void
  notificationCount?: number
  notificationsHref?: string
}

export function DashboardTopNav({
  userName,
  onMenuClick,
  notificationCount = 0,
  notificationsHref = '/dashboard/notifications',
}: DashboardTopNavProps) {
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

        <form action="/dashboard/announcements" className="hidden sm:block">
          <label htmlFor="topnav-search" className="sr-only">Search announcements</label>
          <input
            id="topnav-search"
            name="search"
            type="search"
            placeholder="Search announcements..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={cn(
              'w-72 px-4 py-2 text-sm',
              'bg-[var(--color-surface-elevated)] rounded-full',
              'text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)]',
              'border-none outline-none',
              'focus:ring-1 focus:ring-[var(--color-accent)]/40',
              'transition-all duration-150'
            )}
          />
        </form>
      </div>

      {/* Right: bell + avatar */}
      <div className="flex items-center gap-3">
        <Link
          href="/"
          className="inline-flex min-h-9 items-center gap-2 rounded-full bg-[var(--color-accent-inti)] px-3 text-xs font-semibold text-white shadow-[0_4px_14px_color-mix(in_oklab,var(--color-accent-inti)_30%,transparent)] transition-[transform,box-shadow,background] duration-200 hover:-translate-y-0.5 hover:bg-[var(--color-accent-hover)] sm:px-4"
          aria-label="Review the public announcements page"
          title="Review the public announcements page"
        >
          <Newspaper size={15} aria-hidden="true" />
          <span className="hidden sm:inline">Public view</span>
        </Link>

        <Link
          href={notificationsHref}
          className="relative flex h-8 w-8 items-center justify-center rounded-full text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-surface-elevated)]"
          aria-label="Notifications"
        >
          <Bell size={18} />
          {notificationCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--color-accent-inti)] px-1 text-[10px] font-bold leading-none text-white">
              {notificationCount > 9 ? '9+' : notificationCount}
            </span>
          )}
        </Link>

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
