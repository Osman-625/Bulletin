'use server'

import { redirect } from 'next/navigation'
import { logAuditEvent } from '@/lib/audit'
import { canAccessAdminArea, getCurrentAccessContext, getDefaultAppPath } from '@/lib/auth/authz'
import { reportServerError } from '@/lib/error-reporting'
import {
  INVITATION_EXPIRY_DAYS,
  readPublisherInvitationFormData,
} from '@/lib/invitations/validation'
import { createClient } from '@/lib/supabase/server'

const INVITE_PUBLISHER_PATH = '/admin/publishers/invite'
const INVITE_CREATE_ERROR = 'Could not create invite. Try again.'

function inviteErrorHref(message: string) {
  return `${INVITE_PUBLISHER_PATH}?error=${encodeURIComponent(message)}`
}

export async function invitePublisher(formData: FormData) {
  const access = await getCurrentAccessContext()
  if (!access) redirect('/login')
  if (!canAccessAdminArea(access.role)) redirect(getDefaultAppPath(access.role))

  const parsed = readPublisherInvitationFormData(formData)
  if (!parsed.ok) redirect(inviteErrorHref(parsed.error))

  const { email, orgIds, memberRole } = parsed.data
  if (access.role === 'admin' && orgIds.some((orgId) => !access.orgIds.includes(orgId))) {
    redirect(
      '/admin/publishers/invite?error=You+can+only+invite+publishers+into+your+own+organizations'
    )
  }

  const supabase = await createClient()
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + INVITATION_EXPIRY_DAYS)

  const { data, error: invitationError } = await supabase
    .from('invitations')
    .insert({
      email,
      role: 'publisher',
      member_role: memberRole,
      org_ids: orgIds,
      invited_by: access.userId,
      expires_at: expiresAt.toISOString(),
    })
    .select('id')
    .single()

  if (invitationError || !data) {
    reportServerError(
      'admin.publishers.invite.create',
      invitationError ?? new Error('Invitation insert did not return a row'),
      {
        actorId: access.userId,
        email,
        memberRole,
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
      role: 'publisher',
      member_role: memberRole,
      org_ids: orgIds,
      expires_at: expiresAt.toISOString(),
    },
  })

  redirect(`/admin/publishers/invite?created=${data.id}`)
}
