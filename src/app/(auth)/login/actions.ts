'use server'

import { redirect } from 'next/navigation'
import { logAuditEvent } from '@/modules/audit'
import { createClient, createServiceClient } from '@/infrastructure/database/server'
import { getDefaultAppPath } from '@/modules/auth/authz'
import { ensureAuthUserProfile } from '@/modules/auth/sync-users'
import { reportServerError } from '@/shared/errors/error-reporting'
import { checkActionRateLimit } from '@/shared/middleware/action-rate-limit'

const AUTH_TIMING_DUMMY_EMAIL = 'invalid-login@bulletin.invalid'

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
    const { data: match, error: usernameLookupError } = await service
      .from('users')
      .select('email')
      .eq('display_name', email)
      .maybeSingle()
    if (usernameLookupError) {
      reportServerError('auth.login.username_lookup_failed', usernameLookupError, {
        username: email,
      })
    }
    email = match?.email ?? AUTH_TIMING_DUMMY_EMAIL
  }

  const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })

  if (signInError) {
    reportServerError('auth.login.sign_in_failed', signInError, {
      email: email === AUTH_TIMING_DUMMY_EMAIL ? null : email,
    })
    redirect('/login?error=invalid_credentials')
  }

  const {
    data: { user },
    error: userReadError,
  } = await supabase.auth.getUser()
  if (userReadError) {
    reportServerError('auth.login.user_read_failed', userReadError, {
      email,
    })
  }
  if (!user) redirect('/login?error=invalid_credentials')

  const profileSynced = await ensureAuthUserProfile(user)
  if (!profileSynced) {
    reportServerError(
      'auth.login.profile_sync_failed',
      new Error('Auth user profile sync returned false'),
      {
        userId: user.id,
        email: user.email ?? email,
      }
    )
  }

  const { data: profile, error: profileReadError } = await supabase
    .from('users')
    .select('role, force_password_change')
    .eq('id', user.id)
    .single()

  if (profileReadError) {
    reportServerError('auth.login.profile_read_failed', profileReadError, {
      userId: user.id,
      email: user.email ?? email,
    })
  }
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
  const {
    data: { user },
    error: logoutUserReadError,
  } = await supabase.auth.getUser()
  if (logoutUserReadError) {
    reportServerError('auth.logout.user_read_failed', logoutUserReadError)
  }
  if (user) {
    await logAuditEvent({
      actorId: user.id,
      action: 'auth.logout',
      targetType: 'session',
      targetId: user.id,
      metadata: { email: user.email ?? null },
    })
  }
  const { error: signOutError } = await supabase.auth.signOut()
  if (signOutError) {
    reportServerError('auth.logout.sign_out_failed', signOutError, {
      userId: user?.id ?? null,
      email: user?.email ?? null,
    })
  }
  redirect('/login')
}
