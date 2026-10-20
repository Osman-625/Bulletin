'use server'

import { refresh, revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { logAuditEvent } from '@/modules/audit'
import {
  canAccessSuperAdminArea,
  canManageUser,
  getCurrentAccessContext,
  getDefaultAppPath,
  type AppRole,
} from '@/modules/auth/authz'
import {
  TEMPORARY_PASSWORD_MIN_LENGTH,
  validateTemporaryPassword,
} from '@/modules/auth/password-policy'
import { reportServerError } from '@/shared/errors/error-reporting'
import { checkActionRateLimit } from '@/shared/middleware/action-rate-limit'
import { createAdminClient } from '@/infrastructure/database/admin'

export type PasswordResetRequestState = {
  error?: string
  success?: string
}

const PASSWORD_RESET_REQUEST_ERROR = 'Could not fulfill password reset request. Try again.'

export async function fulfillPasswordResetRequest(
  _prevState: PasswordResetRequestState,
  formData: FormData
): Promise<PasswordResetRequestState> {
  const access = await getCurrentAccessContext()
  if (!access) redirect('/login')
  if (!canAccessSuperAdminArea(access.role)) redirect(getDefaultAppPath(access.role))

  const requestId = ((formData.get('request_id') as string | null) ?? '').trim()
  const tempPassword = (formData.get('temp_password') as string | null) ?? ''

  if (!requestId) return { error: 'Missing reset request.' }
  const rateLimit = await checkActionRateLimit(
    'super-admin-password-reset-request',
    `${access.userId}:${requestId}`
  )
  if (rateLimit.limited) return { error: 'Too many password resets. Try again shortly.' }
  const passwordValidation = validateTemporaryPassword(tempPassword, TEMPORARY_PASSWORD_MIN_LENGTH)
  if (!passwordValidation.valid) {
    return { error: passwordValidation.message }
  }

  const adminClient = createAdminClient()
  const { data: resetRequest, error: requestReadError } = await adminClient
    .from('password_reset_requests')
    .select('id, user_id, email, status')
    .eq('id', requestId)
    .single()

  if (requestReadError) {
    reportServerError('super_admin.users.actions.read_reset_request', requestReadError, {
      actorId: access.userId,
      requestId,
    })
    return { error: PASSWORD_RESET_REQUEST_ERROR }
  }
  if (!resetRequest) return { error: 'Reset request was not found.' }
  if (resetRequest.status !== 'pending') return { error: 'This reset request was already handled.' }

  const { data: targetProfile, error: targetReadError } = await adminClient
    .from('users')
    .select('id, email, display_name, role')
    .eq('id', resetRequest.user_id)
    .single()

  if (targetReadError) {
    reportServerError('super_admin.users.actions.read_request_target', targetReadError, {
      actorId: access.userId,
      requestId,
      targetId: resetRequest.user_id,
    })
    return { error: PASSWORD_RESET_REQUEST_ERROR }
  }
  if (!targetProfile) return { error: 'The requested user no longer exists.' }

  const canManage = canManageUser(
    { id: access.userId, role: access.role, orgIds: access.orgIds },
    { id: targetProfile.id, role: targetProfile.role as AppRole, orgIds: [] }
  )

  if (!canManage) return { error: 'You cannot reset this user from here.' }

  const now = new Date().toISOString()
  const { error: authUpdateError } = await adminClient.auth.admin.updateUserById(targetProfile.id, {
    password: tempPassword,
  })

  if (authUpdateError) {
    reportServerError('super_admin.users.actions.fulfill_reset_auth', authUpdateError, {
      actorId: access.userId,
      requestId,
      targetId: targetProfile.id,
    })
    return { error: PASSWORD_RESET_REQUEST_ERROR }
  }

  const { error: profileUpdateError } = await adminClient
    .from('users')
    .update({ force_password_change: true })
    .eq('id', targetProfile.id)
  if (profileUpdateError) {
    reportServerError('super_admin.users.actions.fulfill_reset_profile', profileUpdateError, {
      actorId: access.userId,
      requestId,
      targetId: targetProfile.id,
    })
    return { error: PASSWORD_RESET_REQUEST_ERROR }
  }

  const { error: requestUpdateError } = await adminClient
    .from('password_reset_requests')
    .update({
      status: 'fulfilled',
      fulfilled_by: access.userId,
      fulfilled_at: now,
      updated_at: now,
    })
    .eq('id', resetRequest.id)
  if (requestUpdateError) {
    reportServerError('super_admin.users.actions.fulfill_reset_request', requestUpdateError, {
      actorId: access.userId,
      requestId: resetRequest.id,
      targetId: targetProfile.id,
    })
    return { error: PASSWORD_RESET_REQUEST_ERROR }
  }

  await logAuditEvent({
    actorId: access.userId,
    action: 'user.password_reset',
    targetType: 'user',
    targetId: targetProfile.id,
    metadata: {
      email: targetProfile.email,
      display_name: targetProfile.display_name,
      role: targetProfile.role,
      request_id: resetRequest.id,
      force_password_change: true,
      source: 'forgot_password_request',
    },
  })

  revalidatePath('/super-admin/users')
  revalidatePath('/owner/users')
  refresh()

  return {
    success: 'Temporary password set. Share it privately; the user must change it on login.',
  }
}
