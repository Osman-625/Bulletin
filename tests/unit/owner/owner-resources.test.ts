import { afterEach, describe, expect, it, vi } from 'vitest'
import { readFileSync } from 'node:fs'
import { getOwnerResourceOverview } from '@/modules/owner/resources'

function source(path: string) {
  return readFileSync(path, 'utf8')
}

function createSupabaseStub({
  announcements = [],
  storageLists = { '': [] },
}: {
  announcements?: unknown[]
  storageLists?: Record<string, Array<{ name: string; id?: string | null; metadata?: unknown }>>
} = {}) {
  return {
    from(table: string) {
      if (table === 'password_reset_requests') {
        return {
          select: () => ({
            eq: () => Promise.resolve({ count: 0, error: null }),
          }),
        }
      }

      return {
        select: () => ({
          order: () => ({
            limit: () => Promise.resolve({ data: announcements, error: null }),
            range: () => Promise.resolve({ data: announcements, error: null }),
          }),
        }),
      }
    },
    storage: {
      from: () => ({
        list: (path = '') => Promise.resolve({ data: storageLists[path] ?? [], error: null }),
      }),
    },
  }
}

describe('owner resource overview', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.restoreAllMocks()
  })

  it('does not call Supabase Management API when SUPABASE_PROJECT_REF is invalid', async () => {
    vi.stubEnv('SUPABASE_ACCESS_TOKEN', 'sbp_test_token')
    vi.stubEnv('SUPABASE_PROJECT_REF', 'https://example.supabase.co')
    vi.stubEnv('VERCEL_API_TOKEN', '')
    vi.stubEnv('VERCEL_PROJECT_ID', '')

    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ error: 'bad request' }), {
        status: 400,
        headers: { 'content-type': 'application/json' },
      })
    )

    const overview = await getOwnerResourceOverview(createSupabaseStub() as never)

    expect(fetchSpy).not.toHaveBeenCalled()
    expect(overview.external.supabase.status).toBe('not_configured')
    expect(overview.external.supabase.summary).toContain('20-character project ref')
    expect(overview.external.supabase.metrics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ label: 'Project ref', value: 'Invalid', tone: 'warn' }),
      ])
    )
  })

  it('counts nested banner files and orphans by full storage path', async () => {
    vi.stubEnv('SUPABASE_ACCESS_TOKEN', '')
    vi.stubEnv('SUPABASE_PROJECT_REF', '')
    vi.stubEnv('VERCEL_API_TOKEN', '')
    vi.stubEnv('VERCEL_PROJECT_ID', '')

    const overview = await getOwnerResourceOverview(
      createSupabaseStub({
        announcements: [
          {
            id: 'ann-1',
            title: 'Announcement',
            status: 'published',
            view_count: 8,
            published_at: '2026-06-14T00:00:00.000Z',
            registration_link: null,
            banner_url:
              'https://project.supabase.co/storage/v1/object/public/banner-images/user-a/org-a/keep.webp',
            categories: { name: 'Academic', color: null },
            organizations: { name: 'Student Affairs' },
          },
        ],
        storageLists: {
          '': [{ name: 'user-a', id: null, metadata: null }],
          'user-a': [{ name: 'org-a', id: null, metadata: null }],
          'user-a/org-a': [
            { name: 'keep.webp', id: 'file-1', metadata: { size: 100 } },
            { name: 'orphan.webp', id: 'file-2', metadata: { size: 120 } },
          ],
        },
      }) as never
    )

    expect(overview.bannerFiles).toBe(2)
    expect(overview.bannerStorageBytes).toBe(220)
    expect(overview.orphanedFiles).toBe(1)
  })

  it('pages owner announcement resource reads instead of truncating at 1000 rows', () => {
    const resources = source('src/modules/owner/resources.ts')

    expect(resources).toContain('OWNER_RESOURCE_ANNOUNCEMENTS_PAGE_SIZE')
    expect(resources).toContain(
      '.range(offset, offset + OWNER_RESOURCE_ANNOUNCEMENTS_PAGE_SIZE - 1)'
    )
    expect(resources).not.toContain('.limit(1000)')
  })
})
