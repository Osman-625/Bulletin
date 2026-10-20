import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  invitation: {
    id: 'inv-1',
    email: 'new@inti.edu.my',
    role: 'publisher',
    member_role: 'publisher',
    org_ids: ['org-1'],
    invited_by: 'admin-1',
  } as Record<string, unknown> | null,
  nameTaken: false,
  profileError: null as Error | null,
  createUser: vi.fn(async () => ({ data: { user: { id: 'new-user' } }, error: null })),
  deleteUser: vi.fn(async () => ({ error: null })),
  acceptInvitation: vi.fn(async () => ({ error: null })),
}))

vi.mock('@/infrastructure/database/admin', () => ({
  createAdminClient: () => ({
    auth: { admin: { createUser: mocks.createUser, deleteUser: mocks.deleteUser } },
    from: (table: string) => {
      if (table === 'invitations') {
        const lookup = {
          select: () => lookup,
          eq: () => lookup,
          is: () => lookup,
          gt: () => lookup,
          single: async () =>
            mocks.invitation
              ? { data: mocks.invitation, error: null }
              : { data: null, error: new Error('no rows') },
          update: () => ({ eq: mocks.acceptInvitation }),
        }
        return lookup
      }
      if (table === 'users') {
        const lookup = {
          select: () => lookup,
          ilike: () => lookup,
          limit: () => lookup,
          then: (resolve: (value: unknown) => void) =>
            resolve({ data: mocks.nameTaken ? [{ id: 'someone' }] : [], error: null }),
          upsert: async () => ({ error: mocks.profileError }),
        }
        return lookup
      }
      return { insert: async () => ({ error: null }) }
    },
  }),
}))

vi.mock('@/shared/middleware/action-rate-limit', () => ({
  checkActionRateLimit: async () => ({ limited: false }),
}))
vi.mock('@/modules/audit', () => ({ logAuditEvent: vi.fn() }))
vi.mock('@/shared/errors/error-reporting', () => ({ reportServerError: vi.fn() }))
vi.mock('next/navigation', () => ({
  redirect: (url: string) => {
    throw new Error(`redirect:${url}`)
  },
}))

import { completeRegistration } from '@/app/register/actions'

function signUp(overrides: Record<string, string> = {}) {
  const form = new FormData()
  const fields = {
    token: 'good-token',
    display_name: 'New Publisher',
    password: 'a-long-enough-password',
    ...overrides,
  }
  for (const [key, value] of Object.entries(fields)) form.set(key, value)
  return form
}

describe('completeRegistration', () => {
  beforeEach(() => {
    mocks.invitation = {
      id: 'inv-1',
      email: 'new@inti.edu.my',
      role: 'publisher',
      member_role: 'publisher',
      org_ids: ['org-1'],
      invited_by: 'admin-1',
    }
    mocks.nameTaken = false
    mocks.profileError = null
    mocks.createUser.mockClear()
    mocks.deleteUser.mockClear()
    mocks.acceptInvitation.mockClear()
  })

  it('rejects an unknown or expired invite', async () => {
    mocks.invitation = null

    await expect(completeRegistration(signUp({ token: 'stale' }))).rejects.toThrow(
      'redirect:/register?error=Invalid+or+expired+invite+link'
    )
  })

  it('creates no account for an unknown or expired invite', async () => {
    mocks.invitation = null

    await completeRegistration(signUp({ token: 'stale' })).catch(() => undefined)

    expect(mocks.createUser).not.toHaveBeenCalled()
  })

  it('refuses a display name another account already uses', async () => {
    mocks.nameTaken = true

    await expect(completeRegistration(signUp())).rejects.toThrow('already%20taken')
    expect(mocks.createUser).not.toHaveBeenCalled()
  })

  it('removes the new auth account when the profile cannot be saved', async () => {
    mocks.profileError = new Error('insert failed')

    await completeRegistration(signUp()).catch(() => undefined)

    expect(mocks.deleteUser).toHaveBeenCalledWith('new-user')
  })

  it('marks the invite accepted and sends the user to sign in', async () => {
    await expect(completeRegistration(signUp())).rejects.toThrow('redirect:/login?registered=1')
    expect(mocks.acceptInvitation).toHaveBeenCalledTimes(1)
  })
})
