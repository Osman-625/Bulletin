'use server'

import { redirect } from 'next/navigation'
import { logAuditEvent } from '@/modules/audit'
import { validatePassword } from '@/modules/auth/password-policy'
import { validateDisplayName } from '@/modules/users/display-name'
import { reportServerError } from '@/shared/errors/error-reporting'
import { checkActionRateLimit } from '@/shared/middleware/action-rate-limit'
import { createAdminClient } from '@/infrastructure/database/admin'

const REGISTRATION_ERROR = 'Could not create account. Try again or request a new invite.'

function registrationErrorHref(encodedToken: string) {
  return `/register?token=${encodedToken}&error=${encodeURIComponent(REGISTRATION_ERROR)}`
}

async function cleanupCreatedAuthUser(
  admin: ReturnType<typeof createAdminClient>,
  userId: string,
  context: string
) {
  const { error: cleanupError } = await admin.auth.admin.deleteUser(userId)
  if (cleanupError) {
    reportServerError(`${context}.cleanup_auth_user`, cleanupError, { targetId: userId })
  }
}

export async function completeRegistration(formData: FormData) {
  const token = ((formData.get('token') as string | null) ?? '').trim()
  const encodedToken = encodeURIComponent(token)
  const displayName = ((formData.get('display_name') as string | null) ?? '').trim()
  const password = (formData.get('password') as string | null) ?? ''

  const rateLimit = await checkActionRateLimit('register', token)
  if (rateLimit.limited) {
    redirect(`/register?token=${encodedToken}&error=Too+many+registration+attempts`)
  }

  if (!token || !displayName || !password) {
    redirect(`/register?token=${encodedToken}&error=All+fields+are+required`)
  }

  const passwordValidation = validatePassword(password)
  if (!passwordValidation.valid) {
    redirect(
      `/register?token=${encodedToken}&error=${encodeURIComponent(passwordValidation.message)}`
    )
  }

  const admin = createAdminClient()

  const { data: invitation, error: invitationReadError } = await admin
    .from('invitations')
    .select('id, email, role, member_role, org_ids, invited_by')
    .eq('token', token)
    .is('accepted_at', null)
    .gt('expires_at', new Date().toISOString())
    .single()

  if (invitationReadError || !invitation) {
    if (invitationReadError) {
      reportServerError('register.invitation.read', invitationReadError)
    }
    redirect('/register?error=Invalid+or+expired+invite+link')
  }

  // Checked after the invite so only someone with a valid invite can learn which names are taken.
  const nameCheck = await validateDisplayName(admin, displayName)
  if (!nameCheck.ok) {
    redirect(`/register?token=${encodedToken}&error=${encodeURIComponent(nameCheck.message)}`)
  }

  const { data: created, error: authCreateError } = await admin.auth.admin.createUser({
    email: invitation.email,
    password,
    user_metadata: { display_name: displayName, role: invitation.role },
    email_confirm: true,
  })

  if (authCreateError || !created.user) {
    reportServerError(
      'register.auth.create_user',
      authCreateError ?? new Error('Supabase Auth did not return a user'),
      {
        email: invitation.email,
        role: invitation.role,
      }
    )
    redirect(registrationErrorHref(encodedToken))
  }

  const userId = created.user.id

  const { error: profileUpsertError } = await admin.from('users').upsert(
    {
      id: userId,
      email: invitation.email,
      display_name: displayName,
      role: invitation.role,
      force_password_change: false,
    },
    { onConflict: 'id' }
  )
  if (profileUpsertError) {
    reportServerError('register.profile.upsert', profileUpsertError, {
      email: invitation.email,
      role: invitation.role,
      targetId: userId,
    })
    await cleanupCreatedAuthUser(admin, userId, 'register.profile.upsert')
    redirect(registrationErrorHref(encodedToken))
  }

  const orgIds = Array.isArray(invitation.org_ids)
    ? invitation.org_ids.filter((orgId): orgId is string => typeof orgId === 'string')
    : []
  let membershipInsertError: unknown = null
  if (orgIds.length > 0) {
    const result = await admin.from('organization_members').insert(
      orgIds.map((orgId) => ({
        organization_id: orgId,
        user_id: userId,
        member_role: invitation.member_role,
      }))
    )
    membershipInsertError = result.error
  }
  if (membershipInsertError) {
    reportServerError('register.memberships.insert', membershipInsertError, {
      email: invitation.email,
      targetId: userId,
      orgCount: orgIds.length,
    })
    await cleanupCreatedAuthUser(admin, userId, 'register.memberships.insert')
    redirect(registrationErrorHref(encodedToken))
  }

  const { error: invitationAcceptError } = await admin
    .from('invitations')
    .update({ accepted_at: new Date().toISOString() })
    .eq('token', token)
  if (invitationAcceptError) {
    reportServerError('register.invitation.accept', invitationAcceptError, {
      email: invitation.email,
      invitationId: invitation.id,
      targetId: userId,
    })
    await cleanupCreatedAuthUser(admin, userId, 'register.invitation.accept')
    redirect(registrationErrorHref(encodedToken))
  }

  await logAuditEvent({
    actorId: userId,
    action: 'invitation.accepted',
    targetType: 'invitation',
    targetId: invitation.id,
    metadata: {
      email: invitation.email,
      role: invitation.role,
      member_role: invitation.member_role,
      org_ids: orgIds,
      invited_by: invitation.invited_by,
      new_user_id: userId,
      display_name: displayName,
    },
  })

  redirect('/login?registered=1')
}
