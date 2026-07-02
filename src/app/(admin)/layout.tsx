import { redirect } from 'next/navigation'
import { createClient } from '@/infrastructure/database/server'
import { DashboardShell } from '@/components/dashboard/DashboardShell'
import {
  canAccessAdminArea,
  getCurrentAccessContext,
  getDefaultAppPath,
  type AppRole,
} from '@/modules/auth/authz'
import { getUnreadNotificationCount } from '@/modules/notifications'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const access = await getCurrentAccessContext()
  if (!access) redirect('/login')

  const role = access.role as AppRole | undefined
  if (!role) redirect('/login?error=profile_missing')
  if (!canAccessAdminArea(role)) redirect(getDefaultAppPath(role))

  const supabase = await createClient()
  let pendingQuery = supabase
    .from('announcements')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'submitted')

  if (role === 'admin') {
    if (access.orgIds.length === 0) {
      pendingQuery = pendingQuery.eq('organization_id', '__none__')
    } else {
      pendingQuery = pendingQuery.in('organization_id', access.orgIds)
    }
  }

  const [{ count: pendingCount }, unreadNotificationCount] = await Promise.all([
    pendingQuery,
    getUnreadNotificationCount(),
  ])

  return (
    <DashboardShell
      displayName={access.displayName}
      role={role}
      variant="admin"
      pendingReviewCount={pendingCount ?? 0}
      unreadNotificationCount={unreadNotificationCount}
    >
      {children}
    </DashboardShell>
  )
}
