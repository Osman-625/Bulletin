'use server'

import { redirect } from 'next/navigation'
import { logAuditEvent } from '@/lib/audit'
import {
  canAccessSuperAdminArea,
  getCurrentAccessContext,
  getDefaultAppPath,
} from '@/lib/auth/authz'
import { reportServerError } from '@/lib/error-reporting'
import { INVITATION_EXPIRY_DAYS, readAdminInvitationFormData } from '@/lib/invitations/validation'
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

  const parsed = readAdminInvitationFormData(formData)
  if (!parsed.ok) redirect(inviteErrorHref(parsed.error))

  const { email, role } = parsed.data
  if (role === 'super_admin' && access.role !== 'owner') {
    redirect(inviteErrorHref('Only owners can invite super admins.'))
  }

  const supabase = await createClient()
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + INVITATION_EXPIRY_DAYS)

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
    .select('id')
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

  redirect(`/super-admin/admins/invite?created=${data.id}`)
}
