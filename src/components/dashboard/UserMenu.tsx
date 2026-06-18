'use client'

import { useEffect, useId, useRef, useState } from 'react'
import Link from 'next/link'
import { ChevronDown, Crown, ExternalLink, LogOut, Settings } from 'lucide-react'
import { logout } from '@/app/(auth)/login/actions'
import { cn } from '@/shared/utils'
import type { DashboardVariant } from './nav-config'

interface UserMenuProps {
  displayName?: string | null
  subline?: string | null
  settingsHref: string
  variant: DashboardVariant
}

export function UserMenu({ displayName, subline, settingsHref, variant }: UserMenuProps) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const firstItemRef = useRef<HTMLAnchorElement | null>(null)
  const menuId = useId()
  const initials = displayName ? displayName.charAt(0).toUpperCase() : '?'

  useEffect(() => {
    if (!open) return

    function onPointerDown(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false)
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    const focusTimer = window.setTimeout(() => firstItemRef.current?.focus(), 0)

    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
      window.clearTimeout(focusTimer)
    }
  }, [open])

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        className={cn(
          'flex min-h-11 items-center gap-2 rounded-full border border-[var(--color-border)] py-1 pr-2 pl-1',
          'bg-[color-mix(in_oklab,var(--color-surface)_82%,transparent)] text-[var(--color-text-primary)]',
          'transition-[background,border-color,box-shadow] duration-200',
          'hover:border-[color-mix(in_oklab,var(--color-accent-inti)_30%,var(--color-border))] hover:bg-[var(--color-surface)]',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-inti)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-canvas)]'
        )}
        aria-label={displayName ? `${displayName} — account menu` : 'Account menu'}
      >
        <span className="grid size-8 place-items-center rounded-full bg-[var(--dashboard-accent-soft)] text-xs font-bold text-[var(--dashboard-accent)]">
          {initials}
        </span>
        <span className="hidden min-w-0 text-left sm:block">
          <span className="block max-w-[8rem] truncate text-xs leading-tight font-semibold">
            {displayName ?? '—'}
          </span>
          <span className="block max-w-[8rem] truncate text-[0.65rem] leading-tight text-[var(--color-text-muted)] capitalize">
            {subline ?? '—'}
          </span>
        </span>
        <ChevronDown
          size={15}
          className={cn(
            'shrink-0 text-[var(--color-text-muted)] transition-transform duration-200',
            open && 'rotate-180'
          )}
          aria-hidden="true"
        />
      </button>

      {open && (
        <div
          id={menuId}
          role="menu"
          aria-label="Account menu"
          className={cn(
            'absolute top-[calc(100%+0.5rem)] right-0 z-50 w-60 origin-top-right',
            'rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-1.5',
            'animate-[fade-up_180ms_var(--ease-ui)_both] shadow-[var(--shadow-hover)]'
          )}
        >
          <div className="flex items-center gap-2.5 rounded-[var(--radius-lg)] px-2.5 py-2">
            <span className="grid size-9 place-items-center rounded-full bg-[var(--dashboard-accent-soft)] text-sm font-bold text-[var(--dashboard-accent)]">
              {initials}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-[var(--color-text-primary)]">
                {displayName ?? '—'}
              </p>
              <p className="flex items-center gap-1 truncate text-xs text-[var(--color-text-muted)] capitalize">
                {variant === 'owner' && (
                  <Crown size={11} className="text-[var(--color-gold-text)]" aria-hidden="true" />
                )}
                {subline ?? '—'}
              </p>
            </div>
          </div>

          <div className="my-1 h-px bg-[var(--color-border)]" />

          <Link
            ref={firstItemRef}
            role="menuitem"
            href={settingsHref}
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 rounded-[var(--radius-lg)] px-2.5 py-2 text-sm font-medium text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-surface-elevated)] hover:text-[var(--color-text-primary)] focus:bg-[var(--color-surface-elevated)] focus:text-[var(--color-text-primary)] focus:outline-none"
          >
            <Settings size={16} aria-hidden="true" />
            Settings
          </Link>
          <Link
            role="menuitem"
            href="/"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 rounded-[var(--radius-lg)] px-2.5 py-2 text-sm font-medium text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-surface-elevated)] hover:text-[var(--color-text-primary)] focus:bg-[var(--color-surface-elevated)] focus:text-[var(--color-text-primary)] focus:outline-none"
          >
            <ExternalLink size={16} aria-hidden="true" />
            Public board
          </Link>

          <div className="my-1 h-px bg-[var(--color-border)]" />

          <form action={logout}>
            <button
              type="submit"
              role="menuitem"
              className="flex w-full items-center gap-2.5 rounded-[var(--radius-lg)] px-2.5 py-2 text-sm font-medium text-[var(--color-text-secondary)] transition-colors hover:bg-[color-mix(in_oklab,var(--color-destructive)_12%,transparent)] hover:text-[var(--color-destructive)] focus:bg-[color-mix(in_oklab,var(--color-destructive)_12%,transparent)] focus:text-[var(--color-destructive)] focus:outline-none"
            >
              <LogOut size={16} aria-hidden="true" />
              Sign out
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
