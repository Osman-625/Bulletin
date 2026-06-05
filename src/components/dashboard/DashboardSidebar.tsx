'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Megaphone,
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
  SquarePen,
  X,
  type LucideIcon,
} from 'lucide-react'
import { ThemeToggle } from '@/components/layout/ThemeToggle'
import { BrandMark } from '@/components/layout/BrandMark'
import { logout } from '@/app/(auth)/login/actions'
import { cn } from '@/lib/utils'

type NavItem = {
  href: string
  label: string
  icon: LucideIcon
  exact?: boolean
  badge?: number
}

const publisherNav: NavItem[] = [
  { href: '/dashboard', label: 'Overview', icon: Newspaper, exact: true },
  { href: '/dashboard/announcements', label: 'Announcements', icon: Megaphone, exact: true },
  { href: '/dashboard/announcements/new', label: 'New announcement', icon: SquarePen },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
  { href: '/', label: 'Public board', icon: ArrowUpRight, exact: true },
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
    { href: '/', label: 'Public board', icon: ArrowUpRight, exact: true },
  ]
}

const superAdminNav: NavItem[] = [
  { href: '/super-admin', label: 'Overview', icon: LayoutDashboard, exact: true },
  { href: '/super-admin/admins', label: 'Admins', icon: ShieldCheck },
  { href: '/super-admin/categories', label: 'Categories', icon: Tag },
  { href: '/super-admin/users', label: 'Users', icon: UserCog },
  { href: '/super-admin/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/super-admin/settings', label: 'Settings', icon: Settings },
  { href: '/', label: 'Public board', icon: ArrowUpRight, exact: true },
]

const ownerNav: NavItem[] = [
  { href: '/owner', label: 'Overview', icon: LayoutDashboard, exact: true },
  { href: '/owner/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/owner/resources', label: 'Resources', icon: Activity },
  { href: '/owner/users', label: 'All users', icon: Users },
  { href: '/owner/categories', label: 'Categories', icon: Tag },
  { href: '/owner/audit', label: 'Audit log', icon: ScrollText },
  { href: '/owner/settings', label: 'Settings', icon: Settings },
  { href: '/', label: 'Public board', icon: ArrowUpRight, exact: true },
]

const ROLE_TABS: Array<{
  variant: NonNullable<DashboardSidebarProps['variant']>
  href: string
  label: string
}> = [
  { variant: 'owner', href: '/owner', label: 'Owner' },
  { variant: 'super_admin', href: '/super-admin', label: 'Super' },
  { variant: 'admin', href: '/admin', label: 'Admin' },
  { variant: 'publisher', href: '/dashboard', label: 'Publisher' },
]

function getIsActive(item: NavItem, pathname: string): boolean {
  if (item.exact) return pathname === item.href
  return pathname.startsWith(item.href)
}

