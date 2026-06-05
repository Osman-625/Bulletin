'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { DashboardSidebar } from './DashboardSidebar'
import { DashboardTopNav } from './DashboardTopNav'

interface DashboardShellProps {
  children: React.ReactNode
  displayName: string | null
  organizationName?: string | null
  role: string | null
  variant?: 'publisher' | 'admin' | 'super_admin' | 'owner'
  pendingReviewCount?: number
  unreadNotificationCount?: number
}

const NOTIFICATION_HREFS: Record<NonNullable<DashboardShellProps['variant']>, string> = {
  publisher: '/dashboard/notifications',
  admin: '/admin/notifications',
  super_admin: '/super-admin/notifications',
  owner: '/owner/notifications',
}

const SETTINGS_HREFS: Record<NonNullable<DashboardShellProps['variant']>, string> = {
  publisher: '/dashboard/settings',
  admin: '/admin/settings',
  super_admin: '/super-admin/settings',
  owner: '/owner/settings',
}

const ANNOUNCEMENT_SEARCH_HREFS: Record<
  NonNullable<DashboardShellProps['variant']>,
  string | null
> = {
  publisher: '/dashboard/announcements',
  admin: null,
  super_admin: null,
  owner: null,
}

export function DashboardShell({
  children,
  displayName,
  organizationName,
  role,
  variant = 'publisher',
  pendingReviewCount,
  unreadNotificationCount = 0,
}: DashboardShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    const timer = window.setTimeout(() => setMobileOpen(false), 0)
    return () => window.clearTimeout(timer)
  }, [pathname])

  return (
    <div className="dashboard-canvas publisher-desk-canvas min-h-[100dvh] bg-[var(--color-canvas)]">
      <DashboardSidebar
        displayName={displayName}
        role={role}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
        variant={variant}
        pendingReviewCount={pendingReviewCount}
        organizationName={organizationName}
      />

      {/* Mobile overlay backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-[var(--color-shell-backdrop)] backdrop-blur-[2px] md:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      <div className="xl:hidden">
        <DashboardTopNav
          userName={displayName}
          onMenuClick={() => setMobileOpen(true)}
          notificationCount={unreadNotificationCount}
          notificationsHref={NOTIFICATION_HREFS[variant]}
          settingsHref={SETTINGS_HREFS[variant]}
          announcementSearchHref={ANNOUNCEMENT_SEARCH_HREFS[variant]}
        />
      </div>

      <main className="min-h-[100dvh] pt-16 pl-0 transition-[padding-left,padding-top] duration-300 ease-[var(--ease-ui)] md:pl-[5rem] xl:pt-0 xl:pl-[18rem]">
        {children}
      </main>
    </div>
  )
}
