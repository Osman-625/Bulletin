'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export async function resetUserPassword(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: callerProfile } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (!['super_admin', 'owner'].includes(callerProfile?.role ?? '')) redirect('/login')

  const targetUserId = formData.get('user_id') as string
  const tempPassword = formData.get('temp_password') as string

  if (!tempPassword || tempPassword.length < 8) {
    redirect('/super-admin/users?error=Password+must+be+at+least+8+characters')
  }

  const adminClient = createAdminClient()

  const { error: authError } = await adminClient.auth.admin.updateUserById(targetUserId, {
    password: tempPassword,
  })

  if (authError) redirect(`/super-admin/users?error=${encodeURIComponent(authError.message)}`)

  await adminClient
    .from('users')
    .update({ force_password_change: true })
    .eq('id', targetUserId)

  revalidatePath('/super-admin/users')
  redirect('/super-admin/users?success=Password+reset+successfully')
}
