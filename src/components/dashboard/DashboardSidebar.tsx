'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Home, Megaphone, Plus, LogOut,
  LayoutDashboard, ClipboardList, Building2, Users, BarChart3,
  ShieldCheck, Tag, UserCog, Crown, ScrollText,
  Newspaper,
} from 'lucide-react'
import { ThemeToggle } from './ThemeToggle'
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
  { href: '/dashboard', label: 'Home', icon: Home, exact: true },
  { href: '/dashboard/announcements', label: 'Announcements', icon: Megaphone, exact: true },
  { href: '/dashboard/announcements/new', label: 'New Announcement', icon: Plus },
  { href: '/', label: 'Public Announcements', icon: Newspaper, exact: true },
]

function adminNav(pendingCount: number): NavItem[] {
  return [
    { href: '/admin', label: 'Overview', icon: LayoutDashboard, exact: true },
    { href: '/admin/review', label: 'Review Queue', icon: ClipboardList, badge: pendingCount || undefined },
    { href: '/admin/orgs', label: 'Organizations', icon: Building2 },
    { href: '/admin/publishers', label: 'Publishers', icon: Users },
    { href: '/admin/categories', label: 'Categories', icon: Tag },
    { href: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
    { href: '/dashboard', label: 'Publisher Workspace', icon: Megaphone, exact: true },
    { href: '/', label: 'Public Announcements', icon: Newspaper, exact: true },
  ]
}

const superAdminNav: NavItem[] = [
  { href: '/super-admin', label: 'Overview', icon: LayoutDashboard, exact: true },
  { href: '/admin', label: 'Admin Workspace', icon: ClipboardList, exact: true },
  { href: '/dashboard', label: 'Publisher Workspace', icon: Megaphone, exact: true },
  { href: '/super-admin/admins', label: 'Admins', icon: ShieldCheck },
  { href: '/super-admin/categories', label: 'Categories', icon: Tag },
  { href: '/super-admin/users', label: 'Users', icon: UserCog },
  { href: '/super-admin/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/', label: 'Public Announcements', icon: Newspaper, exact: true },
]

const ownerNav: NavItem[] = [
  { href: '/owner', label: 'System', icon: LayoutDashboard, exact: true },
  { href: '/super-admin', label: 'Super Admin Workspace', icon: ShieldCheck, exact: true },
  { href: '/admin', label: 'Admin Workspace', icon: ClipboardList, exact: true },
  { href: '/dashboard', label: 'Publisher Workspace', icon: Megaphone, exact: true },
  { href: '/owner/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/owner/users', label: 'All Users', icon: Users },
  { href: '/owner/categories', label: 'Categories', icon: Tag },
  { href: '/owner/audit', label: 'Audit Log', icon: ScrollText },
  { href: '/', label: 'Public Announcements', icon: Newspaper, exact: true },
]

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
                'flex items-center justify-center gap-3 lg:justify-start',
                'rounded-xl px-0 py-2.5 text-sm font-medium lg:px-3',
                'transition-all duration-150',
                isActive
                  ? 'bg-[var(--color-accent-surface)] text-[var(--color-accent)]'
                  : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-elevated)] hover:text-[var(--color-text-primary)]'
              )}
              aria-label={item.label}
            >
              <span className="relative shrink-0">
                <Icon size={16} strokeWidth={isActive ? 2.5 : 2} />
                {item.badge != null && item.badge > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--color-accent)] text-[13.5px] font-bold text-white">
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
              </span>
              <span className="hidden truncate lg:inline">{item.label}</span>
              {item.badge != null && item.badge > 0 && (
                <span className="ml-auto hidden rounded-full bg-[var(--color-accent)] px-1.5 py-0.5 text-[15px] font-bold text-white lg:inline">
                  {item.badge > 99 ? '99+' : item.badge}
                </span>
              )}
            </Link>
            <div
              className="pointer-events-none absolute left-full top-1/2 z-50 ml-2 -translate-y-1/2
                whitespace-nowrap rounded-lg bg-[var(--color-surface-high)]
                px-2 py-1 text-xs font-medium text-[var(--color-text-primary)]
                opacity-0 transition-opacity duration-150 group-hover:opacity-100
                lg:hidden"
            >
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

  const navItems =
    variant === 'owner'
      ? ownerNav
      : variant === 'admin'
        ? adminNav(pendingReviewCount)
        : variant === 'super_admin'
          ? superAdminNav
          : publisherNav

  return (
    <>
      {/* ── Desktop + Tablet sidebar ── */}
      <aside
        className={cn(
          'hidden md:flex',
          'fixed inset-y-0 left-0 z-40 flex-col',
          'w-12 lg:w-64',
          'bg-[var(--color-canvas)]/90 backdrop-blur-xl',
          'border-r border-[var(--color-border)]',
          'transition-[width] duration-200 overflow-hidden'
        )}
      >
        <div className="px-3 lg:px-6 py-5 border-b border-[var(--color-border)] overflow-hidden flex items-center gap-3">
          <Image src="/bulletin_logo.png" alt="Bulletin" width={32} height={32} className="h-8 w-8 shrink-0 object-contain" />
          <div className="hidden lg:block min-w-0">
            <p className="text-[15px] font-bold uppercase tracking-widest text-[var(--color-accent)]">BULLETIN</p>
            <p className="text-[15px] text-[var(--color-text-muted)] mt-0.5 leading-tight">INTI International University</p>
          </div>
        </div>

        <nav className="flex-1 px-1.5 lg:px-3 py-4 space-y-1">
          <NavLinks navItems={navItems} pathname={pathname} />
        </nav>

        <div className="px-1.5 lg:px-3 py-4 border-t border-[var(--color-border)] space-y-2">
          <div className="flex items-center justify-center lg:justify-between lg:px-3">
            <div className="hidden lg:block min-w-0">
              <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">{displayName ?? '—'}</p>
              <div className="flex items-center gap-1.5">
                {variant === 'owner' && <Crown size={10} className="text-[var(--color-gold)] shrink-0" />}
                <p className="text-[15px] text-[var(--color-text-muted)] capitalize">{role?.replace('_', ' ') ?? '—'}</p>
              </div>
            </div>
            <ThemeToggle />
          </div>
          <form action={logout}>
            <button
              type="submit"
              className={cn(
                'flex items-center justify-center lg:justify-start gap-2 w-full',
                'lg:px-3 py-2 rounded-xl text-xs',
                'text-[var(--color-text-muted)] hover:text-[var(--color-destructive)]',
                'hover:bg-[var(--color-surface-elevated)] transition-all duration-150'
              )}
              aria-label="Sign out"
            >
              <LogOut size={14} className="shrink-0" />
              <span className="hidden lg:inline">Sign out</span>
            </button>
          </form>
        </div>
      </aside>

      {/* ── Mobile bottom drawer ── */}
      <div
        className={cn(
          'fixed inset-x-0 bottom-0 z-40 md:hidden',
          'bg-[var(--color-canvas)]/95 backdrop-blur-2xl',
          'border-t border-[var(--color-border)]',
          'rounded-t-2xl transition-[transform,opacity,visibility] duration-300',
          mobileOpen
            ? 'pointer-events-auto visible translate-y-0 opacity-100'
            : 'pointer-events-none invisible translate-y-[calc(100%+1rem)] opacity-0'
        )}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
      >
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 rounded-full bg-[var(--color-border)]" />
        </div>
        <div className="px-6 pb-3 border-b border-[var(--color-border)] flex items-center gap-3">
          <Image src="/bulletin_logo.png" alt="Bulletin" width={28} height={28} className="h-7 w-7 shrink-0 object-contain" />
          <div>
            <p className="text-[15px] font-bold uppercase tracking-widest text-[var(--color-accent)]">BULLETIN</p>
            <p className="text-[15px] text-[var(--color-text-muted)]">INTI International University</p>
          </div>
        </div>
        <nav className="px-4 py-3 space-y-1">
          <NavLinks navItems={navItems} pathname={pathname} onClick={onMobileClose} />
        </nav>
        <div className="px-4 pb-6 pt-2 border-t border-[var(--color-border)] flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-[var(--color-text-primary)]">{displayName ?? '—'}</p>
            <p className="text-[15px] text-[var(--color-text-muted)] capitalize">{role?.replace('_', ' ') ?? '—'}</p>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <form action={logout}>
              <button
                type="submit"
                className="flex items-center gap-1.5 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-destructive)] transition-colors py-2 px-3 rounded-xl hover:bg-[var(--color-surface-elevated)]"
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
