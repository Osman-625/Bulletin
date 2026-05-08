'use server'

import { redirect } from 'next/navigation'
import { logAuditEvent } from '@/lib/audit'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { getDefaultAppPath } from '@/lib/auth/authz'
import { ensureAuthUserProfile } from '@/lib/auth/sync-users'
import { checkActionRateLimit } from '@/lib/security/action-rate-limit'

export async function login(formData: FormData) {
  const supabase = await createClient()

  let email = ((formData.get('email') as string | null) ?? '').trim()
  const password = (formData.get('password') as string | null) ?? ''

  const rateLimit = await checkActionRateLimit('login', email)
  if (rateLimit.limited) redirect('/login?error=too_many_attempts')

  if (!email || !password) redirect('/login?error=invalid_credentials')

  // Username login: no @ means look up the real email
  if (!email.includes('@')) {
    const service = await createServiceClient()
    const { data: match } = await service
      .from('users')
      .select('email')
      .eq('display_name', email)
      .single()
    if (!match?.email) redirect('/login?error=invalid_credentials')
    email = match.email
  }

  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) redirect('/login?error=invalid_credentials')

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?error=invalid_credentials')

  await ensureAuthUserProfile(user)

  const { data: profile } = await supabase
    .from('users')
    .select('role, force_password_change')
    .eq('id', user.id)
    .single()

  if (!profile?.role) redirect('/login?error=profile_missing')
  await logAuditEvent({
    actorId: user.id,
    action: 'auth.login',
    targetType: 'session',
    targetId: user.id,
    metadata: {
      email: user.email ?? email,
      role: profile.role,
    },
  })

  if (profile?.force_password_change) redirect('/change-password')
  redirect(getDefaultAppPath(profile.role))
}

export async function logout() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) {
    await logAuditEvent({
      actorId: user.id,
      action: 'auth.logout',
      targetType: 'session',
      targetId: user.id,
      metadata: { email: user.email ?? null },
    })
  }
  await supabase.auth.signOut()
  redirect('/login')
}
