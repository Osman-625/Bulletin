'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function login(formData: FormData) {
  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithPassword({
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  })

  if (error) redirect('/login?error=invalid_credentials')

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?error=invalid_credentials')

  const { data: profile } = await supabase
    .from('users')
    .select('role, force_password_change')
    .eq('id', user.id)
    .single()

  if (profile?.force_password_change) redirect('/change-password')
  if (profile?.role === 'super_admin') redirect('/super-admin')
  if (profile?.role === 'admin') redirect('/admin')
  redirect('/dashboard')
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
