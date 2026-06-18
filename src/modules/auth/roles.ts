/**
 * @module roles
 * @description Pure role predicates shared by server authorization (authz.ts)
 * and client navigation (nav-config.ts). Keep this module free of server-only
 * imports so client components can use it.
 */

import type { UserRole } from '@/shared/types'

/** Union of all database roles plus the special `owner` app role. */
export type AppRole = UserRole | 'owner'

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
