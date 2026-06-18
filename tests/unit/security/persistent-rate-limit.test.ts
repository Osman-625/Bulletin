import { afterEach, describe, expect, it, vi } from 'vitest'
import { reportServerError } from '@/shared/errors/error-reporting'
import { resetRateLimitForTests } from '@/shared/middleware/rate-limit'
import { checkPersistentRateLimit } from '@/shared/middleware/persistent-rate-limit'
import { createServiceClient } from '@/infrastructure/database/server'

vi.mock('@/shared/errors/error-reporting', () => ({
  reportServerError: vi.fn(),
}))

vi.mock('@/infrastructure/database/server', () => ({
  createServiceClient: vi.fn(),
}))

describe('checkPersistentRateLimit', () => {
  afterEach(() => {
    resetRateLimitForTests()
    vi.mocked(createServiceClient).mockReset()
    vi.mocked(reportServerError).mockReset()
    vi.unstubAllEnvs()
  })

  it('falls back to in-memory buckets outside production when the persistent backend is missing', async () => {
    vi.stubEnv('NODE_ENV', 'development')
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', '')
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', '')

    const first = await checkPersistentRateLimit('login:203.0.113.10', {
      limit: 1,
      windowMs: 60_000,
      now: 1_000,
    })
    const second = await checkPersistentRateLimit('login:203.0.113.10', {
      limit: 1,
      windowMs: 60_000,
      now: 2_000,
    })

    expect(first.limited).toBe(false)
    expect(second.limited).toBe(true)
    expect(createServiceClient).not.toHaveBeenCalled()
  })

  it('fails closed in production when the persistent backend is not configured', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', '')
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', '')

    await expect(
      checkPersistentRateLimit('setup:203.0.113.20', {
        limit: 3,
        windowMs: 120_000,
        now: 5_000,
      })
    ).resolves.toEqual({
      limited: true,
      remaining: 0,
      resetAt: 125_000,
      retryAfterSeconds: 120,
    })

    expect(createServiceClient).not.toHaveBeenCalled()
    expect(reportServerError).toHaveBeenCalledWith(
      'security.rate_limit.persistent_unavailable',
      expect.any(Error),
      expect.objectContaining({
        key_fingerprint: expect.any(String),
        limit: 3,
        window_ms: 120_000,
      })
    )
  })

  it('fails closed in production when the persistent RPC fails', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://example.supabase.co')
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'service-role-key')

    vi.mocked(createServiceClient).mockResolvedValue({
      rpc: vi.fn().mockResolvedValue({ data: null, error: new Error('rpc failed') }),
    } as never)

    await expect(
      checkPersistentRateLimit('register:203.0.113.30', {
        limit: 2,
        windowMs: 30_000,
        now: 10_000,
      })
    ).resolves.toEqual({
      limited: true,
      remaining: 0,
      resetAt: 40_000,
      retryAfterSeconds: 30,
    })

    expect(reportServerError).toHaveBeenCalledWith(
      'security.rate_limit.persistent_failed',
      expect.any(Error),
      expect.objectContaining({
        key_fingerprint: expect.any(String),
        limit: 2,
        window_ms: 30_000,
      })
    )
  })

  it('uses the persistent RPC result when production backend is healthy', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://example.supabase.co')
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'service-role-key')

    vi.mocked(createServiceClient).mockResolvedValue({
      rpc: vi.fn().mockResolvedValue({
        data: [
          {
            limited: false,
            remaining: 4,
            reset_at: new Date(70_000).toISOString(),
            retry_after_seconds: 0,
          },
        ],
        error: null,
      }),
    } as never)

    await expect(
      checkPersistentRateLimit('login:203.0.113.40', {
        limit: 5,
        windowMs: 60_000,
        now: 10_000,
      })
    ).resolves.toEqual({
      limited: false,
      remaining: 4,
      resetAt: 70_000,
      retryAfterSeconds: 0,
    })
  })
})
