import { createClient } from '@/lib/supabase/server'
import { logout } from '@/app/(auth)/login/actions'

export const metadata = { title: 'Dashboard' }

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('users')
    .select('display_name, role')
    .eq('id', user!.id)
    .single()

  return (
    <div className="flex min-h-full flex-col items-center justify-center gap-6 text-center">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">Welcome, {profile?.display_name ?? user!.email}</h1>
        <p className="text-sm text-zinc-500 capitalize">Role: {profile?.role ?? '—'}</p>
      </div>
      <p className="text-sm text-green-600 font-medium">Auth is working.</p>
      <form action={logout}>
        <button type="submit" className="text-sm underline underline-offset-4">
          Sign out
        </button>
      </form>
    </div>
  )
}
