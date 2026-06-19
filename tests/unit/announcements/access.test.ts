import { describe, expect, it } from 'vitest'
import {
  canManageAnnouncementForOrg,
  shouldScopeAnnouncementsToMembership,
} from '@/modules/announcements/access'
import type { AccessContext } from '@/modules/auth/authz'
import type { AppRole } from '@/modules/auth/roles'

function access(role: AppRole, orgIds: string[] = []): AccessContext {
  return {
    userId: `${role}-user`,
    displayName: null,
    role,
    forcePasswordChange: false,
    orgIds,
  }
}

describe('announcement access predicates', () => {
  it('limits publisher dashboard management to publishers in the org and owners', () => {
    expect(canManageAnnouncementForOrg(access('publisher', ['org-a']), 'org-a')).toBe(true)
    expect(canManageAnnouncementForOrg(access('publisher', ['org-b']), 'org-a')).toBe(false)
    expect(canManageAnnouncementForOrg(access('owner'), 'org-a')).toBe(true)
  })

  it('does not allow admin roles to use publisher dashboard announcement actions', () => {
    expect(canManageAnnouncementForOrg(access('admin', ['org-a']), 'org-a')).toBe(false)
    expect(canManageAnnouncementForOrg(access('super_admin'), 'org-a')).toBe(false)
  })

  it('keeps owner and super-admin announcement listings unscoped outside publisher mutations', () => {
    expect(shouldScopeAnnouncementsToMembership(access('publisher', ['org-a']))).toBe(true)
    expect(shouldScopeAnnouncementsToMembership(access('admin', ['org-a']))).toBe(true)
    expect(shouldScopeAnnouncementsToMembership(access('super_admin'))).toBe(false)
    expect(shouldScopeAnnouncementsToMembership(access('owner'))).toBe(false)
  })
})
