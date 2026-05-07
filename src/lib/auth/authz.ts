import { cache } from 'react'
import { createClient } from '../supabase/server'
import type { UserRole } from '../types'

export type AppRole = UserRole | 'owner'

export type AccessContext = {
  userId: string
  displayName: string | null
  role: AppRole
  forcePasswordChange: boolean
  orgIds: string[]
}

export type ScopedUser = {
  id: string
  role: AppRole
  orgIds: string[]
}

export const ROLE_LEVEL: Record<AppRole, number> = {
  owner: 0,
  super_admin: 1,
  admin: 2,
  publisher: 3,
}

export function getDefaultAppPath(role: AppRole): string {
  if (role === 'owner') return '/owner'
  if (role === 'super_admin') return '/super-admin'
  if (role === 'admin') return '/admin'
  return '/dashboard'
}

export function canAccessOwnerArea(role: AppRole): boolean {
  return role === 'owner'
}

export function canAccessSuperAdminArea(role: AppRole): boolean {
  return role === 'owner' || role === 'super_admin'
}

export function canAccessAdminArea(role: AppRole): boolean {
  return role === 'owner' || role === 'super_admin' || role === 'admin'
}

export function canAccessPublisherArea(role: AppRole): boolean {
  return ROLE_LEVEL[role] <= ROLE_LEVEL.publisher
}

export function getAssignableRoles(role: AppRole): AppRole[] {
  if (role === 'owner' || role === 'super_admin') {
    return ['super_admin', 'admin', 'publisher']
  }

  if (role === 'admin') {
    return ['publisher']
  }

  return []
}

export function hasOrgOverlap(left: string[], right: string[]): boolean {
  if (left.length === 0 || right.length === 0) return false
  const rightSet = new Set(right)
  return left.some((orgId) => rightSet.has(orgId))
}

export function canViewUser(actor: ScopedUser, target: ScopedUser): boolean {
  if (target.role === 'owner') return actor.role === 'owner'
  if (actor.role === 'owner') return true
  if (actor.role === 'super_admin') return true
  if (actor.role === 'admin') {
    return hasOrgOverlap(actor.orgIds, target.orgIds) && (target.role === 'admin' || target.role === 'publisher')
  }

  return hasOrgOverlap(actor.orgIds, target.orgIds) && target.role === 'publisher'
}

export function canManageUser(actor: ScopedUser, target: ScopedUser): boolean {
  if (target.id === actor.id || target.role === 'owner') return false
  if (actor.role === 'owner') return true
  if (actor.role === 'super_admin') return true
  if (actor.role === 'admin') {
    return hasOrgOverlap(actor.orgIds, target.orgIds) && target.role === 'publisher'
  }

  return false
}

export const getCurrentAccessContext = cache(async function getCurrentAccessContext(): Promise<AccessContext | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const [{ data: profile }, { data: memberships }] = await Promise.all([
    supabase
      .from('users')
      .select('display_name, role, force_password_change')
      .eq('id', user.id)
      .single(),
    supabase
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', user.id),
  ])

  if (!profile?.role) return null

  return {
    userId: user.id,
    displayName: profile.display_name ?? null,
    role: profile.role as AppRole,
    forcePasswordChange: Boolean(profile.force_password_change),
    orgIds: (memberships ?? []).map((membership) => membership.organization_id),
  }
})
