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
})
