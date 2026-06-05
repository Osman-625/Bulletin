'use server'

import { redirect } from 'next/navigation'
import { logAuditEvent } from '@/lib/audit'
import { reportServerError } from '@/lib/error-reporting'
import { createNotificationsForUsers } from '@/lib/notifications'
import { checkActionRateLimit } from '@/lib/security/action-rate-limit'
import { createServiceClient } from '@/lib/supabase/server'

const FORGOT_PASSWORD_SENT_PATH = '/forgot-password?sent=1'

function redirectAsSent(): never {
  redirect(FORGOT_PASSWORD_SENT_PATH)
}

export async function requestPasswordReset(formData: FormData) {
  const email = ((formData.get('email') as string | null) ?? '').trim().toLowerCase()

  const rateLimit = await checkActionRateLimit('forgot-password', email || 'missing-email')
  if (rateLimit.limited) redirectAsSent()

  if (!email || !email.includes('@')) redirectAsSent()

  const supabase = await createServiceClient()
  const { data: profile, error: profileReadError } = await supabase
    .from('users')
    .select('id, email, display_name, role')
    .eq('email', email)
    .maybeSingle()
  if (profileReadError) {
    reportServerError('auth.forgot_password.read_profile', profileReadError, { email })
    redirectAsSent()
  }

  if (!profile) {
    await logAuditEvent({
      action: 'user.password_reset_requested',
      targetType: 'user',
      metadata: { email, matched_user: false },
    })
    redirectAsSent()
  }

  const { data: existingRequest, error: existingRequestReadError } = await supabase
    .from('password_reset_requests')
    .select('id')
    .eq('user_id', profile.id)
    .eq('status', 'pending')
    .maybeSingle()
  if (existingRequestReadError) {
    reportServerError('auth.forgot_password.read_existing_request', existingRequestReadError, {
      email,
      targetId: profile.id,
    })
    redirectAsSent()
  }

  let requestId = existingRequest?.id ?? null

  if (requestId) {
    const { error: requestUpdateError } = await supabase
      .from('password_reset_requests')
      .update({ email: profile.email, updated_at: new Date().toISOString() })
      .eq('id', requestId)
    if (requestUpdateError) {
      reportServerError('auth.forgot_password.update_request', requestUpdateError, {
        email,
        requestId,
        targetId: profile.id,
      })
      redirectAsSent()
    }
  } else {
    const { data: createdRequest, error: requestCreateError } = await supabase
      .from('password_reset_requests')
      .insert({
        user_id: profile.id,
        email: profile.email,
      })
      .select('id')
      .single()
    if (requestCreateError || !createdRequest) {
      reportServerError(
        'auth.forgot_password.create_request',
        requestCreateError ?? new Error('Password reset request was not returned'),
        { email, targetId: profile.id }
      )
      redirectAsSent()
    }

    requestId = createdRequest?.id ?? null
  }

  const { data: resetManagers, error: resetManagersError } = await supabase
    .from('users')
    .select('id')
    .in('role', ['owner', 'super_admin'])

  if (resetManagersError) {
    reportServerError('auth.forgot_password.read_reset_managers', resetManagersError, {
      email,
      targetId: profile.id,
      requestId,
    })
  } else {
    await createNotificationsForUsers(
      (resetManagers ?? []).flatMap((manager) => (manager.id === profile.id ? [] : [manager.id])),
      {
        actor_id: profile.id,
        type: 'password_reset_requested',
        title: 'Password reset requested',
        body: `${profile.display_name} (${profile.email}) requested a temporary password.`,
        href: requestId ? `/super-admin/users?reset_request=${requestId}` : '/super-admin/users',
      }
    )
  }

  await logAuditEvent({
    actorId: profile.id,
    action: 'user.password_reset_requested',
    targetType: 'user',
    targetId: profile.id,
    metadata: {
      email: profile.email,
      display_name: profile.display_name,
      role: profile.role,
      request_id: requestId,
      matched_user: true,
    },
  })

  redirectAsSent()
}
