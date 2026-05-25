'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Home,
  Megaphone,
  Plus,
  LogOut,
  LayoutDashboard,
  ClipboardList,
  Building2,
  Users,
  BarChart3,
  ShieldCheck,
  Tag,
  UserCog,
  Crown,
  ScrollText,
  Newspaper,
  Settings,
  ArrowUpRight,
  Activity,
  X,
} from 'lucide-react'
import { ThemeToggle } from '@/components/layout/ThemeToggle'
import { BrandMark } from '@/components/layout/BrandMark'
import { logout } from '@/app/(auth)/login/actions'
import { cn } from '@/lib/utils'

type NavItem = {
  href: string
  label: string
  icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>
  exact?: boolean
  badge?: number
}

const publisherNav: NavItem[] = [
  { href: '/dashboard', label: 'Overview', icon: Home, exact: true },
  { href: '/dashboard/announcements', label: 'Announcements', icon: Megaphone, exact: true },
  { href: '/dashboard/announcements/new', label: 'New announcement', icon: Plus },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
  { href: '/', label: 'Public board', icon: Newspaper, exact: true },
]

function adminNav(pendingCount: number): NavItem[] {
  return [
    { href: '/admin', label: 'Overview', icon: LayoutDashboard, exact: true },
    {
      href: '/admin/review',
      label: 'Review queue',
      icon: ClipboardList,
      badge: pendingCount || undefined,
    },
    { href: '/admin/orgs', label: 'Organizations', icon: Building2 },
    { href: '/admin/publishers', label: 'Publishers', icon: Users },
    { href: '/admin/categories', label: 'Categories', icon: Tag },
    { href: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
    { href: '/admin/settings', label: 'Settings', icon: Settings },
    { href: '/dashboard', label: 'Publisher desk', icon: Megaphone, exact: true },
    { href: '/', label: 'Public board', icon: Newspaper, exact: true },
  ]
}

const superAdminNav: NavItem[] = [
  { href: '/super-admin', label: 'Overview', icon: LayoutDashboard, exact: true },
  { href: '/admin', label: 'Admin desk', icon: ClipboardList, exact: true },
  { href: '/dashboard', label: 'Publisher desk', icon: Megaphone, exact: true },
  { href: '/super-admin/admins', label: 'Admins', icon: ShieldCheck },
  { href: '/super-admin/categories', label: 'Categories', icon: Tag },
  { href: '/super-admin/users', label: 'Users', icon: UserCog },
  { href: '/super-admin/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/super-admin/settings', label: 'Settings', icon: Settings },
  { href: '/', label: 'Public board', icon: Newspaper, exact: true },
]

const ownerNav: NavItem[] = [
  { href: '/owner', label: 'Overview', icon: LayoutDashboard, exact: true },
  { href: '/super-admin', label: 'Super admin desk', icon: ShieldCheck, exact: true },
  { href: '/admin', label: 'Admin desk', icon: ClipboardList, exact: true },
  { href: '/dashboard', label: 'Publisher desk', icon: Megaphone, exact: true },
  { href: '/owner/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/owner/resources', label: 'Resources', icon: Activity },
  { href: '/owner/users', label: 'All users', icon: Users },
  { href: '/owner/categories', label: 'Categories', icon: Tag },
  { href: '/owner/audit', label: 'Audit log', icon: ScrollText },
  { href: '/owner/settings', label: 'Settings', icon: Settings },
  { href: '/', label: 'Public board', icon: Newspaper, exact: true },
]

const ROLE_HOME: Record<string, { href: string; label: string; icon: NavItem['icon'] }> = {
  owner: { href: '/owner', label: 'Return to Owner', icon: Crown },
  super_admin: { href: '/super-admin', label: 'Return to Super Admin', icon: ShieldCheck },
  admin: { href: '/admin', label: 'Return to Admin', icon: ClipboardList },
  publisher: { href: '/dashboard', label: 'Publisher desk', icon: Home },
}

const VARIANT_HOME: Record<NonNullable<DashboardSidebarProps['variant']>, string> = {
  publisher: '/dashboard',
  admin: '/admin',
  super_admin: '/super-admin',
  owner: '/owner',
}

function getIsActive(item: NavItem, pathname: string): boolean {
  if (item.exact) return pathname === item.href
  return pathname.startsWith(item.href)
}

function NavLinks({
  navItems,
  pathname,
  onClick,
}: {
  navItems: NavItem[]
  pathname: string
  onClick?: () => void
}) {
  return (
    <>
      {navItems.map((item) => {
        const isActive = getIsActive(item, pathname)
        const Icon = item.icon
        return (
          <div key={item.href} className="group relative">
            <Link
              href={item.href}
              onClick={onClick}
              className={cn(
                'flex items-center justify-center gap-3 xl:justify-start',
                'min-h-11 rounded-[0.95rem] border border-transparent px-0 text-sm font-semibold xl:px-3',
                'transition-[transform,background,border-color,color,box-shadow] duration-200 ease-[var(--ease-ui)] active:scale-[0.98]',
                isActive
                  ? 'border-[color-mix(in_oklab,var(--color-accent-inti)_24%,var(--color-border))] bg-[var(--color-accent-surface)] text-[var(--color-accent)] shadow-[0_8px_18px_rgba(95,61,22,0.08)]'
                  : 'text-[var(--color-text-secondary)] hover:-translate-y-px hover:bg-[color-mix(in_oklab,var(--color-surface)_70%,transparent)] hover:text-[var(--color-text-primary)]'
              )}
              aria-label={item.label}
            >
              <span className="relative shrink-0">
                <Icon size={16} strokeWidth={isActive ? 2.5 : 2} />
                {item.badge != null && item.badge > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--color-accent)] text-[10px] font-bold text-white">
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
              </span>
              <span className="hidden truncate xl:inline">{item.label}</span>
              {item.badge != null && item.badge > 0 && (
                <span className="ml-auto hidden rounded-full bg-[var(--color-accent)] px-1.5 py-0.5 text-[11px] font-bold text-white xl:inline">
                  {item.badge > 99 ? '99+' : item.badge}
                </span>
              )}
            </Link>
            <div className="pointer-events-none absolute top-1/2 left-full z-50 ml-2 -translate-y-1/2 rounded-lg bg-[var(--color-surface-high)] px-2 py-1 text-xs font-medium whitespace-nowrap text-[var(--color-text-primary)] opacity-0 shadow-[var(--shadow-soft)] transition-opacity duration-150 group-hover:opacity-100 xl:hidden">
              {item.label}
            </div>
          </div>
        )
      })}
    </>
  )
}

