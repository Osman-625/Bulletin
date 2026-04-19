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
}

export function DashboardSidebar({ displayName, role }: DashboardSidebarProps) {
  const pathname = usePathname()

  return (
    <aside className="fixed inset-y-0 left-0 z-40 w-64 flex flex-col bg-white/80 dark:bg-slate-950/75 backdrop-blur-xl dark:backdrop-blur-2xl border-r border-[var(--color-border)] transition-colors duration-200">
      {/* Wordmark */}
      <div className="px-6 py-6 border-b border-[var(--color-border)]">
        <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-accent)] font-sans">
          BULLETIN
        </p>
        <p className="text-[10px] text-[var(--color-text-muted)] mt-0.5 leading-tight">
          INTI International University
        </p>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = getIsActive(href, pathname)
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
                isActive
                  ? 'bg-[var(--color-accent-surface)] text-[var(--color-accent)]'
                  : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-elevated)] hover:text-[var(--color-text-primary)]'
              )}
            >
              <Icon size={16} strokeWidth={isActive ? 2.5 : 2} />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Bottom */}
      <div className="px-3 py-4 border-t border-[var(--color-border)] space-y-3">
        <div className="flex items-center justify-between px-3">
          <div className="min-w-0">
            <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">
              {displayName ?? '—'}
            </p>
            <p className="text-[10px] text-[var(--color-text-muted)] capitalize">{role ?? '—'}</p>
          </div>
          <ThemeToggle />
        </div>
        <form action={logout} className="px-0">
          <button
            type="submit"
            className="flex items-center gap-2 w-full px-3 py-2 rounded-xl text-xs text-[var(--color-text-muted)] hover:text-[var(--color-destructive)] hover:bg-[var(--color-surface-elevated)] transition-all duration-150"
          >
            <LogOut size={14} />
            Sign out
          </button>
        </form>
      </div>
    </aside>
  )
}
