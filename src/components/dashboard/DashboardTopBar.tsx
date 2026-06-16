'use client'

import Link from 'next/link'
import { Bell, Menu } from 'lucide-react'
import { cn } from '@/lib/utils'
import { BrandMark } from '@/components/layout/BrandMark'
import { ThemeToggle } from '@/components/layout/ThemeToggle'
import { CommandPalette } from './CommandPalette'
import { UserMenu } from './UserMenu'
import type { DashboardVariant, NavItem } from './nav-config'

interface DashboardTopBarProps {
  displayName?: string | null
  subline?: string | null
  workspaceLabel: string
  variant: DashboardVariant
  navItems: NavItem[]
  notificationCount?: number
  notificationsHref: string
  settingsHref: string
  onMenuClick?: () => void
}

export function DashboardTopBar({
  displayName,
  subline,
  workspaceLabel,
  variant,
  navItems,
  notificationCount = 0,
  notificationsHref,
  settingsHref,
  onMenuClick,
}: DashboardTopBarProps) {
  return (
    <header
      className={cn(
        'fixed inset-x-0 top-0 z-40 flex h-16 items-center gap-3 px-3 sm:px-5',
        'border-b border-[var(--color-border)] bg-[var(--color-header-bg)]/88 backdrop-blur-2xl',
        'shadow-[var(--shadow-header)]'
      )}
    >
      <button
        type="button"
        onClick={onMenuClick}
        className="flex size-11 items-center justify-center rounded-[var(--radius-lg)] text-[var(--color-text-secondary)] transition-[background,color] duration-200 hover:bg-[var(--color-surface-elevated)] hover:text-[var(--color-text-primary)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-inti)] md:hidden"
        aria-label="Open navigation menu"
      >
        <Menu size={20} aria-hidden="true" />
      </button>

      <Link href={navItems[0]?.href ?? '/'} className="shrink-0" aria-label="Workspace home">
        <BrandMark
          size="md"
          showText
          preload
          textClassName="hidden lg:block [&>p:first-child]:text-lg"
          className="lg:gap-3"
        />
      </Link>

      <div className="ml-1 flex-1">
        <CommandPalette
          items={navItems.filter((item) => item.href !== '/')}
          placeholder={`Jump within ${workspaceLabel.toLowerCase()}`}
        />
      </div>

      <div className="hidden min-w-0 items-center gap-2 rounded-full border border-[var(--color-border)] bg-[color-mix(in_oklab,var(--color-surface)_72%,transparent)] px-3 py-1.5 lg:flex">
        <span className="size-2 rounded-full bg-[var(--dashboard-accent,var(--color-accent-inti))]" />
        <span className="font-mono text-[0.66rem] font-extrabold tracking-[0.14em] text-[var(--color-text-muted)] uppercase">
          {workspaceLabel}
        </span>
      </div>

      <Link
        href="/"
        className="hidden h-11 items-center gap-2 rounded-full bg-[var(--color-accent-inti)] px-4 text-xs font-semibold text-[var(--color-on-accent)] shadow-[var(--shadow-button)] transition-[transform,background,box-shadow] duration-200 hover:-translate-y-px hover:bg-[var(--color-accent-hover)] sm:inline-flex"
        title="Open the public announcement board"
      >
        Public view
      </Link>

      <Link
        href={notificationsHref}
        className="relative flex size-11 items-center justify-center rounded-[var(--radius-lg)] text-[var(--color-text-secondary)] transition-[transform,background,color] duration-200 hover:-translate-y-px hover:bg-[var(--color-surface-elevated)] hover:text-[var(--color-text-primary)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-inti)] active:scale-[0.98]"
        aria-label={
          notificationCount > 0 ? `Notifications, ${notificationCount} unread` : 'Notifications'
        }
      >
        <Bell size={18} aria-hidden="true" />
        {notificationCount > 0 && (
          <span className="absolute top-2 right-2 size-2 rounded-full bg-[var(--dashboard-accent)] ring-2 ring-[var(--color-header-bg)]" />
        )}
      </Link>

      <div className="hidden sm:block">
        <ThemeToggle />
      </div>

      <UserMenu
        displayName={displayName}
        subline={subline}
        settingsHref={settingsHref}
        variant={variant}
      />
    </header>
  )
}
