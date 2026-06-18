'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LogOut } from 'lucide-react'
import { logout } from '@/app/(auth)/login/actions'
import { cn } from '@/shared/utils'
import {
  ROLE_TABS,
  canUseRoleTab,
  getIsActive,
  getWorkspaceLabel,
  type DashboardVariant,
  type NavItem,
} from './nav-config'

interface DashboardRailProps {
  variant: DashboardVariant
  role?: string | null
  navItems: NavItem[]
}

const ROLE_CODES: Record<DashboardVariant, string> = {
  publisher: 'P',
  admin: 'A',
  super_admin: 'S',
  owner: 'O',
}

export function DashboardRail({ variant, role, navItems }: DashboardRailProps) {
  const pathname = usePathname()
  const primaryNavItems = navItems.filter((item) => item.href !== '/')
  const workspaceLabel = getWorkspaceLabel(variant)
  const workspaceTabs = ROLE_TABS.filter(
    (tab) => canUseRoleTab(role, tab.variant) || variant === tab.variant
  )

  return (
    <aside
      className={cn(
        'group fixed top-16 bottom-0 left-0 z-30 hidden flex-col md:flex',
        'w-[4.5rem] hover:w-[17rem]',
        'border-r border-[var(--color-border)] bg-[var(--color-header-bg)]/88 backdrop-blur-2xl',
        'shadow-[var(--shadow-sidebar)] transition-[width,box-shadow,background] duration-300 ease-[var(--ease-ui)] hover:bg-[var(--color-header-bg)] hover:shadow-[var(--shadow-hover)]'
      )}
      aria-label="Primary"
    >
      <div className="border-b border-[var(--color-border)] px-3 py-4">
        <div className="flex items-center justify-center gap-3 group-hover:justify-start">
          <span className="grid size-10 shrink-0 place-items-center rounded-[0.9rem] border border-[color-mix(in_oklab,var(--dashboard-accent)_32%,var(--color-border))] bg-[var(--dashboard-accent-soft)] font-mono text-[0.78rem] font-black text-[var(--dashboard-accent)] shadow-[var(--shadow-soft)]">
            {ROLE_CODES[variant]}
          </span>
          <span className="hidden min-w-0 group-hover:block">
            <span className="font-display block truncate text-base leading-tight font-black text-[var(--color-text-primary)]">
              {workspaceLabel}
            </span>
            <span className="block truncate font-mono text-[0.58rem] font-extrabold tracking-[0.18em] text-[var(--color-text-muted)] uppercase">
              Workspace
            </span>
          </span>
        </div>
      </div>

      {workspaceTabs.length > 1 && (
        <div className="px-3 pt-3 pb-2">
          <p className="mb-2 hidden px-1 font-mono text-[0.58rem] font-extrabold tracking-[0.16em] text-[var(--color-text-muted)] uppercase group-hover:block">
            Switch board
          </p>
          <div
            className="grid grid-cols-1 gap-1 group-hover:grid-cols-2"
            aria-label="Workspace switcher"
          >
            {workspaceTabs.map((tab) => {
              const enabled = canUseRoleTab(role, tab.variant)
              const active = variant === tab.variant
              if (!enabled && !active) return null
              const className = cn(
                'flex min-h-10 items-center justify-center rounded-[0.75rem] px-2 font-mono text-[0.68rem] font-black tracking-[0.04em] transition-[background,color,border-color,box-shadow] duration-200',
                active
                  ? 'border border-[color-mix(in_oklab,var(--dashboard-accent)_34%,var(--color-border))] bg-[var(--dashboard-accent-soft)] text-[var(--dashboard-accent)] shadow-[var(--shadow-soft)]'
                  : 'border border-transparent text-[var(--color-text-muted)] hover:border-[var(--color-border)] hover:bg-[var(--color-surface)] hover:text-[var(--color-text-primary)]'
              )
              return (
                <Link
                  key={tab.variant}
                  href={tab.href}
                  aria-current={active ? 'page' : undefined}
                  className={cn(className, !active && 'hidden group-hover:flex')}
                  title={`${tab.label} workspace`}
                >
                  <span className="group-hover:hidden">{ROLE_CODES[tab.variant]}</span>
                  <span className="hidden group-hover:inline">{tab.label}</span>
                </Link>
              )
            })}
          </div>
        </div>
      )}

      <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto px-3 py-3">
        <p className="mb-1 hidden px-2 font-mono text-[0.6rem] font-extrabold tracking-[0.18em] text-[var(--color-text-muted)] uppercase group-hover:block">
          Navigation
        </p>
        <RailLinks items={primaryNavItems} pathname={pathname} />
      </nav>

      <div className="border-t border-[var(--color-border)] px-3 py-3">
        <form action={logout}>
          <button
            type="submit"
            className={cn(
              'flex min-h-11 w-full items-center justify-center gap-3 rounded-[0.9rem] px-3 text-sm font-semibold group-hover:justify-start',
              'text-[var(--color-text-muted)] transition-colors hover:bg-[color-mix(in_oklab,var(--color-destructive)_12%,transparent)] hover:text-[var(--color-destructive)]',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-inti)]'
            )}
            title="Sign out"
          >
            <LogOut size={18} className="shrink-0" aria-hidden="true" />
            <span className="hidden truncate group-hover:inline">Sign out</span>
          </button>
        </form>
      </div>
    </aside>
  )
}

function RailLinks({ items, pathname }: { items: NavItem[]; pathname: string }) {
  return (
    <>
      {items.map((item) => {
        const isActive = getIsActive(item, pathname)
        const Icon = item.icon
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive ? 'page' : undefined}
            title={item.label}
            className={cn(
              'relative flex min-h-11 items-center justify-center gap-3 rounded-[0.9rem] px-3 text-sm font-bold group-hover:justify-start',
              'transition-[background,color,box-shadow] duration-200 ease-[var(--ease-ui)]',
              isActive
                ? 'bg-[var(--dashboard-accent-soft)] text-[var(--dashboard-accent)] shadow-[var(--shadow-soft)]'
                : 'text-[var(--color-text-secondary)] hover:bg-[color-mix(in_oklab,var(--color-surface)_76%,transparent)] hover:text-[var(--color-text-primary)]'
            )}
          >
            {isActive && (
              <span
                className="absolute top-1/2 -left-3 h-6 w-1 -translate-y-1/2 rounded-r-full bg-[var(--dashboard-accent)]"
                aria-hidden="true"
              />
            )}
            <Icon
              size={18}
              strokeWidth={isActive ? 2.5 : 2}
              className="shrink-0"
              aria-hidden="true"
            />
            <span className="hidden flex-1 truncate group-hover:inline">{item.label}</span>
            {item.badge != null && item.badge > 0 && (
              <span className="ml-auto hidden rounded-full bg-[var(--dashboard-accent)] px-1.5 py-0.5 text-[11px] font-bold text-[var(--color-on-accent)] group-hover:inline">
                {item.badge > 99 ? '99+' : item.badge}
              </span>
            )}
            {item.badge != null && item.badge > 0 && (
              <span
                className="absolute top-2 right-2 size-2 rounded-full bg-[var(--dashboard-accent)] group-hover:hidden"
                aria-hidden="true"
              />
            )}
          </Link>
        )
      })}
    </>
  )
}
