'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function inviteAdmin(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const email = (formData.get('email') as string).trim().toLowerCase()
  const role = (formData.get('role') as string) || 'admin'

  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 7)

  const { data, error } = await supabase.from('invitations').insert({
    email,
    role: role as 'admin' | 'super_admin',
    member_role: 'admin',
    org_ids: [],
    invited_by: user.id,
    expires_at: expiresAt.toISOString(),
  }).select('token').single()

  if (error) redirect(`/super-admin/admins/invite?error=${encodeURIComponent(error.message)}`)

  redirect(`/super-admin/admins/invite?token=${data.token}&email=${encodeURIComponent(email)}`)
}
