'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { logAuditEvent } from '@/lib/audit'
import { getDefaultAppPath } from '@/lib/auth/authz'
import { checkActionRateLimit } from '@/lib/security/action-rate-limit'
import { createClient } from '@/lib/supabase/server'

const SETTINGS_PATHS = new Set([
  '/dashboard/settings',
  '/admin/settings',
  '/super-admin/settings',
  '/owner/settings',
])

function getReturnTo(formData: FormData) {
  const value = ((formData.get('return_to') as string | null) ?? '').trim()
  return SETTINGS_PATHS.has(value) ? value : '/dashboard/settings'
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
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const rateLimit = await checkActionRateLimit('account-display-name', user.id)
  if (rateLimit.limited) {
    redirectWithStatus(returnTo, 'error', 'Too many profile updates. Please try again shortly.')
  }

  if (displayName.length < 2) {
    redirectWithStatus(returnTo, 'error', 'Display name must be at least 2 characters.')
  }

  const { data: profile } = await supabase
    .from('users')
    .select('display_name, role')
    .eq('id', user.id)
    .single()

  if (!profile?.role) redirect('/login?error=profile_missing')

  const { error: profileError } = await supabase
    .from('users')
    .update({ display_name: displayName })
    .eq('id', user.id)

  if (profileError) redirectWithStatus(returnTo, 'error', profileError.message)

  await supabase.auth.updateUser({
    data: {
      display_name: displayName,
    },
  })

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
  } = await supabase.auth.getUser()

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

  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()

  if (!profile?.role) redirect('/login?error=profile_missing')

  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: currentPassword,
  })

  if (signInError) redirectWithStatus(returnTo, 'error', 'Current password is incorrect.')

  const { error: updateError } = await supabase.auth.updateUser({ password: newPassword })
  if (updateError) redirectWithStatus(returnTo, 'error', updateError.message)

  await supabase.from('users').update({ force_password_change: false }).eq('id', user.id)

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
