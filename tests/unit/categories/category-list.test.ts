import { describe, expect, it, vi } from 'vitest'

const categories = [
  { id: 'c1', name: 'Academic', slug: 'academic', color: null, is_active: true, created_at: '' },
  { id: 'c2', name: 'Sports', slug: 'sports', color: null, is_active: true, created_at: '' },
]
const linked: Record<string, number> = { c1: 1500, c2: 0 }

vi.mock('@/infrastructure/database/server', () => ({
  createClient: async () => ({}),
  createServiceClient: async () => ({
    from: (table: string) => ({
      select: () =>
        table === 'categories'
          ? { order: async () => ({ data: categories, error: null }) }
          : {
              eq: async (_column: string, id: string) => ({ count: linked[id] ?? 0, error: null }),
            },
    }),
  }),
}))
vi.mock('@/modules/audit', () => ({ logAuditEvent: vi.fn() }))
vi.mock('@/shared/errors/error-reporting', () => ({ reportServerError: vi.fn() }))
vi.mock('@/shared/middleware/action-rate-limit', () => ({
  checkActionRateLimit: async () => ({ limited: false }),
}))
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))
vi.mock('next/navigation', () => ({ redirect: vi.fn() }))

import { loadCategoryList } from '@/modules/categories/management'

describe('loadCategoryList', () => {
  it('counts linked announcements per category even past 1000', async () => {
    const { announcementCounts } = await loadCategoryList()

    expect(announcementCounts).toEqual({ c1: 1500, c2: 0 })
  })
})
