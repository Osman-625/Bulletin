import { describe, expect, it } from 'vitest'
import {
  INVITATION_EXPIRY_DAYS,
  readAdminInvitationFormData,
  readPublisherInvitationFormData,
} from '@/lib/invitations/validation'

function formData(entries: Record<string, string | string[]>) {
  const data = new FormData()
  Object.entries(entries).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach((entry) => data.append(key, entry))
      return
    }

    data.set(key, value)
  })
  return data
}

describe('invitation form validation', () => {
  it('normalizes publisher invite fields and requires at least one organization', () => {
    expect(
      readPublisherInvitationFormData(
        formData({
          email: '  Publisher@Example.edu ',
          org_ids: [' org-a ', 'org-b'],
          member_role: 'admin',
        })
      )
    ).toEqual({
      ok: true,
      data: {
        email: 'publisher@example.edu',
        orgIds: ['org-a', 'org-b'],
        memberRole: 'admin',
      },
    })

    expect(
      readPublisherInvitationFormData(
        formData({ email: 'publisher@example.edu', org_ids: [], member_role: 'publisher' })
      )
    ).toEqual({
      ok: false,
      error: 'Select at least one organization for this publisher.',
    })
  })

  it('rejects invalid emails and invalid invite roles instead of silently coercing them', () => {
    expect(readPublisherInvitationFormData(formData({ email: 'not-an-email' }))).toEqual({
      ok: false,
      error: 'Enter a valid email address.',
    })

    expect(
      readPublisherInvitationFormData(
        formData({
          email: 'publisher@example.edu',
          org_ids: ['org-a'],
          member_role: 'owner',
        })
      )
    ).toEqual({
      ok: false,
      error: 'Choose a valid organization role.',
    })

    expect(
      readAdminInvitationFormData(formData({ email: 'admin@example.edu', role: 'owner' }))
    ).toEqual({
      ok: false,
      error: 'Choose a valid admin role.',
    })
  })

  it('normalizes admin invite fields and keeps invite expiry in shared config', () => {
    expect(INVITATION_EXPIRY_DAYS).toBe(7)
    expect(
      readAdminInvitationFormData(
        formData({
          email: ' Super.Admin@Example.edu ',
          role: 'super_admin',
        })
      )
    ).toEqual({
      ok: true,
      data: {
        email: 'super.admin@example.edu',
        role: 'super_admin',
      },
    })
  })
})
