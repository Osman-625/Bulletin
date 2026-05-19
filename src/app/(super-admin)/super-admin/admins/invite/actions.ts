'use server'

import { redirect } from 'next/navigation'
import { logAuditEvent } from '@/lib/audit'
import {
  canAccessSuperAdminArea,
  getCurrentAccessContext,
  getDefaultAppPath,
} from '@/lib/auth/authz'
import { reportServerError } from '@/lib/error-reporting'
import { createClient } from '@/lib/supabase/server'

const INVITE_ADMIN_PATH = '/super-admin/admins/invite'
const INVITE_CREATE_ERROR = 'Could not create invite. Try again.'

function inviteErrorHref(message: string) {
  return `${INVITE_ADMIN_PATH}?error=${encodeURIComponent(message)}`
}

export async function inviteAdmin(formData: FormData) {
  const access = await getCurrentAccessContext()
  if (!access) redirect('/login')
  if (!canAccessSuperAdminArea(access.role)) redirect(getDefaultAppPath(access.role))

  const supabase = await createClient()

  const email = ((formData.get('email') as string | null) ?? '').trim().toLowerCase()
  const ALLOWED_ROLES = ['admin', 'super_admin']
  const rawRole = (formData.get('role') as string) || 'admin'
  const role = ALLOWED_ROLES.includes(rawRole) ? rawRole : 'admin'

  if (!email || !email.includes('@')) {
    redirect(inviteErrorHref('Enter a valid email address.'))
  }

  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 7)

  const { data, error: invitationError } = await supabase
    .from('invitations')
    .insert({
      email,
      role: role as 'admin' | 'super_admin',
      member_role: 'admin',
      org_ids: [],
      invited_by: access.userId,
      expires_at: expiresAt.toISOString(),
    })
    .select('id, token')
    .single()

  if (invitationError || !data) {
    reportServerError(
      'super_admin.admins.invite.create',
      invitationError ?? new Error('Invitation insert did not return a row'),
      {
        actorId: access.userId,
        email,
        role,
      }
    )
    redirect(inviteErrorHref(INVITE_CREATE_ERROR))
  }

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
