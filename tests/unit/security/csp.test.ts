import { describe, expect, it } from 'vitest'
import { createContentSecurityPolicy } from '@/proxy'

describe('request CSP', () => {
  it('allows React development eval support only when explicitly enabled', () => {
    const devCsp = createContentSecurityPolicy('test-nonce', { allowUnsafeEval: true })
    const productionCsp = createContentSecurityPolicy('test-nonce', { allowUnsafeEval: false })

    expect(devCsp).toContain("script-src 'self' 'nonce-test-nonce' 'strict-dynamic' 'unsafe-eval'")
    expect(productionCsp).toContain("script-src 'self' 'nonce-test-nonce' 'strict-dynamic'")
    expect(productionCsp).not.toContain("'unsafe-eval'")
  })

  it('scopes img-src and connect-src to the specific Supabase project host when provided', () => {
    const csp = createContentSecurityPolicy('test-nonce', {
      supabaseHost: 'abcdefghijk.supabase.co',
    })

    expect(csp).toContain("img-src 'self' data: blob: https://abcdefghijk.supabase.co")
    expect(csp).toContain(
      "connect-src 'self' https://abcdefghijk.supabase.co wss://abcdefghijk.supabase.co"
    )
    expect(csp).not.toContain('*.supabase.co')
  })

  it('falls back to wildcard supabase host when no project host is provided', () => {
    const csp = createContentSecurityPolicy('test-nonce')

    expect(csp).toContain("img-src 'self' data: blob: https://*.supabase.co")
    expect(csp).toContain("connect-src 'self' https://*.supabase.co")
  })
})
