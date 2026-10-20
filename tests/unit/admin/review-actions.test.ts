import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  updateRows: [{ id: 'a1' }] as Array<{ id: string }>,
  announcement: {
    organization_id: 'org-1',
    status: 'submitted',
    author_id: 'author-1',
    title: 'Notice',
    scheduled_publish_at: null,
  } as Record<string, unknown>,
  eqCalls: [] as Array<[string, unknown]>,
  insertReview: vi.fn(async () => ({ error: null })),
  notifyReviewed: vi.fn(async () => undefined),
}))

vi.mock('@/infrastructure/database/server', () => ({
  createClient: async () => ({
    from: (table: string) => {
      if (table === 'announcement_reviews') return { insert: mocks.insertReview }
      const update = {
        eq: (column: string, value: unknown) => {
          mocks.eqCalls.push([column, value])
          return update
        },
        select: async () => ({ data: mocks.updateRows, error: null }),
      }
      return {
        select: () => ({
          eq: () => ({ single: async () => ({ data: mocks.announcement, error: null }) }),
        }),
        update: () => update,
      }
    },
  }),
}))

vi.mock('@/modules/auth/authz', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/modules/auth/authz')>()),
  getCurrentAccessContext: async () => ({ userId: 'admin-1', role: 'admin', orgIds: ['org-1'] }),
}))
vi.mock('@/shared/middleware/action-rate-limit', () => ({
  checkActionRateLimit: async () => ({ limited: false }),
}))
vi.mock('@/modules/notifications', () => ({ notifyAnnouncementReviewed: mocks.notifyReviewed }))
vi.mock('@/modules/audit', () => ({ logAuditEvent: vi.fn() }))
vi.mock('@/shared/errors/error-reporting', () => ({ reportServerError: vi.fn() }))
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))
vi.mock('next/navigation', () => ({
  redirect: (url: string) => {
    throw new Error(`redirect:${url}`)
  },
}))

import { reviewAnnouncement } from '@/app/(admin)/admin/review/[id]/actions'

function decision(fields: Record<string, string>) {
  const form = new FormData()
  for (const [key, value] of Object.entries(fields)) form.set(key, value)
  return form
}

describe('reviewAnnouncement', () => {
  beforeEach(() => {
    mocks.updateRows = [{ id: 'a1' }]
    mocks.announcement = { ...mocks.announcement, status: 'submitted' }
    mocks.eqCalls = []
    mocks.insertReview.mockClear()
    mocks.notifyReviewed.mockClear()
  })

  it('stops an approval when the publisher edited the notice after the admin opened it', async () => {
    mocks.updateRows = []

    await expect(
      reviewAnnouncement('a1', decision({ _action: 'approve', reviewed_updated_at: 'v1' }))
    ).rejects.toThrow('redirect:/admin/review/a1?error=changed')
  })

  it('records no review and sends no notice for a stale approval', async () => {
    mocks.updateRows = []

    await reviewAnnouncement(
      'a1',
      decision({ _action: 'approve', reviewed_updated_at: 'v1' })
    ).catch(() => undefined)

    expect(mocks.insertReview).not.toHaveBeenCalled()
  })

  it('only publishes the version the admin read, and only while it is still submitted', async () => {
    await reviewAnnouncement(
      'a1',
      decision({ _action: 'approve', reviewed_updated_at: 'v1' })
    ).catch(() => undefined)

    expect(mocks.eqCalls).toEqual([
      ['id', 'a1'],
      ['status', 'submitted'],
      ['updated_at', 'v1'],
    ])
  })

  it('records the review and notifies the author when the version still matches', async () => {
    await expect(
      reviewAnnouncement('a1', decision({ _action: 'approve', reviewed_updated_at: 'v1' }))
    ).rejects.toThrow('redirect:/admin/review')

    expect(mocks.notifyReviewed).toHaveBeenCalledTimes(1)
  })

  it('refuses a decision that carries no version', async () => {
    await expect(reviewAnnouncement('a1', decision({ _action: 'approve' }))).rejects.toThrow(
      'redirect:/admin/review/a1?error=changed'
    )
  })

  it('does not let a live notice be approved again', async () => {
    mocks.announcement = { ...mocks.announcement, status: 'published' }

    await expect(
      reviewAnnouncement('a1', decision({ _action: 'approve', reviewed_updated_at: 'v1' }))
    ).rejects.toThrow('redirect:/admin/review')
    expect(mocks.eqCalls).toEqual([])
  })

  it('takes a live notice down only while it is still live', async () => {
    mocks.announcement = { ...mocks.announcement, status: 'published' }

    await reviewAnnouncement(
      'a1',
      decision({ _action: 'reject', comment: 'Wrong date', reviewed_updated_at: 'v1' })
    ).catch(() => undefined)

    expect(mocks.eqCalls).toContainEqual(['status', 'published'])
  })
})
