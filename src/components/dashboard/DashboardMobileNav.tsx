'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LogOut, X } from 'lucide-react'
import { logout } from '@/app/(auth)/login/actions'
import { BrandMark } from '@/components/layout/BrandMark'
import { ThemeToggle } from '@/components/layout/ThemeToggle'
import { cn } from '@/shared/utils'
import {
  ROLE_TABS,
  canUseRoleTab,
  getIsActive,
  type DashboardVariant,
  type NavItem,
} from './nav-config'

interface DashboardMobileNavProps {
  open: boolean
  onClose: () => void
  variant: DashboardVariant
  role?: string | null
  displayName?: string | null
  subline?: string | null
  navItems: NavItem[]
}

export function DashboardMobileNav({
  open,
  onClose,
  variant,
  role,
  displayName,
  subline,
  navItems,
}: DashboardMobileNavProps) {
  const pathname = usePathname()
  const dialogRef = useRef<HTMLDialogElement | null>(null)
  const firstFocusRef = useRef<HTMLButtonElement | null>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!open) {
      if (dialog?.open) dialog.close()
      return
    }

    const active = document.activeElement
    previousFocusRef.current = active instanceof HTMLElement ? active : null
    if (dialog && !dialog.open) dialog.showModal()
    const focusTimer = window.setTimeout(() => firstFocusRef.current?.focus(), 0)

    return () => {
      window.clearTimeout(focusTimer)
      const previous = previousFocusRef.current
      previousFocusRef.current = null
      if (previous && document.contains(previous)) previous.focus()
    }
  }, [open])

  return (
    <dialog
      ref={dialogRef}
      className={cn(
        'fixed inset-y-0 left-0 z-50 m-0 h-full max-h-none w-[min(20rem,86vw)] max-w-none p-0 md:hidden',
        'flex flex-col border-r border-[var(--color-border)] bg-[var(--color-surface)]/97 text-[var(--color-text-primary)] backdrop-blur-2xl',
        'shadow-[var(--shadow-drawer)] backdrop:bg-[var(--color-shell-backdrop)]',
        'transition-[transform,opacity,visibility] duration-300 ease-[var(--ease-ui)]',
        open ? 'visible translate-x-0 opacity-100' : 'invisible -translate-x-full opacity-0'
      )}
      aria-label="Navigation menu"
      onCancel={(event) => {
        event.preventDefault()
        onClose()
      }}
    >
      <div className="flex items-center justify-between gap-3 border-b border-[var(--color-border)] px-4 py-3.5">
        <BrandMark size="sm" showText />
        <button
          ref={firstFocusRef}
          type="button"
          onClick={onClose}
          className="flex size-11 items-center justify-center rounded-[var(--radius-lg)] text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-surface-elevated)] hover:text-[var(--color-text-primary)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-inti)]"
          aria-label="Close navigation menu"
        >
          <X size={18} aria-hidden="true" />
        </button>
      </div>

      <div className="border-b border-[var(--color-border)] px-4 py-3">
        <p className="mb-2 font-mono text-[0.58rem] font-extrabold tracking-[0.16em] text-[var(--color-text-muted)] uppercase">
          Workspaces
        </p>
        <div className="grid grid-cols-2 gap-1.5">
          {ROLE_TABS.map((tab) => {
            const enabled = canUseRoleTab(role, tab.variant)
            const active = variant === tab.variant
            if (!enabled && !active) return null
            return (
              <Link
                key={tab.variant}
                href={tab.href}
                onClick={onClose}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex min-h-10 items-center justify-center rounded-[var(--radius-md)] px-2 font-mono text-[0.66rem] font-bold transition-colors',
                  active
                    ? 'bg-[var(--dashboard-accent-soft)] text-[var(--dashboard-accent)]'
                    : 'text-[var(--color-text-muted)] hover:bg-[var(--color-surface-elevated)] hover:text-[var(--color-text-primary)]'
                )}
              >
                {tab.label}
              </Link>
            )
          })}
        </div>
      </div>

      <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto p-3">
        {navItems.map((item) => {
          const isActive = getIsActive(item, pathname)
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                'flex min-h-11 items-center gap-3 rounded-[var(--radius-lg)] px-3 text-sm font-semibold transition-colors',
                isActive
                  ? 'bg-[var(--dashboard-accent-soft)] text-[var(--dashboard-accent)]'
                  : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-elevated)] hover:text-[var(--color-text-primary)]'
              )}
            >
              <Icon size={18} strokeWidth={isActive ? 2.5 : 2} aria-hidden="true" />
              <span className="flex-1 truncate">{item.label}</span>
              {item.badge != null && item.badge > 0 && (
                <span className="rounded-full bg-[var(--dashboard-accent)] px-1.5 py-0.5 text-[11px] font-bold text-[var(--color-on-accent)]">
                  {item.badge > 99 ? '99+' : item.badge}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      <div className="flex items-center justify-between gap-3 border-t border-[var(--color-border)] p-4">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-[var(--color-text-primary)]">
            {displayName ?? '—'}
          </p>
          <p className="truncate text-xs text-[var(--color-text-muted)] capitalize">
            {subline ?? '—'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <form action={logout}>
            <button
              type="submit"
              className="flex min-h-11 items-center gap-1.5 rounded-[var(--radius-lg)] px-3 text-xs font-semibold text-[var(--color-text-muted)] transition-colors hover:bg-[color-mix(in_oklab,var(--color-destructive)_12%,transparent)] hover:text-[var(--color-destructive)]"
            >
              <LogOut size={15} aria-hidden="true" />
              Sign out
            </button>
          </form>
        </div>
      </div>
    </dialog>
  )
}
