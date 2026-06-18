import { redirect } from 'next/navigation'
import { DashboardShell } from '@/components/dashboard/DashboardShell'
import {
  canAccessPublisherArea,
  getCurrentAccessContext,
  getDefaultAppPath,
} from '@/modules/auth/authz'
import { getUnreadNotificationCount } from '@/modules/notifications'
import { createClient } from '@/infrastructure/database/server'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const access = await getCurrentAccessContext()
  if (!access) redirect('/login')
  if (!canAccessPublisherArea(access.role)) redirect(getDefaultAppPath(access.role))
  const supabase = await createClient()
  const primaryOrgId = access.orgIds[0]

  const [unreadNotificationCount, organizationResult] = await Promise.all([
    getUnreadNotificationCount(),
    primaryOrgId
      ? supabase.from('organizations').select('name').eq('id', primaryOrgId).maybeSingle()
      : Promise.resolve({ data: null }),
  ])

  return (
    <DashboardShell
      displayName={access.displayName}
      role={access.role}
      organizationName={organizationResult.data?.name ?? null}
      unreadNotificationCount={unreadNotificationCount}
    >
      {children}
    </DashboardShell>
  )
}
