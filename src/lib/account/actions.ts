'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { logAuditEvent } from '@/lib/audit'
import { getDefaultAppPath } from '@/lib/auth/authz'
import { reportServerError } from '@/lib/error-reporting'
import { checkActionRateLimit } from '@/lib/security/action-rate-limit'
import { createClient } from '@/lib/supabase/server'

const ACCOUNT_PROFILE_ERROR = 'Could not update profile. Try again.'
const ACCOUNT_PASSWORD_ERROR = 'Could not update password. Try again.'

function isSettingsPath(value: string) {
  switch (value) {
    case '/dashboard/settings':
    case '/admin/settings':
    case '/super-admin/settings':
    case '/owner/settings':
      return true
    default:
      return false
  }
}

function getReturnTo(formData: FormData) {
  const value = ((formData.get('return_to') as string | null) ?? '').trim()
  return isSettingsPath(value) ? value : '/dashboard/settings'
}

function redirectWithStatus(
  path: string,
  key: 'profile' | 'password' | 'error',
  message: string
): never {
  redirect(`${path}?${key}=${encodeURIComponent(message)}`)
}

function revalidateAccountPaths(returnTo: string, rolePath: string) {
  ;[returnTo, rolePath, '/dashboard', '/admin', '/super-admin', '/owner'].forEach((path) => {
    revalidatePath(path)
  })
}

export async function updateDisplayName(formData: FormData) {
  const returnTo = getReturnTo(formData)
  const displayName = ((formData.get('display_name') as string | null) ?? '').trim()

  const supabase = await createClient()
  const {
    data: { user },
    error: userReadError,
  } = await supabase.auth.getUser()

  if (userReadError) {
    reportServerError('account.display_name.user_read_failed', userReadError)
  }
  if (!user) redirect('/login')

  const rateLimit = await checkActionRateLimit('account-display-name', user.id)
  if (rateLimit.limited) {
    redirectWithStatus(returnTo, 'error', 'Too many profile updates. Please try again shortly.')
  }

  if (displayName.length < 2) {
    redirectWithStatus(returnTo, 'error', 'Display name must be at least 2 characters.')
  }

  const { data: profile, error: profileReadError } = await supabase
    .from('users')
    .select('display_name, role')
    .eq('id', user.id)
    .single()

  if (profileReadError) {
    reportServerError('account.display_name.profile_read_failed', profileReadError, {
      user_id: user.id,
    })
    redirectWithStatus(returnTo, 'error', ACCOUNT_PROFILE_ERROR)
  }
  if (!profile?.role) redirect('/login?error=profile_missing')

  const { error: profileUpdateError } = await supabase
    .from('users')
    .update({ display_name: displayName })
    .eq('id', user.id)

  if (profileUpdateError) {
    reportServerError('account.display_name.profile_update_failed', profileUpdateError, {
      user_id: user.id,
    })
    redirectWithStatus(returnTo, 'error', ACCOUNT_PROFILE_ERROR)
  }

  const { error: authMetadataUpdateError } = await supabase.auth.updateUser({
    data: {
      display_name: displayName,
    },
  })

  if (authMetadataUpdateError) {
    reportServerError('account.display_name.auth_metadata_update_failed', authMetadataUpdateError, {
      user_id: user.id,
    })
    redirectWithStatus(returnTo, 'error', ACCOUNT_PROFILE_ERROR)
  }

  await logAuditEvent({
    actorId: user.id,
    action: 'user.display_name_changed',
    targetType: 'user',
    targetId: user.id,
    metadata: {
      previous_display_name: profile.display_name,
      new_display_name: displayName,
    },
  })

  revalidateAccountPaths(returnTo, getDefaultAppPath(profile.role))
  redirectWithStatus(returnTo, 'profile', 'Display name updated.')
}

export async function updateAccountPassword(formData: FormData) {
  const returnTo = getReturnTo(formData)
  const currentPassword = (formData.get('current_password') as string | null) ?? ''
  const newPassword = (formData.get('password') as string | null) ?? ''
  const confirmPassword = (formData.get('confirm') as string | null) ?? ''

  const supabase = await createClient()
  const {
    data: { user },
    error: userReadError,
  } = await supabase.auth.getUser()

  if (userReadError) {
    reportServerError('account.password.user_read_failed', userReadError)
  }
  if (!user) redirect('/login')

  const rateLimit = await checkActionRateLimit('account-password', user.id)
  if (rateLimit.limited) {
    redirectWithStatus(returnTo, 'error', 'Too many password updates. Please try again shortly.')
  }

  if (!user.email)
    redirectWithStatus(returnTo, 'error', 'This account is missing an email address.')
  if (!currentPassword) redirectWithStatus(returnTo, 'error', 'Current password is required.')
  if (newPassword.length < 8)
    redirectWithStatus(returnTo, 'error', 'New password must be at least 8 characters.')
  if (newPassword !== confirmPassword)
    redirectWithStatus(returnTo, 'error', 'New passwords do not match.')
  if (currentPassword === newPassword)
    redirectWithStatus(returnTo, 'error', 'Choose a password you are not already using.')

  const { data: profile, error: profileReadError } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profileReadError) {
    reportServerError('account.password.profile_read_failed', profileReadError, {
      user_id: user.id,
    })
    redirectWithStatus(returnTo, 'error', ACCOUNT_PASSWORD_ERROR)
  }
  if (!profile?.role) redirect('/login?error=profile_missing')

  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: currentPassword,
  })

  if (signInError) {
    reportServerError('account.password.current_password_rejected', signInError, {
      user_id: user.id,
    })
    redirectWithStatus(returnTo, 'error', 'Current password is incorrect.')
  }

  const { error: authPasswordUpdateError } = await supabase.auth.updateUser({
    password: newPassword,
  })
  if (authPasswordUpdateError) {
    reportServerError('account.password.auth_update_failed', authPasswordUpdateError, {
      user_id: user.id,
    })
    redirectWithStatus(returnTo, 'error', ACCOUNT_PASSWORD_ERROR)
  }

  const { error: forcePasswordChangeError } = await supabase
    .from('users')
    .update({ force_password_change: false })
    .eq('id', user.id)

  if (forcePasswordChangeError) {
    reportServerError(
      'account.password.force_password_change_update_failed',
      forcePasswordChangeError,
      {
        user_id: user.id,
      }
    )
    redirectWithStatus(returnTo, 'error', ACCOUNT_PASSWORD_ERROR)
  }

  await logAuditEvent({
    actorId: user.id,
    action: 'user.password_changed',
    targetType: 'user',
    targetId: user.id,
    metadata: {
      source: 'settings',
      email: user.email,
    },
  })

  revalidateAccountPaths(returnTo, getDefaultAppPath(profile.role))
  redirectWithStatus(returnTo, 'password', 'Password updated.')
}
