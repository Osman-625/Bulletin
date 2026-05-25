import { describe, it, expect } from 'vitest'
import {
  ROLE_LEVEL,
  getDefaultAppPath,
  canAccessOwnerArea,
  canAccessSuperAdminArea,
  canAccessAdminArea,
  canAccessPublisherArea,
  getAssignableRoles,
  hasOrgOverlap,
  canViewUser,
  canManageUser,
  type AppRole,
  type ScopedUser,
} from '@/lib/auth/authz'

// ─── Helpers ────────────────────────────────────────────────────────────────

function user(id: string, role: AppRole, orgIds: string[] = []): ScopedUser {
  return { id, role, orgIds }
}

const ORG_A = 'org-a'
const ORG_B = 'org-b'

// ─── ROLE_LEVEL ─────────────────────────────────────────────────────────────

describe('ROLE_LEVEL', () => {
  it('owner is lowest numeric level', () => {
    expect(ROLE_LEVEL.owner).toBeLessThan(ROLE_LEVEL.super_admin)
  })
  it('super_admin < admin < publisher', () => {
    expect(ROLE_LEVEL.super_admin).toBeLessThan(ROLE_LEVEL.admin)
    expect(ROLE_LEVEL.admin).toBeLessThan(ROLE_LEVEL.publisher)
  })
})

// ─── getDefaultAppPath ───────────────────────────────────────────────────────

describe('getDefaultAppPath', () => {
  it.each<[AppRole, string]>([
    ['owner', '/owner'],
    ['super_admin', '/super-admin'],
    ['admin', '/admin'],
    ['publisher', '/dashboard'],
  ])('role %s → %s', (role, path) => {
    expect(getDefaultAppPath(role)).toBe(path)
  })
})

// ─── Area access predicates ──────────────────────────────────────────────────

describe('canAccessOwnerArea', () => {
  it('only owner can access', () => {
    expect(canAccessOwnerArea('owner')).toBe(true)
    expect(canAccessOwnerArea('super_admin')).toBe(false)
    expect(canAccessOwnerArea('admin')).toBe(false)
    expect(canAccessOwnerArea('publisher')).toBe(false)
  })
})

describe('canAccessSuperAdminArea', () => {
  it('owner and super_admin can access', () => {
    expect(canAccessSuperAdminArea('owner')).toBe(true)
    expect(canAccessSuperAdminArea('super_admin')).toBe(true)
    expect(canAccessSuperAdminArea('admin')).toBe(false)
    expect(canAccessSuperAdminArea('publisher')).toBe(false)
  })
})

describe('canAccessAdminArea', () => {
  it('owner, super_admin, admin can access', () => {
    expect(canAccessAdminArea('owner')).toBe(true)
    expect(canAccessAdminArea('super_admin')).toBe(true)
    expect(canAccessAdminArea('admin')).toBe(true)
    expect(canAccessAdminArea('publisher')).toBe(false)
  })
})

describe('canAccessPublisherArea', () => {
  it('all roles can access publisher tools', () => {
    expect(canAccessPublisherArea('publisher')).toBe(true)
    expect(canAccessPublisherArea('admin')).toBe(true)
    expect(canAccessPublisherArea('super_admin')).toBe(true)
    expect(canAccessPublisherArea('owner')).toBe(true)
  })
})

// ─── getAssignableRoles ──────────────────────────────────────────────────────

describe('getAssignableRoles', () => {
  it('owner can assign super_admin, admin, publisher', () => {
    const roles = getAssignableRoles('owner')
    expect(roles).toContain('super_admin')
    expect(roles).toContain('admin')
    expect(roles).toContain('publisher')
    expect(roles).not.toContain('owner')
  })

  it('super_admin can assign super_admin, admin, publisher', () => {
    const roles = getAssignableRoles('super_admin')
    expect(roles).toContain('super_admin')
    expect(roles).toContain('admin')
    expect(roles).toContain('publisher')
    expect(roles).not.toContain('owner')
  })

  it('admin can only assign publisher', () => {
    const roles = getAssignableRoles('admin')
    expect(roles).toEqual(['publisher'])
  })

  it('publisher cannot assign any roles', () => {
    expect(getAssignableRoles('publisher')).toEqual([])
  })
})

// ─── hasOrgOverlap ───────────────────────────────────────────────────────────

describe('hasOrgOverlap', () => {
  it('returns true when orgs share at least one id', () => {
    expect(hasOrgOverlap([ORG_A, ORG_B], [ORG_A])).toBe(true)
  })

  it('returns false when orgs are disjoint', () => {
    expect(hasOrgOverlap([ORG_A], [ORG_B])).toBe(false)
  })

  it('returns false when either side is empty', () => {
    expect(hasOrgOverlap([], [ORG_A])).toBe(false)
    expect(hasOrgOverlap([ORG_A], [])).toBe(false)
    expect(hasOrgOverlap([], [])).toBe(false)
  })
})

