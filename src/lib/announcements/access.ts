import type { AccessContext } from '@/lib/auth/authz'
import { canAccessPublisherArea } from '@/lib/auth/authz'
import type { createClient } from '@/lib/supabase/server'

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>

export function canManageAnnouncementForOrg(access: AccessContext, organizationId: string): boolean {
  if (access.role === 'owner' || access.role === 'super_admin') return true
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
