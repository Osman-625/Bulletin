'use server'

import { redirect } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function login(formData: FormData) {
  const supabase = await createClient()

  let email = formData.get('email') as string
  const password = formData.get('password') as string

  // Username login: no @ means look up the real email
  if (!email.includes('@')) {
    const service = await createServiceClient()
    const { data: match } = await service
      .from('users')
      .select('email')
      .eq('display_name', email)
      .single()
    if (!match?.email) redirect('/login?error=invalid_credentials')
    email = match.email
  }

  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) redirect('/login?error=invalid_credentials')

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?error=invalid_credentials')

  const { data: profile } = await supabase
    .from('users')
    .select('role, force_password_change')
    .eq('id', user.id)
    .single()

  if (profile?.force_password_change) redirect('/change-password')
  if (profile?.role === 'owner') redirect('/owner')
  if (profile?.role === 'super_admin') redirect('/super-admin')
  if (profile?.role === 'admin') redirect('/admin')
  redirect('/dashboard')
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
