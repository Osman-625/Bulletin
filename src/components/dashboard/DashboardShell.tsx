import { DashboardSidebar } from './DashboardSidebar'
import { DashboardTopNav } from './DashboardTopNav'

interface DashboardShellProps {
  children: React.ReactNode
  displayName: string | null
  role: string | null
}

export function DashboardShell({ children, displayName, role }: DashboardShellProps) {
  return (
    <div className="min-h-screen bg-[var(--color-canvas)]">
      <DashboardSidebar displayName={displayName} role={role} />
      <DashboardTopNav userName={displayName} />
      <main className="pl-64 pt-16 min-h-screen">
        {children}
      </main>
    </div>
  )
}
