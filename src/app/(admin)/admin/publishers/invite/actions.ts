
'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function invitePublisher(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const email = (formData.get('email') as string).trim().toLowerCase()
  const orgIds = formData.getAll('org_ids') as string[]
  const memberRole = (formData.get('member_role') as string) || 'publisher'

  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 7)

  const { data, error } = await supabase.from('invitations').insert({
    email,
    role: 'publisher',
    member_role: memberRole as 'publisher' | 'admin',
    org_ids: orgIds,
    invited_by: user.id,
    expires_at: expiresAt.toISOString(),
  }).select('token').single()

  if (error) redirect(`/admin/publishers/invite?error=${encodeURIComponent(error.message)}`)

  redirect(`/admin/publishers/invite?token=${data.token}&email=${encodeURIComponent(email)}`)
}
