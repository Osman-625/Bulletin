import { createClient } from '@/lib/supabase/server'
import { DashboardSidebar } from './DashboardSidebar'
import { DashboardTopNav } from './DashboardTopNav'

interface DashboardShellProps {
  children: React.ReactNode
}

export async function DashboardShell({ children }: DashboardShellProps) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let profile: { display_name: string | null; role: string | null; organization_id: string | null } | null = null

  if (user) {
    const { data } = await supabase
      .from('users')
      .select('display_name, role, organization_id')
      .eq('id', user.id)
      .single()

    profile = data
  }

  return (
    <div className="min-h-screen bg-[var(--color-canvas)]">
      <DashboardSidebar displayName={profile?.display_name} role={profile?.role} />
      <DashboardTopNav userName={profile?.display_name} />
      <main className="pl-64 pt-16 min-h-screen">
        {children}
      </main>
    </div>
  )
}
