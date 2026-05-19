'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { logAuditEvent } from '@/lib/audit'
import { canAccessAdminArea, getCurrentAccessContext } from '@/lib/auth/authz'
import { reportServerError } from '@/lib/error-reporting'
import { readOrganizationFormData } from '@/lib/organizations/validation'
import { createClient } from '@/lib/supabase/server'

const ORGANIZATION_CREATE_ERROR = 'Could not create organization. Try again.'

export async function createOrganization(formData: FormData) {
  const access = await getCurrentAccessContext()
  if (!access) redirect('/login')
  if (!canAccessAdminArea(access.role)) redirect('/dashboard')

  const supabase = await createClient()

  const parsed = readOrganizationFormData(formData)
  if (!parsed.ok) redirect(`/admin/orgs/new?error=${encodeURIComponent(parsed.error)}`)

  const { name, slug, description, org_type } = parsed.data

  const { data: organization, error } = await supabase
    .from('organizations')
    .insert({
      name,
      slug,
      description,
      org_type,
      status: 'approved',
      owner_id: access.userId,
      approved_by: access.userId,
      approved_at: new Date().toISOString(),
    })
    .select('id')
    .single()

  if (error) {
    reportServerError('admin.organization.create_failed', error, {
      actor_id: access.userId,
      slug,
      org_type,
    })
    redirect(`/admin/orgs/new?error=${encodeURIComponent(ORGANIZATION_CREATE_ERROR)}`)
  }

  await logAuditEvent({
    actorId: access.userId,
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
