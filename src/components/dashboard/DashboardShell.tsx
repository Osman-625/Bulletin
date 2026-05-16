'use client'

import { useState } from 'react'
import { DashboardSidebar } from './DashboardSidebar'
import { DashboardTopNav } from './DashboardTopNav'

interface DashboardShellProps {
  children: React.ReactNode
  displayName: string | null
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
  role,
  variant = 'publisher',
  pendingReviewCount,
  unreadNotificationCount = 0,
}: DashboardShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="dashboard-canvas min-h-[100dvh] bg-[var(--color-canvas)]">
      <DashboardSidebar
        displayName={displayName}
        role={role}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
        variant={variant}
        pendingReviewCount={pendingReviewCount}
      />

      {/* Mobile overlay backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-[rgba(36,24,21,0.42)] backdrop-blur-[2px] md:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      <DashboardTopNav
        userName={displayName}
        onMenuClick={() => setMobileOpen(true)}
        notificationCount={unreadNotificationCount}
        notificationsHref={NOTIFICATION_HREFS[variant]}
        settingsHref={SETTINGS_HREFS[variant]}
        announcementSearchHref={ANNOUNCEMENT_SEARCH_HREFS[variant]}
      />

      <main className="min-h-[100dvh] pt-16 pl-0 transition-[padding-left] duration-300 ease-[var(--ease-ui)] md:pl-[4.25rem] xl:pl-[18.5rem]">
        {children}
      </main>
    </div>
  )
}
