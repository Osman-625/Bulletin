'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { DashboardTopBar } from './DashboardTopBar'
import { DashboardRail } from './DashboardRail'
import { DashboardMobileNav } from './DashboardMobileNav'
import { DashboardMobileDock } from './DashboardMobileDock'
import {
  getNavForVariant,
  getNotificationsHref,
  getSettingsHref,
  getWorkspaceLabel,
  type DashboardVariant,
} from './nav-config'

interface DashboardShellProps {
  children: React.ReactNode
  displayName: string | null
  organizationName?: string | null
  role: string | null
  variant?: DashboardVariant
  pendingReviewCount?: number
  unreadNotificationCount?: number
}

export function DashboardShell({
  children,
  displayName,
  organizationName,
  role,
  variant = 'publisher',
  pendingReviewCount = 0,
  unreadNotificationCount = 0,
}: DashboardShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    const timer = window.setTimeout(() => setMobileOpen(false), 0)
    return () => window.clearTimeout(timer)
  }, [pathname])

  const navItems = getNavForVariant(variant, pendingReviewCount)
  const workspaceLabel = getWorkspaceLabel(variant)
  const subline =
    variant === 'publisher' && organizationName
      ? organizationName
      : (role?.replace('_', ' ') ?? '—')

  return (
    <div
      className="dashboard-canvas publisher-board-canvas min-h-[100dvh] bg-[var(--color-canvas)]"
      data-dashboard-variant={variant}
    >
      <DashboardTopBar
        displayName={displayName}
        subline={subline}
        workspaceLabel={workspaceLabel}
        variant={variant}
        navItems={navItems}
        notificationCount={unreadNotificationCount}
        notificationsHref={getNotificationsHref(variant)}
        settingsHref={getSettingsHref(variant)}
        onMenuClick={() => setMobileOpen(true)}
      />

      <DashboardRail variant={variant} role={role} navItems={navItems} />

      <DashboardMobileNav
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        variant={variant}
        role={role}
        displayName={displayName}
        subline={subline}
        navItems={navItems}
      />

      <main
        id="main-content"
        className="min-h-[100dvh] pt-[8.75rem] pb-8 pl-0 transition-[padding-left,padding-top] duration-300 ease-[var(--ease-ui)] md:pt-16 md:pb-0 md:pl-[4.5rem]"
      >
        {children}
      </main>

      <DashboardMobileDock navItems={navItems} />
    </div>
  )
}
