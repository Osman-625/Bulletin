import type { AccessContext } from '@/modules/auth/authz'
import { canAccessPublisherArea } from '@/modules/auth/authz'
import type { createClient } from '@/infrastructure/database/server'

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>

export function canManageAnnouncementForOrg(
  access: AccessContext,
  organizationId: string
): boolean {
  if (!canAccessPublisherArea(access.role)) return false
  if (access.role === 'owner') return true
  return access.orgIds.includes(organizationId)
}

export function shouldScopeAnnouncementsToMembership(access: AccessContext): boolean {
  return access.role !== 'owner' && access.role !== 'super_admin'
}

export async function getWritableOrganizationId(
  supabase: SupabaseServerClient,
  access: AccessContext
): Promise<string | null> {
  if (!canAccessPublisherArea(access.role)) return null
  if (access.orgIds[0]) return access.orgIds[0]
  if (access.role !== 'owner' && access.role !== 'super_admin') return null

  const { data } = await supabase
    .from('organizations')
    .select('id')
    .eq('status', 'approved')
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle()

  return data?.id ?? null
}
