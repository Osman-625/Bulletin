import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DashboardShell } from '@/components/dashboard/DashboardShell'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('display_name, role, organization_id')
    .eq('id', user.id)
    .single()

  return (
    <DashboardShell displayName={profile?.display_name ?? null} role={profile?.role ?? null}>
      {children}
    </DashboardShell>
  )
}
