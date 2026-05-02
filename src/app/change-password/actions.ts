'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function changePassword(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const password = formData.get('password') as string
  const confirm = formData.get('confirm') as string

  if (!password || password.length < 8) {
    redirect('/change-password?error=Password+must+be+at+least+8+characters')
  }
  if (password !== confirm) {
    redirect('/change-password?error=Passwords+do+not+match')
  }

  const { error } = await supabase.auth.updateUser({ password })
  if (error) redirect(`/change-password?error=${encodeURIComponent(error.message)}`)

  // Clear the force_password_change flag
  await supabase.from('users').update({ force_password_change: false }).eq('id', user.id)

  // Redirect to the appropriate dashboard
  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role === 'super_admin') redirect('/super-admin')
  if (profile?.role === 'admin') redirect('/admin')
  redirect('/dashboard')
}
