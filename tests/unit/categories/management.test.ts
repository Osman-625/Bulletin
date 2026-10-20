import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  deleteCategory: vi.fn(async () => ({ error: null })),
}))

vi.mock('@/infrastructure/database/server', () => {
  const client = {
    from: (table: string) => ({
      select: () => ({
        eq: () =>
          table === 'categories'
            ? { single: async () => ({ data: { name: 'Sports', slug: 'sports', color: '#fff' } }) }
            : Promise.resolve({ count: 2, error: null }),
      }),
      update: () => ({ eq: async () => ({ error: null }) }),
      delete: () => ({ eq: mocks.deleteCategory }),
    }),
  }
  return { createClient: async () => client, createServiceClient: async () => client }
})

vi.mock('@/shared/middleware/action-rate-limit', () => ({
  checkActionRateLimit: async () => ({ limited: false }),
}))
vi.mock('@/modules/audit', () => ({ logAuditEvent: vi.fn() }))
vi.mock('@/shared/errors/error-reporting', () => ({ reportServerError: vi.fn() }))
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))
vi.mock('next/navigation', () => ({
  redirect: (url: string) => {
    throw new Error(`redirect:${url}`)
  },
}))

import {
  ADMIN_CATEGORY_SCOPE,
  SUPER_ADMIN_CATEGORY_SCOPE,
  deleteCategoryRecord,
} from '@/modules/categories/management'
import type { AccessContext } from '@/modules/auth/authz'

const access = { userId: 'user-1', role: 'admin', orgIds: [] } as unknown as AccessContext

describe('deleting a category that still has announcements', () => {
  beforeEach(() => {
    mocks.deleteCategory.mockClear()
  })

  it('refuses an admin who asks for force delete', async () => {
    await expect(deleteCategoryRecord(ADMIN_CATEGORY_SCOPE, access, 'c1', true)).rejects.toThrow(
      'redirect:/admin/categories?error=Cannot%20delete'
    )
  })

  it('does not delete anything for an admin who asks for force delete', async () => {
    await deleteCategoryRecord(ADMIN_CATEGORY_SCOPE, access, 'c1', true).catch(() => undefined)

    expect(mocks.deleteCategory).not.toHaveBeenCalled()
  })

  it('lets a super admin force delete it', async () => {
    await expect(
      deleteCategoryRecord(SUPER_ADMIN_CATEGORY_SCOPE, access, 'c1', true)
    ).rejects.toThrow('redirect:/super-admin/categories')
    expect(mocks.deleteCategory).toHaveBeenCalledTimes(1)
  })
})
