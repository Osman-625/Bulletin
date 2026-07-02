import { redirect } from 'next/navigation'
import { createClient } from '@/infrastructure/database/server'
import { DashboardShell } from '@/components/dashboard/DashboardShell'
import { canAccessSuperAdminArea, getDefaultAppPath, type AppRole } from '@/modules/auth/authz'
import { getUnreadNotificationCount } from '@/modules/notifications'

export default async function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('display_name, role')
    .eq('id', user.id)
    .single()

  const role = profile?.role as AppRole | undefined
  if (!role) redirect('/login?error=profile_missing')
  if (!canAccessSuperAdminArea(role)) redirect(getDefaultAppPath(role))
  const unreadNotificationCount = await getUnreadNotificationCount()

  return (
    <DashboardShell
      displayName={profile?.display_name ?? null}
      role={role}
      variant="super_admin"
      unreadNotificationCount={unreadNotificationCount}
    >
      {children}
    </DashboardShell>
  )
}
