import { redirect } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/server'
import { DashboardShell } from '@/components/dashboard/DashboardShell'

export default async function OwnerLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServiceClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('display_name, role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'owner') redirect('/dashboard')

  return (
    <DashboardShell
      displayName={profile.display_name}
      role={profile.role}
      variant="owner"
    >
      {children}
    </DashboardShell>
  )
}
