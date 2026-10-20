import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  limited: false,
  serviceClientCreated: vi.fn(),
  rateLimitKey: vi.fn(),
  auditEvent: vi.fn(),
  notify: vi.fn(),
  insertRequest: vi.fn(async () => ({ data: { id: 'req-1' }, error: null })),
}))

vi.mock('@/infrastructure/database/server', () => ({
  createServiceClient: async () => {
    mocks.serviceClientCreated()
    return {
      from: (table: string) => {
        if (table === 'password_reset_requests') {
          return {
            select: () => ({
              eq: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null }) }) }),
            }),
            insert: () => ({ select: () => ({ single: mocks.insertRequest }) }),
          }
        }
        return {
          // Unknown email: no profile row.
          select: () => ({
            eq: () => ({ maybeSingle: async () => ({ data: null, error: null }) }),
          }),
        }
      },
    }
  },
}))
vi.mock('@/shared/middleware/action-rate-limit', () => ({
  checkActionRateLimit: async (...args: unknown[]) => {
    mocks.rateLimitKey(...args)
    return { limited: mocks.limited }
  },
}))
vi.mock('@/modules/audit', () => ({ logAuditEvent: mocks.auditEvent }))
vi.mock('@/modules/notifications', () => ({ createNotificationsForUsers: mocks.notify }))
vi.mock('@/shared/errors/error-reporting', () => ({ reportServerError: vi.fn() }))
vi.mock('next/navigation', () => ({
  redirect: (url: string) => {
    throw new Error(`redirect:${url}`)
  },
}))

import { requestPasswordReset } from '@/app/(auth)/forgot-password/actions'

function resetFor(email: string) {
  const form = new FormData()
  form.set('email', email)
  return form
}

const SENT = 'redirect:/forgot-password?sent=1'

describe('requestPasswordReset', () => {
  beforeEach(() => {
    mocks.limited = false
    mocks.serviceClientCreated.mockClear()
    mocks.rateLimitKey.mockClear()
    mocks.auditEvent.mockClear()
    mocks.notify.mockClear()
    mocks.insertRequest.mockClear()
  })

  it('answers "sent" for an email nobody uses', async () => {
    await expect(requestPasswordReset(resetFor('nobody@inti.edu.my'))).rejects.toThrow(SENT)
  })

  it('writes nothing for an email nobody uses', async () => {
    await requestPasswordReset(resetFor('nobody@inti.edu.my')).catch(() => undefined)

    expect(mocks.auditEvent).not.toHaveBeenCalled()
    expect(mocks.insertRequest).not.toHaveBeenCalled()
    expect(mocks.notify).not.toHaveBeenCalled()
  })

  it('limits the visitor, not each email text', async () => {
    await requestPasswordReset(resetFor('nobody@inti.edu.my')).catch(() => undefined)

    expect(mocks.rateLimitKey).toHaveBeenCalledWith('forgot-password')
  })

  it('does not touch the database for an email longer than any real address', async () => {
    await expect(requestPasswordReset(resetFor(`${'a'.repeat(300)}@inti.edu.my`))).rejects.toThrow(
      SENT
    )
    expect(mocks.serviceClientCreated).not.toHaveBeenCalled()
  })

  it('does not touch the database once the visitor is rate limited', async () => {
    mocks.limited = true

    await expect(requestPasswordReset(resetFor('nobody@inti.edu.my'))).rejects.toThrow(SENT)
    expect(mocks.serviceClientCreated).not.toHaveBeenCalled()
  })
})
