'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/shared/utils'
import { getIsActive, type NavItem } from './nav-config'

interface DashboardMobileDockProps {
  navItems: NavItem[]
}

export function DashboardMobileDock({ navItems }: DashboardMobileDockProps) {
  const pathname = usePathname()
  const dockItems = navItems.filter((item) => item.href !== '/').slice(0, 4)

  if (dockItems.length === 0) return null

  return (
    <nav
      className="dashboard-mobile-dock fixed inset-x-3 top-[calc(4rem+0.5rem)] z-30 md:hidden"
      aria-label="Primary dashboard destinations"
    >
      <div className="grid grid-cols-4 overflow-hidden rounded-[1.15rem] border border-[var(--color-border)] bg-[var(--color-header-bg)]/94 p-1 shadow-[var(--shadow-drawer)] backdrop-blur-2xl">
        {dockItems.map((item) => {
          const active = getIsActive(item, pathname)
          const Icon = item.icon

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'relative flex min-h-12 min-w-0 flex-col items-center justify-center gap-1 rounded-[0.9rem] px-1 text-center text-[0.64rem] leading-none font-bold transition-[background,color,transform] duration-200',
                active
                  ? 'bg-[var(--dashboard-accent-soft)] text-[var(--dashboard-accent)]'
                  : 'text-[var(--color-text-muted)] hover:bg-[var(--color-surface-elevated)] hover:text-[var(--color-text-primary)] active:scale-[0.98]'
              )}
            >
              <Icon size={17} strokeWidth={active ? 2.5 : 2} aria-hidden="true" />
              <span className="w-full truncate">{item.label}</span>
              {item.badge != null && item.badge > 0 && (
                <span
                  className="absolute top-1.5 right-3 size-2 rounded-full bg-[var(--dashboard-accent)]"
                  aria-hidden="true"
                />
              )}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
