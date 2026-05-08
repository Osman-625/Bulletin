
'use server'

import { redirect } from 'next/navigation'
import { logAuditEvent } from '@/lib/audit'
import { createClient } from '@/lib/supabase/server'
import { canAccessAdminArea, getCurrentAccessContext, getDefaultAppPath } from '@/lib/auth/authz'

export async function invitePublisher(formData: FormData) {
  const access = await getCurrentAccessContext()
  if (!access) redirect('/login')
  if (!canAccessAdminArea(access.role)) redirect(getDefaultAppPath(access.role))

  const supabase = await createClient()

  const email = (formData.get('email') as string).trim().toLowerCase()
  const orgIds = formData.getAll('org_ids') as string[]
  const memberRole = (formData.get('member_role') as string) || 'publisher'

  if (access.role === 'admin' && orgIds.some((orgId) => !access.orgIds.includes(orgId))) {
    redirect('/admin/publishers/invite?error=You+can+only+invite+publishers+into+your+own+organizations')
  }

  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 7)

  const { data, error } = await supabase.from('invitations').insert({
    email,
    role: 'publisher',
    member_role: memberRole as 'publisher' | 'admin',
    org_ids: orgIds,
    invited_by: access.userId,
    expires_at: expiresAt.toISOString(),
  }).select('id, token').single()

  if (error) redirect(`/admin/publishers/invite?error=${encodeURIComponent(error.message)}`)

  await logAuditEvent({
    actorId: access.userId,
    action: 'invitation.created',
    targetType: 'invitation',
    targetId: data.id,
    metadata: {
      email,
      role: 'publisher',
      member_role: memberRole,
      org_ids: orgIds,
      expires_at: expiresAt.toISOString(),
    },
  })

  redirect(`/admin/publishers/invite?token=${data.token}&email=${encodeURIComponent(email)}`)
}
