import { beforeEach, describe, expect, it, vi } from 'vitest'
import { readFileSync } from 'node:fs'
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
    delete process.env.SETUP_OWNER_EMAIL
    delete process.env.SETUP_OWNER_USERNAME
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

  it('uses configured owner identity when bootstrapping the owner account', async () => {
    process.env.SETUP_OWNER_EMAIL = 'owner@example.edu'
    process.env.SETUP_OWNER_USERNAME = 'Campus Owner'

    const queriedEmails: string[] = []
    const profileUpdates: unknown[] = []
    const maybeSingleResponses = [
      { data: null, error: null },
      { data: null, error: null },
    ]
    const createUser = vi.fn().mockResolvedValue({
      data: { user: { id: 'owner-user-id' } },
      error: null,
    })

    const supabase = {
      auth: {
        admin: {
          createUser,
        },
      },
      from: vi.fn(() => {
        const builder = {
          operation: 'select',
          select: vi.fn(() => builder),
          update: vi.fn((payload: unknown) => {
            builder.operation = 'update'
            profileUpdates.push(payload)
            return builder
          }),
          eq: vi.fn((column: string, value: string) => {
            if (column === 'email') queriedEmails.push(value)
            if (builder.operation === 'update') return Promise.resolve({ error: null })
            return builder
          }),
          maybeSingle: vi.fn(() => Promise.resolve(maybeSingleResponses.shift())),
        }
        return builder
      }),
    }

    vi.mocked(createServiceClient).mockResolvedValue(supabase as never)

    const response = await POST(setupRequest('test-secret'))
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(queriedEmails).toContain('owner@example.edu')
    expect(createUser).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'owner@example.edu',
        user_metadata: { display_name: 'Campus Owner' },
      })
    )
    expect(profileUpdates).toContainEqual(expect.objectContaining({ display_name: 'Campus Owner' }))
    expect(body.username).toBe('Campus Owner')
  })

  it('documents setup owner identity as server-only configuration', () => {
    const envExample = readFileSync('.env.example', 'utf8')

    expect(envExample).toContain('SETUP_OWNER_EMAIL=')
    expect(envExample).toContain('SETUP_OWNER_USERNAME=')
    expect(envExample).not.toContain('NEXT_PUBLIC_SETUP_OWNER')
  })
})
