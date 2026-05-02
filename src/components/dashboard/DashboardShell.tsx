'use client'

import { useState } from 'react'
import { DashboardSidebar } from './DashboardSidebar'
import { DashboardTopNav } from './DashboardTopNav'

interface DashboardShellProps {
  children: React.ReactNode
  displayName: string | null
  role: string | null
  variant?: 'publisher' | 'admin' | 'super_admin'
  pendingReviewCount?: number
}

export function DashboardShell({ children, displayName, role, variant = 'publisher', pendingReviewCount }: DashboardShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="min-h-screen bg-[var(--color-canvas)]">
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
          className="fixed inset-0 z-30 bg-black/40 md:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      <DashboardTopNav
        userName={displayName}
        onMenuClick={() => setMobileOpen(true)}
      />

      <main className="pt-16 pl-0 md:pl-12 lg:pl-64 min-h-screen transition-[padding-left] duration-200">
        {children}
      </main>
    </div>
  )
}
