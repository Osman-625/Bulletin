import { redirect } from 'next/navigation'
import { DashboardShell } from '@/components/dashboard/DashboardShell'
import { canAccessPublisherArea, getCurrentAccessContext, getDefaultAppPath } from '@/lib/auth/authz'
import { getUnreadNotificationCount } from '@/lib/notifications'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const access = await getCurrentAccessContext()
  if (!access) redirect('/login')
  if (!canAccessPublisherArea(access.role)) redirect(getDefaultAppPath(access.role))
  const unreadNotificationCount = await getUnreadNotificationCount()

  return (
    <DashboardShell
      displayName={access.displayName}
      role={access.role}
      unreadNotificationCount={unreadNotificationCount}
    >
      {children}
    </DashboardShell>
  )
}
