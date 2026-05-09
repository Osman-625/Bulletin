'use server'

import { refresh, revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { logAuditEvent } from '@/lib/audit'
import {
  canAccessSuperAdminArea,
  canManageUser,
  getCurrentAccessContext,
  getDefaultAppPath,
  type AppRole,
} from '@/lib/auth/authz'
import { createAdminClient } from '@/lib/supabase/admin'

export type PasswordResetRequestState = {
  error?: string
  success?: string
}

export async function resetUserPassword(formData: FormData) {
  const access = await getCurrentAccessContext()
  if (!access) redirect('/login')
  if (!canAccessSuperAdminArea(access.role)) redirect(getDefaultAppPath(access.role))

  const targetUserId = formData.get('user_id') as string
  const tempPassword = formData.get('temp_password') as string

  if (!tempPassword || tempPassword.length < 8) {
    redirect('/super-admin/users?error=Password+must+be+at+least+8+characters')
  }

  const adminClient = createAdminClient()
  const { data: targetProfile } = await adminClient
    .from('users')
    .select('id, email, display_name, role')
    .eq('id', targetUserId)
    .single()

  if (!targetProfile) redirect('/super-admin/users?error=User+not+found')

  const canManage = canManageUser(
    { id: access.userId, role: access.role, orgIds: access.orgIds },
    { id: targetProfile.id, role: targetProfile.role as AppRole, orgIds: [] }
  )

  if (!canManage) redirect('/super-admin/users?error=Cannot+manage+this+user')

  const { error: authError } = await adminClient.auth.admin.updateUserById(targetUserId, {
    password: tempPassword,
  })

  if (authError) redirect(`/super-admin/users?error=${encodeURIComponent(authError.message)}`)

  await adminClient.from('users').update({ force_password_change: true }).eq('id', targetUserId)

  await logAuditEvent({
    actorId: access.userId,
    action: 'user.password_reset',
    targetType: 'user',
    targetId: targetUserId,
    metadata: {
      email: targetProfile?.email ?? null,
      display_name: targetProfile?.display_name ?? null,
      role: targetProfile?.role ?? null,
      force_password_change: true,
    },
  })

  revalidatePath('/super-admin/users')
  redirect('/super-admin/users?success=Password+reset+successfully')
}

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
  if (tempPassword.length < 8) {
    return { error: 'Temporary password must be at least 8 characters.' }
  }

  const adminClient = createAdminClient()
  const { data: resetRequest } = await adminClient
    .from('password_reset_requests')
    .select('id, user_id, email, status')
    .eq('id', requestId)
    .single()

  if (!resetRequest) return { error: 'Reset request was not found.' }
  if (resetRequest.status !== 'pending') return { error: 'This reset request was already handled.' }

  const { data: targetProfile } = await adminClient
    .from('users')
    .select('id, email, display_name, role')
    .eq('id', resetRequest.user_id)
    .single()

  if (!targetProfile) return { error: 'The requested user no longer exists.' }

  const canManage = canManageUser(
    { id: access.userId, role: access.role, orgIds: access.orgIds },
    { id: targetProfile.id, role: targetProfile.role as AppRole, orgIds: [] }
  )

  if (!canManage) return { error: 'You cannot reset this user from here.' }

  const now = new Date().toISOString()
  const { error: authError } = await adminClient.auth.admin.updateUserById(targetProfile.id, {
    password: tempPassword,
  })

  if (authError) return { error: authError.message }

  await adminClient.from('users').update({ force_password_change: true }).eq('id', targetProfile.id)

  await adminClient
    .from('password_reset_requests')
    .update({
      status: 'fulfilled',
      fulfilled_by: access.userId,
      fulfilled_at: now,
      updated_at: now,
    })
    .eq('id', resetRequest.id)

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