// ─── canViewUser ─────────────────────────────────────────────────────────────

describe('canViewUser', () => {
  it('owner can view everyone except other owners', () => {
    const owner = user('u1', 'owner')
    expect(canViewUser(owner, user('u2', 'super_admin'))).toBe(true)
    expect(canViewUser(owner, user('u3', 'admin'))).toBe(true)
    expect(canViewUser(owner, user('u4', 'publisher'))).toBe(true)
  })

  it('non-owner cannot view owner', () => {
    const ownerTarget = user('u1', 'owner')
    expect(canViewUser(user('u2', 'super_admin'), ownerTarget)).toBe(false)
    expect(canViewUser(user('u3', 'admin'), ownerTarget)).toBe(false)
    expect(canViewUser(user('u4', 'publisher'), ownerTarget)).toBe(false)
  })

  it('owner can view another owner', () => {
    expect(canViewUser(user('u1', 'owner'), user('u2', 'owner'))).toBe(true)
  })

  it('super_admin can view all non-owner users', () => {
    const sa = user('u1', 'super_admin')
    expect(canViewUser(sa, user('u2', 'admin'))).toBe(true)
    expect(canViewUser(sa, user('u3', 'publisher'))).toBe(true)
    expect(canViewUser(sa, user('u4', 'super_admin'))).toBe(true)
  })

  it('admin can view users in same org (admin or publisher only)', () => {
    const admin = user('u1', 'admin', [ORG_A])
    expect(canViewUser(admin, user('u2', 'admin', [ORG_A]))).toBe(true)
    expect(canViewUser(admin, user('u3', 'publisher', [ORG_A]))).toBe(true)
  })

  it('admin cannot view super_admin', () => {
    const admin = user('u1', 'admin', [ORG_A])
    expect(canViewUser(admin, user('u2', 'super_admin', [ORG_A]))).toBe(false)
  })

  it('admin cannot view users in different org', () => {
    const admin = user('u1', 'admin', [ORG_A])
    expect(canViewUser(admin, user('u2', 'publisher', [ORG_B]))).toBe(false)
  })
})

// ─── canManageUser ────────────────────────────────────────────────────────────

describe('canManageUser', () => {
  it('no one can manage themselves', () => {
    expect(canManageUser(user('u1', 'owner'), user('u1', 'owner'))).toBe(false)
    expect(canManageUser(user('u1', 'super_admin'), user('u1', 'super_admin'))).toBe(false)
  })

  it('no one can manage the owner account', () => {
    const ownerTarget = user('u1', 'owner')
    expect(canManageUser(user('u2', 'owner'), ownerTarget)).toBe(false)
    expect(canManageUser(user('u3', 'super_admin'), ownerTarget)).toBe(false)
    expect(canManageUser(user('u4', 'admin'), ownerTarget)).toBe(false)
  })

  it('owner can manage super_admin, admin, publisher', () => {
    const owner = user('u1', 'owner')
    expect(canManageUser(owner, user('u2', 'super_admin'))).toBe(true)
    expect(canManageUser(owner, user('u3', 'admin'))).toBe(true)
    expect(canManageUser(owner, user('u4', 'publisher'))).toBe(true)
  })

  it('super_admin can manage admin and publisher', () => {
    const sa = user('u1', 'super_admin')
    expect(canManageUser(sa, user('u2', 'admin'))).toBe(true)
    expect(canManageUser(sa, user('u3', 'publisher'))).toBe(true)
  })

  it('admin can manage publisher in same org', () => {
    const admin = user('u1', 'admin', [ORG_A])
    expect(canManageUser(admin, user('u2', 'publisher', [ORG_A]))).toBe(true)
  })

  it('admin cannot manage publisher in different org', () => {
    const admin = user('u1', 'admin', [ORG_A])
    expect(canManageUser(admin, user('u2', 'publisher', [ORG_B]))).toBe(false)
  })

  it('admin cannot manage another admin', () => {
    const admin = user('u1', 'admin', [ORG_A])
    expect(canManageUser(admin, user('u2', 'admin', [ORG_A]))).toBe(false)
  })

  it('publisher cannot manage anyone', () => {
    const pub = user('u1', 'publisher', [ORG_A])
    expect(canManageUser(pub, user('u2', 'publisher', [ORG_A]))).toBe(false)
  })
})
