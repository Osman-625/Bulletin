import { afterEach, describe, expect, it, vi } from 'vitest'
import { getOwnerResourceOverview } from '@/lib/owner/resources'

function createSupabaseStub() {
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
            limit: () => Promise.resolve({ data: [], error: null }),
          }),
        }),
      }
    },
    storage: {
      from: () => ({
        list: () => Promise.resolve({ data: [], error: null }),
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
})
