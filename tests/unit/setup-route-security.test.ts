import { beforeEach, describe, expect, it, vi } from 'vitest'
import { resetRateLimitForTests } from '@/lib/security/rate-limit'
import { POST } from '@/app/api/setup/route'
import { createServiceClient } from '@/lib/supabase/server'

vi.mock('@/lib/supabase/server', () => ({
  createServiceClient: vi.fn(),
}))

function setupRequest(secret?: string): Request {
  return new Request('http://localhost/api/setup', {
    method: 'POST',
    headers: {
      'x-forwarded-for': '203.0.113.90',
      ...(secret ? { 'x-setup-secret': secret } : {}),
    },
  })
}

describe('POST /api/setup security', () => {
  beforeEach(() => {
    vi.mocked(createServiceClient).mockReset()
    resetRateLimitForTests()
    process.env.ENABLE_SETUP_ROUTE = '1'
    process.env.SETUP_SECRET = 'test-secret'
  })

  it('stays disabled unless the setup route is explicitly enabled', async () => {
    delete process.env.ENABLE_SETUP_ROUTE

    const response = await POST(setupRequest('test-secret'))

    expect(response.status).toBe(404)
    expect(createServiceClient).not.toHaveBeenCalled()
  })

  it('rejects missing setup secret without creating a service client', async () => {
    const response = await POST(setupRequest())
    expect(response.status).toBe(403)
    expect(createServiceClient).not.toHaveBeenCalled()
  })

  it('rejects wrong setup secret without creating a service client', async () => {
    const response = await POST(setupRequest('wrong-secret'))
    expect(response.status).toBe(403)
    expect(createServiceClient).not.toHaveBeenCalled()
  })

  it('rate-limits repeated setup attempts before service client creation', async () => {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const response = await POST(setupRequest('wrong-secret'))
      expect(response.status).toBe(403)
    }

    const response = await POST(setupRequest('wrong-secret'))
    expect(response.status).toBe(429)
    expect(response.headers.get('Retry-After')).toBeTruthy()
    expect(createServiceClient).not.toHaveBeenCalled()
  })
})
