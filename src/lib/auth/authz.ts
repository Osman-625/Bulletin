/**
 * @module authz
 * @description Role-based access control (RBAC) helpers for the Bulletin platform.
 *
 * Role hierarchy (lowest number = highest privilege):
 *   0 owner       — full platform control, cannot be managed by any other role
 *   1 super_admin — platform-wide admin, managed by owner only
 *   2 admin       — org-scoped moderator, manages publishers within their orgs
 *   3 publisher   — creates and submits announcements within their org
 *
 * All server-side data queries should call `getCurrentAccessContext()` first and
 * then use the predicate helpers below to enforce access before touching data.
 */

import { cache } from 'react'
import { createClient } from '../supabase/server'
import type { UserRole } from '../types'

/** Union of all database roles plus the special `owner` app role. */
export type AppRole = UserRole | 'owner'

/**
 * Full access context for the currently authenticated user.
 * Populated by `getCurrentAccessContext()` once per request (React cache).
 */
export type AccessContext = {
  userId: string
  displayName: string | null
  role: AppRole
  /** When true, middleware redirects the user to the change-password page before anything else. */
  forcePasswordChange: boolean
  /** UUIDs of organizations the user belongs to (relevant for admin-scoped queries). */
  orgIds: string[]
}

/** Minimal user representation used for cross-user permission checks. */
export type ScopedUser = {
  id: string
  role: AppRole
  orgIds: string[]
}

/** Numeric privilege level for each role — lower means more privileged. */
export const ROLE_LEVEL: Record<AppRole, number> = {
  owner: 0,
  super_admin: 1,
  admin: 2,
  publisher: 3,
}

/**
 * Returns the default landing path after login for a given role.
 * Used by middleware and the login redirect to send users to the right dashboard.
 */
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
  return role === 'owner' || role === 'admin'
}

export function canAccessPublisherArea(role: AppRole): boolean {
  return role === 'owner' || role === 'publisher'
}

export function getAssignableRoles(role: AppRole): AppRole[] {
  if (role === 'owner') {
    return ['super_admin', 'admin', 'publisher']
  }

  if (role === 'super_admin') {
    return ['admin', 'publisher']
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
    return (
      hasOrgOverlap(actor.orgIds, target.orgIds) &&
      (target.role === 'admin' || target.role === 'publisher')
    )
  }

  return hasOrgOverlap(actor.orgIds, target.orgIds) && target.role === 'publisher'
}

export function canManageUser(actor: ScopedUser, target: ScopedUser): boolean {
  if (target.id === actor.id || target.role === 'owner') return false
  if (actor.role === 'owner') return true
  if (actor.role === 'super_admin') return target.role !== 'super_admin'
  if (actor.role === 'admin') {
    return hasOrgOverlap(actor.orgIds, target.orgIds) && target.role === 'publisher'
  }

  return false
}

export const getCurrentAccessContext = cache(
  async function getCurrentAccessContext(): Promise<AccessContext | null> {
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
      supabase.from('organization_members').select('organization_id').eq('user_id', user.id),
    ])

    if (!profile?.role) return null

    return {
      userId: user.id,
      displayName: profile.display_name ?? null,
      role: profile.role as AppRole,
      forcePasswordChange: Boolean(profile.force_password_change),
      orgIds: (memberships ?? []).map((membership) => membership.organization_id),
    }
  }
)
