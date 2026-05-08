'use server'

import { redirect } from 'next/navigation'
import { logAuditEvent } from '@/lib/audit'
import { createClient } from '@/lib/supabase/server'
import { canAccessSuperAdminArea, getCurrentAccessContext, getDefaultAppPath } from '@/lib/auth/authz'

export async function inviteAdmin(formData: FormData) {
  const access = await getCurrentAccessContext()
  if (!access) redirect('/login')
  if (!canAccessSuperAdminArea(access.role)) redirect(getDefaultAppPath(access.role))

  const supabase = await createClient()

  const email = (formData.get('email') as string).trim().toLowerCase()
  const ALLOWED_ROLES = ['admin', 'super_admin']
  const rawRole = (formData.get('role') as string) || 'admin'
  const role = ALLOWED_ROLES.includes(rawRole) ? rawRole : 'admin'

  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 7)

  const { data, error } = await supabase.from('invitations').insert({
    email,
    role: role as 'admin' | 'super_admin',
    member_role: 'admin',
    org_ids: [],
    invited_by: access.userId,
    expires_at: expiresAt.toISOString(),
  }).select('id, token').single()

  if (error) redirect(`/super-admin/admins/invite?error=${encodeURIComponent(error.message)}`)

  await logAuditEvent({
    actorId: access.userId,
    action: 'invitation.created',
    targetType: 'invitation',
    targetId: data.id,
    metadata: {
      email,
      role,
      member_role: 'admin',
      org_ids: [],
      expires_at: expiresAt.toISOString(),
    },
  })

  redirect(`/super-admin/admins/invite?token=${data.token}&email=${encodeURIComponent(email)}`)
}
