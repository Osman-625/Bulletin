import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DashboardShell } from '@/components/dashboard/DashboardShell'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('display_name, role')
    .eq('id', user.id)
    .single()

  if (!profile || !['admin', 'super_admin'].includes(profile.role)) redirect('/dashboard')

  const { count: pendingCount } = await supabase
    .from('announcements')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'submitted')

  return (
    <DashboardShell
      displayName={profile.display_name}
      role={profile.role}
      variant="admin"
      pendingReviewCount={pendingCount ?? 0}
    >
      {children}
    </DashboardShell>
  )
}
