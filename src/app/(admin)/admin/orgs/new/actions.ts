'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { logAuditEvent } from '@/lib/audit'
import { canAccessAdminArea, getCurrentAccessContext } from '@/lib/auth/authz'
import { reportServerError } from '@/lib/error-reporting'
import { readOrganizationFormData } from '@/lib/organizations/validation'
import { checkActionRateLimit } from '@/lib/security/action-rate-limit'
import { createClient } from '@/lib/supabase/server'

const ORGANIZATION_CREATE_ERROR = 'Could not create organization. Try again.'

export async function createOrganization(formData: FormData) {
  const access = await getCurrentAccessContext()
  if (!access) redirect('/login')
  if (!canAccessAdminArea(access.role)) redirect('/dashboard')

  const supabase = await createClient()
  const rateLimit = await checkActionRateLimit('organization-create', access.userId)
  if (rateLimit.limited) {
    redirect(`/admin/orgs/new?error=${encodeURIComponent('Too many attempts. Try again shortly.')}`)
  }

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

  const { error: membershipError } = await supabase.from('organization_members').upsert(
    {
      organization_id: organization.id,
      user_id: access.userId,
      member_role: 'admin',
    },
    { onConflict: 'organization_id,user_id' }
  )

  if (membershipError) {
    reportServerError('admin.organization.creator_membership_failed', membershipError, {
      actor_id: access.userId,
      organization_id: organization.id,
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
      creator_membership: 'admin',
    },
  })

  revalidatePath('/admin/orgs')
  redirect('/admin/orgs')
}
