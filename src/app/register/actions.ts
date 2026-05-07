'use server'

import { redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { checkActionRateLimit } from '@/lib/security/action-rate-limit'

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

  if (password.length < 8) {
    redirect(`/register?token=${encodedToken}&error=Password+must+be+at+least+8+characters`)
  }

  const admin = createAdminClient()

  // Validate invitation token
  const { data: invitation, error: invErr } = await admin
    .from('invitations')
    .select('*')
    .eq('token', token)
    .is('accepted_at', null)
    .gt('expires_at', new Date().toISOString())
    .single()

  if (invErr || !invitation) {
    redirect('/register?error=Invalid+or+expired+invite+link')
  }

  // Create auth user
  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email: invitation.email,
    password,
    user_metadata: { display_name: displayName, role: invitation.role },
    email_confirm: true,
  })

  if (createErr || !created.user) {
    redirect(`/register?token=${encodedToken}&error=${encodeURIComponent(createErr?.message ?? 'Failed to create account')}`)
  }

  const userId = created.user.id

  // Upsert public.users (auth trigger may have already created it)
  await admin.from('users').upsert({
    id: userId,
    email: invitation.email,
    display_name: displayName,
    role: invitation.role,
    force_password_change: false,
  }, { onConflict: 'id' })

  // Create org memberships
  if (invitation.org_ids && invitation.org_ids.length > 0) {
    await admin.from('organization_members').insert(
      invitation.org_ids.map((orgId: string) => ({
        organization_id: orgId,
        user_id: userId,
        member_role: invitation.member_role,
      }))
    )
  }

  // Mark invitation as accepted
  await admin.from('invitations').update({ accepted_at: new Date().toISOString() }).eq('token', token)

  redirect('/login?registered=1')
}
