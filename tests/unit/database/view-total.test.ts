import { describe, expect, it, vi } from 'vitest'

vi.mock('@/shared/errors/error-reporting', () => ({ reportServerError: vi.fn() }))
vi.mock('@/infrastructure/database/server', () => ({
  createClient: async () => ({}),
  createServiceClient: async () => ({}),
}))

import { sumAnnouncementViews } from '@/infrastructure/database/data'

// Serves `total` announcements of 1 view each, at most `pageSize` rows per request like the API.
function clientWithRows(total: number, options: { failAtPage?: number } = {}) {
  let pageIndex = 0
  const query = {
    select: () => query,
    order: () => query,
    in: () => query,
    range: (from: number, to: number) => {
      const index = pageIndex++
      if (options.failAtPage === index) {
        return Promise.resolve({ data: null, error: new Error('db down') })
      }
      const count = Math.max(0, Math.min(to + 1, total) - from)
      return Promise.resolve({
        data: Array.from({ length: count }, () => ({ view_count: 1 })),
        error: null,
      })
    },
  }
  return { from: () => query } as never
}

describe('sumAnnouncementViews', () => {
  it('adds up every page, not just the first 1000 rows', async () => {
    expect(await sumAnnouncementViews(clientWithRows(2503), null)).toBe(2503)
  })

  it('stops after a short first page', async () => {
    expect(await sumAnnouncementViews(clientWithRows(3), null)).toBe(3)
  })

  it('reports no views at all when a page fails, rather than a partial total', async () => {
    expect(await sumAnnouncementViews(clientWithRows(2503, { failAtPage: 1 }), null)).toBe(0)
  })
})
