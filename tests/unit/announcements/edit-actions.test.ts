import { beforeEach, describe, expect, it, vi } from 'vitest'

const BANNER_BASE = 'https://project.supabase.co/storage/v1/object/public/banner-images'

const mocks = vi.hoisted(() => ({
  removeFile: vi.fn(async () => ({ error: null })),
}))

const announcement = {
  id: 'a1',
  organization_id: 'org-1',
  title: 'Notice',
  body: 'Body',
  author_id: 'someone-else',
  status: 'published',
  scheduled_publish_at: null,
  banner_url: `${BANNER_BASE}/someone-else/org-1/old.png`,
}

// RLS refuses the write without an error: the database answers with zero rows.
vi.mock('@/infrastructure/database/server', () => {
  const blocked = Promise.resolve({ data: [], error: null })
  const write = () => ({ eq: () => ({ select: () => blocked }) })
  return {
    createClient: async () => ({
      from: () => ({
        select: () => ({
          eq: () => ({ single: async () => ({ data: announcement, error: null }) }),
        }),
        update: write,
        delete: write,
      }),
    }),
  }
})

vi.mock('@/infrastructure/database/admin', () => ({
  createAdminClient: () => ({ storage: { from: () => ({ remove: mocks.removeFile }) } }),
}))

vi.mock('@/modules/auth/authz', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/modules/auth/authz')>()),
  getCurrentAccessContext: async () => ({
    userId: 'publisher-1',
    role: 'publisher',
    orgIds: ['org-1'],
  }),
}))

vi.mock('@/modules/announcements/mutations', () => ({
  readAnnouncementMutationFields: async () => ({
    categoryId: null,
    bannerUrl: `${BANNER_BASE}/publisher-1/org-1/new.png`,
    registrationLink: null,
    expiresAt: null,
    scheduledPublishAt: null,
    pinnedUntil: null,
  }),
}))

vi.mock('@/shared/middleware/action-rate-limit', () => ({
  checkActionRateLimit: async () => ({ limited: false }),
}))
vi.mock('@/modules/audit', () => ({ logAuditEvent: vi.fn() }))
vi.mock('@/modules/notifications', () => ({ notifyAnnouncementSubmitted: vi.fn() }))
vi.mock('@/shared/errors/error-reporting', () => ({ reportServerError: vi.fn() }))
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))
vi.mock('next/navigation', () => ({ redirect: vi.fn() }))

import {
  deleteAnnouncement,
  submitForReview,
  unpublishAnnouncement,
  updateAnnouncement,
} from '@/app/(dashboard)/dashboard/announcements/[id]/edit/actions'

const FORBIDDEN = 'You cannot change this announcement.'

function editForm() {
  const form = new FormData()
  form.set('title', 'Edited')
  form.set('body', 'Edited body')
  return form
}

describe('announcement edit actions when the database refuses the write', () => {
  beforeEach(() => {
    mocks.removeFile.mockClear()
  })

  it('reports a blocked save instead of success', async () => {
    await expect(updateAnnouncement('a1', editForm())).rejects.toThrow(FORBIDDEN)
  })

  it('keeps the old banner file after a blocked save', async () => {
    await updateAnnouncement('a1', editForm()).catch(() => undefined)

    expect(mocks.removeFile).not.toHaveBeenCalled()
  })

  it('reports a blocked unpublish instead of success', async () => {
    await expect(unpublishAnnouncement('a1')).rejects.toThrow(FORBIDDEN)
  })

  it('reports a blocked submit instead of success', async () => {
    await expect(submitForReview('a1')).rejects.toThrow(FORBIDDEN)
  })

  it('keeps the banner file after a blocked delete', async () => {
    await deleteAnnouncement('a1').catch(() => undefined)

    expect(mocks.removeFile).not.toHaveBeenCalled()
  })
})
