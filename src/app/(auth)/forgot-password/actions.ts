'use server'

import { redirect } from 'next/navigation'
import { logAuditEvent } from '@/lib/audit'
import { createNotificationsForUsers } from '@/lib/notifications'
import { checkActionRateLimit } from '@/lib/security/action-rate-limit'
import { createServiceClient } from '@/lib/supabase/server'

export async function requestPasswordReset(formData: FormData) {
  const email = ((formData.get('email') as string | null) ?? '').trim().toLowerCase()

  const rateLimit = await checkActionRateLimit('forgot-password', email || 'missing-email')
  if (rateLimit.limited) redirect('/forgot-password?sent=1')

  if (!email || !email.includes('@')) redirect('/forgot-password?sent=1')

  const supabase = await createServiceClient()
  const { data: profile } = await supabase
    .from('users')
    .select('id, email, display_name, role')
    .eq('email', email)
    .maybeSingle()

  if (!profile) {
    await logAuditEvent({
      action: 'user.password_reset_requested',
      targetType: 'user',
      metadata: { email, matched_user: false },
    })
    redirect('/forgot-password?sent=1')
  }

  const { data: existingRequest } = await supabase
    .from('password_reset_requests')
    .select('id')
    .eq('user_id', profile.id)
    .eq('status', 'pending')
    .maybeSingle()

  let requestId = existingRequest?.id ?? null

  if (requestId) {
    await supabase
      .from('password_reset_requests')
      .update({ email: profile.email, updated_at: new Date().toISOString() })
      .eq('id', requestId)
  } else {
    const { data: createdRequest } = await supabase
      .from('password_reset_requests')
      .insert({
        user_id: profile.id,
        email: profile.email,
      })
      .select('id')
      .single()

    requestId = createdRequest?.id ?? null
  }

  const { data: resetManagers } = await supabase
    .from('users')
    .select('id')
    .in('role', ['owner', 'super_admin'])

  await createNotificationsForUsers(
    (resetManagers ?? []).map((manager) => manager.id).filter((id) => id !== profile.id),
    {
      actor_id: profile.id,
      type: 'password_reset_requested',
      title: 'Password reset requested',
      body: `${profile.display_name} (${profile.email}) requested a temporary password.`,
      href: requestId ? `/super-admin/users?reset_request=${requestId}` : '/super-admin/users',
    }
  )

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

  redirect('/forgot-password?sent=1')
}
