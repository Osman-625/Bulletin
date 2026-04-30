'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Megaphone, Plus, LogOut } from 'lucide-react'
import { ThemeToggle } from './ThemeToggle'
import { logout } from '@/app/(auth)/login/actions'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/dashboard', label: 'Home', icon: Home },
  { href: '/dashboard/announcements', label: 'Announcements', icon: Megaphone },
  { href: '/dashboard/announcements/new', label: 'New Announcement', icon: Plus },
]

function getIsActive(href: string, pathname: string): boolean {
  if (href === '/dashboard') return pathname === href
  if (href === '/dashboard/announcements') return pathname === href
  return pathname.startsWith(href)
}

interface DashboardSidebarProps {
  displayName?: string | null
  role?: string | null
  mobileOpen?: boolean
  onMobileClose?: () => void
}

export function DashboardSidebar({
  displayName,
  role,
  mobileOpen = false,
  onMobileClose,
}: DashboardSidebarProps) {
  const pathname = usePathname()

  return (
    <>
      {/* ── Desktop + Tablet sidebar (md+) ── */}
      <aside
        className={cn(
          'hidden md:flex',
          'fixed inset-y-0 left-0 z-40 flex-col',
          'w-12 lg:w-64',
          'bg-white/80 dark:bg-slate-950/75 backdrop-blur-xl dark:backdrop-blur-2xl',
          'border-r border-[var(--color-border)]',
          'transition-[width] duration-200 overflow-hidden'
        )}
      >
        {/* Wordmark — desktop only */}
        <div className="px-3 lg:px-6 py-6 border-b border-[var(--color-border)] overflow-hidden">
          <p className="hidden lg:block text-[10px] font-bold uppercase tracking-widest text-[var(--color-accent)]">
            BULLETIN
          </p>
          <p className="hidden lg:block text-[10px] text-[var(--color-text-muted)] mt-0.5 leading-tight">
            INTI International University
          </p>
          {/* Tablet: accent dot as brand marker */}
          <div className="lg:hidden w-6 h-6 rounded-full bg-[var(--color-accent-surface)] flex items-center justify-center mx-auto">
            <span className="w-2 h-2 rounded-full bg-[var(--color-accent)] block" />
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-1.5 lg:px-3 py-4 space-y-1">
          {navItems.map(({ href, label, icon: Icon }) => {
            const isActive = getIsActive(href, pathname)
            return (
              <div key={href} className="relative group">
                <Link
                  href={href}
                  className={cn(
                    'flex items-center justify-center lg:justify-start gap-3',
                    'px-0 lg:px-3 py-2.5 rounded-xl text-sm font-medium',
                    'transition-all duration-150',
                    isActive
                      ? 'bg-[var(--color-accent-surface)] text-[var(--color-accent)]'
                      : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-elevated)] hover:text-[var(--color-text-primary)]'
                  )}
                  aria-label={label}
                >
                  <Icon size={16} strokeWidth={isActive ? 2.5 : 2} className="shrink-0" />
                  <span className="hidden lg:inline truncate">{label}</span>
                </Link>
                {/* Tablet tooltip */}
                <div
                  className="pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-2 z-50
                    px-2 py-1 rounded-lg text-xs font-medium whitespace-nowrap
                    bg-[var(--color-surface-high,#1A2438)] text-[var(--color-text-primary)]
                    opacity-0 group-hover:opacity-100 transition-opacity duration-150
                    lg:hidden"
                >
                  {label}
                </div>
              </div>
            )
          })}
        </nav>

        {/* Bottom — user + theme toggle + logout */}
        <div className="px-1.5 lg:px-3 py-4 border-t border-[var(--color-border)] space-y-2">
          <div className="flex items-center justify-center lg:justify-between lg:px-3">
            <div className="hidden lg:block min-w-0">
              <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">
                {displayName ?? '—'}
              </p>
              <p className="text-[10px] text-[var(--color-text-muted)] capitalize">{role ?? '—'}</p>
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
          'bg-white/95 dark:bg-slate-950/95 backdrop-blur-2xl',
          'border-t border-[var(--color-border)]',
          'rounded-t-2xl',
          'transition-transform duration-300',
          mobileOpen ? 'translate-y-0' : 'translate-y-full'
        )}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 rounded-full bg-[var(--color-border)]" />
        </div>

        {/* Wordmark */}
        <div className="px-6 pb-3 border-b border-[var(--color-border)]">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-accent)]">BULLETIN</p>
          <p className="text-[10px] text-[var(--color-text-muted)]">INTI International University</p>
        </div>

        {/* Nav */}
        <nav className="px-4 py-3 space-y-1">
          {navItems.map(({ href, label, icon: Icon }) => {
            const isActive = getIsActive(href, pathname)
            return (
              <Link
                key={href}
                href={href}
                onClick={onMobileClose}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-150',
                  isActive
                    ? 'bg-[var(--color-accent-surface)] text-[var(--color-accent)]'
                    : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-elevated)] hover:text-[var(--color-text-primary)]'
                )}
              >
                <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
                {label}
              </Link>
            )
          })}
        </nav>

        {/* User + sign out */}
        <div className="px-4 pb-6 pt-2 border-t border-[var(--color-border)] flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-[var(--color-text-primary)]">{displayName ?? '—'}</p>
            <p className="text-[10px] text-[var(--color-text-muted)] capitalize">{role ?? '—'}</p>
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
