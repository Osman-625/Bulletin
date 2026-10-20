import { describe, expect, it, vi } from 'vitest'
import {
  bannerStoragePath,
  cleanupOrphanBannerImages,
} from '@/infrastructure/storage/banner-cleanup'

function storageClient({
  referencedUrls = [],
  lists,
}: {
  referencedUrls?: string[]
  lists: Record<
    string,
    Array<{ name: string; id?: string | null; created_at?: string; metadata?: unknown }>
  >
}) {
  const removed: string[][] = []
  const list = vi.fn((path = '') =>
    Promise.resolve({
      data: lists[path] ?? [],
      error: null,
    })
  )
  const remove = vi.fn((paths: string[]) => {
    removed.push(paths)
    return Promise.resolve({ data: paths.map((name) => ({ name })), error: null })
  })
  const not = vi.fn(() =>
    Promise.resolve({
      data: referencedUrls.map((banner_url) => ({ banner_url })),
      error: null,
    })
  )
  const select = vi.fn(() => ({ not }))
  const from = vi.fn(() => ({ select }))

  return {
    client: {
      from,
      storage: {
        from: vi.fn(() => ({ list, remove })),
      },
    },
    list,
    remove,
    removed,
  }
}

describe('banner storage cleanup', () => {
  it('extracts banner storage paths from public URLs', () => {
    expect(
      bannerStoragePath(
        'https://project.supabase.co/storage/v1/object/public/banner-images/user-a/org-a/poster.webp'
      )
    ).toBe('user-a/org-a/poster.webp')
    expect(bannerStoragePath('https://example.edu/not-a-banner.webp')).toBeNull()
    expect(bannerStoragePath(null)).toBeNull()
  })

  it('dry-runs recursive orphan detection without deleting files', async () => {
    const referenced =
      'https://project.supabase.co/storage/v1/object/public/banner-images/user-a/org-a/keep.webp'
    const { client, remove } = storageClient({
      referencedUrls: [referenced],
      lists: {
        '': [{ name: 'user-a', id: null, metadata: null }],
        'user-a': [{ name: 'org-a', id: null, metadata: null }],
        'user-a/org-a': [
          { name: 'keep.webp', id: 'file-1', metadata: { size: 100 } },
          { name: 'orphan.webp', id: 'file-2', metadata: { size: 120 } },
        ],
      },
    })

    const result = await cleanupOrphanBannerImages(client as never, { dryRun: true })

    expect(result).toMatchObject({
      scanned: 2,
      referenced: 1,
      orphaned: 1,
      deleted: 0,
      dryRun: true,
    })
    expect(result.orphanedPaths).toEqual(['user-a/org-a/orphan.webp'])
    expect(remove).not.toHaveBeenCalled()
  })

  it('deletes only unreferenced banner files up to the configured limit', async () => {
    const referenced =
      'https://project.supabase.co/storage/v1/object/public/banner-images/user-a/org-a/keep.webp'
    const { client, remove } = storageClient({
      referencedUrls: [referenced],
      lists: {
        '': [{ name: 'user-a', id: null, metadata: null }],
        'user-a': [{ name: 'org-a', id: null, metadata: null }],
        'user-a/org-a': [
          { name: 'keep.webp', id: 'file-1', metadata: { size: 100 } },
          { name: 'orphan-1.webp', id: 'file-2', metadata: { size: 120 } },
          { name: 'orphan-2.webp', id: 'file-3', metadata: { size: 130 } },
        ],
      },
    })

    const result = await cleanupOrphanBannerImages(client as never, {
      batchSize: 1,
      maxDeletes: 1,
    })

    expect(result.deleted).toBe(1)
    expect(result.orphanedPaths).toEqual(['user-a/org-a/orphan-1.webp'])
    expect(remove).toHaveBeenCalledWith(['user-a/org-a/orphan-1.webp'])
  })

  it('keeps unreferenced banners uploaded in the last 24 hours', async () => {
    const now = Date.parse('2026-10-19T12:00:00.000Z')
    const { client } = storageClient({
      lists: {
        '': [{ name: 'user-a', id: null, metadata: null }],
        'user-a': [
          { name: 'fresh.webp', id: 'file-1', created_at: '2026-10-19T06:00:00.000Z' },
          { name: 'stale.webp', id: 'file-2', created_at: '2026-10-17T06:00:00.000Z' },
        ],
      },
    })

    const result = await cleanupOrphanBannerImages(client as never, { dryRun: true, now })

    expect(result.orphanedPaths).toEqual(['user-a/stale.webp'])
  })
})
