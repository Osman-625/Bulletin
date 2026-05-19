'use server'

import { redirect } from 'next/navigation'
import { logAuditEvent } from '@/lib/audit'
import { reportServerError } from '@/lib/error-reporting'
import { checkActionRateLimit } from '@/lib/security/action-rate-limit'
import { createClient } from '@/lib/supabase/server'

const CHANGE_PASSWORD_PATH = '/change-password'
const PASSWORD_CHANGE_ERROR = 'Could not finish updating your password. Try again.'

function changePasswordErrorHref(message: string) {
  return `${CHANGE_PASSWORD_PATH}?error=${encodeURIComponent(message)}`
}

export async function changePassword(formData: FormData) {
  const supabase = await createClient()
  const {
    data: { user },
    error: userReadError,
  } = await supabase.auth.getUser()
  if (userReadError) {
    reportServerError('auth.change_password.read_user', userReadError)
  }
  if (!user) redirect('/login')

  const rateLimit = await checkActionRateLimit('change-password', user.id)
  if (rateLimit.limited) {
    redirect('/change-password?error=Too+many+password+change+attempts')
  }

  const password = formData.get('password') as string
  const confirm = formData.get('confirm') as string

  if (!password || password.length < 8) {
    redirect('/change-password?error=Password+must+be+at+least+8+characters')
  }
  if (password !== confirm) {
    redirect('/change-password?error=Passwords+do+not+match')
  }

  const { error: authUpdateError } = await supabase.auth.updateUser({ password })
  if (authUpdateError) {
    reportServerError('auth.change_password.update_auth', authUpdateError, { actorId: user.id })
    redirect(changePasswordErrorHref(PASSWORD_CHANGE_ERROR))
  }

  const { error: profileUpdateError } = await supabase
    .from('users')
    .update({ force_password_change: false })
    .eq('id', user.id)
  if (profileUpdateError) {
    reportServerError('auth.change_password.update_profile', profileUpdateError, {
      actorId: user.id,
    })
    redirect(changePasswordErrorHref(PASSWORD_CHANGE_ERROR))
  }
  await logAuditEvent({
    actorId: user.id,
    action: 'user.password_changed',
    targetType: 'user',
    targetId: user.id,
    metadata: { email: user.email ?? null },
  })

  // Redirect to the appropriate dashboard
  const { data: profile, error: profileReadError } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()
  if (profileReadError) {
    reportServerError('auth.change_password.read_profile', profileReadError, { actorId: user.id })
  }

  if (profile?.role === 'owner') redirect('/owner')
  if (profile?.role === 'super_admin') redirect('/super-admin')
  if (profile?.role === 'admin') redirect('/admin')
  redirect('/dashboard')
}