function NavLinks({
  navItems,
  pathname,
  closeMenu,
}: {
  navItems: NavItem[]
  pathname: string
  closeMenu?: () => void
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
              onClick={closeMenu}
              className={cn(
                'flex items-center justify-center gap-3 xl:justify-start',
                'min-h-11 rounded-[0.95rem] border border-transparent px-0 text-sm font-semibold xl:px-3',
                'transition-[transform,background,border-color,color,box-shadow] duration-200 ease-[var(--ease-ui)] active:scale-[0.98]',
                isActive
                  ? 'border-[color-mix(in_oklab,var(--color-accent-inti)_24%,var(--color-border))] bg-[var(--color-accent-surface)] text-[var(--color-accent)] shadow-[var(--shadow-soft)]'
                  : 'text-[var(--color-text-secondary)] hover:-translate-y-px hover:bg-[color-mix(in_oklab,var(--color-surface)_70%,transparent)] hover:text-[var(--color-text-primary)]'
              )}
              aria-label={item.label}
            >
              <span className="relative shrink-0">
                <Icon size={16} strokeWidth={isActive ? 2.5 : 2} aria-hidden="true" />
                {item.badge != null && item.badge > 0 && (
                  <span className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-[var(--color-accent)] text-[10px] font-bold text-[var(--color-on-accent)]">
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
              </span>
              <span className="hidden truncate xl:inline">{item.label}</span>
              {item.badge != null && item.badge > 0 && (
                <span className="ml-auto hidden rounded-full bg-[var(--color-accent)] px-1.5 py-0.5 text-[11px] font-bold text-[var(--color-on-accent)] xl:inline">
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
  organizationName?: string | null
}

function canUseRoleTab(
  role: string | null | undefined,
  tabVariant: NonNullable<DashboardSidebarProps['variant']>
) {
  if (role === 'owner') return true
  if (role === 'super_admin') return tabVariant === 'super_admin'
  if (role === 'admin') return tabVariant === 'admin'
  if (role === 'publisher') return tabVariant === 'publisher'
  return false
}

export function DashboardSidebar({
  displayName,
  role,
  mobileOpen = false,
  onMobileClose,
  variant = 'publisher',
  pendingReviewCount = 0,
  organizationName,
}: DashboardSidebarProps) {
  const pathname = usePathname()
  const mobileDialogRef = useRef<HTMLDialogElement | null>(null)
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

  const visibleNavItems = navItems
  const primaryNavItems = visibleNavItems.filter((item) => item.href !== '/')
  const elsewhereItems = visibleNavItems.filter((item) => item.href === '/')
  const workspaceLabel =
    variant === 'publisher'
      ? 'Publisher desk'
      : variant === 'admin'
        ? 'Admin desk'
        : variant === 'super_admin'
          ? 'Super desk'
          : 'Owner desk'
  const accountSubline =
    variant === 'publisher' && organizationName
      ? organizationName
      : (role?.replace('_', ' ') ?? '—')

  useEffect(() => {
    const dialog = mobileDialogRef.current

    if (!mobileOpen) {
      if (dialog?.open) dialog.close()
      return
    }

    const activeElement = document.activeElement
    previousFocusedElementRef.current = activeElement instanceof HTMLElement ? activeElement : null

    if (dialog && !dialog.open) {
      dialog.showModal()
    }

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

  return (
    <>
      {/* ── Desktop + Tablet sidebar ── */}
      <aside
        className={cn(
          'hidden md:flex',
          'fixed inset-y-0 left-0 z-40 flex-col',
          'w-[5rem] xl:w-[18rem]',
          'bg-[var(--color-header-bg)]/88 backdrop-blur-2xl',
          'border-r border-[var(--color-border)]',
          'overflow-hidden shadow-[var(--shadow-sidebar)] transition-[width] duration-300 ease-[var(--ease-ui)]'
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

        <div className="mx-4 mt-4 hidden rounded-[var(--radius-control)] border border-[var(--color-border-subtle)] bg-[color-mix(in_oklab,var(--color-surface-elevated)_82%,transparent)] p-2 xl:block">
          <p className="px-1 pb-2 font-mono text-[0.58rem] font-extrabold tracking-[0.16em] text-[var(--color-text-muted)] uppercase">
            Workspaces
          </p>
          <div className="grid grid-cols-2 gap-1" aria-label="Workspace switcher">
            {ROLE_TABS.map((tab) => {
              const enabled = canUseRoleTab(role, tab.variant)
              const active = variant === tab.variant
              const className = cn(
                'flex min-h-11 min-w-0 items-center justify-center rounded-[0.5rem] px-2 font-mono text-[0.66rem] font-bold tracking-[0.02em]',
                active
                  ? 'bg-[var(--color-surface)] text-[var(--color-text-primary)] shadow-[var(--shadow-soft)]'
                  : enabled
                    ? 'text-[var(--color-text-muted)] transition-[background,color] duration-200 hover:bg-[var(--color-surface)] hover:text-[var(--color-text-primary)]'
                    : 'cursor-not-allowed text-[var(--color-text-muted)] opacity-45'
              )

              return enabled ? (
                <Link
                  key={tab.variant}
                  href={tab.href}
                  aria-current={active ? 'page' : undefined}
                  className={className}
                >
                  {tab.label}
                </Link>
              ) : (
                <span
                  key={tab.variant}
                  className={className}
                  aria-disabled="true"
                  title="Only the owner can open another role dashboard"
                >
                  {tab.label}
                </span>
              )
            })}
          </div>
        </div>

        <nav className="min-h-0 flex-1 space-y-1.5 overflow-y-auto px-2 py-4 xl:px-4">
          <>
            <p className="hidden px-3 pt-2 pb-3 font-mono text-[0.62rem] font-extrabold tracking-[0.18em] text-[var(--color-text-muted)] uppercase xl:block">
              {workspaceLabel}
            </p>
            <NavLinks navItems={primaryNavItems} pathname={pathname} />
            {elsewhereItems.length > 0 && (
              <>
                <p className="mt-8 hidden px-3 pb-3 font-mono text-[0.62rem] font-extrabold tracking-[0.18em] text-[var(--color-text-muted)] uppercase xl:block">
                  Elsewhere
                </p>
                <NavLinks navItems={elsewhereItems} pathname={pathname} />
              </>
            )}
          </>
        </nav>

        <div className="space-y-2 border-t border-[var(--color-border)] px-2 py-4 xl:px-4">
          <div className="hidden items-center justify-between rounded-[1rem] bg-[color-mix(in_oklab,var(--color-surface)_72%,transparent)] p-3 xl:flex">
            <div className="hidden min-w-0 xl:block">
              <p className="truncate text-sm font-medium text-[var(--color-text-primary)]">
                {displayName ?? '—'}
              </p>
              <div className="flex items-center gap-1.5">
                {variant === 'owner' && (
                  <Crown
                    size={10}
                    className="shrink-0 text-[var(--color-gold-text)]"
                    aria-hidden="true"
                  />
                )}
                <p className="truncate text-[15px] text-[var(--color-text-muted)] capitalize">
                  {accountSubline}
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
              <LogOut size={14} className="shrink-0" aria-hidden="true" />
              <span className="hidden xl:inline">Sign out</span>
            </button>
          </form>
        </div>
      </aside>

      {/* ── Mobile bottom drawer ── */}
      <dialog
        ref={mobileDialogRef}
        className={cn(
          'fixed inset-x-0 bottom-0 z-40 md:hidden',
          'bg-[var(--color-surface)]/96 backdrop-blur-2xl',
          'm-0 max-h-none max-w-none p-0 text-[var(--color-text-primary)]',
          'border-t border-[var(--color-border)]',
          'rounded-t-[1.5rem] shadow-[var(--shadow-drawer)] transition-[transform,opacity,visibility] duration-300 ease-[var(--ease-ui)] backdrop:bg-[var(--color-shell-backdrop)]',
          mobileOpen
            ? 'pointer-events-auto visible translate-y-0 opacity-100'
            : 'pointer-events-none invisible translate-y-[calc(100%+1rem)] opacity-0'
        )}
        aria-label="Navigation menu"
        onCancel={(event) => {
          event.preventDefault()
          onMobileClose?.()
        }}
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
              <X size={18} aria-hidden="true" />
            </button>
          </div>
        </div>
        <nav className="max-h-[min(70dvh,32rem)] space-y-1 overflow-y-auto px-4 py-3">
          <NavLinks navItems={visibleNavItems} pathname={pathname} closeMenu={onMobileClose} />
        </nav>
        <div className="flex items-center justify-between border-t border-[var(--color-border)] px-4 pt-2 pb-6">
          <div>
            <p className="text-sm font-medium text-[var(--color-text-primary)]">
              {displayName ?? '—'}
            </p>
            <p className="text-[15px] text-[var(--color-text-muted)] capitalize">
              {accountSubline}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <form action={logout}>
              <button
                type="submit"
                className="flex min-h-11 items-center gap-1.5 rounded-xl px-3 text-xs text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-surface-elevated)] hover:text-[var(--color-destructive)]"
              >
                <LogOut size={14} aria-hidden="true" />
                Sign out
              </button>
            </form>
          </div>
        </div>
      </dialog>
    </>
  )
}
