import { beforeEach, describe, expect, it, vi } from 'vitest'
import { readFileSync } from 'node:fs'
import { GET } from '@/app/api/maintenance/cleanup-orphan-banners/route'
import { createServiceClient } from '@/lib/supabase/server'
import { cleanupOrphanBannerImages } from '@/lib/storage/banner-cleanup'

vi.mock('@/lib/supabase/server', () => ({
  createServiceClient: vi.fn(),
}))

vi.mock('@/lib/storage/banner-cleanup', () => ({
  cleanupOrphanBannerImages: vi.fn(),
}))

function cleanupRequest(secret?: string, path = '/api/maintenance/cleanup-orphan-banners') {
  return new Request(`http://localhost${path}`, {
    method: 'GET',
    headers: secret ? { Authorization: `Bearer ${secret}` } : {},
  })
}

describe('GET /api/maintenance/cleanup-orphan-banners', () => {
  beforeEach(() => {
    vi.mocked(createServiceClient).mockReset()
    vi.mocked(cleanupOrphanBannerImages).mockReset()
    delete process.env.CRON_SECRET
  })

  it('stays unavailable until CRON_SECRET is configured', async () => {
    const response = await GET(cleanupRequest('anything'))

    expect(response.status).toBe(404)
    expect(createServiceClient).not.toHaveBeenCalled()
    expect(cleanupOrphanBannerImages).not.toHaveBeenCalled()
  })

  it('rejects missing or wrong Authorization before creating a service client', async () => {
    process.env.CRON_SECRET = 'cron-secret'

    const missing = await GET(cleanupRequest())
    const wrong = await GET(cleanupRequest('wrong-secret'))

    expect(missing.status).toBe(401)
    expect(wrong.status).toBe(401)
    expect(createServiceClient).not.toHaveBeenCalled()
    expect(cleanupOrphanBannerImages).not.toHaveBeenCalled()
  })

  it('runs cleanup with the service client and supports dry runs', async () => {
    process.env.CRON_SECRET = 'cron-secret'
    const service = { storage: {}, from: vi.fn() }
    vi.mocked(createServiceClient).mockResolvedValue(service as never)
    vi.mocked(cleanupOrphanBannerImages).mockResolvedValue({
      scanned: 3,
      referenced: 1,
      orphaned: 2,
      deleted: 0,
      dryRun: true,
      orphanedPaths: ['user/org/orphan.webp'],
      errors: [],
    })

    const response = await GET(
      cleanupRequest('cron-secret', '/api/maintenance/cleanup-orphan-banners?dryRun=1')
    )
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(createServiceClient).toHaveBeenCalledOnce()
    expect(cleanupOrphanBannerImages).toHaveBeenCalledWith(
      service,
      expect.objectContaining({ dryRun: true })
    )
    expect(body).toMatchObject({ ok: true, dryRun: true, orphaned: 2 })
  })

  it('registers the daily Vercel cron and documents CRON_SECRET', () => {
    const vercel = JSON.parse(readFileSync('vercel.json', 'utf8')) as {
      crons?: Array<{ path: string; schedule: string }>
    }
    const envExample = readFileSync('.env.example', 'utf8')

    expect(vercel.crons).toContainEqual({
      path: '/api/maintenance/cleanup-orphan-banners',
      schedule: '17 18 * * *',
    })
    expect(envExample).toContain('CRON_SECRET=')
  })
})
