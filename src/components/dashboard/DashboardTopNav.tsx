'use client'

import { useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Bell, Menu, Newspaper, Search, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'
import { BrandMark } from '@/components/layout/BrandMark'

interface DashboardTopNavProps {
  userName?: string | null
  onMenuClick?: () => void
  notificationCount?: number
  notificationsHref?: string
  settingsHref?: string
  announcementSearchHref?: string | null
}

export function DashboardTopNav({
  userName,
  onMenuClick,
  notificationCount = 0,
  notificationsHref = '/dashboard/notifications',
  settingsHref = '/dashboard/settings',
  announcementSearchHref = '/dashboard/announcements',
}: DashboardTopNavProps) {
  const initials = userName ? userName.charAt(0).toUpperCase() : '?'
  const [search, setSearch] = useState('')
  const router = useRouter()
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function handleSearchChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value
    setSearch(value)
    if (!announcementSearchHref) return
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      const params = new URLSearchParams()
      if (value.trim()) params.set('search', value.trim())
      router.push(
        params.toString() ? `${announcementSearchHref}?${params}` : announcementSearchHref
      )
    }, 500)
  }

  function handleSearchSubmit() {
    if (debounceRef.current) clearTimeout(debounceRef.current)
  }

  return (
    <header
      className={cn(
        'fixed top-0 right-0 left-0 z-30 h-16',
        'md:left-[5rem] xl:left-[19rem]',
        'flex items-center justify-between px-4 md:px-6',
        'bg-[var(--color-header-bg)]/86 backdrop-blur-2xl',
        'border-b border-[var(--color-border)]',
        'shadow-[0_8px_24px_rgba(95,61,22,0.06)]',
        'transition-[left] duration-300 ease-[var(--ease-ui)]'
      )}
    >
      {/* Left: hamburger (mobile only) + search */}
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          className="flex h-11 w-11 items-center justify-center rounded-[0.9rem] text-[var(--color-text-secondary)] transition-[transform,background,color] duration-200 hover:bg-[var(--color-surface-elevated)] hover:text-[var(--color-text-primary)] active:scale-[0.98] md:hidden"
          aria-label="Open menu"
        >
          <Menu size={20} />
        </button>

        <div className="min-w-0 sm:hidden md:hidden" aria-label="Publisher workspace">
          <BrandMark
            size="sm"
            showText
            preload
            textClassName="[&>p:first-child]:text-base [&>p:nth-child(2)]:hidden"
          />
          <span className="sr-only">Publisher workspace</span>
        </div>

        {announcementSearchHref && (
          <form
            action={announcementSearchHref}
            onSubmit={handleSearchSubmit}
            className="relative hidden sm:block"
          >
            <label htmlFor="topnav-search" className="sr-only">
              Search announcements
            </label>
            <Search
              size={15}
              className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-[var(--color-text-muted)]"
              aria-hidden="true"
            />
            <input
              id="topnav-search"
              name="search"
              type="search"
              placeholder="Search announcements"
              value={search}
              onChange={handleSearchChange}
              className={cn(
                'min-h-11 w-64 rounded-[0.95rem] border border-[var(--color-border)] bg-[color-mix(in_oklab,var(--color-surface)_78%,transparent)] pr-4 pl-10 text-sm',
                'text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)]',
                'outline-none',
                'focus:border-[var(--color-accent-inti)] focus:ring-[3px] focus:ring-[var(--color-accent-surface)]',
                'transition-[width,border-color,box-shadow,background] duration-200 ease-[var(--ease-ui)] focus:w-80'
              )}
            />
          </form>
        )}
      </div>

      {/* Right: bell + avatar */}
      <div className="flex items-center gap-3">
        <Link
          href="/"
          className="action-lift inline-flex min-h-11 items-center gap-2 rounded-[0.95rem] bg-[var(--color-accent-inti)] px-3 text-xs font-semibold text-white shadow-[var(--shadow-button)] transition-[transform,box-shadow,background] duration-200 hover:bg-[var(--color-accent-hover)] sm:px-4"
          aria-label="Review the public announcements page"
          title="Review the public announcements page"
        >
          <Newspaper size={15} aria-hidden="true" />
          <span className="hidden sm:inline">Public view</span>
        </Link>

        <Link
          href={notificationsHref}
          className="relative flex h-11 w-11 items-center justify-center rounded-[0.95rem] text-[var(--color-text-secondary)] transition-[transform,background,color] duration-200 hover:-translate-y-px hover:bg-[var(--color-surface-elevated)] hover:text-[var(--color-text-primary)] active:scale-[0.98]"
          aria-label="Notifications"
        >
          <Bell size={18} />
          {notificationCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--color-accent-inti)] px-1 text-[10px] leading-none font-bold text-white">
              {notificationCount > 9 ? '9+' : notificationCount}
            </span>
          )}
        </Link>

        <Link
          href={settingsHref}
          className="flex h-11 w-11 items-center justify-center rounded-[0.95rem] border border-[color-mix(in_oklab,var(--color-accent-inti)_18%,var(--color-border))] bg-[var(--color-accent-surface)] text-xs font-semibold text-[var(--color-accent)] transition-[transform,background] duration-200 select-none hover:-translate-y-px hover:bg-[color-mix(in_oklab,var(--color-accent-surface)_72%,var(--color-surface))] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]/50 active:scale-[0.98]"
          aria-label={userName ? `${userName} - account settings` : 'Account settings'}
          title="Account settings"
        >
          <span className="hidden sm:inline">{initials}</span>
          <Settings size={15} className="sm:hidden" aria-hidden="true" />
        </Link>
      </div>
    </header>
  )
}
