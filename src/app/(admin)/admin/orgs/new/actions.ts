'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { logAuditEvent } from '@/lib/audit'
import { createClient } from '@/lib/supabase/server'

export async function createOrganization(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const name = (formData.get('name') as string).trim()
  const slug = (formData.get('slug') as string).trim().toLowerCase().replace(/\s+/g, '-')
  const description = (formData.get('description') as string | null)?.trim() || null
  const org_type = formData.get('org_type') as string

  const { data: organization, error } = await supabase.from('organizations').insert({
    name,
    slug,
    description,
    org_type: org_type as 'club' | 'department' | 'society' | 'faculty' | 'other',
    status: 'approved',
    owner_id: user.id,
    approved_by: user.id,
    approved_at: new Date().toISOString(),
  }).select('id').single()

  if (error) redirect(`/admin/orgs/new?error=${encodeURIComponent(error.message)}`)

  await logAuditEvent({
    actorId: user.id,
    action: 'organization.created',
    targetType: 'organization',
    targetId: organization.id,
    metadata: {
      name,
      slug,
      org_type,
      status: 'approved',
    },
  })

  revalidatePath('/admin/orgs')
  redirect('/admin/orgs')
}
