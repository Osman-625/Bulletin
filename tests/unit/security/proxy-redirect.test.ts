import { NextRequest } from 'next/server'
import { describe, expect, it, vi } from 'vitest'

vi.mock('@supabase/ssr', () => ({
  createServerClient: () => ({
    auth: { getUser: async () => ({ data: { user: { id: 'user-without-profile' } } }) },
    from: () => ({ select: () => ({ eq: () => ({ single: async () => ({ data: null }) }) }) }),
  }),
}))

import { proxy } from '@/proxy'

describe('proxy for a signed-in user without a profile row', () => {
  it('lets /login render instead of redirecting it to itself', async () => {
    const response = await proxy(new NextRequest('http://localhost/login'))

    expect(response.headers.get('location')).toBeNull()
  })

  it('still sends protected pages to /login', async () => {
    const response = await proxy(new NextRequest('http://localhost/dashboard'))

    expect(response.headers.get('location')).toBe('http://localhost/login')
  })
})