interface DashboardSidebarProps {
  displayName?: string | null
  role?: string | null
  mobileOpen?: boolean
  onMobileClose?: () => void
  variant?: 'publisher' | 'admin' | 'super_admin' | 'owner'
  pendingReviewCount?: number
}

export function DashboardSidebar({
  displayName,
  role,
  mobileOpen = false,
  onMobileClose,
  variant = 'publisher',
  pendingReviewCount = 0,
}: DashboardSidebarProps) {
  const pathname = usePathname()
  const mobileDialogRef = useRef<HTMLDivElement | null>(null)
  const firstMobileFocusRef = useRef<HTMLButtonElement | null>(null)
  const previousFocusedElementRef = useRef<HTMLElement | null>(null)

  const navItems =
    variant === 'owner'
      ? ownerNav
      : variant === 'admin'
        ? adminNav(pendingReviewCount)
        : variant === 'super_admin'
          ? superAdminNav
          : publisherNav

  const roleHome = role ? ROLE_HOME[role] : null
  const returnItem =
    roleHome && roleHome.href !== VARIANT_HOME[variant]
      ? [{ ...roleHome, icon: ArrowUpRight, exact: true }]
      : []

  const visibleNavItems = [...returnItem, ...navItems]

  useEffect(() => {
    if (!mobileOpen) return

    const activeElement = document.activeElement
    previousFocusedElementRef.current = activeElement instanceof HTMLElement ? activeElement : null

    const focusTimer = window.setTimeout(() => {
      firstMobileFocusRef.current?.focus()
    }, 0)

    return () => {
      window.clearTimeout(focusTimer)

      const previousFocusedElement = previousFocusedElementRef.current
      previousFocusedElementRef.current = null

      if (previousFocusedElement && document.contains(previousFocusedElement)) {
        previousFocusedElement.focus()
      }
    }
  }, [mobileOpen])

  function handleMobileDialogKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Escape') {
      event.preventDefault()
      onMobileClose?.()
      return
    }

    if (event.key === 'Tab') {
      const dialog = mobileDialogRef.current
      if (!dialog) return

      const focusableElements = Array.from(
        dialog.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
      ).filter((element) => element.getAttribute('aria-hidden') !== 'true' && element.offsetParent)

      if (focusableElements.length === 0) return

      const firstElement = focusableElements[0]
      const lastElement = focusableElements[focusableElements.length - 1]

      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault()
        lastElement.focus()
        return
      }

      if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault()
        firstElement.focus()
      }
    }
  }

  return (
    <>
      {/* ── Desktop + Tablet sidebar ── */}
      <aside
        className={cn(
          'hidden md:flex',
          'fixed inset-y-0 left-0 z-40 flex-col',
          'w-[5rem] xl:w-[19rem]',
          'bg-[var(--color-header-bg)]/88 backdrop-blur-2xl',
          'border-r border-[var(--color-border)]',
          'overflow-hidden shadow-[10px_0_36px_rgba(95,61,22,0.08)] transition-[width] duration-300 ease-[var(--ease-ui)]'
        )}
      >
        <div className="flex items-center justify-center overflow-hidden border-b border-[var(--color-border)] px-3 py-3 xl:justify-start xl:px-5">
          <BrandMark
            size="md"
            showText
            preload
            textClassName="hidden xl:block [&>p:first-child]:text-lg"
            className="xl:gap-3"
          />
        </div>

        <nav className="min-h-0 flex-1 space-y-1.5 overflow-y-auto px-2 py-4 xl:px-4">
          <NavLinks navItems={visibleNavItems} pathname={pathname} />
        </nav>

        <div className="space-y-2 border-t border-[var(--color-border)] px-2 py-4 xl:px-4">
          <div className="hidden items-center justify-between rounded-[1rem] bg-[color-mix(in_oklab,var(--color-surface)_72%,transparent)] px-3 py-3 xl:flex">
            <div className="hidden min-w-0 xl:block">
              <p className="truncate text-sm font-medium text-[var(--color-text-primary)]">
                {displayName ?? '—'}
              </p>
              <div className="flex items-center gap-1.5">
                {variant === 'owner' && (
                  <Crown size={10} className="shrink-0 text-[var(--color-gold)]" />
                )}
                <p className="text-[15px] text-[var(--color-text-muted)] capitalize">
                  {role?.replace('_', ' ') ?? '—'}
                </p>
              </div>
            </div>
            <ThemeToggle />
          </div>
          <form action={logout}>
            <button
              type="submit"
              className={cn(
                'flex w-full items-center justify-center gap-2 xl:justify-start',
                'min-h-11 rounded-[0.95rem] text-xs font-semibold xl:px-3',
                'text-[var(--color-text-muted)] hover:text-[var(--color-destructive)]',
                'transition-[transform,background,color] duration-200 hover:-translate-y-px hover:bg-[var(--color-surface-elevated)] active:scale-[0.98]'
              )}
              aria-label="Sign out"
            >
              <LogOut size={14} className="shrink-0" />
              <span className="hidden xl:inline">Sign out</span>
            </button>
          </form>
        </div>
      </aside>

      {/* ── Mobile bottom drawer ── */}
      <div
        ref={mobileDialogRef}
        className={cn(
          'fixed inset-x-0 bottom-0 z-40 md:hidden',
          'bg-[var(--color-canvas)]/95 backdrop-blur-2xl',
          'border-t border-[var(--color-border)]',
          'rounded-t-[1.5rem] shadow-[0_-18px_44px_rgba(36,24,21,0.18)] transition-[transform,opacity,visibility] duration-300 ease-[var(--ease-ui)]',
          mobileOpen
            ? 'pointer-events-auto visible translate-y-0 opacity-100'
            : 'pointer-events-none invisible translate-y-[calc(100%+1rem)] opacity-0'
        )}
        role="dialog"
        aria-modal="true"
        aria-hidden={!mobileOpen}
        aria-label="Navigation menu"
        onKeyDown={handleMobileDialogKeyDown}
      >
        <div className="flex justify-center pt-3 pb-2">
          <div className="h-1 w-10 rounded-full bg-[var(--color-border)]" />
        </div>
        <div className="border-b border-[var(--color-border)] px-4 pb-3">
          <div className="flex items-center justify-between gap-3">
            <BrandMark size="sm" />
            <button
              ref={firstMobileFocusRef}
              type="button"
              onClick={onMobileClose}
              className="flex min-h-11 min-w-11 items-center justify-center rounded-xl text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-surface-elevated)] hover:text-[var(--color-text-primary)] focus-visible:ring-2 focus-visible:ring-[var(--color-accent-inti)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-canvas)] focus-visible:outline-none"
              aria-label="Close navigation menu"
            >
              <X size={18} />
            </button>
          </div>
        </div>
        <nav className="max-h-[min(70dvh,32rem)] space-y-1 overflow-y-auto px-4 py-3">
          <NavLinks navItems={visibleNavItems} pathname={pathname} onClick={onMobileClose} />
        </nav>
        <div className="flex items-center justify-between border-t border-[var(--color-border)] px-4 pt-2 pb-6">
          <div>
            <p className="text-sm font-medium text-[var(--color-text-primary)]">
              {displayName ?? '—'}
            </p>
            <p className="text-[15px] text-[var(--color-text-muted)] capitalize">
              {role?.replace('_', ' ') ?? '—'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <form action={logout}>
              <button
                type="submit"
                className="flex min-h-11 items-center gap-1.5 rounded-xl px-3 text-xs text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-surface-elevated)] hover:text-[var(--color-destructive)]"
              >
                <LogOut size={14} />
                Sign out
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  )
}
